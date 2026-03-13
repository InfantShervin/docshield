from sqlalchemy import (
    create_engine, Column, String, Float,
    DateTime, Text, Integer, ForeignKey, JSON, Boolean
)
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime
import uuid
from .config import settings

engine = create_engine(settings.DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class User(Base):
    __tablename__ = "users"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    hashed_password = Column(String, nullable=False)
    avatar_color = Column(String, default="#6366f1")
    created_at = Column(DateTime, default=datetime.utcnow)
    scans = relationship("Scan", back_populates="user", cascade="all, delete-orphan")


class Scan(Base):
    __tablename__ = "scans"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    filename = Column(String, nullable=False)
    file_type = Column(String, default="image")
    exposure_score = Column(Float, default=0.0)
    risk_level = Column(String, default="Safe")
    entities = Column(JSON, default=list)
    raw_text = Column(Text, default="")
    summary = Column(Text, default="")
    warnings = Column(JSON, default=list)
    safe_fields = Column(JSON, default=list)
    sensitive_count = Column(Integer, default=0)
    total_count = Column(Integer, default=0)
    is_starred = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    user = relationship("User", back_populates="scans")
    chats = relationship("Chat", back_populates="scan", cascade="all, delete-orphan")


class Chat(Base):
    __tablename__ = "chats"
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    scan_id = Column(String, ForeignKey("scans.id"), nullable=False)
    role = Column(String, nullable=False)
    content = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    scan = relationship("Scan", back_populates="chats")


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_tables():
    Base.metadata.create_all(bind=engine)