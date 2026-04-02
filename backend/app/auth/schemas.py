from pydantic import BaseModel, EmailStr


class UserRegister(BaseModel):
    email: EmailStr
    password: str
    username: str


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: str
    email: str
    username: str | None = None
    total_xp: int = 0
    level: int = 1
    current_title: str = "Novato"
    streak_days: int = 0


class AuthResponse(BaseModel):
    user: UserResponse
    message: str
