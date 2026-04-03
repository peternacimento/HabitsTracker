import { useState, useEffect } from 'react';
import { api } from '../api/client';

const EMOJI_OPTIONS = [
  '⭐','🎯','💪','📖','🏃','🧘','🥗','💧','😴','✍️',
  '🎬','🎵','👨‍👩‍👧','🙏','⚔️','🛡️','🔥','💎','🌱','📚',
];

const DAYS_LABELS = ['', '1×', '2×', '3×', '4×', '5×', '6×', '7×'];

export default function GoalsPage() {
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ name: '', emoji: '⭐', target_days_per_week: 7 });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { loadHabits(); }, []);

  async function loadHabits() {
    try {
      const data = await api.getGoals();
      setHabits(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function openCreate() {
    setEditingId(null);
    setForm({ name: '', emoji: '⭐', target_days_per_week: 7 });
    setError('');
    setShowForm(true);
  }

  function openEdit(habit) {
    setEditingId(habit.id);
    setForm({ name: habit.name, emoji: habit.emoji, target_days_per_week: habit.target_days_per_week });
    setError('');
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setError('');
  }

  async function handleSave() {
    if (!form.name.trim()) { setError('Nome é obrigatório'); return; }
    setSaving(true);
    setError('');
    try {
      if (editingId) {
        const updated = await api.updateGoal(editingId, form);
        setHabits((prev) => prev.map((h) => h.id === editingId ? { ...h, ...updated } : h));
      } else {
        const created = await api.createGoal(form);
        setHabits((prev) => [...prev, created]);
      }
      closeForm();
    } catch (err) {
      setError(err.message || 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Remover esta meta?')) return;
    try {
      await api.deleteGoal(id);
      setHabits((prev) => prev.filter((h) => h.id !== id));
    } catch (err) {
      alert('Erro ao remover');
    }
  }

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <div className="loading-screen__text">Carregando metas...</div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="section-header">
        <h1 className="section-title">Minhas Metas</h1>
        <button className="btn btn--primary" style={{ padding: '8px 16px', fontSize: '0.85rem' }} onClick={openCreate}>
          + Nova Meta
        </button>
      </div>

      {/* Lista de metas */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
        {habits.length === 0 && (
          <div className="glass-card" style={{ textAlign: 'center', padding: 'var(--space-2xl)' }}>
            <div style={{ fontSize: '3rem', marginBottom: 'var(--space-md)' }}>🎯</div>
            <div style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-sm)' }}>
              Nenhuma meta criada ainda
            </div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Crie sua primeira meta para começar a acumular XP
            </div>
          </div>
        )}

        {habits.map((habit) => {
          const progress = Math.min(habit.completions_this_week / habit.target_days_per_week, 1);
          const isOnTrack = habit.completions_this_week >= habit.target_days_per_week;

          return (
            <div key={habit.id} className="glass-card" style={{ padding: 'var(--space-md)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                <span style={{ fontSize: '2rem', lineHeight: 1 }}>{habit.emoji}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem', marginBottom: '4px' }}>
                    {habit.name}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}>
                    META: {habit.target_days_per_week}× POR SEMANA
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                  <button
                    className="btn btn--ghost"
                    style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                    onClick={() => openEdit(habit)}
                  >
                    ✏️
                  </button>
                  <button
                    className="btn btn--ghost"
                    style={{ padding: '6px 10px', fontSize: '0.8rem', color: 'var(--accent-danger)' }}
                    onClick={() => handleDelete(habit.id)}
                  >
                    🗑️
                  </button>
                </div>
              </div>

              {/* Barra de progresso semanal */}
              <div style={{ marginTop: 'var(--space-md)' }}>
                <div style={{
                  display: 'flex', justifyContent: 'space-between',
                  fontSize: '0.7rem', color: isOnTrack ? 'var(--accent-success)' : 'var(--text-muted)',
                  marginBottom: '6px', fontFamily: 'var(--font-display)',
                }}>
                  <span>ESTA SEMANA</span>
                  <span>{habit.completions_this_week}/{habit.target_days_per_week} dias</span>
                </div>
                <div style={{
                  height: '6px', background: 'var(--bg-tertiary)',
                  borderRadius: 'var(--radius-full)', overflow: 'hidden',
                }}>
                  <div style={{
                    height: '100%',
                    width: `${progress * 100}%`,
                    background: isOnTrack
                      ? 'linear-gradient(90deg, var(--accent-success), #16a34a)'
                      : 'linear-gradient(90deg, var(--accent-primary), var(--accent-cyan))',
                    borderRadius: 'var(--radius-full)',
                    transition: 'width 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  }} />
                </div>

                {/* Dias da semana como bolinhas */}
                <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                  {Array.from({ length: habit.target_days_per_week }).map((_, i) => (
                    <div key={i} style={{
                      width: '20px', height: '20px',
                      borderRadius: '50%',
                      background: i < habit.completions_this_week
                        ? 'var(--accent-success)'
                        : 'var(--bg-tertiary)',
                      border: i < habit.completions_this_week
                        ? 'none'
                        : '1px solid var(--border-primary)',
                      transition: 'all 0.2s',
                    }} />
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal de criação/edição */}
      {showForm && (
        <div className="level-up-overlay" onClick={closeForm}>
          <div
            className="glass-card"
            style={{ width: '90%', maxWidth: '420px', padding: 'var(--space-xl)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="font-display" style={{ fontSize: '0.9rem', marginBottom: 'var(--space-lg)', letterSpacing: '0.1em' }}>
              {editingId ? 'EDITAR META' : 'NOVA META'}
            </div>

            {/* Emoji picker */}
            <div style={{ marginBottom: 'var(--space-md)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                Ícone
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {EMOJI_OPTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => setForm((f) => ({ ...f, emoji }))}
                    style={{
                      width: '40px', height: '40px', fontSize: '1.4rem',
                      borderRadius: 'var(--radius-sm)',
                      background: form.emoji === emoji ? 'rgba(139,92,246,0.3)' : 'var(--bg-tertiary)',
                      border: form.emoji === emoji ? '1px solid var(--accent-primary)' : '1px solid var(--border-primary)',
                      cursor: 'pointer', transition: 'all 0.15s',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            {/* Nome */}
            <div className="input-group" style={{ marginBottom: 'var(--space-md)' }}>
              <label>Nome da meta</label>
              <input
                className="input"
                placeholder="Ex: Leitura diária, Treino..."
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                maxLength={60}
                autoFocus
              />
            </div>

            {/* Frequência */}
            <div className="input-group" style={{ marginBottom: 'var(--space-lg)' }}>
              <label>Frequência semanal — {DAYS_LABELS[form.target_days_per_week]} por semana</label>
              <input
                type="range"
                min="1" max="7"
                value={form.target_days_per_week}
                onChange={(e) => setForm((f) => ({ ...f, target_days_per_week: +e.target.value }))}
                style={{ width: '100%', accentColor: 'var(--accent-primary)', marginTop: '4px' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-muted)', fontFamily: 'var(--font-display)' }}>
                <span>1×/SEM</span>
                <span>DIÁRIO</span>
              </div>
            </div>

            {error && (
              <div className="auth-form__error" style={{ marginBottom: 'var(--space-md)' }}>{error}</div>
            )}

            <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
              <button className="btn btn--ghost btn--full" onClick={closeForm}>Cancelar</button>
              <button className="btn btn--primary btn--full" onClick={handleSave} disabled={saving}>
                {saving ? '...' : editingId ? 'Salvar' : 'Criar Meta'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
