"""
Analysis Service — full AI pipeline:
OCR → LayoutLMv3 embeddings → SGAT graph classification → Exposure scoring
"""
import os
import torch
import numpy as np
from PIL import Image
from typing import List, Dict

from ..models.sgat_model import SGAT, build_graph
from ..services.ocr_service import run_ocr_on_image, run_ocr_on_pdf
from ..services.exposure_service import find_sensitive_spans, compute_exposure_score
from ..core.config import settings

ID2LABEL = {0: "OTHER", 1: "KEY", 2: "VALUE", 3: "HEADER", 4: "QUESTION"}
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

_processor = None
_layoutlm = None
_sgat = None
_models_loaded = False


def _load_models():
    global _processor, _layoutlm, _sgat, _models_loaded
    if _models_loaded:
        return
    from transformers import LayoutLMv3Processor, LayoutLMv3Model
    print("[MODEL] Loading LayoutLMv3…")
    model_name = "microsoft/layoutlmv3-large"
    sgat_input_dim = 1024
    try:
        _processor = LayoutLMv3Processor.from_pretrained(model_name, apply_ocr=False)
        _layoutlm = LayoutLMv3Model.from_pretrained(model_name).to(device)
    except Exception:
        print("[MODEL] Falling back to layoutlmv3-base…")
        model_name = "microsoft/layoutlmv3-base"
        sgat_input_dim = 768
        _processor = LayoutLMv3Processor.from_pretrained(model_name, apply_ocr=False)
        _layoutlm = LayoutLMv3Model.from_pretrained(model_name).to(device)
    _layoutlm.eval()
    print(f"[MODEL] {model_name} loaded on {device}")
    _sgat = SGAT(input_dim=sgat_input_dim, classes=5).to(device)
    model_path = settings.MODEL_PATH
    if os.path.exists(model_path):
        checkpoint = torch.load(model_path, map_location=device)
        state_dict = checkpoint.get("sgat_model", checkpoint)
        try:
            _sgat.load_state_dict(state_dict)
            print(f"[MODEL] SGAT loaded from {model_path}")
        except RuntimeError:
            print("[MODEL] Retrying SGAT with base dims…")
            _sgat = SGAT(input_dim=768, classes=5).to(device)
            _sgat.load_state_dict(state_dict, strict=False)
    else:
        print(f"[MODEL] Warning: {model_path} not found")
    _sgat.eval()
    _models_loaded = True


def _run_layoutlm_sgat(image: Image.Image, tokens: List[str], bboxes: List[List[int]]) -> List[str]:
    try:
        _load_models()
        encoding = _processor(
            image, tokens, boxes=bboxes,
            return_tensors="pt", padding="max_length",
            truncation=True, max_length=512
        )
        encoding = {k: v.to(device) for k, v in encoding.items()}
        with torch.no_grad():
            outputs = _layoutlm(**encoding)
        valid_len = int((encoding["attention_mask"][0] == 1).sum())
        emb = outputs.last_hidden_state[0][:valid_len]
        valid_bboxes = encoding["bbox"][0][:valid_len].cpu().numpy().tolist()
        edge_index = build_graph(valid_bboxes)
        if edge_index.numel() == 0 or (edge_index.numel() > 0 and edge_index.max() >= emb.shape[0]):
            return ["OTHER"] * valid_len
        edge_index = edge_index.to(device)
        with torch.no_grad():
            pred = _sgat(emb, edge_index)
        predicted_ids = torch.argmax(pred, dim=1).cpu().numpy()
        return [ID2LABEL.get(int(i), "OTHER") for i in predicted_ids]
    except Exception as e:
        print(f"[SGAT ERROR] {e}")
        return ["OTHER"] * len(tokens)


