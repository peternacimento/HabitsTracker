from app.gamification.constants import (
    XP_PER_HABIT,
    PERFECT_DAY_BONUS,
    TOTAL_DAILY_HABITS,
    COMBO_MULTIPLIERS,
    LEVEL_THRESHOLDS,
    STREAK_MILESTONES,
    MAX_STREAK_DAYS,
)


def get_combo_multiplier(streak_days: int) -> float:
    """Retorna o multiplicador de combo baseado nos dias de streak."""
    for threshold, multiplier in COMBO_MULTIPLIERS:
        if streak_days >= threshold:
            return multiplier
    return 1.0


def calculate_daily_xp(
    habits_completed: int, streak_days: int, is_perfect_day: bool
) -> dict:
    """Calcula XP ganho no dia com base nos hábitos e streak."""
    base_xp = habits_completed * XP_PER_HABIT
    perfect_bonus = PERFECT_DAY_BONUS if is_perfect_day else 0
    multiplier = get_combo_multiplier(streak_days)

    raw_xp = base_xp + perfect_bonus
    final_xp = int(raw_xp * multiplier)

    # Checa se atingiu um milestone de streak
    milestone_bonus = STREAK_MILESTONES.get(streak_days, 0)
    final_xp += milestone_bonus

    return {
        "base_xp": base_xp,
        "perfect_bonus": perfect_bonus,
        "multiplier": multiplier,
        "milestone_bonus": milestone_bonus,
        "total_xp": final_xp,
        "breakdown": {
            "habits": f"{habits_completed}x {XP_PER_HABIT} = {base_xp}",
            "perfect": f"+{perfect_bonus}" if perfect_bonus else None,
            "combo": f"x{multiplier}" if multiplier > 1.0 else None,
            "milestone": f"+{milestone_bonus} (streak {streak_days}!)"
            if milestone_bonus
            else None,
        },
    }


def get_level_info(total_xp: int) -> dict:
    """Retorna o nível, título e progresso para o próximo nível."""
    current_level = LEVEL_THRESHOLDS[0]
    next_level = None

    for i, (level, threshold, title, color) in enumerate(LEVEL_THRESHOLDS):
        if total_xp >= threshold:
            current_level = (level, threshold, title, color)
            if i + 1 < len(LEVEL_THRESHOLDS):
                next_level = LEVEL_THRESHOLDS[i + 1]
        else:
            break

    level, threshold, title, color = current_level

    if next_level:
        next_threshold = next_level[1]
        xp_in_level = total_xp - threshold
        xp_needed = next_threshold - threshold
        progress = min(xp_in_level / xp_needed, 1.0) if xp_needed > 0 else 1.0
    else:
        xp_in_level = 0
        xp_needed = 0
        progress = 1.0

    return {
        "level": level,
        "title": title,
        "color": color,
        "total_xp": total_xp,
        "xp_in_level": xp_in_level,
        "xp_needed": xp_needed,
        "progress": round(progress, 3),
        "next_level": next_level[0] if next_level else None,
        "next_title": next_level[2] if next_level else None,
    }
