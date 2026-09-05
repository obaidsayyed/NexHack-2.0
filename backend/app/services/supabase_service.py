from functools import lru_cache
from supabase import Client, create_client

from app.core.config import settings

def _require_config():
    missing = []
    if not settings.supabase_url:
        missing.append("SUPABASE_URL")
    if not settings.supabase_publishable_key:
        missing.append("SUPABASE_PUBLISHABLE_KEY")
    if not settings.supabase_secret_key:
        missing.append("SUPABASE_SECRET_KEY")
    if missing:
        raise RuntimeError(
            "Supabase is not configured. Missing: " + ", ".join(missing)
        )

@lru_cache
def get_auth_client() -> Client:
    _require_config()
    return create_client(
        settings.supabase_url,
        settings.supabase_publishable_key,
    )

@lru_cache
def get_db_client() -> Client:
    _require_config()
    return create_client(
        settings.supabase_url,
        settings.supabase_secret_key,
    )