def _build_summary(score, level, sensitive, total, warnings):
    if level == "Safe":
        return f"Your document appears safe with an exposure score of {score:.1f}%. All {total} detected fields contain no sensitive information. Safe to share."
    elif level == "Low":
        return f"Low exposure risk ({score:.1f}%). {sensitive} of {total} fields may contain mildly sensitive content. Review before sharing externally."
    elif level == "Medium":
        return f"Moderate privacy exposure ({score:.1f}%). {sensitive} of {total} fields contain potentially sensitive data. Consider redacting highlighted fields."
    elif level == "High":
        return f"High privacy exposure ({score:.1f}%)! {sensitive} of {total} fields contain sensitive information. Do NOT share without proper redaction."
    else:
        return f"CRITICAL privacy exposure ({score:.1f}%)! This document contains {sensitive} highly sensitive fields. Do NOT share or transmit this document."


async def analyze_document(
    file_bytes: bytes,
    filename: str,
    file_type: str,
    representative_image: Image.Image,
) -> Dict:
    if file_type == "pdf":
        tokens, bboxes = run_ocr_on_pdf(file_bytes)
    else:
        tokens, bboxes = run_ocr_on_image(representative_image)

    if not tokens:
        return {
            "entities": [], "raw_text": "", "exposure_score": 0.0,
            "risk_level": "Safe", "warnings": [], "safe_fields": [],
            "sensitive_count": 0, "total_count": 0,
            "summary": "No text could be extracted from this document.",
        }

    raw_text = " ".join(tokens)
    model_tokens = tokens[:512]
    model_bboxes = bboxes[:512]
    predicted_labels = _run_layoutlm_sgat(representative_image, model_tokens, model_bboxes)

    while len(predicted_labels) < len(tokens):
        predicted_labels.append("OTHER")

    sensitive_spans = find_sensitive_spans(raw_text)

    entities = []
    current_idx = 0
    token_infos = []

    for i in range(min(len(tokens), len(predicted_labels))):
        text = tokens[i]
        label = predicted_labels[i]
        bbox = bboxes[i] if i < len(bboxes) else [0, 0, 0, 0]
        
        start_idx = raw_text.find(text, current_idx)
        if start_idx == -1:
            start_idx = current_idx  # Fallback
        end_idx = start_idx + len(text)
        current_idx = end_idx
        
        token_infos.append({
            "text": text, "label": label, "bbox": bbox,
            "start": start_idx, "end": end_idx, "used": False
        })
        
    for span in sensitive_spans:
        group_tokens = []
        for t in token_infos:
            if not t["used"] and max(t["start"], span["start"]) < min(t["end"], span["end"]):
                group_tokens.append(t)
                t["used"] = True
                
        if group_tokens:
            min_x = min(t["bbox"][0] for t in group_tokens)
            min_y = min(t["bbox"][1] for t in group_tokens)
            max_x = max(t["bbox"][2] for t in group_tokens)
            max_y = max(t["bbox"][3] for t in group_tokens)
            
            entities.append({
                "text": span["text"],
                "label": group_tokens[0]["label"],
                "bbox": [min_x, min_y, max_x, max_y],
                "sensitivity": span["sensitivity"],
                "risk_score": span["score"],
                "matched_types": [span["match_type"]],
            })

    for t in token_infos:
        if not t["used"]:
            entities.append({
                "text": t["text"], "label": t["label"], "bbox": t["bbox"],
                "sensitivity": "Very Low", "risk_score": 0.0,
                "matched_types": [],
            })

    # Sort entities back to document order based on vertical bounding box
    entities.sort(key=lambda e: (e["bbox"][1], e["bbox"][0]))

    exposure_score, risk_level, warnings, safe_fields = compute_exposure_score(entities)
    sensitive_count = sum(1 for e in entities if e["sensitivity"] in ("Critical", "High", "Medium"))
    total_count = len(entities)
    summary = _build_summary(exposure_score, risk_level, sensitive_count, total_count, warnings)

    return {
        "entities": entities, "raw_text": raw_text,
        "exposure_score": exposure_score, "risk_level": risk_level,
        "warnings": warnings, "safe_fields": safe_fields,
        "sensitive_count": sensitive_count, "total_count": total_count,
        "summary": summary,
    }