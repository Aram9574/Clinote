from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi import Request, Response
from fastapi.responses import JSONResponse
from app.config import get_settings

settings = get_settings()

limiter = Limiter(
    key_func=get_remote_address,
    storage_uri=settings.redis_url,
    default_limits=[]
)


def get_rate_limit_for_plan(plan: str) -> str:
    limits = {
        "free": "2/minute",
        "pro": "10/minute",
        "clinic": "30/minute"
    }
    return limits.get(plan, "2/minute")


async def rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded) -> Response:
    plan = getattr(request.state, "user_plan", "free")
    upgrade_msg = ""
    if plan == "free":
        upgrade_msg = " Actualiza a Pro para 10 solicitudes/minuto."
    elif plan == "pro":
        upgrade_msg = " Actualiza a Clínica para 30 solicitudes/minuto."

    return JSONResponse(
        status_code=429,
        content={
            "error": "rate_limit_exceeded",
            "message": f"Demasiadas solicitudes.{upgrade_msg}",
            "retry_after": 60
        },
        headers={"Retry-After": "60"}
    )
