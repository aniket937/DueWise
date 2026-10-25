from fastapi import APIRouter
from app.core.config import settings
from app.schemas.schemas import AIStatusResponse
from app.services.openrouter_service import is_openrouter_configured
from app.services.ocr_service import is_tesseract_installed

router = APIRouter(prefix="/ai", tags=["AI Status"])

@router.get("/status", response_model=AIStatusResponse)
async def get_ai_status():
    configured = is_openrouter_configured()
    tesseract_avail = is_tesseract_installed()

    if configured:
        msg = f"Live AI inference active using OpenRouter model '{settings.OPENROUTER_MODEL}'."
        mode = "live"
    else:
        msg = "Demo Mode active. Real document extraction and deterministic study planning work locally without an API key. To enable live open-weight AI inference, add your OPENROUTER_API_KEY in backend/.env."
        mode = "demo"

    return AIStatusResponse(
        is_configured=configured,
        mode=mode,
        model=settings.OPENROUTER_MODEL,
        base_url=settings.OPENROUTER_BASE_URL,
        message=msg,
        tesseract_available=tesseract_avail
    )
