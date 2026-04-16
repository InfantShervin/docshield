"""
Chat Service — AI assistant that answers questions about analyzed documents.
Uses OpenAI GPT-4o-mini if key is set, otherwise uses smart rule-based fallback.
"""
from typing import List, Dict
from ..core.config import settings

SYSTEM_PROMPT = """You are a helpful privacy assistant. 
You are looking at a document analysis and answering questions for the user. 
Try to be helpful, informal, and point out exactly what sensitive stuff was found.

--- ANALYSIS DATA ---
{analysis_context}
--- END ---

Help the user understand:
- Why certain fields are risky.
- How they can hide/redact them.
- What rules (GDPR, HIPAA, etc.) might apply.
- General advice on sharing the file safely."""


def _build_context(scan_data: Dict) -> str:
    lines = [
        f"Filename: {scan_data.get('filename', 'Unknown')}",
        f"Exposure Score: {scan_data.get('exposure_score', 0):.1f}%",
        f"Risk Level: {scan_data.get('risk_level', 'Unknown')}",
        f"Sensitive Fields: {scan_data.get('sensitive_count', 0)} / {scan_data.get('total_count', 0)}",
        f"Summary: {scan_data.get('summary', '')}",
        "", "Warnings:",
    ]
    for w in scan_data.get("warnings", []):
        lines.append(f"  • {w}")
    lines.append("")
    lines.append("Detected sensitive entities:")
    for e in [x for x in scan_data.get("entities", []) if x.get("sensitivity") not in ("Very Low",)][:20]:
        lines.append(f"  [{e['label']}] \"{e['text']}\" → {e['sensitivity']} {e.get('matched_types', [])}")
    return "\n".join(lines)


def _rule_based_response(message: str, scan_data: Dict) -> str:
    msg = message.lower()
    score = scan_data.get("exposure_score", 0)
    level = scan_data.get("risk_level", "Safe")
    warnings = scan_data.get("warnings", [])
    sensitive = scan_data.get("sensitive_count", 0)
    total = scan_data.get("total_count", 0)

    if any(k in msg for k in ["score", "exposure", "percentage", "percent"]):
        return f"Your document has an **exposure score of {score:.1f}%** with a **{level}** risk level. This means {sensitive} out of {total} extracted fields contain sensitive or identifiable information."

    if any(k in msg for k in ["why", "how", "reason", "false positive", "wrong", "incorrect", "but"]):
        return (
            "The scanner uses a mix of OCR and pattern matching to find stuff.\n\n"
            "Sometimes it might misidentify a field (like confusing a PAN card for a Credit Card) if the formats look similar. "
            "It's always worth double-checking the highlights yourself."
        )

    if any(k in msg for k in ["warn", "danger", "sensitive", "found", "detect", "what"]):
        if warnings:
            return "The following sensitive fields were detected:\n\n" + "\n".join(f"• {w}" for w in warnings)
        return "No high-risk fields were detected in this document. It appears safe."

    if any(k in msg for k in ["safe", "share", "send", "okay", "ok", "can i"]):
        if level in ("Safe", "Low"):
            return f"With a {level} risk level and score of {score:.1f}%, this document is relatively **safe to share**. Always double-check before sending to unknown parties."
        return f"⚠️ With a **{level}** risk level and score of {score:.1f}%, I would **NOT recommend sharing** this document without first redacting the highlighted fields."

    if any(k in msg for k in ["redact", "remove", "hide", "protect", "anonymize"]):
        types = list({w.split("—")[0].replace("🔴", "").replace("🟠", "").strip() for w in warnings})
        if types:
            return f"To protect this document, redact these fields: **{', '.join(types)}**.\n\nUse tools like Adobe Acrobat Pro, LibreOffice Draw, or an online redaction service to black out these areas before sharing."
        return "No critical fields were found that need redaction."

    if any(k in msg for k in ["law", "legal", "regulation", "gdpr", "dpdp", "hipaa"]):
        return ("Applicable regulations may include:\n"
                "• **DPDP Act 2023** (India) — covers Aadhaar, PAN, medical records\n"
                "• **GDPR** (EU) — covers email, phone, passport data\n"
                "• **HIPAA** (US) — covers medical records and diagnoses\n"
                "• **PCI-DSS** — covers credit card numbers and CVV\n"
                "Consult a legal professional for advice specific to your situation.")

    return (f"Hi! I'm your privacy assistant 🛡️. Your document has a **{level}** risk level (score: **{score:.1f}%**).\n\n"
            "You can ask me about:\n• What I found\n• If it's safe to share\n• How to redact it\n• Legal risks")


async def get_chat_response(message: str, scan_data: Dict, history: List[Dict]) -> str:
    if settings.OPENAI_API_KEY and settings.OPENAI_API_KEY.startswith("sk-"):
        try:
            from openai import AsyncOpenAI
            client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
            context = _build_context(scan_data)
            messages = [{"role": "system", "content": SYSTEM_PROMPT.format(analysis_context=context)}]
            for h in history[-10:]:
                messages.append({"role": h["role"], "content": h["content"]})
            messages.append({"role": "user", "content": message})
            response = await client.chat.completions.create(
                model="gpt-4o-mini", messages=messages, max_tokens=600, temperature=0.4,
            )
            return response.choices[0].message.content
        except Exception as e:
            print(f"[OPENAI ERROR] {e}")
    return _rule_based_response(message, scan_data)