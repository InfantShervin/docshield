"""
Exposure Engine — detects 30+ PII patterns and scores document risk.
"""
import re
from typing import List, Dict, Tuple

SENSITIVE_PATTERNS: Dict[str, tuple] = {
    "Aadhaar Number":     (r"\b\d{4}[\s\-]?\d{4}[\s\-]?\d{4}\b", 95),
    "PAN Card":           (r"\b[A-Z]{5}[0-9]{4}[A-Z]\b", 90),
    "Passport Number":    (r"\b[A-Z][0-9]{7}\b", 88),
    "Voter ID":           (r"\b[A-Z]{3}[0-9]{7}\b", 82),
    "Driving Licence":    (r"\b[A-Z]{2}\d{2}[A-Z]{1,2}\d{4,11}\b", 80),
    "SSN (US)":           (r"\b\d{3}-\d{2}-\d{4}\b", 95),
    "Credit/Debit Card":  (r"\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|3(?:0[0-5]|[68][0-9])[0-9]{11}|(?:2131|1800|35\d{3})\d{11})\b", 93),
    "CVV":                (r"\bCVV\s*[:\-]?\s*\d{3,4}\b", 95, re.IGNORECASE),
    "IFSC Code":          (r"\b[A-Z]{4}0[A-Z0-9]{6}\b", 70),
    "Bank Account":       (r"\b(?:account|a/c)\s*(?:no|number)?\s*[:\-]?\s*\d{9,18}\b", 78, re.IGNORECASE),
    "UPI ID":             (r"\b[\w.\-]+@[a-z]{3,10}\b", 65),
    "Phone Number":       (r"\b(?:\+91[\s\-]?)?[6-9]\d{9}\b", 65),
    "Email Address":      (r"\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}\b", 60),
    "Date of Birth":      (r"\b(?:dob|date\s+of\s+birth)\s*[:\-]?\s*\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b", 75, re.IGNORECASE),
    "Home Address":       (r"\b\d{1,5}[\s,]+[A-Za-z\s,]{5,60}(?:Street|St|Road|Rd|Avenue|Ave|Nagar|Colony)\b", 58, re.IGNORECASE),
    "Medical Record No":  (r"\b(?:MRN|medical\s+record|patient\s+id)\s*[:\-]?\s*[A-Z0-9]{5,15}\b", 88, re.IGNORECASE),
    "Diagnosis":          (r"\b(?:diagnosis|diagnosed\s+with|condition|disease)\s*[:\-]?\s*[A-Za-z\s]{3,50}\b", 85, re.IGNORECASE),
    "Prescription":       (r"\b(?:prescription|rx|dosage|tablet|capsule)\b", 80, re.IGNORECASE),
    "Blood Group":        (r"\b(?:blood\s+group|blood\s+type)\s*[:\-]?\s*(?:A|B|AB|O)[+-]\b", 65, re.IGNORECASE),
    "Password":           (r"\b(?:password|passwd|pwd)\s*[:\-=]\s*\S{4,}\b", 98, re.IGNORECASE),
    "API Key / Token":    (r"\b(?:api[_\s]?key|token|secret)\s*[:\-=]\s*[A-Za-z0-9_\-\.]{16,}\b", 95, re.IGNORECASE),
    "Private Key":        (r"-----BEGIN (?:RSA |EC )?PRIVATE KEY-----", 99),
    "Vehicle Number":     (r"\b[A-Z]{2}[\s\-]?\d{2}[\s\-]?[A-Z]{1,2}[\s\-]?\d{4}\b", 52),
    "Salary/Income":      (r"\b(?:salary|ctc|income|₹|Rs\.?)\s*[\d,\.]+\b", 72, re.IGNORECASE),
    "Case Number":        (r"\b(?:case|FIR)\s*(?:no|number)?\s*[:\-]?\s*[A-Z0-9\/]{3,20}\b", 70, re.IGNORECASE),
}

SENSITIVITY_THRESHOLDS = [
    (85, "Critical"), (70, "High"), (50, "Medium"), (20, "Low"), (0, "Very Low"),
]

