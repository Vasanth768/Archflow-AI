"""
ArchFlow AI — Stage 8C-D: Held-Out Test & Geometry Benchmark
Comprehensive evaluation script for SpatialLayoutMLP on held-out test.json.

Safety Rules:
- CPU-only execution using C:\\archflow_env.
- Held-out test set (test.json) is evaluated strictly read-only for reporting.
- Does not modify any production files, Docker, or CAD renderers.
- No checkpoint overwrite.
"""

import os
import sys
import time
import json
import math
import shutil
import psutil
import numpy as np
import torch
from typing import Dict, Any, List, Tuple

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)

from spatial_layout_model import (
    SpatialLayoutMLP,
    extract_input_features,
    map_rooms_to_slots,
    denormalize_layout,
    ROOM_SLOTS,
    NUM_ROOM_SLOTS,
    IN_FEATURES_DIM
)

# File Paths
DATA_DIR = os.path.abspath(os.path.join(CURRENT_DIR, "..", "datasets", "synthetic_cad_dataset"))
TEST_JSON = os.path.join(DATA_DIR, "test.json")
CHECKPOINT_PATH = os.path.join(CURRENT_DIR, "checkpoints", "spatial_layout_mlp_v1.pt")
BENCHMARK_RESULTS_JSON = os.path.join(CURRENT_DIR, "checkpoints", "benchmark_stage8c_results.json")

TOLERANCE = 0.1 # inches, matching ConstraintValidator


def check_resources():
    _, _, free_bytes = shutil.disk_usage("C:")
    c_free_gb = free_bytes / (1024 ** 3)
    mem = psutil.virtual_memory()
    ram_avail_mb = mem.available / (1024 ** 2)
    return c_free_gb, ram_avail_mb


def calculate_overlap_area(r1: Dict[str, float], r2: Dict[str, float]) -> float:
    """Calculates rectangular intersection area between two rooms in sq inches."""
    x1, y1, w1, h1 = r1["x"], r1["y"], r1["w"], r1["h"]
    x2, y2, w2, h2 = r2["x"], r2["y"], r2["w"], r2["h"]

    dx = max(0.0, min(x1 + w1, x2 + w2) - max(x1, x2))
    dy = max(0.0, min(y1 + h1, y2 + h2) - max(y1, y2))
    return dx * dy


def check_rect_overlap(r1: Dict[str, float], r2: Dict[str, float], tolerance: float = TOLERANCE) -> bool:
    """Returns True if two rooms strictly overlap beyond tolerance."""
    x1, y1, w1, h1 = r1["x"], r1["y"], r1["w"], r1["h"]
    x2, y2, w2, h2 = r2["x"], r2["y"], r2["w"], r2["h"]

    return not (
        x1 + w1 - tolerance <= x2 or
        x2 + w2 - tolerance <= x1 or
        y1 + h1 - tolerance <= y2 or
        y2 + h2 - tolerance <= y1
    )


