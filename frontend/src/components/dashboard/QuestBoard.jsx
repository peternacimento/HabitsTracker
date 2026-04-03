import { useState } from 'react';

export default function QuestBoard({ habits, onToggle, comboMultiplier }) {
  const [floatingXP, setFloatingXP] = useState([]);

  const completedCount = habits.filter((h) => h.completed_today).length;
  const totalCount = habits.length;
  const isPerfect = totalCount > 0 && completedCount === totalCount;

  async function handleToggle(habit) {
    const result = await onToggle(habit.id);
    if (result?.completed && result?.xp_gained > 0) {
      const id = Date.now();
      setFloatingXP((prev) => [...prev, { id, value: result.xp_gained }]);
      setTimeout(() => setFloatingXP((prev) => prev.filter((f) => f.id !== id)), 1200);
    }
  }

  if (habits.length === 0) {
    return (
      <div className="quest-board">
        <div className="quest-board__header">
          <span className="quest-board__title">Quests Diárias</span>
        </div>
        <div className="glass-card" style={{ textAlign: 'center', padding: 'var(--space-xl)' }}>
          <div style={{ fontSize: '2rem', marginBottom: 'var(--space-md)' }}>🎯</div>
          <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            Nenhuma meta definida ainda.
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: 'var(--space-sm)' }}>
            Vá em Metas para criar seus hábitos.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="quest-board">
      <div className="quest-board__header">
        <span className="quest-board__title">Quests Diárias</span>
        <span className="quest-board__counter">{completedCount}/{totalCount}</span>
      </div>

      {habits.map((habit) => (
        <div
          key={habit.id}
          className={`quest-card ${habit.completed_today ? 'quest-card--completed' : ''}`}
          onClick={() => handleToggle(habit)}
          role="button"
          tabIndex={0}
        >
          <span className="quest-card__icon">{habit.emoji}</span>
          <div className="quest-card__content">
            <div className="quest-card__name">{habit.name}</div>
            <div className="quest-card__xp">
              +{Math.round(50 * (comboMultiplier || 1))} XP
              {comboMultiplier > 1 && (
                <span style={{ color: 'var(--accent-streak)', marginLeft: '4px' }}>
                  (x{comboMultiplier})
                </span>
              )}
              <span style={{ color: 'var(--text-muted)', marginLeft: '6px' }}>
                · {habit.target_days_per_week}×/sem
              </span>
            </div>
          </div>
          <div className="quest-card__check">{habit.completed_today ? '✓' : ''}</div>
        </div>
      ))}

      {floatingXP.map((f) => (
        <div key={f.id} className="xp-float" style={{ left: '50%', top: '40%', transform: 'translateX(-50%)' }}>
          +{f.value} XP
        </div>
      ))}

      {isPerfect && (
        <div className="glass-card" style={{
          textAlign: 'center',
          borderColor: 'rgba(251, 191, 36, 0.3)',
          boxShadow: 'var(--glow-xp)',
          marginTop: 'var(--space-sm)',
        }}>
          <div style={{ fontSize: '1.5rem', marginBottom: '4px' }}>🏆</div>
          <div className="font-display text-gradient-xp" style={{ fontSize: '0.8rem' }}>
            PERFECT DAY! +100 XP BÔNUS
          </div>
        </div>
      )}
    </div>
  );
}
