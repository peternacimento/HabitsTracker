export default function GameHUD({ stats }) {
  if (!stats) return null;

  const {
    level = 1,
    title = '🌱 Novato',
    total_xp = 0,
    xp_in_level = 0,
    xp_needed = 500,
    progress = 0,
    streak,
  } = stats;

  const streakDays = streak?.current_days || 0;
  const isStreakActive = streakDays > 0;

  return (
    <div className="game-hud">
      {/* Level badge */}
      <div className="game-hud__level" title={`Level ${level}`}>
        {level}
      </div>

      {/* XP info */}
      <div className="game-hud__info">
        <div className="game-hud__title">{title}</div>
        <div className="game-hud__xp-bar">
          <div
            className="game-hud__xp-fill"
            style={{ width: `${Math.max(progress * 100, 2)}%` }}
          />
        </div>
        <div className="game-hud__xp-text">
          {xp_in_level.toLocaleString()} / {xp_needed.toLocaleString()} XP
        </div>
      </div>

      {/* Streak counter */}
      <div className={`game-hud__streak ${isStreakActive ? 'game-hud__streak--active' : ''}`}>
        <div className="game-hud__streak-number">
          {isStreakActive ? '🔥' : '❄️'} {streakDays}
        </div>
        <div className="game-hud__streak-label">Combo</div>
      </div>
    </div>
  );
}
