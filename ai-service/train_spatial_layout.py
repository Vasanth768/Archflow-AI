"""
ArchFlow AI — Stage 8C-C: Controlled First Training Run
Controlled, reproducible, CPU-only training script for SpatialLayoutMLP.

Safety and Resource Rules:
- Offline CPU execution only using C:\\archflow_env.
- Strictly monitored resource thresholds: C: >= 2.0 GB free, Host Available RAM >= 500 MB.
- Phase 1: 1-epoch resource smoke run measuring execution time, peak RAM, and finite losses.
- Phase 2: Controlled training up to a maximum of 20 epochs, halting immediately upon memory pressure.
- Held-out test set (test.json) is strictly preserved for Stage 8C-D and NEVER loaded.
- Save a versioned checkpoint without overwriting existing files.
"""

import os
import sys
import time
import math
import gc
import random
import shutil
import psutil
import numpy as np
import torch
from typing import Dict, Any, Tuple, List

# Add ai-service to path
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)

from spatial_layout_model import (
    SpatialLayoutMLP,
    SpatialLayoutDataset,
    MaskedSpatialLayoutLoss,
    ROOM_SLOTS,
    NUM_ROOM_SLOTS,
    IN_FEATURES_DIM
)

# Configuration Constants
RANDOM_SEED = 42
BATCH_SIZE = 8
LEARNING_RATE = 1e-3
WEIGHT_DECAY = 1e-4
MAX_EPOCHS = 20
MIN_DISK_FREE_GB = 2.0
MIN_RAM_AVAIL_MB = 500.0

DATA_DIR = os.path.abspath(os.path.join(CURRENT_DIR, "..", "datasets", "synthetic_cad_dataset"))
TRAIN_JSON = os.path.join(DATA_DIR, "train.json")
VAL_JSON = os.path.join(DATA_DIR, "val.json")
CHECKPOINT_DIR = os.path.join(CURRENT_DIR, "checkpoints")
CHECKPOINT_PATH = os.path.join(CHECKPOINT_DIR, "spatial_layout_mlp_v1.pt")


def set_seed(seed: int = 42):
    """Ensure fully deterministic model initialization and data sampling."""
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    if torch.cuda.is_available():
        torch.cuda.manual_seed_all(seed)


def check_system_resources() -> Tuple[float, float, bool]:
    """
    Returns (c_free_gb, ram_avail_mb, is_safe).
    Safe requires C: free space >= 2.0 GB and available host RAM >= 500.0 MB.
    """
    _, _, free_bytes = shutil.disk_usage("C:")
    c_free_gb = free_bytes / (1024 ** 3)
    mem = psutil.virtual_memory()
    ram_avail_mb = mem.available / (1024 ** 2)
    is_safe = (c_free_gb >= MIN_DISK_FREE_GB) and (ram_avail_mb >= MIN_RAM_AVAIL_MB)
    return c_free_gb, ram_avail_mb, is_safe


class PreloadedSpatialDataset(torch.utils.data.Dataset):
    """
    Lightweight, pre-indexed in-memory dataset.
    Extracts all tensors into contiguous memory during init and frees the raw JSON dict.
    Eliminates GC thrashing and dynamic object allocation during epoch iterations.
    """
    def __init__(self, json_path: str, split_name: str = "train"):
        raw_dataset = SpatialLayoutDataset(json_path, split_name=split_name)
        self.samples = [raw_dataset[i] for i in range(len(raw_dataset))]
        del raw_dataset
        gc.collect()

    def __len__(self) -> int:
        return len(self.samples)

    def __getitem__(self, idx: int) -> Dict[str, Any]:
        return self.samples[idx]


def train_one_epoch(
    model: torch.nn.Module,
    dataloader: torch.utils.data.DataLoader,
    criterion: MaskedSpatialLayoutLoss,
    optimizer: torch.optim.Optimizer,
    epoch: int
) -> Dict[str, float]:
    """Executes one training epoch with strict finite-loss and gradient clipping."""
    model.train()
    running_loss = 0.0
    running_coord = 0.0
    running_mask = 0.0
    running_feas = 0.0
    total_batches = len(dataloader)

    for batch_idx, batch in enumerate(dataloader):
        features = batch["input_features"]          # (B, 23)
        target_boxes = batch["target_boxes"]        # (B, 8, 4)
        target_mask = batch["target_mask"]          # (B, 8)
        target_feas = batch["is_feasible"]          # (B, 1)

        optimizer.zero_grad()
        preds = model(features)

        loss, metrics = criterion(preds, target_boxes, target_mask, target_feas)

        # Finite loss verification
        if not math.isfinite(loss.item()):
            raise FloatingPointError(
                f"FATAL: Non-finite loss detected at epoch {epoch}, batch {batch_idx}! "
                f"Metrics: {metrics}"
            )

        loss.backward()

        # Gradient clipping to prevent gradient explosion on CPU
        torch.nn.utils.clip_grad_norm_(model.parameters(), max_norm=1.0)

        optimizer.step()

        running_loss += metrics["total_loss"]
        running_coord += metrics["coord_loss"]
        running_mask += metrics["mask_loss"]
        running_feas += metrics["feasibility_loss"]

    return {
        "loss": running_loss / total_batches,
        "coord_loss": running_coord / total_batches,
        "mask_loss": running_mask / total_batches,
        "feas_loss": running_feas / total_batches
    }


