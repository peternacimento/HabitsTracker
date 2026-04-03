import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import GameHUD from '../components/layout/GameHUD';
import QuestBoard from '../components/dashboard/QuestBoard';
import StreakRing from '../components/dashboard/StreakRing';

export default function DashboardPage() {
  const { refreshStats } = useAuth();
  const [stats, setStats] = useState(null);
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [levelUp, setLevelUp] = useState(null);

  const loadData = useCallback(async () => {
    try {
      const [statsData, habitsData] = await Promise.all([
        api.getStats(),
        api.getGoals(),
      ]);
      setStats(statsData);
      setHabits(habitsData || []);
    } catch (err) {
      console.error('Erro ao carregar dashboard:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  async function handleToggle(habitId) {
    try {
      const result = await api.toggleGoal(habitId);

      if (result.level_up) {
        setLevelUp({ level: result.new_level, title: result.new_title });
      }

      // Atualiza estado local do hábito imediatamente
      setHabits((prev) =>
        prev.map((h) =>
          h.id === habitId ? { ...h, completed_today: result.completed } : h
        )
      );

      // Atualiza stats em background
      api.getStats().then(setStats).catch(() => {});
      refreshStats();

      return result;
    } catch (err) {
      console.error('Erro ao toglar hábito:', err);
      return null;
    }
  }

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <div className="loading-screen__text">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="page">
      <GameHUD stats={stats} />

      <StreakRing
        currentDays={stats?.streak?.current_days || 0}
        maxDays={stats?.streak?.max_days || 40}
      />

      <QuestBoard
        habits={habits}
        onToggle={handleToggle}
        comboMultiplier={stats?.streak?.combo_multiplier || 1}
      />

      {levelUp && (
        <div className="level-up-overlay" onClick={() => setLevelUp(null)}>
          <div className="level-up-content">
            <div className="level-up-content__badge">🎉</div>
            <div className="level-up-content__title text-gradient-xp">LEVEL UP!</div>
            <div className="level-up-content__subtitle">
              Você alcançou o nível {levelUp.level}<br />
              <strong>{levelUp.title}</strong>
            </div>
            <button className="btn btn--primary btn--large" onClick={() => setLevelUp(null)}>
              CONTINUAR
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
