-- ============================================================
-- Migration 001: Sistema de Metas (user_habits + habit_completions)
-- Execute no Supabase SQL Editor
-- ============================================================

-- Tabela de hábitos/metas do usuário
CREATE TABLE IF NOT EXISTS user_habits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    emoji TEXT DEFAULT '⭐',
    target_days_per_week INTEGER DEFAULT 7 CHECK (target_days_per_week >= 1 AND target_days_per_week <= 7),
    is_active BOOLEAN DEFAULT TRUE,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de conclusões de hábitos por dia
CREATE TABLE IF NOT EXISTS habit_completions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    habit_id UUID NOT NULL REFERENCES user_habits(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    completed_date DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(habit_id, completed_date)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_user_habits_user ON user_habits(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_habit_completions_user_date ON habit_completions(user_id, completed_date DESC);

-- RLS: user_habits
ALTER TABLE user_habits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own habits" ON user_habits
    FOR ALL USING (auth.uid() = user_id);

-- RLS: habit_completions
ALTER TABLE habit_completions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own completions" ON habit_completions
    FOR ALL USING (auth.uid() = user_id);
