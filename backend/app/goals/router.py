from fastapi import APIRouter, Depends, HTTPException
from datetime import date, timedelta
from app.auth.dependencies import get_current_user
from app.goals.schemas import (
    HabitCreate, HabitUpdate, HabitResponse,
    ToggleHabitRequest, ToggleHabitResponse,
)
from app.gamification.service import calculate_daily_xp, get_level_info, get_combo_multiplier
from app.database import get_supabase_admin

router = APIRouter(prefix="/goals", tags=["Goals & Habits"])

DEFAULT_HABITS = [
    {"name": "Leitura Bíblica", "emoji": "📖", "target_days_per_week": 7},
    {"name": "Treino", "emoji": "⚔️", "target_days_per_week": 5},
    {"name": "Conteúdo Criado", "emoji": "🎬", "target_days_per_week": 5},
    {"name": "Tempo em Família", "emoji": "👨‍👩‍👧", "target_days_per_week": 7},
]


def _ensure_habits(db, user_id: str) -> list:
    """Retorna hábitos ativos ou cria os padrões se não houver nenhum."""
    try:
        result = (
            db.table("user_habits")
            .select("*")
            .eq("user_id", user_id)
            .eq("is_active", True)
            .order("order_index")
            .execute()
        )
    except Exception as e:
        if "PGRST205" in str(e) or "user_habits" in str(e):
            raise HTTPException(
                status_code=503,
                detail="Migration pendente: execute supabase/migrations/001_add_goals.sql no Supabase SQL Editor."
            )
        raise

    if result.data:
        return result.data

    # Cria hábitos padrão
    rows = [
        {"user_id": user_id, "order_index": i, **h}
        for i, h in enumerate(DEFAULT_HABITS)
    ]
    created = db.table("user_habits").insert(rows).execute()
    return created.data


def _get_completions_today(db, user_id: str, today: str) -> set:
    result = (
        db.table("habit_completions")
        .select("habit_id")
        .eq("user_id", user_id)
        .eq("completed_date", today)
        .execute()
    )
    return {r["habit_id"] for r in result.data}


def _get_completions_week(db, user_id: str) -> dict:
    since = (date.today() - timedelta(days=6)).isoformat()
    result = (
        db.table("habit_completions")
        .select("habit_id")
        .eq("user_id", user_id)
        .gte("completed_date", since)
        .execute()
    )
    counts: dict = {}
    for r in result.data:
        counts[r["habit_id"]] = counts.get(r["habit_id"], 0) + 1
    return counts


@router.get("", response_model=list[HabitResponse])
async def list_habits(user: dict = Depends(get_current_user)):
    """Lista todos os hábitos ativos do usuário com status de hoje."""
    db = get_supabase_admin()
    user_id = user["id"]
    today = date.today().isoformat()

    habits = _ensure_habits(db, user_id)
    completed_today = _get_completions_today(db, user_id, today)
    week_counts = _get_completions_week(db, user_id)

    return [
        HabitResponse(
            id=h["id"],
            name=h["name"],
            emoji=h["emoji"],
            target_days_per_week=h["target_days_per_week"],
            order_index=h["order_index"],
            completed_today=h["id"] in completed_today,
            completions_this_week=week_counts.get(h["id"], 0),
        )
        for h in habits
    ]


@router.post("", response_model=HabitResponse)
async def create_habit(data: HabitCreate, user: dict = Depends(get_current_user)):
    """Cria um novo hábito."""
    db = get_supabase_admin()
    user_id = user["id"]

    # Define order_index como o próximo disponível
    existing = (
        db.table("user_habits")
        .select("order_index")
        .eq("user_id", user_id)
        .eq("is_active", True)
        .order("order_index", desc=True)
        .limit(1)
        .execute()
    )
    next_index = (existing.data[0]["order_index"] + 1) if existing.data else 0

    result = db.table("user_habits").insert({
        "user_id": user_id,
        "name": data.name,
        "emoji": data.emoji,
        "target_days_per_week": data.target_days_per_week,
        "order_index": next_index,
    }).execute()

    h = result.data[0]
    return HabitResponse(
        id=h["id"], name=h["name"], emoji=h["emoji"],
        target_days_per_week=h["target_days_per_week"],
        order_index=h["order_index"],
    )


