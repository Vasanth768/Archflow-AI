from __future__ import annotations

"""
spatial_layout_model.py - Stage 8C-B Lightweight Offline Spatial Layout MLP & Dataset Loader

Defines:
1. SpatialLayoutDataset & DataLoader for synthetic CAD training/validation.
2. Compact SpatialLayoutMLP (~85K parameters) operating 100% locally on CPU.
3. Masked loss function handling variable room allocations without phantom room penalties.
4. Normalization and denormalization helpers with explicit safety notices.

CRITICAL SAFETY & UNTRUSTED GEOMETRY NOTICE:
Raw predicted geometry produced by this neural network is UNTRUSTED.
Neural regression outputs are statistical approximations and DO NOT carry mathematical
guarantees of zero room overlap, wall connectivity, or strict plot containment.
All model predictions MUST be validated by ConstraintValidator and repaired by
the deterministic DynamicLayoutSolver before being consumed by any rendering or CAD pipeline.
Snapping alone does NOT guarantee 100% geometric validity.
"""

import os
import json
try:
    import torch
    import torch.nn as nn
    from torch.utils.data import Dataset, DataLoader
    HAS_TORCH = True
except ImportError:
    torch = None
    nn = None
    Dataset = object
    DataLoader = None
    HAS_TORCH = False

import numpy as np
from typing import Dict, Any, List, Tuple, Optional

# Stable, explicitly typed room slots (up to 8 discrete spatial roles)
ROOM_SLOTS = [
    "living",            # Slot 0: Primary living hall
    "kitchen",           # Slot 1: Kitchen area
    "master_bedroom",    # Slot 2: Master bedroom
    "bedroom_1",         # Slot 3: Secondary bedroom
    "bedroom_2",         # Slot 4: Tertiary bedroom
    "bedroom_3",         # Slot 5: Quaternary bedroom
    "attached_toilet",   # Slot 6: Toilet / Bathroom
    "pooja"              # Slot 7: Pooja room
]
NUM_ROOM_SLOTS = len(ROOM_SLOTS) # 8
BOX_COORDS = 4                   # (x, y, w, h)

CARDINAL_FACINGS = [
    "East", "North", "South", "West",
    "North-East", "North-West", "South-East", "South-West"
]
IN_FEATURES_DIM = 23  # 4 plot + 8 facing + 1 unit + 6 req flags + 4 requested dims


def extract_input_features(input_block: Dict[str, Any], as_numpy: bool = False) -> Any:
    """
    Encodes raw input requirement dict into a normalized 23-dimensional feature vector.
    All normalization factors are deterministic and fixed.
    Returns torch.Tensor if PyTorch is available and as_numpy is False, else np.ndarray.
    """
    plot = input_block.get("plot", {})
    req = input_block.get("requirements", {})

    w_inches = float(plot.get("widthInches", 360))
    l_inches = float(plot.get("lengthInches", 480))

    if w_inches <= 0 or l_inches <= 0:
        raise ValueError(f"Invalid plot dimensions: width={w_inches}, length={l_inches}")

    # Plot geometric features
    norm_w = w_inches / 1200.0                       # Max reference: 100 ft (1200 in)
    norm_l = l_inches / 1200.0
    aspect_ratio = w_inches / max(1.0, l_inches)
    norm_area = (w_inches * l_inches) / 1440000.0    # Normalized by 100x100 ft plot

    # Cardinal orientation one-hot (8 dims)
    facing_str = plot.get("facing", "East")
    facing_one_hot = [1.0 if facing_str == c else 0.0 for c in CARDINAL_FACINGS]

    # Unit system flag (0 = imperial, 1 = metric)
    unit_metric = 1.0 if plot.get("unitSystem") == "metric" else 0.0

    # User requirement features
    norm_bhk = float(req.get("bedrooms", 1)) / 5.0
    has_pooja = 1.0 if req.get("pooja") else 0.0
    has_parking = 1.0 if req.get("parking") else 0.0
    has_toilet = 1.0 if req.get("attachedToilet") else 0.0
    has_balcony = 1.0 if req.get("balcony") else 0.0
    has_study = 1.0 if req.get("study") else 0.0

    # Requested dimension features (Master bed & kitchen)
    mb_req = req.get("masterBedroom") or {}
    mb_w = float(mb_req.get("width", 0)) * 12.0 / 240.0 # Normalized by 20 ft
    mb_l = float(mb_req.get("length", 0)) * 12.0 / 240.0

    kit_req = req.get("kitchen") or {}
    kit_w = float(kit_req.get("width", 0)) * 12.0 / 240.0
    kit_l = float(kit_req.get("length", 0)) * 12.0 / 240.0

    features = [
        norm_w, norm_l, aspect_ratio, norm_area,
        *facing_one_hot,
        unit_metric,
        norm_bhk, has_pooja, has_parking, has_toilet, has_balcony, has_study,
        mb_w, mb_l, kit_w, kit_l
    ]

    if as_numpy or not HAS_TORCH or torch is None:
        return np.array(features, dtype=np.float32)
    return torch.tensor(features, dtype=torch.float32)


