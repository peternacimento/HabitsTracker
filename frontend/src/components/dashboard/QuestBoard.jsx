import { useState, useRef } from 'react';

const QUESTS = [
  { key: 'bible_read', icon: '📖', name: 'Leitura Bíblica', xp: 50 },
  { key: 'workout_done', icon: '⚔️', name: 'Treino', xp: 50 },
  { key: 'content_posted', icon: '🎬', name: 'Conteúdo Criado', xp: 50 },
  { key: 'family_time', icon: '👨‍👩‍👧', name: 'Tempo em Família', xp: 50 },
];

export default function QuestBoard({ todayLog, onCheckin, comboMultiplier }) {
  const [floatingXP, setFloatingXP] = useState([]);
  const boardRef = useRef(null);

  const completedCount = todayLog
    ? QUESTS.filter((q) => todayLog[q.key]).length
    : 0;

  async function handleToggle(quest) {
    const currentValue = todayLog?.[quest.key] || false;
    const newValue = !currentValue;

    // Cria o novo estado
    const newLog = {
      bible_read: todayLog?.bible_read || false,
      workout_done: todayLog?.workout_done || false,
      content_posted: todayLog?.content_posted || false,
      family_time: todayLog?.family_time || false,
      [quest.key]: newValue,
    };

    // Animação de XP flutuante
    if (newValue) {
      const id = Date.now();
      const xpValue = Math.round(quest.xp * (comboMultiplier || 1));
      setFloatingXP((prev) => [...prev, { id, value: xpValue }]);
      setTimeout(() => {
        setFloatingXP((prev) => prev.filter((f) => f.id !== id));
      }, 1200);
    }

    await onCheckin(newLog);
  }

  return (
    <div className="quest-board" ref={boardRef}>
      <div className="quest-board__header">
        <span className="quest-board__title">Quests Diárias</span>
        <span className="quest-board__counter">
          {completedCount}/{QUESTS.length}
        </span>
      </div>

      {QUESTS.map((quest) => {
        const isCompleted = todayLog?.[quest.key] || false;

        return (
          <div
            key={quest.key}
            className={`quest-card ${isCompleted ? 'quest-card--completed' : ''}`}
            onClick={() => handleToggle(quest)}
            role="button"
            tabIndex={0}
            id={`quest-${quest.key}`}
          >
            <span className="quest-card__icon">{quest.icon}</span>
            <div className="quest-card__content">
              <div className="quest-card__name">{quest.name}</div>
              <div className="quest-card__xp">
                +{Math.round(quest.xp * (comboMultiplier || 1))} XP
                {comboMultiplier > 1 && (
                  <span style={{ color: 'var(--accent-streak)', marginLeft: '4px' }}>
                    (x{comboMultiplier})
                  </span>
                )}
              </div>
            </div>
            <div className="quest-card__check">
              {isCompleted ? '✓' : ''}
            </div>
          </div>
        );
      })}

      {/* XP Float animations */}
      {floatingXP.map((f) => (
        <div
          key={f.id}
          className="xp-float"
          style={{
            left: '50%',
            top: '40%',
            transform: 'translateX(-50%)',
          }}
        >
          +{f.value} XP
        </div>
      ))}

      {completedCount === QUESTS.length && (
        <div
          className="glass-card"
          style={{
            textAlign: 'center',
            borderColor: 'rgba(251, 191, 36, 0.3)',
            boxShadow: 'var(--glow-xp)',
            marginTop: 'var(--space-sm)',
          }}
        >
          <div style={{ fontSize: '1.5rem', marginBottom: '4px' }}>🏆</div>
          <div className="font-display text-gradient-xp" style={{ fontSize: '0.8rem' }}>
            PERFECT DAY! +100 XP BÔNUS
          </div>
        </div>
      )}
    </div>
  );
}
