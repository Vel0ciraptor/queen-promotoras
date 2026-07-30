import { useState, useEffect } from 'react';
import { Plus, X, UserCheck, UserX } from 'lucide-react';
import api from '../../lib/api';
import { useToast } from '../../context/ToastContext';

function NuevaPromotoraModal({ onClose, onCreada }) {
  const toast = useToast();
  const [form, setForm] = useState({ nombre: '', usuario: '', password: '', rol: 'promotora' });
  const [loading, setLoading] = useState(false);
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/usuarios', form);
      onCreada(data.usuario);
      toast.success(`¡${data.usuario.nombre} creada! ⭐`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error');
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-sheet">
        <div className="modal-handle"/>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1.25rem' }}>
          <h2 style={{ color:'var(--pink-strong)', fontSize:'1.2rem' }}>⭐ Nueva promotora</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose} style={{ minHeight:'unset' }}><X size={18}/></button>
        </div>
        <form onSubmit={handleSubmit} className="gap-stack">
          <div className="form-group">
            <label className="form-label">Nombre completo</label>
            <input className="input" placeholder="María García" value={form.nombre} onChange={set('nombre')} required />
          </div>
          <div className="form-group">
            <label className="form-label">Usuario (para iniciar sesión)</label>
            <input className="input" placeholder="maria_garcia" value={form.usuario} onChange={set('usuario')} required autoComplete="off" />
          </div>
          <div className="form-group">
            <label className="form-label">Contraseña inicial</label>
            <input className="input" type="password" placeholder="••••••••" value={form.password} onChange={set('password')} required autoComplete="new-password" />
          </div>
          <div className="form-group">
            <label className="form-label">Rol</label>
            <select className="input" value={form.rol} onChange={set('rol')}>
              <option value="promotora">Promotora</option>
              <option value="promotora_lider">Promotora Líder</option>
            </select>
          </div>
          <div style={{ display:'flex', gap:'0.75rem', marginTop:'0.25rem' }}>
            <button type="button" className="btn btn-ghost" style={{ flex:1 }} onClick={onClose}>Cancelar</button>
            <button id="btn-crear-promotora" type="submit" className="btn btn-primary" style={{ flex:2 }} disabled={loading}>
              {loading ? '⏳ Creando...' : '✨ Crear cuenta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const ROL_LABEL = { promotora: 'Promotora', promotora_lider: 'Líder', admin: 'Admin' };
const ROL_BADGE = { promotora: 'badge-pink', promotora_lider: 'badge-gold', admin: 'badge-green' };
const fmtDate = d => new Date(d).toLocaleDateString('es-BO', { day: '2-digit', month: 'short', year: 'numeric' });

export default function AdminPromotoras() {
  const toast = useToast();
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    api.get('/usuarios').then(({ data }) => setUsuarios(data.usuarios)).catch(() => toast.error('Error')).finally(() => setLoading(false));
  }, []);

  const handleCreada = u => { setUsuarios(prev => [u, ...prev]); setShowModal(false); };

  const handleToggle = async u => {
    try {
      const { data } = await api.patch(`/usuarios/${u.id}/toggle`);
      setUsuarios(prev => prev.map(x => x.id === u.id ? { ...x, activo: data.usuario.activo } : x));
    } catch { toast.error('Error'); }
  };

  return (
    <div className="gap-stack" style={{ gap:'1.25rem' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'0.75rem' }}>
        <h1 style={{ fontSize:'1.5rem', fontWeight:900 }}>Promotoras ⭐</h1>
        <button id="btn-nueva-promotora" className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={18}/> Nueva
        </button>
      </div>

      {loading ? (
        Array.from({length:4}).map((_,i) => <div key={i} className="skeleton" style={{height:80,borderRadius:'1.25rem'}}/>)
      ) : (
        <div className="gap-stack">
          {usuarios.map(u => (
            <div key={u.id} className="card" style={{ opacity: u.activo ? 1 : 0.6 }}>
              <div style={{ display:'flex', alignItems:'center', gap:'1rem', flexWrap:'wrap' }}>
                <div style={{
                  width:44, height:44, borderRadius:'50%', flexShrink:0,
                  background: 'linear-gradient(135deg, var(--pink-medium), var(--pink-strong))',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  color:'#fff', fontWeight:900, fontSize:'1rem'
                }}>
                  {u.nombre[0].toUpperCase()}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', flexWrap:'wrap' }}>
                    <span style={{ fontWeight:800 }}>{u.nombre}</span>
                    <span className={`badge ${ROL_BADGE[u.rol] || 'badge-gray'}`}>{ROL_LABEL[u.rol]}</span>
                    {!u.activo && <span className="badge badge-red">Inactiva</span>}
                  </div>
                  <div style={{ fontSize:'0.8rem', color:'var(--text-muted)', marginTop:'0.2rem' }}>
                    @{u.usuario} · Desde {fmtDate(u.creado_en)}
                  </div>
                </div>
                {u.rol !== 'admin' && (
                  <button
                    className={`btn ${u.activo ? 'btn-ghost' : 'btn-primary'} btn-icon`}
                    style={{ minHeight:'unset', padding:'0.5rem 0.75rem', fontSize:'0.8rem' }}
                    onClick={() => handleToggle(u)}
                    id={`btn-toggle-usuario-${u.id}`}
                    title={u.activo ? 'Desactivar' : 'Activar'}
                  >
                    {u.activo ? <UserX size={16}/> : <UserCheck size={16}/>}
                  </button>
                )}
              </div>
            </div>
          ))}
          {usuarios.length === 0 && (
            <div style={{ textAlign:'center', padding:'3rem', color:'var(--text-muted)' }}>Sin usuarios</div>
          )}
        </div>
      )}

      {showModal && <NuevaPromotoraModal onClose={() => setShowModal(false)} onCreada={handleCreada} />}
    </div>
  );
}