RISK_LEVEL_THRESHOLDS = [
    (75, "Critical"), (50, "High"), (25, "Medium"), (5, "Low"), (0, "Safe"),
]


def classify_text_sensitivity(text: str, raw_text: str = "", start_idx: int = -1, end_idx: int = -1) -> Tuple[str, float, List[str]]:
    max_score = 0.0
    matched: List[str] = []
    
    # If we have the full text and context indices, run patterns on full text
    search_text = raw_text if raw_text and start_idx >= 0 and end_idx >= 0 else text
    
    for name, pattern_info in SENSITIVE_PATTERNS.items():
        if len(pattern_info) == 3:
            pattern, score, flags = pattern_info
            # Use finditer to get all matches
            matches = list(re.finditer(pattern, search_text, flags))
        else:
            pattern, score = pattern_info
            matches = list(re.finditer(pattern, search_text))
            
        for match in matches:
            # If we are searching full text, check if this match overlaps with our token
            if search_text == raw_text:
                m_start, m_end = match.span()
                # Overlap condition: max(m_start, start_idx) < min(m_end, end_idx)
                if max(m_start, start_idx) < min(m_end, end_idx):
                    if name not in matched:
                        matched.append(name)
                    max_score = max(max_score, float(score))
            else:
                if name not in matched:
                    matched.append(name)
                max_score = max(max_score, float(score))
                
    sensitivity = next((label for threshold, label in SENSITIVITY_THRESHOLDS if max_score >= threshold), "Very Low")
    return sensitivity, round(max_score / 100.0, 4), matched


def find_sensitive_spans(raw_text: str) -> List[Dict]:
    """Finds all occurrences of sensitive patterns in the full text."""
    spans = []
    for name, pattern_info in SENSITIVE_PATTERNS.items():
        if len(pattern_info) == 3:
            pattern, score, flags = pattern_info
            matches = list(re.finditer(pattern, raw_text, flags))
        else:
            pattern, score = pattern_info
            matches = list(re.finditer(pattern, raw_text))
            
        for match in matches:
            m_start, m_end = match.span()
            # Determine sensitivity
            sensitivity = next((label for threshold, label in SENSITIVITY_THRESHOLDS if float(score) >= threshold), "Very Low")
            spans.append({
                "match_type": name,
                "score": round(float(score) / 100.0, 4),
                "sensitivity": sensitivity,
                "start": m_start,
                "end": m_end,
                "text": match.group(0)
            })
    return spans


def compute_exposure_score(entities: List[Dict]) -> Tuple[float, str, List[str], List[str]]:
    if not entities:
        return 0.0, "Safe", [], []
    WEIGHT_MAP = {"Critical": 1.0, "High": 0.75, "Medium": 0.5, "Low": 0.2, "Very Low": 0.0}
    weighted_sum = sum(WEIGHT_MAP.get(e.get("sensitivity", "Very Low"), 0.0) for e in entities)
    n = len(entities)
    base_score = (weighted_sum / n) * 100.0 if n > 0 else 0.0
    critical_count = sum(1 for e in entities if e.get("sensitivity") in ("Critical", "High"))
    amplification = min(1.0 + critical_count * 0.04, 1.6)
    score = min(base_score * amplification, 100.0)
    risk_level = next((label for threshold, label in RISK_LEVEL_THRESHOLDS if score >= threshold), "Safe")
    warnings: List[str] = []
    seen_types: set = set()
    for e in entities:
        if e.get("sensitivity") not in ("Critical", "High"):
            continue
        for mtype in e.get("matched_types", []):
            if mtype not in seen_types:
                seen_types.add(mtype)
                preview = e["text"][:25] + "…" if len(e["text"]) > 25 else e["text"]
                icon = "🔴" if e["sensitivity"] == "Critical" else "🟠"
                warnings.append(f"{icon} {mtype} detected — \"{preview}\"")
    safe_fields = [
        e["text"] for e in entities
        if e.get("sensitivity") in ("Very Low", "Low") and len(e["text"]) > 2
    ][:12]
    return round(score, 2), risk_level, warnings[:12], safe_fields