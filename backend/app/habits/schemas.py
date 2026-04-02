from pydantic import BaseModel
from datetime import date


class DailyLogCreate(BaseModel):
    bible_read: bool = False
    workout_done: bool = False
    content_posted: bool = False
    family_time: bool = False


class DailyLogResponse(BaseModel):
    id: str
    user_id: str
    date: str
    bible_read: bool
    workout_done: bool
    content_posted: bool
    family_time: bool
    xp_earned: int
    habits_completed: int
    is_perfect_day: bool


class StreakResponse(BaseModel):
    current_days: int
    max_days: int
    is_active: bool
    start_date: str | None = None
    combo_multiplier: float


class StatsResponse(BaseModel):
    total_xp: int
    level: int
    title: str
    level_color: str
    xp_in_level: int
    xp_needed: int
    progress: float
    next_level: int | None
    next_title: str | None
    streak: StreakResponse
    today_log: DailyLogResponse | None = None


class XPGainResponse(BaseModel):
    base_xp: int
    perfect_bonus: int
    multiplier: float
    milestone_bonus: int
    total_xp: int
    new_total_xp: int
    level_up: bool
    new_level: int | None = None
    new_title: str | None = None
