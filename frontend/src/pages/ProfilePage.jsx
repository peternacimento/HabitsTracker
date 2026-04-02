import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <div className="page">
      <div className="section-header">
        <h1 className="section-title">Perfil</h1>
      </div>

      <div className="glass-card" style={{ textAlign: 'center', marginBottom: 'var(--space-lg)' }}>
        <div style={{ fontSize: '3rem', marginBottom: 'var(--space-md)' }}>
          {getLevelEmoji(user?.level || 1)}
        </div>
        <div className="font-display" style={{
          fontSize: '1.2rem',
          fontWeight: 800,
          marginBottom: 'var(--space-xs)',
        }}>
          {user?.username || user?.email || 'Guerreiro'}
        </div>
        <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
          {user?.title || '🌱 Novato'}
        </div>
        <div className="font-display text-gradient-xp" style={{
          fontSize: '0.9rem',
          marginTop: 'var(--space-md)',
        }}>
          {(user?.total_xp || 0).toLocaleString()} XP TOTAL
        </div>
      </div>

      {/* Level progression */}
      <div className="glass-card" style={{ marginBottom: 'var(--space-lg)' }}>
        <div className="section-title" style={{ marginBottom: 'var(--space-md)' }}>
          Progressão de Níveis
        </div>
        {LEVELS.map((lvl) => {
          const isCurrent = (user?.level || 1) === lvl.level;
          const isUnlocked = (user?.level || 1) >= lvl.level;
          return (
            <div
              key={lvl.level}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-md)',
                padding: 'var(--space-sm) 0',
                opacity: isUnlocked ? 1 : 0.4,
                borderLeft: isCurrent ? '3px solid var(--accent-primary)' : '3px solid transparent',
                paddingLeft: 'var(--space-md)',
              }}
            >
              <span style={{ fontSize: '1.2rem' }}>{lvl.emoji}</span>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  color: isCurrent ? 'var(--text-primary)' : 'var(--text-secondary)',
                }}>
                  Nível {lvl.level} — {lvl.title}
                </div>
                <div style={{
                  fontSize: '0.7rem',
                  color: 'var(--text-muted)',
                  fontFamily: 'var(--font-display)',
                }}>
                  {lvl.xp.toLocaleString()} XP
                </div>
              </div>
              {isUnlocked && (
                <span style={{ color: 'var(--accent-success)', fontSize: '0.8rem' }}>✓</span>
              )}
            </div>
          );
        })}
      </div>

      <button
        className="btn btn--ghost btn--full"
        onClick={handleLogout}
        id="logout-btn"
      >
        Sair da Conta
      </button>
    </div>
  );
}

const LEVELS = [
  { level: 1, emoji: '🌱', title: 'Novato', xp: 0 },
  { level: 2, emoji: '⚔️', title: 'Disciplinado', xp: 500 },
  { level: 3, emoji: '🛡️', title: 'Guerreiro', xp: 1500 },
  { level: 4, emoji: '🔮', title: 'Mestre', xp: 3500 },
  { level: 5, emoji: '👑', title: 'Lenda', xp: 7000 },
  { level: 6, emoji: '🌟', title: 'Ascendido', xp: 12000 },
  { level: 7, emoji: '💎', title: 'Imortal', xp: 20000 },
  { level: 8, emoji: '🔥', title: 'Divino', xp: 35000 },
];

function getLevelEmoji(level) {
  const found = LEVELS.find((l) => l.level === level);
  return found?.emoji || '🌱';
}
