import { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import api from '../../lib/api';
import { Moon, Sun } from 'lucide-react';

export default function AdminConfiguracion() {
  const { theme, toggle } = useTheme();

  return (
    <div className="gap-stack" style={{ gap:'1.5rem', maxWidth:560 }}>
      <div>
        <h1 style={{ fontSize:'1.5rem', fontWeight:900 }}>Configuración ⚙️</h1>
        <p style={{ color:'var(--text-muted)', fontSize:'0.85rem', marginTop:'0.25rem' }}>Ajustes del sistema</p>
      </div>

      <div className="card">
        <h3 style={{ fontWeight:800, marginBottom:'1rem' }}>Apariencia</h3>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'0.75rem 0', borderBottom:'1px solid var(--border)' }}>
          <div>
            <div style={{ fontWeight:700 }}>Modo {theme === 'dark' ? 'oscuro' : 'claro'}</div>
            <div style={{ fontSize:'0.82rem', color:'var(--text-muted)', marginTop:'0.15rem' }}>
              {theme === 'dark' ? 'Fondo oscuro ciruela/vino' : 'Fondo rosa neblina'}
            </div>
          </div>
          <button
            id="btn-toggle-tema"
            className="btn btn-primary"
            onClick={toggle}
            style={{ gap:'0.4rem' }}
          >
            {theme === 'dark' ? <><Sun size={16}/> Modo claro</> : <><Moon size={16}/> Modo oscuro</>}
          </button>
        </div>
      </div>

      <div className="card">
        <h3 style={{ fontWeight:800, marginBottom:'1rem' }}>Datos del negocio</h3>
        <div className="gap-stack">
          <div className="form-group">
            <label className="form-label">Nombre del negocio</label>
            <input className="input" defaultValue="Queen Style" readOnly style={{ opacity:0.7 }} />
          </div>
          <div className="form-group">
            <label className="form-label">Moneda</label>
            <input className="input" defaultValue="BOB (Bolivianos)" readOnly style={{ opacity:0.7 }} />
          </div>
          <p style={{ fontSize:'0.8rem', color:'var(--text-muted)', fontStyle:'italic' }}>
            La edición de datos del negocio estará disponible en una próxima versión.
          </p>
        </div>
      </div>

      <div className="card">
        <h3 style={{ fontWeight:800, marginBottom:'1rem' }}>Cambiar mi contraseña 🔒</h3>
        <CambiarPasswordForm />
      </div>

      <div className="card">
        <h3 style={{ fontWeight:800, marginBottom:'1rem' }}>Información del sistema</h3>
        <div style={{ fontSize:'0.85rem', color:'var(--text-muted)', lineHeight:1.8 }}>
          <div>🌸 Queen Promotoras v1.0</div>
          <div>🛡️ Auth: JWT con expiración de 8h</div>
          <div>📊 BD: PostgreSQL con auditoría completa</div>
          <div>📱 Diseño: Mobile-first</div>
        </div>
      </div>
    </div>
  );
}

function CambiarPasswordForm() {
  const toast = useToast();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      return toast.error('Ingresa la contraseña actual y la nueva');
    }
    if (newPassword !== confirmPassword) {
      return toast.error('La nueva contraseña y la confirmación no coinciden');
    }
    if (newPassword.length < 6) {
      return toast.error('La nueva contraseña debe tener al menos 6 caracteres');
    }

    setLoading(true);
    try {
      await api.post('/auth/change-password', { currentPassword, newPassword });
      toast.success('¡Contraseña cambiada exitosamente!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al cambiar la contraseña');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="gap-stack">
      <div className="form-group">
        <label className="form-label">Contraseña actual *</label>
        <input
          type="password"
          className="input"
          placeholder="••••••••"
          value={currentPassword}
          onChange={e => setCurrentPassword(e.target.value)}
          required
        />
      </div>
      <div className="form-group">
        <label className="form-label">Nueva contraseña *</label>
        <input
          type="password"
          className="input"
          placeholder="Mínimo 6 caracteres"
          value={newPassword}
          onChange={e => setNewPassword(e.target.value)}
          required
        />
      </div>
      <div className="form-group">
        <label className="form-label">Confirmar nueva contraseña *</label>
        <input
          type="password"
          className="input"
          placeholder="Repite la nueva contraseña"
          value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)}
          required
        />
      </div>
      <button
        id="btn-cambiar-password"
        type="submit"
        className="btn btn-primary"
        style={{ marginTop: '0.5rem' }}
        disabled={loading}
      >
        {loading ? '⏳ Actualizando...' : '🔐 Actualizar contraseña'}
      </button>
    </form>
  );
}
