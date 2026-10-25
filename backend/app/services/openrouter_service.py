import logging
from typing import Optional, Dict, Any, List
import httpx
from app.core.config import settings

logger = logging.getLogger(__name__)

class OpenRouterError(Exception):
    def __init__(self, message: str, status_code: int = 500, error_type: str = "openrouter_error"):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.error_type = error_type

def is_openrouter_configured() -> bool:
    """Return True if OPENROUTER_API_KEY is present and not empty."""
    return bool(settings.OPENROUTER_API_KEY and settings.OPENROUTER_API_KEY.strip())

async def call_openrouter(
    messages: List[Dict[str, str]],
    model: Optional[str] = None,
    temperature: float = 0.2,
    response_format: Optional[Dict[str, Any]] = None,
    max_tokens: int = 2500,
    timeout: float = 45.0
) -> str:
    """
    Call OpenRouter's /chat/completions endpoint using httpx.
    """
    if not is_openrouter_configured():
        raise OpenRouterError(
            "OpenRouter API key is not configured. Please set OPENROUTER_API_KEY in backend/.env.",
            status_code=400,
            error_type="missing_api_key"
        )

    selected_model = model or settings.OPENROUTER_MODEL
    url = f"{settings.OPENROUTER_BASE_URL}/chat/completions"

    headers = {
        "Authorization": f"Bearer {settings.OPENROUTER_API_KEY}",
        "HTTP-Referer": settings.OPENROUTER_HTTP_REFERER,
        "X-Title": settings.OPENROUTER_APP_NAME,
        "Content-Type": "application/json"
    }

    payload: Dict[str, Any] = {
        "model": selected_model,
        "messages": messages,
        "temperature": temperature,
        "max_tokens": max_tokens
    }

    if response_format:
        payload["response_format"] = response_format

    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            response = await client.post(url, json=payload, headers=headers)

            if response.status_code == 401:
                raise OpenRouterError(
                    "Invalid OpenRouter API Key. Please verify your key.",
                    status_code=401,
                    error_type="invalid_api_key"
                )
            elif response.status_code == 402:
                raise OpenRouterError(
                    "Insufficient OpenRouter credits or quota exceeded.",
                    status_code=402,
                    error_type="insufficient_credits"
                )
            elif response.status_code == 429:
                raise OpenRouterError(
                    "OpenRouter rate limit reached. Please wait a moment before retrying.",
                    status_code=429,
                    error_type="rate_limited"
                )
            elif response.status_code >= 500:
                raise OpenRouterError(
                    f"OpenRouter service error (status {response.status_code}): {response.text[:200]}",
                    status_code=502,
                    error_type="provider_error"
                )
            elif response.status_code != 200:
                raise OpenRouterError(
                    f"OpenRouter request failed with status {response.status_code}: {response.text[:200]}",
                    status_code=response.status_code,
                    error_type="request_failed"
                )

            data = response.json()
            choices = data.get("choices", [])
            if not choices:
                raise OpenRouterError("No completion choices returned by model.", status_code=500)

            content = choices[0].get("message", {}).get("content", "")
            return content.strip()

    except httpx.TimeoutException:
        raise OpenRouterError("OpenRouter request timed out after 45 seconds.", status_code=504, error_type="timeout")
    except httpx.RequestError as e:
        raise OpenRouterError(f"Network error connecting to OpenRouter: {str(e)}", status_code=502, error_type="network_error")
    except OpenRouterError:
        raise
    except Exception as e:
        logger.exception("Unexpected error in call_openrouter")
        raise OpenRouterError(f"Unexpected error calling OpenRouter: {str(e)}", status_code=500)
