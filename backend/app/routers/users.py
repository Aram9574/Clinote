from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import JSONResponse
from app.middleware.auth import get_current_user_with_profile, get_supabase_client
from app.services.audit_service import log_action
import json

router = APIRouter()


@router.get("/users/export")
async def export_user_data(
    request: Request,
    user_data=Depends(get_current_user_with_profile),
    supabase_client=Depends(get_supabase_client)
):
    """
    RGPD Art. 20: Right to data portability.
    Exports all user data in JSON format.
    """
    user_id = user_data["profile"]["id"]
    
    # Get profile
    profile = user_data["profile"]
    
    # Get cases
    cases_resp = supabase_client.table("cases").select("*").eq("user_id", user_id).execute()
    cases = cases_resp.data if cases_resp.data else []
    
    # Get audit logs for the user
    logs_resp = supabase_client.table("audit_log").select("*").eq("user_id", user_id).execute()
    logs = logs_resp.data if logs_resp.data else []

    export_data = {
        "profile": profile,
        "cases": cases,
        "audit_logs": logs
    }

    await log_action(
        supabase_client, user_id, "export_data", "users", user_id,
        request.client.host if request.client else None,
        request.headers.get("user-agent"),
        request_id=getattr(request.state, "request_id", None)
    )

    return JSONResponse(
        content=export_data,
        headers={"Content-Disposition": f"attachment; filename=clinote_data_export_{user_id}.json"}
    )


@router.delete("/users/me")
async def delete_user_account(
    request: Request,
    user_data=Depends(get_current_user_with_profile),
    supabase_client=Depends(get_supabase_client)
):
    """
    RGPD Art. 17: Right to erasure.
    Deletes the user's account from Supabase Auth, which triggers cascade deletions 
    in the public schema due to foreign key constraints (if configured), or at least 
    removes the user access permanently.
    """
    user_id = user_data["profile"]["id"]

    await log_action(
        supabase_client, user_id, "delete_account", "users", user_id,
        request.client.host if request.client else None,
        request.headers.get("user-agent"),
        request_id=getattr(request.state, "request_id", None)
    )

    try:
        # Service role client can delete auth users
        supabase_client.auth.admin.delete_user(user_id)
        # Note: public.users record will be cascade-deleted by Supabase if setup appropriately,
        # otherwise we manually delete here:
        supabase_client.table("users").delete().eq("id", user_id).execute()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    return {"success": True, "message": "Account successfully deleted"}
