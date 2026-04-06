import asyncio
import logging
from typing import Optional
from datetime import datetime, timezone

logger = logging.getLogger(__name__)


async def log_action(
    supabase_client,
    user_id: Optional[str],
    action: str,
    resource_type: Optional[str] = None,
    resource_id: Optional[str] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None,
    metadata: Optional[dict] = None,
    request_id: Optional[str] = None
) -> None:
    """
    Fire-and-forget audit log. Never throws exceptions.
    """
    try:
        log_entry = {
            "user_id": user_id,
            "action": action,
            "resource_type": resource_type,
            "resource_id": resource_id,
            "ip_address": ip_address,
            "user_agent": user_agent,
            "metadata": {
                **(metadata or {}),
                "request_id": request_id
            },
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        # Remove None values for cleaner logs
        log_entry = {k: v for k, v in log_entry.items() if v is not None}

        supabase_client.table("audit_log").insert(log_entry).execute()
    except Exception as e:
        logger.warning(f"Failed to write audit log: {e}")
