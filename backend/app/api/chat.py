from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..core.database import get_db, Scan, Chat
from ..core.security import get_current_user
from ..models.schemas import ChatMessage, ChatResponse
from ..services.chat_service import get_chat_response

router = APIRouter(prefix="/api/chat", tags=["chat"])


@router.post("/", response_model=ChatResponse)
async def chat(msg: ChatMessage, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    scan = db.query(Scan).filter(Scan.id == msg.scan_id, Scan.user_id == current_user.id).first()
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")
    scan_data = {
        "filename": scan.filename, "exposure_score": scan.exposure_score,
        "risk_level": scan.risk_level, "summary": scan.summary,
        "warnings": scan.warnings or [], "safe_fields": scan.safe_fields or [],
        "sensitive_count": scan.sensitive_count, "total_count": scan.total_count,
        "entities": scan.entities or [],
    }
    history = [{"role": c.role, "content": c.content}
               for c in db.query(Chat).filter(Chat.scan_id == msg.scan_id).order_by(Chat.created_at).all()]
    reply = await get_chat_response(msg.message, scan_data, history)
    db.add(Chat(scan_id=msg.scan_id, role="user", content=msg.message))
    db.add(Chat(scan_id=msg.scan_id, role="assistant", content=reply))
    db.commit()
    return ChatResponse(reply=reply, scan_id=msg.scan_id)


@router.get("/{scan_id}/history")
def get_history(scan_id: str, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    scan = db.query(Scan).filter(Scan.id == scan_id, Scan.user_id == current_user.id).first()
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")
    chats = db.query(Chat).filter(Chat.scan_id == scan_id).order_by(Chat.created_at).all()
    return [{"id": c.id, "role": c.role, "content": c.content, "created_at": c.created_at} for c in chats]