from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import init_db

from app.routers import health, ai_status, dashboard, documents, tasks, plans, revision, demo

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize SQLite database schema
    await init_db()
    yield

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="DueWise: Autonomous Academic Planning and Study Optimization",
    lifespan=lifespan
)

# Configure CORS
origins = [
    settings.FRONTEND_URL,
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers under /api
app.include_router(health.router, prefix=settings.API_PREFIX)
app.include_router(ai_status.router, prefix=settings.API_PREFIX)
app.include_router(dashboard.router, prefix=settings.API_PREFIX)
app.include_router(documents.router, prefix=settings.API_PREFIX)
app.include_router(tasks.router, prefix=settings.API_PREFIX)
app.include_router(plans.router, prefix=settings.API_PREFIX)
app.include_router(revision.router, prefix=settings.API_PREFIX)
app.include_router(demo.router, prefix=settings.API_PREFIX)

@app.get("/")
async def root():
    return {
        "project": settings.PROJECT_NAME,
        "tagline": "Upload once. Know what to do next.",
        "status": "online",
        "docs_url": "/docs"
    }