def map_rooms_to_slots(rooms: List[Dict[str, Any]], site_w: float, site_l: float) -> Tuple[torch.Tensor, torch.Tensor]:
    """
    Maps variable room lists into fixed 8-room slots.
    Returns:
    - target_boxes: (8, 4) tensor of normalized coordinates [x, y, w, h] in [0, 1]
    - target_mask: (8,) binary tensor indicating active rooms (1.0) vs unused slots (0.0)
    """
    boxes = torch.zeros((NUM_ROOM_SLOTS, BOX_COORDS), dtype=torch.float32)
    mask = torch.zeros((NUM_ROOM_SLOTS,), dtype=torch.float32)

    regular_bed_counter = 0

    for r in rooms:
        rtype = r.get("type", "other").lower()
        rx = float(r.get("x", 0)) / site_w
        ry = float(r.get("y", 0)) / site_l
        rw = float(r.get("w", 0)) / site_w
        rh = float(r.get("h", 0)) / site_l

        slot_idx = None
        if rtype == "living":
            slot_idx = 0
        elif rtype == "kitchen":
            slot_idx = 1
        elif rtype == "master_bedroom":
            slot_idx = 2
        elif "bed" in rtype:
            # Secondary/tertiary/quaternary bedrooms
            if regular_bed_counter == 0:
                slot_idx = 3 # bedroom_1
            elif regular_bed_counter == 1:
                slot_idx = 4 # bedroom_2
            elif regular_bed_counter == 2:
                slot_idx = 5 # bedroom_3
            regular_bed_counter += 1
        elif rtype in ["attached_toilet", "toilet", "bathroom"]:
            slot_idx = 6
        elif rtype == "pooja":
            slot_idx = 7

        if slot_idx is not None and slot_idx < NUM_ROOM_SLOTS:
            boxes[slot_idx] = torch.tensor([rx, ry, rw, rh], dtype=torch.float32)
            mask[slot_idx] = 1.0

    return boxes, mask


class SpatialLayoutDataset(Dataset):
    """
    PyTorch Dataset loading synthetic CAD layouts from JSON records.
    Strictly forbids loading held-out test data during training.
    """
    def __init__(self, json_path: str, split_name: str = "train"):
        self.json_path = json_path
        self.split_name = split_name.lower()

        # Quality Safeguard: Test set is strictly held out
        if self.split_name == "train" and "test.json" in os.path.basename(json_path).lower():
            raise ValueError(
                "DATASET INTEGRITY ERROR: Attempted to load test.json as training data! "
                "The test set is held out for unbiased evaluation and must never be used for training."
            )

        if not os.path.exists(json_path):
            raise FileNotFoundError(f"Dataset file not found: {json_path}")

        with open(json_path, "r", encoding="utf-8") as f:
            self.data = json.load(f)

        if not isinstance(self.data, list):
            raise ValueError(f"Malformed dataset: Expected JSON list, got {type(self.data)}")

    def __len__(self) -> int:
        return len(self.data)

    def __getitem__(self, idx: int) -> Dict[str, Any]:
        record = self.data[idx]

        # 1. Validate required top-level keys
        if "input" not in record or "target" not in record:
            raise KeyError(f"Record at index {idx} ({record.get('id', 'unknown')}) missing required 'input' or 'target' keys.")

        input_block = record["input"]
        target_block = record["target"]

        # 2. Extract and validate plot and requirements
        site = target_block.get("site", {})
        site_w = float(site.get("width", 0))
        site_l = float(site.get("length", 0))
        if site_w <= 0 or site_l <= 0:
            raise ValueError(f"Record {record.get('id')} has non-positive site dimensions: ({site_w}, {site_l})")

        # 3. Input features
        input_tensor = extract_input_features(input_block)

        # 4. Target boxes and active-room mask
        rooms = target_block.get("rooms", [])
        target_boxes, target_mask = map_rooms_to_slots(rooms, site_w, site_l)

        # 5. Dataset Quality Safeguard: Explicit Feasibility Label
        # Records where plot was too small for requested BHK have feasibility = 0
        req_bhk = input_block.get("requirements", {}).get("bedrooms", 1)
        actual_beds = sum(1 for r in rooms if "bed" in r.get("type", "").lower())
        is_feasible = 1.0 if actual_beds >= req_bhk else 0.0

        return {
            "id": record.get("id", f"sample_{idx}"),
            "input_features": input_tensor,
            "target_boxes": target_boxes,
            "target_mask": target_mask,
            "is_feasible": torch.tensor([is_feasible], dtype=torch.float32),
            "site_width": site_w,
            "site_length": site_l
        }