@router.put("/{habit_id}", response_model=HabitResponse)
async def update_habit(habit_id: str, data: HabitUpdate, user: dict = Depends(get_current_user)):
    """Atualiza nome, emoji ou frequência alvo de um hábito."""
    db = get_supabase_admin()

    habit = (
        db.table("user_habits")
        .select("*")
        .eq("id", habit_id)
        .eq("user_id", user["id"])
        .single()
        .execute()
    )
    if not habit.data:
        raise HTTPException(status_code=404, detail="Hábito não encontrado")

    updates = data.model_dump(exclude_none=True)
    if not updates:
        raise HTTPException(status_code=400, detail="Nenhum campo para atualizar")

    result = db.table("user_habits").update(updates).eq("id", habit_id).execute()
    h = result.data[0]
    return HabitResponse(
        id=h["id"], name=h["name"], emoji=h["emoji"],
        target_days_per_week=h["target_days_per_week"],
        order_index=h["order_index"],
    )


@router.delete("/{habit_id}")
async def delete_habit(habit_id: str, user: dict = Depends(get_current_user)):
    """Desativa (soft delete) um hábito."""
    db = get_supabase_admin()

    habit = (
        db.table("user_habits")
        .select("id")
        .eq("id", habit_id)
        .eq("user_id", user["id"])
        .single()
        .execute()
    )
    if not habit.data:
        raise HTTPException(status_code=404, detail="Hábito não encontrado")

    db.table("user_habits").update({"is_active": False}).eq("id", habit_id).execute()
    return {"message": "Hábito removido"}


@router.post("/toggle", response_model=ToggleHabitResponse)
async def toggle_habit(data: ToggleHabitRequest, user: dict = Depends(get_current_user)):
    """Marca ou desmarca a conclusão de um hábito para hoje e recalcula XP."""
    db = get_supabase_admin()
    user_id = user["id"]
    today = date.today().isoformat()

    # Valida que o hábito pertence ao usuário
    habit = (
        db.table("user_habits")
        .select("id")
        .eq("id", data.habit_id)
        .eq("user_id", user_id)
        .eq("is_active", True)
        .single()
        .execute()
    )
    if not habit.data:
        raise HTTPException(status_code=404, detail="Hábito não encontrado")

    # Toggle
    existing = (
        db.table("habit_completions")
        .select("id")
        .eq("habit_id", data.habit_id)
        .eq("user_id", user_id)
        .eq("completed_date", today)
        .execute()
    )

    if existing.data:
        db.table("habit_completions").delete().eq("id", existing.data[0]["id"]).execute()
        completed = False
    else:
        db.table("habit_completions").insert({
            "habit_id": data.habit_id,
            "user_id": user_id,
            "completed_date": today,
        }).execute()
        completed = True

    # Recalcula XP do dia
    all_habits = _ensure_habits(db, user_id)
    completed_today = _get_completions_today(db, user_id, today)
    habits_completed = len(completed_today)
    total_habits = len(all_habits)
    is_perfect_day = habits_completed == total_habits and total_habits > 0

    # Streak atual
    streak_result = (
        db.table("streaks")
        .select("*")
        .eq("user_id", user_id)
        .eq("is_active", True)
        .execute()
    )
    streak_days = streak_result.data[0]["current_days"] if streak_result.data else 0

    # XP do dia (recalculado do zero)
    xp_result = calculate_daily_xp(habits_completed, streak_days, is_perfect_day)
    new_xp_today = xp_result["total_xp"]

    # XP anterior hoje (de goal_xp_cache ou perfil)
    cache = (
        db.table("daily_logs")
        .select("xp_earned")
        .eq("user_id", user_id)
        .eq("date", today)
        .execute()
    )
    prev_xp_today = cache.data[0]["xp_earned"] if cache.data else 0

    # Atualiza cache em daily_logs
    log_data = {
        "user_id": user_id, "date": today,
        "habits_completed": habits_completed,
        "is_perfect_day": is_perfect_day,
        "xp_earned": new_xp_today,
        "bible_read": False, "workout_done": False,
        "content_posted": False, "family_time": False,
    }
    if cache.data:
        db.table("daily_logs").update(log_data).eq("id", cache.data[0]["id"]).execute()
    else:
        db.table("daily_logs").insert(log_data).execute()

    # Atualiza XP do perfil
    profile = db.table("profiles").select("total_xp, level").eq("id", user_id).single().execute()
    old_total_xp = profile.data.get("total_xp", 0)
    old_level = profile.data.get("level", 1)

    xp_delta = new_xp_today - prev_xp_today
    new_total_xp = max(0, old_total_xp + xp_delta)

    level_info = get_level_info(new_total_xp)
    level_up = level_info["level"] > old_level

    db.table("profiles").update({
        "total_xp": new_total_xp,
        "level": level_info["level"],
        "current_title": level_info["title"],
    }).eq("id", user_id).execute()

    return ToggleHabitResponse(
        habit_id=data.habit_id,
        completed=completed,
        xp_gained=abs(xp_delta),
        total_xp=new_total_xp,
        level_up=level_up,
        new_level=level_info["level"] if level_up else None,
        new_title=level_info["title"] if level_up else None,
    )
