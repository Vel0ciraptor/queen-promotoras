import { useTheme } from '../../context/ThemeContext';
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