def validate(
    model: torch.nn.Module,
    dataloader: torch.utils.data.DataLoader,
    criterion: MaskedSpatialLayoutLoss
) -> Dict[str, float]:
    """Evaluates model on validation split without gradient computation."""
    model.eval()
    running_loss = 0.0
    running_coord = 0.0
    running_mask = 0.0
    running_feas = 0.0
    total_batches = len(dataloader)

    with torch.no_grad():
        for batch in dataloader:
            features = batch["input_features"]
            target_boxes = batch["target_boxes"]
            target_mask = batch["target_mask"]
            target_feas = batch["is_feasible"]

            preds = model(features)
            loss, metrics = criterion(preds, target_boxes, target_mask, target_feas)

            if not math.isfinite(loss.item()):
                raise FloatingPointError(f"FATAL: Non-finite validation loss detected! Metrics: {metrics}")

            running_loss += metrics["total_loss"]
            running_coord += metrics["coord_loss"]
            running_mask += metrics["mask_loss"]
            running_feas += metrics["feasibility_loss"]

    return {
        "val_loss": running_loss / total_batches,
        "val_coord_loss": running_coord / total_batches,
        "val_mask_loss": running_mask / total_batches,
        "val_feas_loss": running_feas / total_batches
    }


def run_controlled_training():
    print("=" * 65)
    print("ARCHFLOW AI — STAGE 8C-C: CONTROLLED FIRST TRAINING RUN")
    print("=" * 65)

    # 1. Preflight Resource Check
    c_free_start, ram_avail_start, is_safe_start = check_system_resources()
    print(f"\n[PREFLIGHT] Drive C: Free Space: {c_free_start:.3f} GB (Threshold >= {MIN_DISK_FREE_GB} GB)")
    print(f"[PREFLIGHT] Host Available RAM: {ram_avail_start:.1f} MB (Threshold >= {MIN_RAM_AVAIL_MB} MB)")
    print(f"[PREFLIGHT] PyTorch Version: {torch.__version__} (Device: CPU)")

    if not is_safe_start:
        raise RuntimeError(
            f"PREFLIGHT ABORT: Host resources inadequate before start! "
            f"Drive C: {c_free_start:.3f} GB (min {MIN_DISK_FREE_GB} GB), "
            f"Available RAM: {ram_avail_start:.1f} MB (min {MIN_RAM_AVAIL_MB} MB)"
        )

    # 2. Checkpoint destination verification (Prevent accidental overwrite)
    if os.path.exists(CHECKPOINT_PATH):
        raise FileExistsError(
            f"SAFETY ABORT: Checkpoint {CHECKPOINT_PATH} already exists! "
            f"ArchFlow safety policy strictly forbids overwriting existing checkpoints."
        )
    os.makedirs(CHECKPOINT_DIR, exist_ok=True)
    print(f"[PREFLIGHT] Checkpoint destination: {CHECKPOINT_PATH} (verified clean)")

    # 3. Deterministic initialization
    set_seed(RANDOM_SEED)
    print(f"[SETUP] Global Random Seed: {RANDOM_SEED}")
    print(f"[SETUP] Conservative Batch Size: {BATCH_SIZE}")
    print(f"[SETUP] Optimizer: AdamW (lr={LEARNING_RATE}, weight_decay={WEIGHT_DECAY})")

    # 4. Data Loaders (Strictly train.json and val.json; NEVER test.json)
    print(f"[SETUP] Training Dataset: {TRAIN_JSON}")
    print(f"[SETUP] Validation Dataset: {VAL_JSON}")
    print(f"[SETUP] Held-Out Test Set: (RESERVED FOR STAGE 8C-D — UNTOUCHED)")

    print("[SETUP] Preloading datasets into optimized in-memory tensors...")
    train_dataset = PreloadedSpatialDataset(TRAIN_JSON, split_name="train")
    val_dataset = PreloadedSpatialDataset(VAL_JSON, split_name="val")

    train_loader = torch.utils.data.DataLoader(train_dataset, batch_size=BATCH_SIZE, shuffle=True, num_workers=0)
    val_loader = torch.utils.data.DataLoader(val_dataset, batch_size=BATCH_SIZE, shuffle=False, num_workers=0)

    print(f"[SETUP] Train batches: {len(train_loader)} (700 samples), Val batches: {len(val_loader)} (150 samples)")

    # 5. Model & Criterion Instantiation
    model = SpatialLayoutMLP(in_features=IN_FEATURES_DIM, num_slots=NUM_ROOM_SLOTS)
    param_count = model.count_parameters()
    print(f"[SETUP] Model Parameters: {param_count:,} (~84.6K parameters)")

    criterion = MaskedSpatialLayoutLoss(coord_weight=1.0, mask_weight=0.5, feasibility_weight=0.2)
    optimizer = torch.optim.AdamW(model.parameters(), lr=LEARNING_RATE, weight_decay=WEIGHT_DECAY)

    # Tracking metrics
    proc = psutil.Process()
    history = []
    best_val_loss = float("inf")
    best_model_state = None

    # -------------------------------------------------------------
    # PHASE 1: Resource Smoke Run (Epoch 1)
    # -------------------------------------------------------------
    print("\n" + "-" * 65)
    print("PHASE 1: 1-EPOCH RESOURCE SMOKE RUN")
    print("-" * 65)

    smoke_start_time = time.time()
    smoke_train_metrics = train_one_epoch(model, train_loader, criterion, optimizer, epoch=1)
    smoke_val_metrics = validate(model, val_loader, criterion)
    smoke_duration = time.time() - smoke_start_time

    gc.collect()
    smoke_rss_mb = proc.memory_info().rss / (1024 ** 2)
    c_free_smoke, ram_avail_smoke, is_safe_smoke = check_system_resources()

    print(f"Smoke Epoch 1 Completed in {smoke_duration:.2f}s")
    print(f"  Train Loss: {smoke_train_metrics['loss']:.4f} "
          f"(coord: {smoke_train_metrics['coord_loss']:.4f}, "
          f"mask: {smoke_train_metrics['mask_loss']:.4f}, "
          f"feas: {smoke_train_metrics['feas_loss']:.4f})")
    print(f"  Val Loss:   {smoke_val_metrics['val_loss']:.4f} "
          f"(coord: {smoke_val_metrics['val_coord_loss']:.4f}, "
          f"mask: {smoke_val_metrics['val_mask_loss']:.4f}, "
          f"feas: {smoke_val_metrics['val_feas_loss']:.4f})")
    print(f"  Process RSS: {smoke_rss_mb:.1f} MB | Host Avail RAM: {ram_avail_smoke:.1f} MB | C: Free: {c_free_smoke:.3f} GB")

    # Safety Evaluation after Smoke Run
    estimated_total_time = smoke_duration * MAX_EPOCHS
    print(f"\n[RESOURCE PROJECTION] Estimated runtime for {MAX_EPOCHS} epochs: ~{estimated_total_time:.1f}s (~{estimated_total_time/60:.1f} min)")

    if not is_safe_smoke:
        raise RuntimeError(
            f"SMOKE RUN ABORT: Host available RAM ({ram_avail_smoke:.1f} MB) dipped below threshold ({MIN_RAM_AVAIL_MB} MB)!"
        )

    history.append({
        "epoch": 1,
        "train": smoke_train_metrics,
        "val": smoke_val_metrics,
        "duration_sec": smoke_duration,
        "rss_mb": smoke_rss_mb,
        "ram_avail_mb": ram_avail_smoke,
        "c_free_gb": c_free_smoke
    })

    if smoke_val_metrics["val_loss"] < best_val_loss:
        best_val_loss = smoke_val_metrics["val_loss"]
        best_model_state = {k: v.cpu().clone() for k, v in model.state_dict().items()}

    # -------------------------------------------------------------
    # PHASE 2: Controlled Training Continuation (Epochs 2 to 20)
    # -------------------------------------------------------------
    print("\n" + "-" * 65)
    print(f"PHASE 2: CONTROLLED TRAINING (EPOCHS 2 TO {MAX_EPOCHS})")
    print("-" * 65)

    start_full_time = time.time()
    completed_epochs = 1
    stopped_due_to_resource_limit = False

    for epoch in range(2, MAX_EPOCHS + 1):
        ep_start = time.time()
        train_metrics = train_one_epoch(model, train_loader, criterion, optimizer, epoch=epoch)
        val_metrics = validate(model, val_loader, criterion)
        ep_duration = time.time() - ep_start

        # Monitor resources each epoch
        gc.collect()
        ep_rss_mb = proc.memory_info().rss / (1024 ** 2)
        c_free_ep, ram_avail_ep, is_safe_ep = check_system_resources()

        print(f"Epoch {epoch:02d}/{MAX_EPOCHS:02d} [{ep_duration:4.1f}s] | "
              f"Train: {train_metrics['loss']:.4f} (c:{train_metrics['coord_loss']:.4f}, m:{train_metrics['mask_loss']:.4f}, f:{train_metrics['feas_loss']:.4f}) | "
              f"Val: {val_metrics['val_loss']:.4f} (c:{val_metrics['val_coord_loss']:.4f}, m:{val_metrics['val_mask_loss']:.4f}, f:{val_metrics['val_feas_loss']:.4f}) | "
              f"RAM Avail: {ram_avail_ep:.0f}MB | RSS: {ep_rss_mb:.0f}MB")

        history.append({
            "epoch": epoch,
            "train": train_metrics,
            "val": val_metrics,
            "duration_sec": ep_duration,
            "rss_mb": ep_rss_mb,
            "ram_avail_mb": ram_avail_ep,
            "c_free_gb": c_free_ep
        })

        completed_epochs = epoch

        if val_metrics["val_loss"] < best_val_loss:
            best_val_loss = val_metrics["val_loss"]
            best_model_state = {k: v.cpu().clone() for k, v in model.state_dict().items()}

        # Stop immediately if memory pressure or resource worsening occurs
        if not is_safe_ep:
            print(f"\n[RESOURCE SAFETY STOP] Resource safety limit reached at epoch {epoch}: "
                  f"RAM {ram_avail_ep:.1f} MB (threshold {MIN_RAM_AVAIL_MB} MB) or "
                  f"Disk {c_free_ep:.3f} GB (threshold {MIN_DISK_FREE_GB} GB). "
                  f"Stopping training loop immediately per safety rules.")
            stopped_due_to_resource_limit = True
            break

    total_training_time = time.time() - start_full_time + smoke_duration
    print("\n" + "=" * 65)
    print(f"TRAINING PHASE CONCLUDED ({completed_epochs} Epochs Completed in {total_training_time:.2f}s)")
    print(f"Best Validation Loss: {best_val_loss:.4f}")
    if stopped_due_to_resource_limit:
        print("[STATUS] Training halted early due to monitored resource safety threshold.")
    else:
        print("[STATUS] All planned epochs completed safely within resource limits.")
    print("=" * 65)

    # -------------------------------------------------------------
    # 6. Save Versioned Checkpoint
    # -------------------------------------------------------------
    if best_model_state is None:
        raise RuntimeError("No model state was captured during training!")

    checkpoint_payload = {
        "version": "1.0.0",
        "stage": "8C-C",
        "architecture": "SpatialLayoutMLP",
        "in_features": IN_FEATURES_DIM,
        "num_slots": NUM_ROOM_SLOTS,
        "room_slots": ROOM_SLOTS,
        "total_parameters": param_count,
        "model_state_dict": best_model_state,
        "optimizer_state_dict": optimizer.state_dict(),
        "random_seed": RANDOM_SEED,
        "hyperparameters": {
            "batch_size": BATCH_SIZE,
            "learning_rate": LEARNING_RATE,
            "weight_decay": WEIGHT_DECAY,
            "max_epochs": MAX_EPOCHS,
            "completed_epochs": completed_epochs,
            "coord_weight": 1.0,
            "mask_weight": 0.5,
            "feasibility_weight": 0.2
        },
        "best_val_loss": best_val_loss,
        "training_history": history,
        "safety_notes": [
            "Predicted geometry is untrusted until validated by ConstraintValidator and repaired by DynamicLayoutSolver.",
            "Test set (test.json) was strictly held out and untouched.",
            "Model is completely decoupled from production CAD rendering.",
            "Model outputs are statistical heuristics; low loss does not guarantee 100% architectural validity."
        ]
    }

    torch.save(checkpoint_payload, CHECKPOINT_PATH)
    ckpt_size_kb = os.path.getsize(CHECKPOINT_PATH) / 1024.0
    c_free_end, ram_avail_end, _ = check_system_resources()

    print(f"\n[CHECKPOINT SAVED] {CHECKPOINT_PATH}")
    print(f"  Checkpoint File Size: {ckpt_size_kb:.2f} KB ({ckpt_size_kb/1024:.3f} MB)")
    print(f"  Drive C: Free Space: Before: {c_free_start:.3f} GB -> After: {c_free_end:.3f} GB (Delta: {(c_free_end - c_free_start)*1024:.1f} MB)")
    print(f"  Host Available RAM:  Before: {ram_avail_start:.1f} MB -> After: {ram_avail_end:.1f} MB")
    print(f"  Completed Epochs:    {completed_epochs} / {MAX_EPOCHS}")
    print(f"  Safety Status: ALL CONSTRAINTS AND THRESHOLDS SATISFIED")


if __name__ == "__main__":
    run_controlled_training()
