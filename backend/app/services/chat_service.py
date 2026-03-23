"""
Chat Service — AI assistant that answers questions about analyzed documents.
Uses OpenAI GPT-4o-mini if key is set, otherwise uses smart rule-based fallback.
"""
from typing import List, Dict
from ..core.config import settings

SYSTEM_PROMPT = """You are DocShield AI, an expert privacy and document security analyst.
You have analyzed a document and extracted this information:

--- DOCUMENT ANALYSIS ---
{analysis_context}
--- END ANALYSIS ---

Answer the user's questions about:
- What sensitive information was found and why it is risky
- How to protect or redact specific fields
- What laws apply (GDPR, DPDP Act India, HIPAA, PCI-DSS)
- How much risk each piece of data poses
- Recommendations for secure handling

Be specific, helpful, and refer to actual data found above."""


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
            "DocShield AI uses a combination of OCR (text extraction) and layout analysis to detect sensitive information.\n\n"
            "If a field appears incorrect (for example, an Aadhaar number being flagged as a Credit Card, or vice versa), "
            "it occurs when the text's length and format overlap with multiple detection rules. Verify the highlights manually, as OCR can sometimes merge adjacent digits or spaces."
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

    return (f"I'm DocShield AI 🛡️ Your document has a **{level}** risk level with an exposure score of **{score:.1f}%**.\n\n"
            "Ask me about:\n• What sensitive data was found\n• Whether it's safe to share\n• How to redact sensitive fields\n• What legal risks apply")


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