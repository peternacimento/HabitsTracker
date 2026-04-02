from supabase import create_client, Client
from app.config import get_settings


def get_supabase_client() -> Client:
    """Client com anon key — para operações autenticadas via JWT do usuário."""
    settings = get_settings()
    return create_client(settings.supabase_url, settings.supabase_anon_key)


def get_supabase_admin() -> Client:
    """Client com service role key — para operações administrativas."""
    settings = get_settings()
    return create_client(settings.supabase_url, settings.supabase_service_role_key)
