# XP por hábito completado
XP_PER_HABIT = 50

# Bônus por completar TODOS os hábitos (Perfect Day)
PERFECT_DAY_BONUS = 100

# Total de hábitos diários
TOTAL_DAILY_HABITS = 4

# Multiplicadores de combo baseados no streak
COMBO_MULTIPLIERS = [
    (40, 3.0),  # 40+ dias = 3x
    (30, 2.5),  # 30+ dias = 2.5x
    (20, 2.0),  # 20+ dias = 2x
    (10, 1.5),  # 10+ dias = 1.5x
    (5, 1.2),   # 5+ dias = 1.2x
    (1, 1.0),   # 1+ dia = 1x (base)
]

# Streak máximo (cap do combo)
MAX_STREAK_DAYS = 40

# Níveis, XP necessário e títulos
LEVEL_THRESHOLDS = [
    (1, 0, "🌱 Novato", "#64748b"),
    (2, 500, "⚔️ Disciplinado", "#22c55e"),
    (3, 1500, "🛡️ Guerreiro", "#3b82f6"),
    (4, 3500, "🔮 Mestre", "#8b5cf6"),
    (5, 7000, "👑 Lenda", "#facc15"),
    (6, 12000, "🌟 Ascendido", "#f97316"),
    (7, 20000, "💎 Imortal", "#06b6d4"),
    (8, 35000, "🔥 Divino", "#ef4444"),
]

# Bônus de milestone de streak
STREAK_MILESTONES = {
    7: 200,    # 1 semana = +200 XP
    14: 500,   # 2 semanas = +500 XP
    21: 800,   # 3 semanas = +800 XP
    30: 1500,  # 1 mês = +1500 XP
    40: 3000,  # Combo máximo = +3000 XP
}

# Nomes dos hábitos
HABIT_NAMES = {
    "bible_read": "📖 Leitura Bíblica",
    "workout_done": "⚔️ Treino",
    "content_posted": "🎬 Conteúdo",
    "family_time": "👨‍👩‍👧 Família",
}
