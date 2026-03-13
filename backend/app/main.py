from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from contextlib import asynccontextmanager
from .core.database import create_tables
from .core.config import settings
from .api import auth, analyze, chat, history


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("[STARTUP] Creating database tables…")
    create_tables()
    print("[STARTUP] DocShield API ready.")
    yield
    print("[SHUTDOWN] Server stopped.")


app = FastAPI(title="DocShield API", version="1.0.0", lifespan=lifespan)

app.add_middleware(GZipMiddleware, minimum_size=1000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:5173", "http://localhost:3000", "https://*.vercel.app"],
    allow_credentials=True, allow_methods=["*"], allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(analyze.router)
app.include_router(chat.router)
app.include_router(history.router)


@app.get("/")
def root():
    return {"message": "DocShield API v1.0", "status": "running"}

@app.get("/health")
def health():
    return {"status": "healthy"}