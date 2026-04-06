from fastapi import HTTPException, Security, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from supabase import create_client, Client
from app.config import get_settings

security = HTTPBearer()


def get_supabase_client() -> Client:
    settings = get_settings()
    return create_client(settings.supabase_url, settings.supabase_service_role_key)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Security(security),
    settings=Depends(get_settings)
):
    """Validate JWT token via Supabase and return user data."""
    token = credentials.credentials
    supabase = create_client(settings.supabase_url, settings.supabase_anon_key)

    try:
        user_response = supabase.auth.get_user(token)
        if not user_response or not user_response.user:
            raise HTTPException(status_code=401, detail="Invalid or expired token")
        return user_response.user
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid or expired token")


async def get_current_user_with_profile(
    credentials: HTTPAuthorizationCredentials = Security(security),
    settings=Depends(get_settings)
):
    """Validate JWT and fetch full user profile from users table."""
    token = credentials.credentials
    supabase = create_client(settings.supabase_url, settings.supabase_service_role_key)

    try:
        auth_client = create_client(settings.supabase_url, settings.supabase_anon_key)
        user_response = auth_client.auth.get_user(token)
        if not user_response or not user_response.user:
            raise HTTPException(status_code=401, detail="Invalid or expired token")

        user_id = user_response.user.id

        profile_resp = supabase.table("users").select("*").eq("id", user_id).single().execute()
        if not profile_resp.data:
            raise HTTPException(status_code=401, detail="User profile not found")

        return {
            "auth_user": user_response.user,
            "profile": profile_resp.data,
            "token": token
        }
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=401, detail="Authentication failed")
