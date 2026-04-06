from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import Optional


class Settings(BaseSettings):
    # Anthropic
    anthropic_api_key: str
    claude_model: str = "claude-sonnet-4-20250514"

    # Supabase
    supabase_url: str
    supabase_anon_key: str
    supabase_service_role_key: str

    # Redis
    redis_url: str = "redis://localhost:6379"

    # Stripe
    stripe_secret_key: str = ""
    stripe_webhook_secret: str = ""
    stripe_pro_price_id: str = ""
    stripe_clinic_price_id: str = ""

    # External APIs
    rxnorm_base_url: str = "https://rxnav.nlm.nih.gov/REST"
    pubmed_api_key: Optional[str] = None
    pubmed_base_url: str = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils"
    cochrane_base_url: str = "https://www.cochranelibrary.com/api"

    # App
    environment: str = "development"
    allowed_origins: list[str] = ["http://localhost:3000"]
    jwt_secret: str = ""

    class Config:
        env_file = ".env"
        case_sensitive = False


@lru_cache()
def get_settings() -> Settings:
    return Settings()
