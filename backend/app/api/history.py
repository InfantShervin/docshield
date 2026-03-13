from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from collections import Counter
from ..core.database import get_db, Scan
from ..core.security import get_current_user
from ..models.schemas import ScanSummary, ScanDetail, StatsResponse

router = APIRouter(prefix="/api/history", tags=["history"])


@router.get("/", response_model=List[ScanSummary])
def get_history(db: Session = Depends(get_db), current_user=Depends(get_current_user), skip: int = 0, limit: int = 50):
    scans = db.query(Scan).filter(Scan.user_id == current_user.id).order_by(Scan.created_at.desc()).offset(skip).limit(limit).all()
    return [ScanSummary(id=s.id, filename=s.filename, file_type=s.file_type or "image",
                        exposure_score=s.exposure_score, risk_level=s.risk_level,
                        sensitive_count=s.sensitive_count, total_count=s.total_count,
                        is_starred=s.is_starred, created_at=s.created_at) for s in scans]


@router.get("/stats", response_model=StatsResponse)
def get_stats(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    scans = db.query(Scan).filter(Scan.user_id == current_user.id).all()
    if not scans:
        return StatsResponse(total_scans=0, critical_scans=0, avg_exposure=0.0, most_common_risk="Safe")
    total = len(scans)
    critical = sum(1 for s in scans if s.risk_level in ("Critical", "High"))
    avg_exp = sum(s.exposure_score for s in scans) / total
    most_common = Counter(s.risk_level for s in scans).most_common(1)[0][0]
    return StatsResponse(total_scans=total, critical_scans=critical, avg_exposure=round(avg_exp, 2), most_common_risk=most_common)


@router.get("/{scan_id}", response_model=ScanDetail)
def get_scan(scan_id: str, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    scan = db.query(Scan).filter(Scan.id == scan_id, Scan.user_id == current_user.id).first()
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")
    return ScanDetail(id=scan.id, filename=scan.filename, file_type=scan.file_type or "image",
                      exposure_score=scan.exposure_score, risk_level=scan.risk_level,
                      entities=scan.entities or [], raw_text=scan.raw_text or "",
                      summary=scan.summary or "", warnings=scan.warnings or [],
                      safe_fields=scan.safe_fields or [], sensitive_count=scan.sensitive_count,
                      total_count=scan.total_count, is_starred=scan.is_starred, created_at=scan.created_at)


@router.patch("/{scan_id}/star")
def toggle_star(scan_id: str, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    scan = db.query(Scan).filter(Scan.id == scan_id, Scan.user_id == current_user.id).first()
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")
    scan.is_starred = not scan.is_starred
    db.commit()
    return {"starred": scan.is_starred}


@router.delete("/{scan_id}")
def delete_scan(scan_id: str, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    scan = db.query(Scan).filter(Scan.id == scan_id, Scan.user_id == current_user.id).first()
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")
    db.delete(scan); db.commit()
    return {"deleted": True}