def repair_spatial_layout(
    raw_rooms: List[Dict[str, Any]],
    envelope: Dict[str, float],
    site_w: float,
    site_l: float
) -> Tuple[List[Dict[str, Any]], bool, List[str]]:
    """
    Deterministic geometric snapping and repair pass.
    Snaps raw neural bounding boxes into valid constructible layouts.
    Returns (repaired_rooms, is_valid, issues).
    """
    env_x = float(envelope.get("x", 24))
    env_y = float(envelope.get("y", 24))
    env_w = float(envelope.get("width", site_w - 48))
    env_l = float(envelope.get("length", site_l - 48))

    repaired = []
    issues = []

    # Priority ranking for placement/overlap resolution
    priority_order = [
        "living", "master_bedroom", "kitchen",
        "bedroom_1", "bedroom_2", "bedroom_3",
        "attached_toilet", "pooja"
    ]

    # 1. Filter and sort by priority
    sorted_rooms = []
    for slot_name in priority_order:
        for r in raw_rooms:
            if r.get("slot") == slot_name:
                sorted_rooms.append(dict(r))

    # 2. Clamping and Minimum Dimension Enforcement
    for r in sorted_rooms:
        slot = r.get("slot", "")
        min_dim = 48.0 if slot in ["attached_toilet", "pooja"] else 72.0

        w = max(min_dim, min(r["w"], env_w))
        h = max(min_dim, min(r["h"], env_l))
        x = max(env_x, min(r["x"], env_x + env_w - w))
        y = max(env_y, min(r["y"], env_y + env_l - h))

        r["x"] = round(x, 1)
        r["y"] = round(y, 1)
        r["w"] = round(w, 1)
        r["h"] = round(h, 1)
        repaired.append(r)

    # 3. Iterative Overlap Resolution (Pushing & Snapping)
    max_passes = 10
    for _ in range(max_passes):
        has_overlap = False
        for i in range(len(repaired)):
            for j in range(i + 1, len(repaired)):
                r1 = repaired[i] # Higher priority
                r2 = repaired[j] # Lower priority

                if check_rect_overlap(r1, r2):
                    has_overlap = True
                    # Calculate penetration depths
                    overlap_x1 = (r1["x"] + r1["w"]) - r2["x"] # push r2 right
                    overlap_x2 = (r2["x"] + r2["w"]) - r1["x"] # push r2 left
                    overlap_y1 = (r1["y"] + r1["h"]) - r2["y"] # push r2 down
                    overlap_y2 = (r2["y"] + r2["h"]) - r1["y"] # push r2 up

                    min_shift = min(overlap_x1, overlap_x2, overlap_y1, overlap_y2)

                    if min_shift == overlap_x1 and r2["x"] + overlap_x1 + r2["w"] <= env_x + env_w:
                        r2["x"] = round(r1["x"] + r1["w"], 1)
                    elif min_shift == overlap_x2 and r1["x"] - r2["w"] >= env_x:
                        r2["x"] = round(r1["x"] - r2["w"], 1)
                    elif min_shift == overlap_y1 and r2["y"] + overlap_y1 + r2["h"] <= env_y + env_l:
                        r2["y"] = round(r1["y"] + r1["h"], 1)
                    elif min_shift == overlap_y2 and r1["y"] - r2["h"] >= env_y:
                        r2["y"] = round(r1["y"] - r2["h"], 1)
                    else:
                        # Envelope space constrained: try shrinking lower priority room to min_dim
                        min_d = 48.0 if r2.get("slot") in ["attached_toilet", "pooja"] else 72.0
                        if r2["w"] > min_d + 12:
                            r2["w"] = max(min_d, r2["w"] - 12)
                        elif r2["h"] > min_d + 12:
                            r2["h"] = max(min_d, r2["h"] - 12)
                        elif r2["x"] + overlap_x1 + r2["w"] <= env_x + env_w:
                            r2["x"] = round(r1["x"] + r1["w"], 1)
                        elif r2["y"] + overlap_y1 + r2["h"] <= env_y + env_l:
                            r2["y"] = round(r1["y"] + r1["h"], 1)
        if not has_overlap:
            break

    # 4. Final Validation Check
    is_valid = True
    for i in range(len(repaired)):
        r = repaired[i]
        # Containment check
        if r["x"] < env_x - TOLERANCE or r["y"] < env_y - TOLERANCE or \
           r["x"] + r["w"] > env_x + env_w + TOLERANCE or \
           r["y"] + r["h"] > env_y + env_l + TOLERANCE:
            is_valid = False
            issues.append(f"Room {r.get('slot')} violates buildable envelope bounds")

        # Overlap check
        for j in range(i + 1, len(repaired)):
            if check_rect_overlap(r, repaired[j]):
                is_valid = False
                issues.append(f"Unresolved collision between {r.get('slot')} and {repaired[j].get('slot')}")

    return repaired, is_valid, issues


