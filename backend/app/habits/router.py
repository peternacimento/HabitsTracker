from fastapi import APIRouter, Depends, HTTPException
from datetime import date, datetime, timedelta
from app.auth.dependencies import get_current_user
from app.habits.schemas import (
    DailyLogCreate,
    DailyLogResponse,
    StatsResponse,
    StreakResponse,
    XPGainResponse,
)
from app.gamification.service import calculate_daily_xp, get_level_info, get_combo_multiplier
from app.gamification.constants import TOTAL_DAILY_HABITS, MAX_STREAK_DAYS
from app.database import get_supabase_admin

router = APIRouter(prefix="/habits", tags=["Habits & Gamification"])


def _count_habits(log: dict) -> int:
    """Conta quantos hábitos foram completados."""
    return sum(
        1
        for key in ["bible_read", "workout_done", "content_posted", "family_time"]
        if log.get(key, False)
    )


@router.post("/checkin", response_model=XPGainResponse)
async def daily_checkin(data: DailyLogCreate, user: dict = Depends(get_current_user)):
    """Registra ou atualiza o check-in diário e calcula XP."""
    db = get_supabase_admin()
    user_id = user["id"]
    today = date.today().isoformat()

    # Verifica se já existe log para hoje
    existing = (
        db.table("daily_logs")
        .select("*")
        .eq("user_id", user_id)
        .eq("date", today)
        .execute()
    )

    habits_data = {
        "user_id": user_id,
        "date": today,
        "bible_read": data.bible_read,
        "workout_done": data.workout_done,
        "content_posted": data.content_posted,
        "family_time": data.family_time,
    }

    habits_completed = _count_habits(habits_data)
    is_perfect_day = habits_completed == TOTAL_DAILY_HABITS

    # Busca streak atual
    streak_data = _get_or_create_streak(db, user_id)
    streak_days = streak_data.get("current_days", 0)

    # Se completou pelo menos 1 hábito e não tinha completado nada antes hoje
    if habits_completed > 0:
        prev_habits = 0
        if existing.data:
            prev_habits = _count_habits(existing.data[0])

        # Atualiza streak se é a primeira completude do dia
        if prev_habits == 0:
            streak_days = _update_streak(db, user_id, streak_data)

    # Calcula XP
    xp_result = calculate_daily_xp(habits_completed, streak_days, is_perfect_day)

    habits_data["xp_earned"] = xp_result["total_xp"]
    habits_data["habits_completed"] = habits_completed
    habits_data["is_perfect_day"] = is_perfect_day

    # Upsert do log diário
    if existing.data:
        db.table("daily_logs").update(habits_data).eq("id", existing.data[0]["id"]).execute()
    else:
        db.table("daily_logs").insert(habits_data).execute()

    # Busca XP anterior e atualiza perfil
    profile = db.table("profiles").select("total_xp, level").eq("id", user_id).single().execute()
    old_total_xp = profile.data.get("total_xp", 0)
    old_level = profile.data.get("level", 1)

    # Calcula XP diferencial (somente o novo)
    prev_xp = existing.data[0].get("xp_earned", 0) if existing.data else 0
    xp_delta = xp_result["total_xp"] - prev_xp
    new_total_xp = old_total_xp + max(xp_delta, 0)

    # Calcula novo nível
    level_info = get_level_info(new_total_xp)
    level_up = level_info["level"] > old_level

    # Atualiza perfil
    db.table("profiles").update(
        {
            "total_xp": new_total_xp,
            "level": level_info["level"],
            "current_title": level_info["title"],
        }
    ).eq("id", user_id).execute()

    return XPGainResponse(
        base_xp=xp_result["base_xp"],
        perfect_bonus=xp_result["perfect_bonus"],
        multiplier=xp_result["multiplier"],
        milestone_bonus=xp_result["milestone_bonus"],
        total_xp=xp_result["total_xp"],
        new_total_xp=new_total_xp,
        level_up=level_up,
        new_level=level_info["level"] if level_up else None,
        new_title=level_info["title"] if level_up else None,
    )


@router.get("/today", response_model=DailyLogResponse | None)
async def get_today_log(user: dict = Depends(get_current_user)):
    """Retorna o log de hoje."""
    db = get_supabase_admin()
    today = date.today().isoformat()

    result = (
        db.table("daily_logs")
        .select("*")
        .eq("user_id", user["id"])
        .eq("date", today)
        .execute()
    )

    if not result.data:
        return None

    log = result.data[0]
    return DailyLogResponse(
        id=log["id"],
        user_id=log["user_id"],
        date=log["date"],
        bible_read=log.get("bible_read", False),
        workout_done=log.get("workout_done", False),
        content_posted=log.get("content_posted", False),
        family_time=log.get("family_time", False),
        xp_earned=log.get("xp_earned", 0),
        habits_completed=log.get("habits_completed", 0),
        is_perfect_day=log.get("is_perfect_day", False),
    )


