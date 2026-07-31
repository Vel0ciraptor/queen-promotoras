import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import api from '../lib/api';
import queenLogo from '../assets/copiaqueenlogo.jpg';

export default function LoginPage() {
  const [form, setForm] = useState({ usuario: '', password: '' });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', form);
      login(data.token, data.user);
      if (data.user.rol === 'admin') navigate('/admin');
      else navigate('/promotora');
    } catch (err) {
      const msg = err.response?.data?.details 
        ? `${err.response.data.error}: ${err.response.data.details}`
        : (err.response?.data?.error || 'Error al iniciar sesión');
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-bg">
      <div className="login-card">
        {/* Logo / Brand */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <img
            src={queenLogo}
            alt="Queen Style Logo"
            style={{
              width: 90, height: 90, borderRadius: '50%', margin: '0 auto 1rem',
              objectFit: 'cover', boxShadow: '0 8px 24px rgba(255,61,143,0.5)'
            }}
          />
          <h1 style={{ color: 'var(--pink-strong)', fontSize: '1.75rem', fontWeight: 900 }}>Queen Style</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            Sistema de fidelización
          </p>
        </div>

        <form onSubmit={handleSubmit} className="gap-stack">
          <div className="form-group">
            <label className="form-label" htmlFor="usuario">Usuario</label>
            <input
              id="usuario"
              className="input"
              type="text"
              placeholder="tu_usuario"
              autoComplete="username"
              value={form.usuario}
              onChange={e => setForm(f => ({ ...f, usuario: e.target.value }))}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Contraseña</label>
            <input
              id="password"
              className="input"
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              required
            />
          </div>

          <button
            id="btn-login"
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '0.5rem', fontSize: '1rem' }}
            disabled={loading}
          >
            {loading ? (
              <span className="animate-spin" style={{ display:'inline-block', width:18,height:18,border:'2.5px solid #fff',borderTopColor:'transparent',borderRadius:'50%' }} />
            ) : '✨ Ingresar'}
          </button>
        </form>

        <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          Queen Promotoras © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
