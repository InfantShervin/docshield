import random
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..core.database import get_db, User
from ..core.security import hash_password, verify_password, create_access_token, get_current_user
from ..models.schemas import UserCreate, UserLogin, Token

router = APIRouter(prefix="/api/auth", tags=["auth"])
AVATAR_COLORS = ["#6366f1","#ec4899","#14b8a6","#f59e0b","#ef4444","#8b5cf6","#06b6d4","#10b981"]


@router.post("/register", response_model=Token)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == user_data.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(
        email=user_data.email, name=user_data.name,
        hashed_password=hash_password(user_data.password),
        avatar_color=random.choice(AVATAR_COLORS),
    )
    db.add(user); db.commit(); db.refresh(user)
    token = create_access_token({"sub": user.email})
    return Token(access_token=token, token_type="bearer",
                 user_id=user.id, user_name=user.name, user_email=user.email)


@router.post("/login", response_model=Token)
def login(user_data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == user_data.email).first()
    if not user or not verify_password(user_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_access_token({"sub": user.email})
    return Token(access_token=token, token_type="bearer",
                 user_id=user.id, user_name=user.name, user_email=user.email)


@router.get("/me")
def get_me(current_user: User = Depends(get_current_user)):
    return {"id": current_user.id, "name": current_user.name,
            "email": current_user.email, "avatar_color": current_user.avatar_color}