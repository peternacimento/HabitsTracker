from fastapi import APIRouter, Response, Request, HTTPException, Depends
from app.auth.schemas import UserRegister, UserLogin, AuthResponse, UserResponse
from app.database import get_supabase_client, get_supabase_admin
from app.auth.dependencies import get_current_user
from app.config import get_settings

router = APIRouter(prefix="/auth", tags=["Authentication"])


def _is_secure() -> bool:
    return get_settings().environment != "development"


def _set_auth_cookies(response: Response, access_token: str, refresh_token: str):
    secure = _is_secure()
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=secure,
        samesite="lax",
        max_age=60 * 60 * 24 * 7,
    )
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=secure,
        samesite="lax",
        max_age=60 * 60 * 24 * 30,
    )


@router.post("/register", response_model=AuthResponse)
async def register(data: UserRegister, response: Response):
    """Registra um novo usuário via Supabase Auth e cria o perfil."""
    supabase = get_supabase_client()

    try:
        # Pass the username in the metadata so the database trigger can catch it
        auth_response = supabase.auth.sign_up(
            {
                "email": data.email, 
                "password": data.password,
                "options": {
                    "data": {
                        "username": data.username
                    }
                }
            }
        )

        if not auth_response.user:
            raise HTTPException(status_code=400, detail="Erro ao criar conta")

        user_id = auth_response.user.id

        # Set HttpOnly cookie
        if auth_response.session:
            _set_auth_cookies(
                response,
                auth_response.session.access_token,
                auth_response.session.refresh_token,
            )

        return AuthResponse(
            user=UserResponse(
                id=user_id,
                email=data.email,
                username=data.username,
            ),
            message="Conta criada com sucesso!",
        )

    except Exception as e:
        if "already registered" in str(e).lower():
            raise HTTPException(status_code=409, detail="Email já cadastrado")
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/login", response_model=AuthResponse)
async def login(data: UserLogin, response: Response):
    """Autentica via Supabase Auth e seta cookies HttpOnly."""
    supabase = get_supabase_client()

    try:
        auth_response = supabase.auth.sign_in_with_password(
            {"email": data.email, "password": data.password}
        )

        if not auth_response.user:
            raise HTTPException(status_code=401, detail="Credenciais inválidas")

        user_id = auth_response.user.id

        # Busca perfil
        admin = get_supabase_admin()
        profile = (
            admin.table("profiles").select("*").eq("id", user_id).single().execute()
        )
        profile_data = profile.data

        # Set HttpOnly cookies
        if auth_response.session:
            _set_auth_cookies(
                response,
                auth_response.session.access_token,
                auth_response.session.refresh_token,
            )

        return AuthResponse(
            user=UserResponse(
                id=user_id,
                email=data.email,
                username=profile_data.get("username"),
                total_xp=profile_data.get("total_xp", 0),
                level=profile_data.get("level", 1),
                current_title=profile_data.get("current_title", "Novato"),
            ),
            message="Login bem-sucedido!",
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=401, detail="Credenciais inválidas")


@router.post("/logout")
async def logout(response: Response):
    """Limpa os cookies de autenticação."""
    response.delete_cookie("access_token")
    response.delete_cookie("refresh_token")
    return {"message": "Logout realizado"}


@router.post("/refresh")
async def refresh_token(request: Request, response: Response):
    """Renova o access_token usando o refresh_token do cookie."""
    refresh_tok = request.cookies.get("refresh_token")
    if not refresh_tok:
        raise HTTPException(status_code=401, detail="Refresh token não encontrado")

    supabase = get_supabase_client()
    try:
        result = supabase.auth.refresh_session(refresh_tok)
        if not result.session:
            raise HTTPException(status_code=401, detail="Refresh token inválido")

        _set_auth_cookies(
            response,
            result.session.access_token,
            result.session.refresh_token,
        )
        return {"message": "Token renovado com sucesso"}
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(status_code=401, detail="Sessão expirada, faça login novamente")


@router.get("/me", response_model=AuthResponse)
async def get_me(user: dict = Depends(get_current_user)):
    """Retorna o perfil do usuário autenticado."""
    admin = get_supabase_admin()
    profile = (
        admin.table("profiles")
        .select("*")
        .eq("id", user["id"])
        .single()
        .execute()
    )
    if not profile.data:
        raise HTTPException(status_code=404, detail="Perfil não encontrado")

    p = profile.data

    streak_result = (
        admin.table("streaks")
        .select("current_days")
        .eq("user_id", user["id"])
        .eq("is_active", True)
        .execute()
    )
    streak_days = streak_result.data[0]["current_days"] if streak_result.data else 0

    return AuthResponse(
        user=UserResponse(
            id=user["id"],
            email=user["email"],
            username=p.get("username"),
            total_xp=p.get("total_xp", 0),
            level=p.get("level", 1),
            current_title=p.get("current_title", "Novato"),
            streak_days=streak_days,
        ),
        message="ok",
    )
