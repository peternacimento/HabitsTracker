const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

let isRefreshing = false;

async function request(endpoint, options = {}, retry = true) {
  const url = `${API_URL}${endpoint}`;

  const config = {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  if (options.body && typeof options.body === 'object') {
    config.body = JSON.stringify(options.body);
  }

  const response = await fetch(url, config);

  if (response.status === 401 && retry && !isRefreshing) {
    // Tenta renovar o token antes de redirecionar
    isRefreshing = true;
    try {
      const refreshRes = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      });
      if (refreshRes.ok) {
        isRefreshing = false;
        return request(endpoint, options, false);
      }
    } catch {
      // ignore
    }
    isRefreshing = false;
    window.location.href = '/login';
    throw new Error('Sessão expirada');
  }

  if (response.status === 401) {
    window.location.href = '/login';
    throw new Error('Sessão expirada');
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `HTTP ${response.status}`);
  }

  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

export const api = {
  // Auth
  register: (data) => request('/auth/register', { method: 'POST', body: data }),
  login: (data) => request('/auth/login', { method: 'POST', body: data }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  getMe: () => request('/auth/me'),

  // Habits
  checkin: (data) => request('/habits/checkin', { method: 'POST', body: data }),
  getToday: () => request('/habits/today'),
  getStats: () => request('/habits/stats'),
  getHistory: (days = 30) => request(`/habits/history?days=${days}`),
};
