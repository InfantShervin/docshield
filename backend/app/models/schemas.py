from pydantic import BaseModel, EmailStr
from typing import List, Optional, Dict
from datetime import datetime


class UserCreate(BaseModel):
    email: EmailStr
    name: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str
    user_id: str
    user_name: str
    user_email: str


class Entity(BaseModel):
    text: str
    label: str
    bbox: List[int]
    sensitivity: str
    risk_score: float
    matched_types: List[str] = []


class AnalysisResult(BaseModel):
    scan_id: str
    filename: str
    file_type: str
    exposure_score: float
    risk_level: str
    entities: List[Entity]
    raw_text: str
    summary: str
    warnings: List[str]
    safe_fields: List[str]
    sensitive_count: int
    total_count: int


class ChatMessage(BaseModel):
    scan_id: str
    message: str
    history: Optional[List[Dict[str, str]]] = []


class ChatResponse(BaseModel):
    reply: str
    scan_id: str


class ScanSummary(BaseModel):
    id: str
    filename: str
    file_type: str
    exposure_score: float
    risk_level: str
    sensitive_count: int
    total_count: int
    is_starred: bool
    created_at: datetime

    class Config:
        from_attributes = True


class ScanDetail(ScanSummary):
    entities: List[Entity]
    raw_text: str
    summary: str
    warnings: List[str]
    safe_fields: List[str]

    class Config:
        from_attributes = True


class StatsResponse(BaseModel):
    total_scans: int
    critical_scans: int
    avg_exposure: float
    most_common_risk: str