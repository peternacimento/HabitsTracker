import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Senha deve ter no mínimo 6 caracteres');
      return;
    }

    setLoading(true);

    try {
      await register(email, password, username);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Erro ao criar conta');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-page__logo text-gradient-primary">
        ⚔️ LEVEL UP
      </div>
      <div className="auth-page__subtitle">
        Crie sua conta e comece sua jornada
      </div>

      <form className="auth-form" onSubmit={handleSubmit}>
        {error && <div className="auth-form__error">{error}</div>}

        <div className="input-group">
          <label htmlFor="username">Nome de Guerreiro</label>
          <input
            id="username"
            className="input"
            type="text"
            placeholder="PeterTheGreat"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            autoComplete="username"
          />
        </div>

        <div className="input-group">
          <label htmlFor="reg-email">Email</label>
          <input
            id="reg-email"
            className="input"
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </div>

        <div className="input-group">
          <label htmlFor="reg-password">Senha</label>
          <input
            id="reg-password"
            className="input"
            type="password"
            placeholder="Mínimo 6 caracteres"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            autoComplete="new-password"
          />
        </div>

        <button
          type="submit"
          className="btn btn--primary btn--large btn--full"
          disabled={loading}
          id="register-submit"
        >
          {loading ? 'Criando...' : '🛡️ CRIAR CONTA'}
        </button>

        <div className="auth-form__switch">
          Já tem conta?{' '}
          <Link to="/login">Entrar</Link>
        </div>
      </form>
    </div>
  );
}
