import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import GameHUD from '../components/layout/GameHUD';
import QuestBoard from '../components/dashboard/QuestBoard';
import StreakRing from '../components/dashboard/StreakRing';

export default function DashboardPage() {
  const { refreshStats } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [levelUp, setLevelUp] = useState(null);

  const loadStats = useCallback(async () => {
    try {
      const data = await api.getStats();
      setStats(data);
    } catch (err) {
      console.error('Erro ao carregar stats:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  async function handleCheckin(habitStates) {
    try {
      const result = await api.checkin(habitStates);

      // Level up?
      if (result.level_up) {
        setLevelUp({
          level: result.new_level,
          title: result.new_title,
        });
      }

      // Refresh stats
      await loadStats();
      await refreshStats();
    } catch (err) {
      console.error('Erro no check-in:', err);
    }
  }

  function dismissLevelUp() {
    setLevelUp(null);
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
        todayLog={stats?.today_log}
        onCheckin={handleCheckin}
        comboMultiplier={stats?.streak?.combo_multiplier || 1}
      />

      {/* Level Up Overlay */}
      {levelUp && (
        <div className="level-up-overlay" onClick={dismissLevelUp}>
          <div className="level-up-content">
            <div className="level-up-content__badge">🎉</div>
            <div className="level-up-content__title text-gradient-xp">
              LEVEL UP!
            </div>
            <div className="level-up-content__subtitle">
              Você alcançou o nível {levelUp.level}
              <br />
              <strong>{levelUp.title}</strong>
            </div>
            <button className="btn btn--primary btn--large" onClick={dismissLevelUp}>
              CONTINUAR
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