@router.get("/stats", response_model=StatsResponse)
async def get_stats(user: dict = Depends(get_current_user)):
    """Retorna todas as stats gamificadas do usuário."""
    db = get_supabase_admin()
    user_id = user["id"]

    # Perfil
    profile = db.table("profiles").select("*").eq("id", user_id).single().execute()
    p = profile.data

    # Level info
    level_info = get_level_info(p.get("total_xp", 0))

    # Streak
    streak_data = _get_or_create_streak(db, user_id)
    streak_days = streak_data.get("current_days", 0)

    # Log de hoje
    today = date.today().isoformat()
    today_result = (
        db.table("daily_logs")
        .select("*")
        .eq("user_id", user_id)
        .eq("date", today)
        .execute()
    )

    today_log = None
    if today_result.data:
        log = today_result.data[0]
        today_log = DailyLogResponse(
            id=log["id"],
            user_id=log["user_id"],
            date=log["date"],
            bible_read=log.get("bible_read", False),
            workout_done=log.get("workout_done", False),
            content_posted=log.get("content_posted", False),
            family_time=log.get("family_time", False),
            xp_earned=log.get("xp_earned", 0),
            habits_completed=log.get("habits_completed", 0),
            is_perfect_day=log.get("is_perfect_day", False),
        )

    return StatsResponse(
        total_xp=level_info["total_xp"],
        level=level_info["level"],
        title=level_info["title"],
        level_color=level_info["color"],
        xp_in_level=level_info["xp_in_level"],
        xp_needed=level_info["xp_needed"],
        progress=level_info["progress"],
        next_level=level_info["next_level"],
        next_title=level_info["next_title"],
        streak=StreakResponse(
            current_days=streak_days,
            max_days=MAX_STREAK_DAYS,
            is_active=streak_data.get("is_active", False),
            start_date=streak_data.get("start_date"),
            combo_multiplier=get_combo_multiplier(streak_days),
        ),
        today_log=today_log,
    )


@router.get("/history")
async def get_history(days: int = 30, user: dict = Depends(get_current_user)):
    """Retorna histórico de logs dos últimos N dias."""
    db = get_supabase_admin()
    since = (date.today() - timedelta(days=days)).isoformat()

    result = (
        db.table("daily_logs")
        .select("*")
        .eq("user_id", user["id"])
        .gte("date", since)
        .order("date", desc=True)
        .execute()
    )

    return {"logs": result.data, "period_days": days}


def _get_or_create_streak(db, user_id: str) -> dict:
    """Busca o streak ativo ou cria um novo."""
    result = (
        db.table("streaks")
        .select("*")
        .eq("user_id", user_id)
        .eq("is_active", True)
        .execute()
    )

    if result.data:
        streak = result.data[0]
        # Verifica se o streak ainda é válido (não pulou um dia)
        last_log = (
            db.table("daily_logs")
            .select("date")
            .eq("user_id", user_id)
            .order("date", desc=True)
            .limit(1)
            .execute()
        )

        if last_log.data:
            last_date = date.fromisoformat(last_log.data[0]["date"])
            today = date.today()
            diff = (today - last_date).days

            if diff > 1:
                # Streak quebrou — reset
                db.table("streaks").update(
                    {"is_active": False, "broken_at": today.isoformat()}
                ).eq("id", streak["id"]).execute()

                # Cria novo streak
                new_streak = (
                    db.table("streaks")
                    .insert(
                        {
                            "user_id": user_id,
                            "start_date": today.isoformat(),
                            "current_days": 0,
                            "is_active": True,
                        }
                    )
                    .execute()
                )
                return new_streak.data[0]

        return streak

    # Nenhum streak ativo — cria
    new_streak = (
        db.table("streaks")
        .insert(
            {
                "user_id": user_id,
                "start_date": date.today().isoformat(),
                "current_days": 0,
                "is_active": True,
            }
        )
        .execute()
    )
    return new_streak.data[0]


def _update_streak(db, user_id: str, streak_data: dict) -> int:
    """Incrementa o streak e retorna o novo valor."""
    current = streak_data.get("current_days", 0)
    new_days = min(current + 1, MAX_STREAK_DAYS)

    db.table("streaks").update({"current_days": new_days}).eq(
        "id", streak_data["id"]
    ).execute()

    return new_days
