import io
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from PIL import Image
from ..core.database import get_db, Scan
from ..core.security import get_current_user
from ..models.schemas import AnalysisResult
from ..services.analysis_service import analyze_document

router = APIRouter(prefix="/api/analyze", tags=["analyze"])
ALLOWED_IMAGE = {"image/jpeg","image/jpg","image/png","image/tiff","image/bmp","image/webp"}
MAX_SIZE = 20 * 1024 * 1024


@router.post("/", response_model=AnalysisResult)
async def analyze(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):
    file_bytes = await file.read()
    if len(file_bytes) > MAX_SIZE:
        raise HTTPException(status_code=413, detail="File too large. Max 20 MB.")

    ct = file.content_type or ""
    fname = file.filename or "document"
    ext = fname.lower().rsplit(".", 1)[-1] if "." in fname else ""

    if ct in ALLOWED_IMAGE or ext in ("jpg","jpeg","png","tiff","tif","bmp","webp"):
        file_type = "image"
        try:
            representative_image = Image.open(io.BytesIO(file_bytes)).convert("RGB")
        except Exception:
            raise HTTPException(status_code=400, detail="Cannot open image file.")
    elif ct == "application/pdf" or ext == "pdf":
        file_type = "pdf"
        try:
            from pdf2image import convert_from_bytes
            pages = convert_from_bytes(file_bytes, dpi=150, first_page=1, last_page=1)
            representative_image = pages[0].convert("RGB") if pages else Image.new("RGB",(800,1100),"white")
        except Exception:
            representative_image = Image.new("RGB", (800, 1100), "white")
    else:
        raise HTTPException(status_code=415, detail=f"Unsupported file type: {ct}")

    result = await analyze_document(file_bytes, fname, file_type, representative_image)

    scan = Scan(
        user_id=current_user.id, filename=fname, file_type=file_type,
        exposure_score=result["exposure_score"], risk_level=result["risk_level"],
        entities=result["entities"], raw_text=result["raw_text"][:10000],
        summary=result["summary"], warnings=result["warnings"],
        safe_fields=result["safe_fields"], sensitive_count=result["sensitive_count"],
        total_count=result["total_count"],
    )
    db.add(scan); db.commit(); db.refresh(scan)

    return AnalysisResult(
        scan_id=scan.id, filename=scan.filename, file_type=scan.file_type,
        exposure_score=scan.exposure_score, risk_level=scan.risk_level,
        entities=result["entities"], raw_text=scan.raw_text, summary=scan.summary,
        warnings=scan.warnings, safe_fields=scan.safe_fields,
        sensitive_count=scan.sensitive_count, total_count=scan.total_count,
    )