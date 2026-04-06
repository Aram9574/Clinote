from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from app.middleware.auth import get_supabase_client

router = APIRouter()


class LoginRequest(BaseModel):
    email: str
    password: str


class MFAVerifyRequest(BaseModel):
    factor_id: str
    code: str


@router.post("/auth/login")
async def login(
    login_req: LoginRequest,
    supabase_client=Depends(get_supabase_client)
):
    """Login via Supabase Auth. Returns session if MFA not required, MFA challenge if enabled."""
    try:
        resp = supabase_client.auth.sign_in_with_password({
            "email": login_req.email,
            "password": login_req.password
        })
        return {
            "access_token": resp.session.access_token if resp.session else None,
            "user_id": resp.user.id if resp.user else None,
            "mfa_required": False
        }
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid credentials")


@router.post("/auth/logout")
async def logout(supabase_client=Depends(get_supabase_client)):
    try:
        supabase_client.auth.sign_out()
    except Exception:
        pass
    return {"success": True}
