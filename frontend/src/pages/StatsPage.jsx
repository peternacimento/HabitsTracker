import { useState, useEffect } from 'react';
import { api } from '../api/client';

export default function StatsPage() {
  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [statsData, historyData] = await Promise.all([
          api.getStats(),
          api.getHistory(35),
        ]);
        setStats(statsData);
        setHistory(historyData?.logs || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <div className="loading-screen__text">Carregando stats...</div>
      </div>
    );
  }

  if (!stats) return null;

  // Build weekly grid data (last 35 days = 5 weeks)
  const today = new Date();
  const gridData = [];
  for (let i = 34; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const log = history.find((l) => l.date === dateStr);
    const habitsCompleted = log?.habits_completed || 0;
    const isToday = i === 0;
    gridData.push({ date: dateStr, habitsCompleted, isToday });
  }

  // Split into weeks
  const weeks = [];
  for (let i = 0; i < gridData.length; i += 7) {
    weeks.push(gridData.slice(i, i + 7));
  }

  const dayLabels = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

  // Total stats
  const totalDays = history.length;
  const perfectDays = history.filter((l) => l.is_perfect_day).length;
  const totalHabits = history.reduce((sum, l) => sum + (l.habits_completed || 0), 0);

  return (
    <div className="page">
      <div className="section-header">
        <h1 className="section-title">Estatísticas</h1>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card__value text-gradient-xp">
            {stats.total_xp.toLocaleString()}
          </div>
          <div className="stat-card__label">XP Total</div>
        </div>
        <div className="stat-card">
          <div className="stat-card__value text-gradient-primary">
            {stats.level}
          </div>
          <div className="stat-card__label">Nível</div>
        </div>
        <div className="stat-card">
          <div className="stat-card__value text-gradient-fire">
            {stats.streak?.current_days || 0}
          </div>
          <div className="stat-card__label">Streak Atual</div>
        </div>
        <div className="stat-card">
          <div className="stat-card__value" style={{ color: 'var(--accent-success)' }}>
            {perfectDays}
          </div>
          <div className="stat-card__label">Dias Perfeitos</div>
        </div>
      </div>

      {/* More Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-card__value" style={{ color: 'var(--accent-cyan)' }}>
            {totalDays}
          </div>
          <div className="stat-card__label">Dias Ativos</div>
        </div>
        <div className="stat-card">
          <div className="stat-card__value" style={{ color: 'var(--accent-primary-light)' }}>
            {totalHabits}
          </div>
          <div className="stat-card__label">Hábitos Feitos</div>
        </div>
      </div>

      {/* Weekly Grid */}
      <div className="weekly-grid" style={{ marginTop: 'var(--space-lg)' }}>
        <div className="weekly-grid__title">Últimas 5 Semanas</div>

        <div className="weekly-grid__labels">
          {dayLabels.map((label, i) => (
            <div key={i} className="weekly-grid__label">{label}</div>
          ))}
        </div>

        {weeks.map((week, weekIdx) => (
          <div key={weekIdx} className="weekly-grid__row">
            {week.map((day, dayIdx) => {
              let levelClass = '';
              if (day.habitsCompleted === 4) levelClass = 'weekly-grid__day--level-4';
              else if (day.habitsCompleted === 3) levelClass = 'weekly-grid__day--level-3';
              else if (day.habitsCompleted === 2) levelClass = 'weekly-grid__day--level-2';
              else if (day.habitsCompleted >= 1) levelClass = 'weekly-grid__day--level-1';

              return (
                <div
                  key={dayIdx}
                  className={`weekly-grid__day ${levelClass} ${day.isToday ? 'weekly-grid__day--today' : ''}`}
                  title={`${day.date}: ${day.habitsCompleted}/4 hábitos`}
                />
              );
            })}
          </div>
        ))}

        {/* Legend */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          marginTop: 'var(--space-md)',
          justifyContent: 'flex-end',
          fontSize: '0.6rem',
          color: 'var(--text-muted)',
        }}>
          <span>Menos</span>
          <div className="weekly-grid__day" style={{ width: '12px', height: '12px' }} />
          <div className="weekly-grid__day weekly-grid__day--level-1" style={{ width: '12px', height: '12px' }} />
          <div className="weekly-grid__day weekly-grid__day--level-2" style={{ width: '12px', height: '12px' }} />
          <div className="weekly-grid__day weekly-grid__day--level-3" style={{ width: '12px', height: '12px' }} />
          <div className="weekly-grid__day weekly-grid__day--level-4" style={{ width: '12px', height: '12px' }} />
          <span>Mais</span>
        </div>
      </div>
    </div>
  );
}
