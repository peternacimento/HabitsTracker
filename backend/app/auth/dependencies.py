from fastapi import HTTPException, Request
from jose import jwt, JWTError, jwk
from functools import lru_cache
import httpx
from app.config import get_settings


@lru_cache(maxsize=1)
def _get_jwks() -> list:
    """Busca e faz cache das chaves públicas JWKS do Supabase."""
    settings = get_settings()
    resp = httpx.get(f"{settings.supabase_url}/auth/v1/.well-known/jwks.json", timeout=10)
    resp.raise_for_status()
    return resp.json().get("keys", [])


def _get_public_key(kid: str):
    for key_data in _get_jwks():
        if key_data.get("kid") == kid:
            return jwk.construct(key_data)
    return None


async def get_current_user(request: Request) -> dict:
    """Extrai e valida o JWT (ES256 ou HS256) do cookie ou header Authorization."""
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]

    if not token:
        raise HTTPException(status_code=401, detail="Não autenticado")

    try:
        header = jwt.get_unverified_header(token)
        alg = header.get("alg", "HS256")
        kid = header.get("kid")

        if alg == "ES256" and kid:
            public_key = _get_public_key(kid)
            if not public_key:
                raise HTTPException(status_code=401, detail="Chave pública não encontrada")
            payload = jwt.decode(
                token,
                public_key,
                algorithms=["ES256"],
                audience="authenticated",
            )
        else:
            settings = get_settings()
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