def create_spatial_dataloader(json_path: str, split_name: str = "train", batch_size: int = 16, shuffle: bool = True) -> DataLoader:
    """Creates a standard PyTorch DataLoader with conservative batch sizing for CPU."""
    dataset = SpatialLayoutDataset(json_path, split_name=split_name)
    return DataLoader(dataset, batch_size=batch_size, shuffle=shuffle, num_workers=0)


_BaseModule = nn.Module if (HAS_TORCH and nn is not None) else object


class SpatialLayoutMLP(_BaseModule):
    """
    Compact Spatial Layout Multi-Layer Perceptron (~84.5K parameters).
    Designed specifically for low-memory CPU execution without discrete GPU dependencies.
    
    Output-to-Room Mapping:
    - Slot 0: Living Hall
    - Slot 1: Kitchen
    - Slot 2: Master Bedroom
    - Slot 3: Secondary Bedroom (Bedroom 1)
    - Slot 4: Tertiary Bedroom (Bedroom 2)
    - Slot 5: Quaternary Bedroom (Bedroom 3)
    - Slot 6: Attached / Common Toilet
    - Slot 7: Pooja Room
    """
    def __init__(
        self,
        in_features: int = IN_FEATURES_DIM,
        num_slots: int = NUM_ROOM_SLOTS,
        hidden1: int = 144,
        hidden2: int = 256
    ):
        super().__init__()
        self.in_features = in_features
        self.num_slots = num_slots

        # Deep feedforward trunk with LayerNorm for stable CPU convergence
        self.trunk = nn.Sequential(
            nn.Linear(in_features, hidden1),
            nn.LayerNorm(hidden1),
            nn.ReLU(),
            nn.Linear(hidden1, hidden2),
            nn.LayerNorm(hidden2),
            nn.ReLU(),
            nn.Linear(hidden2, hidden1),
            nn.LayerNorm(hidden1),
            nn.ReLU(),
        )

        # Coordinate regression head: (num_slots * 4 coordinates in [0, 1])
        self.box_head = nn.Linear(hidden1, num_slots * BOX_COORDS)

        # Existence / Active mask classification head: (num_slots binary logits)
        self.mask_head = nn.Linear(hidden1, num_slots)

        # Physical feasibility classification head: (1 binary logit)
        self.feasibility_head = nn.Linear(hidden1, 1)

    def forward(self, x: torch.Tensor) -> Dict[str, torch.Tensor]:
        """
        Forward pass.
        Returns:
        - 'pred_boxes': (B, 8, 4) in [0, 1] range via Sigmoid activation
        - 'pred_mask_logits': (B, 8) unnormalized logits for active room slots
        - 'pred_feasibility_logits': (B, 1) unnormalized logit for plan feasibility
        """
        h = self.trunk(x)

        # Predict normalized coordinates bounded in [0, 1]
        raw_boxes = self.box_head(h)
        boxes = torch.sigmoid(raw_boxes).view(-1, self.num_slots, BOX_COORDS)

        # Predict room active logits and feasibility
        mask_logits = self.mask_head(h)
        feasibility_logits = self.feasibility_head(h)

        return {
            "pred_boxes": boxes,
            "pred_mask_logits": mask_logits,
            "pred_feasibility_logits": feasibility_logits
        }

    def count_parameters(self) -> int:
        """Returns total trainable parameter count."""
        return sum(p.numel() for p in self.parameters() if p.requires_grad)


