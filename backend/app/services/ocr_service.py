import shutil
import logging
from typing import Optional
from PIL import Image

logger = logging.getLogger(__name__)

def is_tesseract_installed() -> bool:
    """Check if tesseract executable is in PATH."""
    return shutil.which("tesseract") is not None

def extract_text_from_image(image: Image.Image) -> Optional[str]:
    """Perform OCR on an image if Tesseract is available."""
    if not is_tesseract_installed():
        logger.info("Tesseract executable not found in PATH; skipping OCR.")
        return None
    try:
        import pytesseract
        return pytesseract.image_to_string(image)
    except Exception as e:
        logger.warning(f"Tesseract OCR failed: {e}")
        return None
