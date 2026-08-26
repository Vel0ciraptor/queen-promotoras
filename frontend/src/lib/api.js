import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

api.interceptors.response.use(
  r => r,
  err => {
    // Log detallado del error para debugging en produccion
    const url = err.config?.url || 'unknown';
    const method = err.config?.method?.toUpperCase() || 'UNKNOWN';
    const status = err.response?.status || 'NO_RESPONSE';
    const errorMsg = err.response?.data?.error || err.message || 'unknown';
    console.error(`[API ERROR] ${method} ${url} → ${status}: ${errorMsg}`);

    if (err.response?.status === 429) {
      console.warn('[API] Rate limit alcanzado. Intenta de nuevo en unos minutos.');
    }

    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