class NumpySpatialLayoutMLP:
    """
    Lightweight, zero-dependency NumPy inference engine for SpatialLayoutMLP.
    Reproduces the exact feedforward trunk, LayerNorm (eps=1e-5), ReLU,
    sigmoid-activated box coordinates, mask logits, and feasibility logits.
    """
    EXPECTED_SHAPES = {
        "trunk.0.weight": (144, 23),
        "trunk.0.bias": (144,),
        "trunk.1.weight": (144,),
        "trunk.1.bias": (144,),
        "trunk.3.weight": (256, 144),
        "trunk.3.bias": (256,),
        "trunk.4.weight": (256,),
        "trunk.4.bias": (256,),
        "trunk.6.weight": (144, 256),
        "trunk.6.bias": (144,),
        "trunk.7.weight": (144,),
        "trunk.7.bias": (144,),
        "box_head.weight": (32, 144),
        "box_head.bias": (32,),
        "mask_head.weight": (8, 144),
        "mask_head.bias": (8,),
        "feasibility_head.weight": (1, 144),
        "feasibility_head.bias": (1,)
    }

    def __init__(self, weights: Dict[str, Any]):
        self.in_features = IN_FEATURES_DIM
        self.num_slots = NUM_ROOM_SLOTS
        self.w = self._validate_and_sanitize_weights(weights)

    def _validate_and_sanitize_weights(self, weights: Dict[str, Any]) -> Dict[str, np.ndarray]:
        sanitized = {}
        for name, exp_shape in self.EXPECTED_SHAPES.items():
            if name not in weights:
                raise ValueError(f"Missing required weight tensor: '{name}'")
            arr = np.asarray(weights[name], dtype=np.float32)
            if arr.shape != exp_shape:
                raise ValueError(f"Weight tensor '{name}' shape mismatch: expected {exp_shape}, got {arr.shape}")
            if not np.all(np.isfinite(arr)):
                raise ValueError(f"Weight tensor '{name}' contains non-finite values (NaN or Inf)")
            sanitized[name] = arr
        return sanitized

    @staticmethod
    def _layer_norm(x: np.ndarray, gamma: np.ndarray, beta: np.ndarray, eps: float = 1e-5) -> np.ndarray:
        mean = np.mean(x, axis=-1, keepdims=True)
        var = np.var(x, axis=-1, keepdims=True, ddof=0)
        norm = (x - mean) / np.sqrt(var + eps)
        return norm * gamma + beta

    @staticmethod
    def _relu(x: np.ndarray) -> np.ndarray:
        return np.maximum(0.0, x)

    @staticmethod
    def _sigmoid(x: np.ndarray) -> np.ndarray:
        return 1.0 / (1.0 + np.exp(-x))

    def forward(self, x: Any) -> Dict[str, np.ndarray]:
        if hasattr(x, "detach"):
            x = x.detach().cpu().numpy()
        elif hasattr(x, "numpy"):
            x = x.numpy()
        elif isinstance(x, (list, tuple)):
            x = np.array(x, dtype=np.float32)

        if not isinstance(x, np.ndarray):
            raise TypeError(f"Expected numpy ndarray or tensor, got {type(x).__name__}")

        if x.ndim == 1:
            x = x.reshape(1, -1)

        if x.shape[-1] != self.in_features:
            raise ValueError(f"Feature dimension mismatch: expected {self.in_features}, got {x.shape[-1]}")

        if not np.all(np.isfinite(x)):
            raise ValueError("Input features contain non-finite values (NaN or Inf)")

        x = x.astype(np.float32)

        # Trunk Layer 1: Linear(23, 144) -> LayerNorm(144) -> ReLU
        h = x @ self.w["trunk.0.weight"].T + self.w["trunk.0.bias"]
        h = self._layer_norm(h, self.w["trunk.1.weight"], self.w["trunk.1.bias"])
        h = self._relu(h)

        # Trunk Layer 2: Linear(144, 256) -> LayerNorm(256) -> ReLU
        h = h @ self.w["trunk.3.weight"].T + self.w["trunk.3.bias"]
        h = self._layer_norm(h, self.w["trunk.4.weight"], self.w["trunk.4.bias"])
        h = self._relu(h)

        # Trunk Layer 3: Linear(256, 144) -> LayerNorm(144) -> ReLU
        h = h @ self.w["trunk.6.weight"].T + self.w["trunk.6.bias"]
        h = self._layer_norm(h, self.w["trunk.7.weight"], self.w["trunk.7.bias"])
        h = self._relu(h)

        # Head 1: box_head Linear(144, 32) -> Sigmoid -> reshape(B, 8, 4)
        raw_boxes = h @ self.w["box_head.weight"].T + self.w["box_head.bias"]
        pred_boxes = self._sigmoid(raw_boxes).reshape(-1, self.num_slots, BOX_COORDS)

        # Head 2: mask_head Linear(144, 8)
        pred_mask_logits = h @ self.w["mask_head.weight"].T + self.w["mask_head.bias"]

        # Head 3: feasibility_head Linear(144, 1)
        pred_feasibility_logits = h @ self.w["feasibility_head.weight"].T + self.w["feasibility_head.bias"]

        return {
            "pred_boxes": pred_boxes,
            "pred_mask_logits": pred_mask_logits,
            "pred_feasibility_logits": pred_feasibility_logits
        }

    def __call__(self, x: Any) -> Dict[str, np.ndarray]:
        return self.forward(x)

    def count_parameters(self) -> int:
        return sum(v.size for v in self.w.values())


