from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from app.config import get_settings
from app.auth.router import router as auth_router
from app.habits.router import router as habits_router

settings = get_settings()

# Rate Limiter
limiter = Limiter(key_func=get_remote_address)

app = FastAPI(
    title="Level Up Peter API",
    description="🎮 API de Gamificação de Hábitos",
    version="1.0.0",
)

# Rate limiting
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS
origins = [o.strip() for o in settings.cors_origins.split(",")]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth_router)
app.include_router(habits_router)


@app.get("/", tags=["Health"])
async def health_check():
    return {
        "status": "🎮 Level Up Peter API is running!",
        "version": "1.0.0",
    }
