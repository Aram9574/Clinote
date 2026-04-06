from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi.errors import RateLimitExceeded
from contextlib import asynccontextmanager

from app.config import get_settings
from app.middleware.audit_middleware import AuditMiddleware
from app.middleware.rate_limiter import limiter, rate_limit_exceeded_handler
from app.routers import analyze, cases, auth, health, billing, users


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield


def create_app() -> FastAPI:
    settings = get_settings()

    app = FastAPI(
        title="CLINOTE API",
        version="1.0.0",
        description="Clinical NLP SaaS for Spanish-speaking physicians",
        docs_url="/docs" if settings.environment == "development" else None,
        redoc_url=None,
        lifespan=lifespan
    )

    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, rate_limit_exceeded_handler)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allowed_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=["*"],
    )

    app.add_middleware(AuditMiddleware)

    app.include_router(health.router, tags=["health"])
    app.include_router(auth.router, prefix="/api/v1", tags=["auth"])
    app.include_router(analyze.router, prefix="/api/v1", tags=["analyze"])
    app.include_router(cases.router, prefix="/api/v1", tags=["cases"])
    app.include_router(billing.router, prefix="/api/v1", tags=["billing"])
    app.include_router(users.router, prefix="/api/v1", tags=["users"])

    return app


app = create_app()