class MaskedSpatialLayoutLoss(_BaseModule):
    """
    Loss function tailored for variable architectural room allocations.
    
    Guarantees:
    - Only ACTIVE rooms contribute to the coordinate regression loss.
    - Nonexistent / inactive room slots receive zero gradient penalty on their bounding boxes.
    - Mask prediction is supervised via binary cross-entropy.
    """
    def __init__(self, coord_weight: float = 1.0, mask_weight: float = 0.5, feasibility_weight: float = 0.2):
        super().__init__()
        self.coord_weight = coord_weight
        self.mask_weight = mask_weight
        self.feasibility_weight = feasibility_weight

        self.coord_criterion = nn.SmoothL1Loss(reduction="none")
        self.mask_criterion = nn.BCEWithLogitsLoss()
        self.feasibility_criterion = nn.BCEWithLogitsLoss()

    def forward(
        self,
        pred_dict: Dict[str, torch.Tensor],
        target_boxes: torch.Tensor,
        target_mask: torch.Tensor,
        target_feasibility: torch.Tensor
    ) -> Tuple[torch.Tensor, Dict[str, float]]:
        pred_boxes = pred_dict["pred_boxes"]                  # (B, 8, 4)
        pred_mask_logits = pred_dict["pred_mask_logits"]      # (B, 8)
        pred_feasibility = pred_dict["pred_feasibility_logits"] # (B, 1)

        # 1. Masked Coordinate Regression Loss
        raw_box_loss = self.coord_criterion(pred_boxes, target_boxes) # (B, 8, 4)
        mask_expanded = target_mask.unsqueeze(-1)                     # (B, 8, 1)
        active_box_loss = (raw_box_loss * mask_expanded).sum()
        total_active_coords = (mask_expanded.sum() * BOX_COORDS).clamp(min=1.0)
        coord_loss = active_box_loss / total_active_coords

        # 2. Room Existence Mask Loss
        mask_loss = self.mask_criterion(pred_mask_logits, target_mask)

        # 3. Feasibility Classification Loss
        feasibility_loss = self.feasibility_criterion(pred_feasibility, target_feasibility)

        total_loss = (
            self.coord_weight * coord_loss +
            self.mask_weight * mask_loss +
            self.feasibility_weight * feasibility_loss
        )

        metrics = {
            "coord_loss": float(coord_loss.item()),
            "mask_loss": float(mask_loss.item()),
            "feasibility_loss": float(feasibility_loss.item()),
            "total_loss": float(total_loss.item())
        }

        return total_loss, metrics


def denormalize_layout(
    pred_boxes: torch.Tensor,
    site_w: float,
    site_l: float,
    pred_mask_logits: Optional[torch.Tensor] = None,
    threshold: float = 0.5
) -> List[Dict[str, Any]]:
    """
    Transforms normalized [0, 1] predictions into architectural room entities (inches).
    
    SAFETY NOTICE:
    Output rooms are raw neural proposals. They MUST be validated via ConstraintValidator
    and repaired by DynamicLayoutSolver before production CAD usage.
    """
    rooms = []
    boxes_np = pred_boxes.detach().cpu().numpy()
    mask_active = [True] * NUM_ROOM_SLOTS

    if pred_mask_logits is not None:
        probs = torch.sigmoid(pred_mask_logits).detach().cpu().numpy()
        mask_active = [p >= threshold for p in probs]

    for slot_idx in range(NUM_ROOM_SLOTS):
        if not mask_active[slot_idx]:
            continue

        slot_name = ROOM_SLOTS[slot_idx]
        bx, by, bw, bh = boxes_np[slot_idx]

        # Scale from [0, 1] to architectural inches
        rx = max(0.0, min(site_w, bx * site_w))
        ry = max(0.0, min(site_l, by * site_l))
        rw = max(48.0, min(site_w - rx, bw * site_w)) # Min 4' room dimension
        rh = max(48.0, min(site_l - ry, bh * site_l))

        rooms.append({
            "id": f"pred_{slot_name}",
            "name": slot_name.replace("_", " ").upper(),
            "type": slot_name.split("_")[0] if "bedroom" in slot_name else slot_name,
            "slot": slot_name,
            "x": round(rx, 1),
            "y": round(ry, 1),
            "w": round(rw, 1),
            "h": round(rh, 1)
        })

    return rooms
