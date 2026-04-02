from fastapi import Depends, HTTPException, Request
from jose import jwt, JWTError
from app.config import get_settings


async def get_current_user(request: Request) -> dict:
    """Extrai e valida o JWT do cookie HttpOnly ou do header Authorization."""
    settings = get_settings()

    # Tenta cookie primeiro, depois header
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]

    if not token:
        raise HTTPException(status_code=401, detail="Não autenticado")

    try:
        payload = jwt.decode(
            token,
            settings.supabase_jwt_secret,
            algorithms=["HS256"],
            audience="authenticated",
        )
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Token inválido")

        return {
            "id": user_id,
            "email": payload.get("email"),
            "role": payload.get("role"),
        }
    except JWTError:
        raise HTTPException(status_code=401, detail="Token expirado ou inválido")
