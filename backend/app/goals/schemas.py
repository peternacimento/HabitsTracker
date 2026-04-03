from pydantic import BaseModel, Field
from typing import Optional


class HabitCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=60)
    emoji: str = Field(default="⭐", max_length=8)
    target_days_per_week: int = Field(default=7, ge=1, le=7)


class HabitUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=60)
    emoji: Optional[str] = Field(None, max_length=8)
    target_days_per_week: Optional[int] = Field(None, ge=1, le=7)
    order_index: Optional[int] = None


class HabitResponse(BaseModel):
    id: str
    name: str
    emoji: str
    target_days_per_week: int
    order_index: int
    completed_today: bool = False
    completions_this_week: int = 0


class ToggleHabitRequest(BaseModel):
    habit_id: str


class ToggleHabitResponse(BaseModel):
    habit_id: str
    completed: bool
    xp_gained: int
    total_xp: int
    level_up: bool
    new_level: Optional[int] = None
    new_title: Optional[str] = None