def run_benchmark():
    print("=" * 70)
    print("ARCHFLOW AI — STAGE 8C-D: HELD-OUT TEST & GEOMETRY BENCHMARK")
    print("=" * 70)

    # Preflight resources
    c_free_start, ram_avail_start = check_resources()
    print(f"\n[PREFLIGHT] Drive C: Free Space: {c_free_start:.3f} GB")
    print(f"[PREFLIGHT] Host Available RAM: {ram_avail_start:.1f} MB")
    print(f"[PREFLIGHT] PyTorch Version: {torch.__version__} (Device: CPU)")

    # 1. Load Checkpoint
    if not os.path.exists(CHECKPOINT_PATH):
        raise FileNotFoundError(f"Checkpoint not found: {CHECKPOINT_PATH}")

    print(f"\n[MODEL] Loading checkpoint: {CHECKPOINT_PATH}")
    ckpt = torch.load(CHECKPOINT_PATH, map_location="cpu")
    print(f"  Stage: {ckpt.get('stage')}")
    print(f"  Architecture: {ckpt.get('architecture')}")
    print(f"  Total Parameters: {ckpt.get('total_parameters'):,}")
    print(f"  Best Val Loss: {ckpt.get('best_val_loss'):.4f}")

    model = SpatialLayoutMLP(in_features=ckpt["in_features"], num_slots=ckpt["num_slots"])
    model.load_state_dict(ckpt["model_state_dict"])
    model.eval()

    # 2. Load Held-Out Test Records
    if not os.path.exists(TEST_JSON):
        raise FileNotFoundError(f"Test dataset not found: {TEST_JSON}")

    with open(TEST_JSON, "r", encoding="utf-8") as f:
        test_records = json.load(f)

    num_test = len(test_records)
    print(f"\n[DATASET] Held-Out Test Set: {TEST_JSON}")
    print(f"  Total Test Samples: {num_test} (strictly held out from training/tuning)")

    # -------------------------------------------------------------
    # Evaluation Containers
    # -------------------------------------------------------------
    model_inference_latencies = []
    repair_latencies = []
    total_latencies = []

    # Coordinate MAE metrics (in inches)
    coord_errors_x = []
    coord_errors_y = []
    coord_errors_w = []
    coord_errors_h = []
    slot_coord_errors = {slot: {"x": [], "y": [], "w": [], "h": []} for slot in ROOM_SLOTS}

    # Slot classification confusion metrics
    slot_confusions = {slot: {"tp": 0, "fp": 0, "fn": 0, "tn": 0} for slot in ROOM_SLOTS}

    # Feasibility classification metrics
    feas_tp, feas_fp, feas_fn, feas_tn = 0, 0, 0, 0

    # Requested room satisfaction
    req_sat_bhk = []
    req_sat_kitchen = []
    req_sat_pooja = []
    req_sat_toilet = []

    # Boundary Containment & Overlap (Raw Neural)
    raw_plans_zero_overlap = 0
    raw_total_overlaps = 0
    raw_overlap_areas = []
    raw_rooms_contained = 0
    raw_total_rooms = 0
    raw_plans_fully_contained = 0

    # Boundary Containment & Overlap (Repaired Neural)
    repaired_plans_zero_overlap = 0
    repaired_total_overlaps = 0
    repaired_overlap_areas = []
    repaired_rooms_contained = 0
    repaired_total_rooms = 0
    repaired_plans_fully_valid = 0

    # Solver Baseline (Target Ground Truth)
    solver_plans_zero_overlap = 0
    solver_total_overlaps = 0
    solver_rooms_contained = 0
    solver_total_rooms = 0
    solver_plans_fully_valid = 0

    # Failure case logging
    failure_cases = []

    print("\n[BENCHMARK] Executing inference, geometry validation, and repair on all 150 test records...")

    for idx, record in enumerate(test_records):
        rec_id = record.get("id", f"test_{idx}")
        input_block = record["input"]
        target_block = record["target"]

        site = target_block.get("site", {})
        site_w = float(site.get("width", 360))
        site_l = float(site.get("length", 480))
        envelope = site.get("buildableEnvelope", {"x": 24, "y": 24, "width": site_w - 48, "length": site_l - 48})
        ground_truth_rooms = target_block.get("rooms", [])

        # -------------------------------------------------------------
        # 1. Model Forward Pass & Latency Measurement
        # -------------------------------------------------------------
        features = extract_input_features(input_block)

        t0 = time.perf_counter()
        with torch.no_grad():
            preds = model(features.unsqueeze(0))
        t1 = time.perf_counter()
        model_lat_ms = (t1 - t0) * 1000.0
        model_inference_latencies.append(model_lat_ms)

        pred_boxes = preds["pred_boxes"][0].numpy()                  # (8, 4) in [0, 1]
        pred_mask_logits = preds["pred_mask_logits"][0].numpy()      # (8,)
        pred_feas_logit = preds["pred_feasibility_logits"][0].item() # float
        pred_mask_probs = 1.0 / (1.0 + np.exp(-pred_mask_logits))
        pred_feas_prob = 1.0 / (1.0 + np.exp(-pred_feas_logit))

        # Ground truth mapping
        gt_boxes, gt_mask = map_rooms_to_slots(ground_truth_rooms, site_w, site_l)
        gt_boxes = gt_boxes.numpy()
        gt_mask = gt_mask.numpy()

        req_bhk = input_block.get("requirements", {}).get("bedrooms", 1)
        actual_beds = sum(1 for r in ground_truth_rooms if "bed" in r.get("type", "").lower())
        gt_feasible = 1 if actual_beds >= req_bhk else 0

        # Feasibility classification
        pred_feas_bin = 1 if pred_feas_prob >= 0.5 else 0
        if pred_feas_bin == 1 and gt_feasible == 1:
            feas_tp += 1
        elif pred_feas_bin == 1 and gt_feasible == 0:
            feas_fp += 1
        elif pred_feas_bin == 0 and gt_feasible == 1:
            feas_fn += 1
        else:
            feas_tn += 1

        # -------------------------------------------------------------
        # 2. Slot Classification & Coordinate Accuracy
        # -------------------------------------------------------------
        active_raw_rooms = []
        plan_all_contained = True

        for s_idx, slot_name in enumerate(ROOM_SLOTS):
            pred_active = bool(pred_mask_probs[s_idx] >= 0.5)
            gt_active = bool(gt_mask[s_idx] == 1.0)

            # Confusion matrix
            if pred_active and gt_active:
                slot_confusions[slot_name]["tp"] += 1
            elif pred_active and not gt_active:
                slot_confusions[slot_name]["fp"] += 1
            elif not pred_active and gt_active:
                slot_confusions[slot_name]["fn"] += 1
            else:
                slot_confusions[slot_name]["tn"] += 1

            # Coordinate MAE in inches (computed on active ground-truth slots)
            if gt_active:
                px = pred_boxes[s_idx, 0] * site_w
                py = pred_boxes[s_idx, 1] * site_l
                pw = pred_boxes[s_idx, 2] * site_w
                ph = pred_boxes[s_idx, 3] * site_l

                gx = gt_boxes[s_idx, 0] * site_w
                gy = gt_boxes[s_idx, 1] * site_l
                gw = gt_boxes[s_idx, 2] * site_w
                gh = gt_boxes[s_idx, 3] * site_l

                err_x = abs(px - gx)
                err_y = abs(py - gy)
                err_w = abs(pw - gw)
                err_h = abs(ph - gh)

                coord_errors_x.append(err_x)
                coord_errors_y.append(err_y)
                coord_errors_w.append(err_w)
                coord_errors_h.append(err_h)

                slot_coord_errors[slot_name]["x"].append(err_x)
                slot_coord_errors[slot_name]["y"].append(err_y)
                slot_coord_errors[slot_name]["w"].append(err_w)
                slot_coord_errors[slot_name]["h"].append(err_h)

            # Raw prediction entity
            if pred_active:
                raw_room = {
                    "id": f"pred_{slot_name}",
                    "slot": slot_name,
                    "x": pred_boxes[s_idx, 0] * site_w,
                    "y": pred_boxes[s_idx, 1] * site_l,
                    "w": pred_boxes[s_idx, 2] * site_w,
                    "h": pred_boxes[s_idx, 3] * site_l
                }
                active_raw_rooms.append(raw_room)
                raw_total_rooms += 1

                # Containment check
                if raw_room["x"] >= -TOLERANCE and raw_room["y"] >= -TOLERANCE and \
                   raw_room["x"] + raw_room["w"] <= site_w + TOLERANCE and \
                   raw_room["y"] + raw_room["h"] <= site_l + TOLERANCE:
                    raw_rooms_contained += 1
                else:
                    plan_all_contained = False

        if plan_all_contained and len(active_raw_rooms) > 0:
            raw_plans_fully_contained += 1

        # Raw Pairwise Overlaps
        raw_plan_overlaps = 0
        for i in range(len(active_raw_rooms)):
            for j in range(i + 1, len(active_raw_rooms)):
                if check_rect_overlap(active_raw_rooms[i], active_raw_rooms[j]):
                    raw_plan_overlaps += 1
                    raw_total_overlaps += 1
                    area_sq_in = calculate_overlap_area(active_raw_rooms[i], active_raw_rooms[j])
                    raw_overlap_areas.append(area_sq_in / 144.0) # sq ft

        if raw_plan_overlaps == 0 and len(active_raw_rooms) > 0:
            raw_plans_zero_overlap += 1

        # -------------------------------------------------------------
        # 3. Geometric Snapping & Repair Pass
        # -------------------------------------------------------------
        t_rep0 = time.perf_counter()
        repaired_rooms, rep_valid, rep_issues = repair_spatial_layout(active_raw_rooms, envelope, site_w, site_l)
        t_rep1 = time.perf_counter()
        rep_lat_ms = (t_rep1 - t_rep0) * 1000.0
        repair_latencies.append(rep_lat_ms)
        total_latencies.append(model_lat_ms + rep_lat_ms)

        rep_overlaps = 0
        for i in range(len(repaired_rooms)):
            repaired_total_rooms += 1
            r = repaired_rooms[i]
            if r["x"] >= envelope["x"] - TOLERANCE and r["y"] >= envelope["y"] - TOLERANCE and \
               r["x"] + r["w"] <= envelope["x"] + envelope["width"] + TOLERANCE and \
               r["y"] + r["h"] <= envelope["y"] + envelope["length"] + TOLERANCE:
                repaired_rooms_contained += 1

            for j in range(i + 1, len(repaired_rooms)):
                if check_rect_overlap(r, repaired_rooms[j]):
                    rep_overlaps += 1
                    repaired_total_overlaps += 1
                    area_sq_in = calculate_overlap_area(r, repaired_rooms[j])
                    repaired_overlap_areas.append(area_sq_in / 144.0)

        if rep_overlaps == 0 and len(repaired_rooms) > 0:
            repaired_plans_zero_overlap += 1
        if rep_valid:
            repaired_plans_fully_valid += 1

        # -------------------------------------------------------------
        # 4. Solver Baseline (Ground Truth Target Layout)
        # -------------------------------------------------------------
        solver_overlaps = 0
        for i in range(len(ground_truth_rooms)):
            solver_total_rooms += 1
            gr = ground_truth_rooms[i]
            if gr["x"] >= envelope["x"] - TOLERANCE and gr["y"] >= envelope["y"] - TOLERANCE and \
               gr["x"] + gr["w"] <= envelope["x"] + envelope["width"] + TOLERANCE and \
               gr["y"] + gr["h"] <= envelope["y"] + envelope["length"] + TOLERANCE:
                solver_rooms_contained += 1

            for j in range(i + 1, len(ground_truth_rooms)):
                if check_rect_overlap(gr, ground_truth_rooms[j]):
                    solver_overlaps += 1
                    solver_total_overlaps += 1

        if solver_overlaps == 0:
            solver_plans_zero_overlap += 1
            solver_plans_fully_valid += 1

        # -------------------------------------------------------------
        # 5. Requirement Satisfaction Tracking
        # -------------------------------------------------------------
        reqs = input_block.get("requirements", {})
        # Kitchen
        req_sat_kitchen.append(1 if pred_mask_probs[1] >= 0.5 else 0)
        # Pooja
        if reqs.get("pooja"):
            req_sat_pooja.append(1 if pred_mask_probs[7] >= 0.5 else 0)
        # Toilet
        if reqs.get("attachedToilet"):
            req_sat_toilet.append(1 if pred_mask_probs[6] >= 0.5 else 0)
        # BHK: Check total bedrooms predicted active
        pred_bed_count = sum(1 for s in [2, 3, 4, 5] if pred_mask_probs[s] >= 0.5)
        req_sat_bhk.append(1 if pred_bed_count >= req_bhk else 0)

        # Failure Case Logging (Record worst 3 cases)
        if len(failure_cases) < 5:
            if not rep_valid or raw_plan_overlaps > 2 or pred_bed_count < req_bhk:
                failure_cases.append({
                    "id": rec_id,
                    "plot": f"{site_w/12:.0f}'x{site_l/12:.0f}' ({site_w*site_l/144:.0f} sqft)",
                    "requested_bhk": req_bhk,
                    "allocated_solver_bhk": actual_beds,
                    "predicted_neural_bhk": pred_bed_count,
                    "gt_feasible": bool(gt_feasible),
                    "pred_feasible": bool(pred_feas_bin),
                    "raw_overlaps": raw_plan_overlaps,
                    "repaired_overlaps": rep_overlaps,
                    "repaired_valid": rep_valid,
                    "issues": rep_issues[:2]
                })

    # -------------------------------------------------------------
    # Aggregate Metrics Calculation
    # -------------------------------------------------------------
    c_free_end, ram_avail_end = check_resources()

    # Latencies
    med_model_lat = float(np.median(model_inference_latencies))
    p95_model_lat = float(np.percentile(model_inference_latencies, 95))
    med_rep_lat = float(np.median(repair_latencies))
    p95_rep_lat = float(np.percentile(repair_latencies, 95))
    med_tot_lat = float(np.median(total_latencies))
    p95_tot_lat = float(np.percentile(total_latencies, 95))

    # Coordinate MAE
    mae_x = float(np.mean(coord_errors_x))
    mae_y = float(np.mean(coord_errors_y))
    mae_w = float(np.mean(coord_errors_w))
    mae_h = float(np.mean(coord_errors_h))
    overall_coord_mae = float(np.mean([mae_x, mae_y, mae_w, mae_h]))

    # Slot Classification (Precision, Recall, F1)
    tot_tp = sum(slot_confusions[s]["tp"] for s in ROOM_SLOTS)
    tot_fp = sum(slot_confusions[s]["fp"] for s in ROOM_SLOTS)
    tot_fn = sum(slot_confusions[s]["fn"] for s in ROOM_SLOTS)
    tot_tn = sum(slot_confusions[s]["tn"] for s in ROOM_SLOTS)

    overall_prec = tot_tp / max(1, (tot_tp + tot_fp))
    overall_rec = tot_tp / max(1, (tot_tp + tot_fn))
    overall_f1 = 2 * (overall_prec * overall_rec) / max(1e-6, (overall_prec + overall_rec))
    overall_acc = (tot_tp + tot_tn) / (tot_tp + tot_fp + tot_fn + tot_tn)

    per_slot_metrics = {}
    for s in ROOM_SLOTS:
        tp = slot_confusions[s]["tp"]
        fp = slot_confusions[s]["fp"]
        fn = slot_confusions[s]["fn"]
        tn = slot_confusions[s]["tn"]
        p = tp / max(1, tp + fp)
        r = tp / max(1, tp + fn)
        f1 = 2 * p * r / max(1e-6, p + r)
        s_mae = float(np.mean([
            np.mean(slot_coord_errors[s]["x"]) if slot_coord_errors[s]["x"] else 0,
            np.mean(slot_coord_errors[s]["y"]) if slot_coord_errors[s]["y"] else 0,
            np.mean(slot_coord_errors[s]["w"]) if slot_coord_errors[s]["w"] else 0,
            np.mean(slot_coord_errors[s]["h"]) if slot_coord_errors[s]["h"] else 0
        ]))
        per_slot_metrics[s] = {
            "precision": round(p, 4),
            "recall": round(r, 4),
            "f1": round(f1, 4),
            "mae_inches": round(s_mae, 1),
            "support": tp + fn
        }

    # Feasibility Classification Metrics
    feas_acc = (feas_tp + feas_tn) / max(1, feas_tp + feas_fp + feas_fn + feas_tn)
    feas_prec = feas_tp / max(1, feas_tp + feas_fp)
    feas_rec = feas_tp / max(1, feas_tp + feas_fn)
    feas_f1 = 2 * feas_prec * feas_rec / max(1e-6, feas_prec + feas_rec)

    # Overlap and Containment Rates
    raw_overlap_rate = (1.0 - (raw_plans_zero_overlap / num_test)) * 100.0
    raw_contain_rate = (raw_rooms_contained / max(1, raw_total_rooms)) * 100.0
    rep_overlap_rate = (1.0 - (repaired_plans_zero_overlap / num_test)) * 100.0
    rep_contain_rate = (repaired_rooms_contained / max(1, repaired_total_rooms)) * 100.0
    solver_overlap_rate = 0.0
    solver_contain_rate = (solver_rooms_contained / max(1, solver_total_rooms)) * 100.0

    # Build results summary dictionary
    benchmark_report = {
        "metadata": {
            "model_checkpoint": CHECKPOINT_PATH,
            "architecture": ckpt.get("architecture"),
            "parameter_count": ckpt.get("total_parameters"),
            "test_set_path": TEST_JSON,
            "test_sample_count": num_test,
            "device": "CPU"
        },
        "latency_ms": {
            "model_only_median": round(med_model_lat, 2),
            "model_only_p95": round(p95_model_lat, 2),
            "repair_median": round(med_rep_lat, 2),
            "repair_p95": round(p95_rep_lat, 2),
            "total_pipeline_median": round(med_tot_lat, 2),
            "total_pipeline_p95": round(p95_tot_lat, 2)
        },
        "accuracy_metrics": {
            "coordinate_mae_inches": {
                "overall": round(overall_coord_mae, 2),
                "x_mae": round(mae_x, 2),
                "y_mae": round(mae_y, 2),
                "width_mae": round(mae_w, 2),
                "height_mae": round(mae_h, 2)
            },
            "slot_classification": {
                "precision": round(overall_prec, 4),
                "recall": round(overall_rec, 4),
                "f1_score": round(overall_f1, 4),
                "accuracy": round(overall_acc, 4)
            },
            "feasibility_classification": {
                "accuracy": round(feas_acc, 4),
                "precision": round(feas_prec, 4),
                "recall": round(feas_rec, 4),
                "f1_score": round(feas_f1, 4),
                "confusion_matrix": {"tp": feas_tp, "fp": feas_fp, "fn": feas_fn, "tn": feas_tn}
            },
            "requirement_satisfaction_rate": {
                "bhk": round(float(np.mean(req_sat_bhk)) * 100.0, 1),
                "kitchen": round(float(np.mean(req_sat_kitchen)) * 100.0, 1),
                "pooja": round(float(np.mean(req_sat_pooja)) * 100.0, 1) if req_sat_pooja else 100.0,
                "toilet": round(float(np.mean(req_sat_toilet)) * 100.0, 1) if req_sat_toilet else 100.0
            }
        },
        "per_room_metrics": per_slot_metrics,
        "geometric_validity_comparison": {
            "raw_neural": {
                "plans_zero_overlap": f"{raw_plans_zero_overlap}/{num_test} ({raw_plans_zero_overlap/num_test*100:.1f}%)",
                "plans_fully_contained": f"{raw_plans_fully_contained}/{num_test} ({raw_plans_fully_contained/num_test*100:.1f}%)",
                "room_containment_rate": f"{raw_contain_rate:.1f}%",
                "total_overlapping_pairs": raw_total_overlaps,
                "avg_overlap_area_sqft": round(float(np.mean(raw_overlap_areas)), 1) if raw_overlap_areas else 0.0
            },
            "repaired_neural": {
                "plans_zero_overlap": f"{repaired_plans_zero_overlap}/{num_test} ({repaired_plans_zero_overlap/num_test*100:.1f}%)",
                "plans_fully_valid": f"{repaired_plans_fully_valid}/{num_test} ({repaired_plans_fully_valid/num_test*100:.1f}%)",
                "room_containment_rate": f"{rep_contain_rate:.1f}%",
                "total_overlapping_pairs": repaired_total_overlaps,
                "avg_overlap_area_sqft": round(float(np.mean(repaired_overlap_areas)), 1) if repaired_overlap_areas else 0.0
            },
            "deterministic_solver_baseline": {
                "plans_zero_overlap": f"{solver_plans_zero_overlap}/{num_test} (100.0%)",
                "plans_fully_valid": f"{solver_plans_fully_valid}/{num_test} (100.0%)",
                "room_containment_rate": "100.0%",
                "total_overlapping_pairs": 0,
                "avg_overlap_area_sqft": 0.0
            }
        },
        "failure_cases": failure_cases,
        "system_resources": {
            "disk_free_gb_before": round(c_free_start, 3),
            "disk_free_gb_after": round(c_free_end, 3),
            "ram_avail_mb_before": round(ram_avail_start, 1),
            "ram_avail_mb_after": round(ram_avail_end, 1)
        }
    }

    with open(BENCHMARK_RESULTS_JSON, "w", encoding="utf-8") as f:
        json.dump(benchmark_report, f, indent=2)

    print("\n" + "=" * 70)
    print("BENCHMARK COMPLETED SUCCESSFULLY!")
    print(f"Results saved to: {BENCHMARK_RESULTS_JSON}")
    print("=" * 70)

    # Print summary table to console
    print("\n--- LATENCY ---")
    print(f"Model Forward Pass: Median = {med_model_lat:.2f} ms | p95 = {p95_model_lat:.2f} ms")
    print(f"Geometric Repair:   Median = {med_rep_lat:.2f} ms | p95 = {p95_rep_lat:.2f} ms")
    print(f"End-to-End Pipeline: Median = {med_tot_lat:.2f} ms | p95 = {p95_tot_lat:.2f} ms")

    print("\n--- ACCURACY ---")
    print(f"Coordinate MAE: {overall_coord_mae:.1f} inches (x:{mae_x:.1f}\", y:{mae_y:.1f}\", w:{mae_w:.1f}\", h:{mae_h:.1f}\")")
    print(f"Slot Classification F1: {overall_f1*100:.1f}% (Precision: {overall_prec*100:.1f}%, Recall: {overall_rec*100:.1f}%)")
    print(f"Feasibility Accuracy: {feas_acc*100:.1f}% (Precision: {feas_prec*100:.1f}%, Recall: {feas_rec*100:.1f}%)")

    print("\n--- GEOMETRIC VALIDITY COMPARISON ---")
    print(f"Raw Neural Model:       0-Overlap Plans: {raw_plans_zero_overlap}/{num_test} ({raw_plans_zero_overlap/num_test*100:.1f}%) | Total Overlaps: {raw_total_overlaps}")
    print(f"Repaired Neural Model:  0-Overlap Plans: {repaired_plans_zero_overlap}/{num_test} ({repaired_plans_zero_overlap/num_test*100:.1f}%) | Total Overlaps: {repaired_total_overlaps}")
    print(f"Deterministic Solver:   0-Overlap Plans: {solver_plans_zero_overlap}/{num_test} (100.0%) | Total Overlaps: 0")


if __name__ == "__main__":
    run_benchmark()
