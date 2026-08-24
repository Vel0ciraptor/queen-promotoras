import { useState, useEffect, useCallback } from 'react';
import { Plus, X, UserCheck, UserX, ArrowLeft, ShoppingCart, UserPlus, Clock, TrendingUp } from 'lucide-react';
import api from '../../lib/api';
import { useToast } from '../../context/ToastContext';

const fmt = n => new Intl.NumberFormat('es-BO', { style: 'currency', currency: 'BOB', minimumFractionDigits: 0 }).format(n || 0);
const fmtDate = d => new Date(d).toLocaleDateString('es-BO', { day: '2-digit', month: 'short', year: 'numeric' });
const fmtDateTime = d => new Date(d).toLocaleString('es-BO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
const fmtTime = d => new Date(d).toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' });

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

function HistorialModal({ promotora, onClose }) {
  const toast = useToast();
  const [actividad, setActividad] = useState(null);
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cargar = async () => {
      try {
        const [actRes, histRes] = await Promise.all([
          api.get(`/usuarios/${promotora.id}/actividad`),
          api.get(`/usuarios/${promotora.id}/historial`, { params: { limit: 50 } })
        ]);
        setActividad(actRes.data);
        setHistorial(histRes.data.eventos);
      } catch {
        toast.error('Error cargando historial');
      } finally {
        setLoading(false);
      }
    };
    cargar();
  }, [promotora.id, toast]);

  const getIcon = (tipo) => {
    switch (tipo) {
      case 'cliente_registrado': return <UserPlus size={16} />;
      case 'ingreso_registrado': return <ShoppingCart size={16} />;
      default: return <Clock size={16} />;
    }
  };

  const getColor = (tipo) => {
    switch (tipo) {
      case 'cliente_registrado': return '#8B5CF6';
      case 'ingreso_registrado': return '#10B981';
      default: return '#6B7280';
    }
  };

  const agruparPorFecha = (eventos) => {
    const grupos = {};
    eventos.forEach(e => {
      const fecha = new Date(e.fecha).toLocaleDateString('es-BO', { day: '2-digit', month: 'long', year: 'numeric' });
      if (!grupos[fecha]) grupos[fecha] = [];
      grupos[fecha].push(e);
    });
    return grupos;
  };

  const gruposFecha = agruparPorFecha(historial);

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-sheet" style={{ maxHeight: '90dvh' }}>
        <div className="modal-handle"/>
        <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', marginBottom:'1.25rem' }}>
          <button className="btn btn-ghost btn-icon" onClick={onClose} style={{ minHeight:'unset', padding:'0.4rem' }}>
            <ArrowLeft size={18}/>
          </button>
          <h2 style={{ color:'var(--pink-strong)', fontSize:'1.2rem', flex:1 }}>Historial de {promotora.nombre}</h2>
        </div>

        {loading ? (
          <div className="gap-stack">
            {Array.from({length:3}).map((_,i) => <div key={i} className="skeleton" style={{height:80,borderRadius:'0.75rem'}}/>)}
          </div>
        ) : (
          <>
            {/* Stats cards */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:'0.75rem', marginBottom:'1.5rem' }}>
              <div className="stat-card" style={{ textAlign:'center', padding:'1rem 0.5rem' }}>
                <div style={{ fontSize:'1.5rem', fontWeight:900, color:'var(--pink-strong)' }}>
                  {actividad?.total_clientes || 0}
                </div>
                <div style={{ fontSize:'0.7rem', color:'var(--text-muted)', fontWeight:600 }}>Clientes</div>
              </div>
              <div className="stat-card" style={{ textAlign:'center', padding:'1rem 0.5rem' }}>
                <div style={{ fontSize:'1.5rem', fontWeight:900, color:'#8B5CF6' }}>
                  {actividad?.total_ingresos || 0}
                </div>
                <div style={{ fontSize:'0.7rem', color:'var(--text-muted)', fontWeight:600 }}>Ingresos</div>
              </div>
              <div className="stat-card" style={{ textAlign:'center', padding:'1rem 0.5rem' }}>
                <div style={{ fontSize:'1.2rem', fontWeight:900, color:'#10B981' }}>
                  {fmt(actividad?.monto_total || 0)}
                </div>
                <div style={{ fontSize:'0.7rem', color:'var(--text-muted)', fontWeight:600 }}>Total</div>
              </div>
            </div>

            {/* Timeline */}
            <div style={{ display:'flex', flexDirection:'column', gap:'1.5rem' }}>
              {Object.entries(gruposFecha).map(([fecha, eventos]) => (
                <div key={fecha}>
                  <div style={{ fontSize:'0.8rem', fontWeight:800, color:'var(--text-secondary)', marginBottom:'0.75rem', textTransform:'uppercase' }}>
                    📅 {fecha}
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', gap:'0.5rem' }}>
                    {eventos.map((evento, idx) => (
                      <div
                        key={idx}
                        style={{
                          display:'flex',
                          alignItems:'flex-start',
                          gap:'0.75rem',
                          padding:'0.75rem',
                          background:'var(--surface)',
                          borderRadius:'0.875rem',
                          border:'1px solid var(--border)'
                        }}
                      >
                        <div style={{
                          width:32, height:32, borderRadius:'50%', flexShrink:0,
                          background: getColor(evento.tipo) + '20',
                          color: getColor(evento.tipo),
                          display:'flex', alignItems:'center', justifyContent:'center'
                        }}>
                          {getIcon(evento.tipo)}
                        </div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontSize:'0.85rem', fontWeight:700, color:'var(--text-primary)' }}>
                            {evento.descripcion}
                          </div>
                          {evento.nota && (
                            <div style={{ fontSize:'0.78rem', color:'var(--text-muted)', marginTop:'0.2rem', fontStyle:'italic' }}>
                              "{evento.nota}"
                            </div>
                          )}
                          <div style={{ fontSize:'0.72rem', color:'var(--text-muted)', marginTop:'0.3rem' }}>
                            🕐 {fmtTime(evento.fecha)}
                          </div>
                        </div>
                        {evento.tipo === 'ingreso_registrado' && (
                          <div style={{ fontWeight:800, color:'var(--pink-strong)', fontSize:'0.9rem', whiteSpace:'nowrap' }}>
                            {fmt(evento.monto)}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {historial.length === 0 && (
                <div style={{ textAlign:'center', padding:'2rem', color:'var(--text-muted)' }}>
                  <div style={{ fontSize:'2rem', marginBottom:'0.5rem' }}>📭</div>
                  <p style={{ fontWeight:700 }}>Sin actividad registrada</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const ROL_LABEL = { promotora: 'Promotora', promotora_lider: 'Líder', admin: 'Admin' };
const ROL_BADGE = { promotora: 'badge-pink', promotora_lider: 'badge-gold', admin: 'badge-green' };

export default function AdminPromotoras() {
  const toast = useToast();
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedPromotora, setSelectedPromotora] = useState(null);

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
          {usuarios.filter(u => u.rol !== 'admin').map(u => (
            <div key={u.id} className="card admin-promotora-card" style={{ opacity: u.activo ? 1 : 0.6 }}>
              <div style={{ display:'flex', alignItems:'center', gap:'0.875rem', flexWrap:'wrap', justifyContent:'space-between' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', flex:'1 1 200px', minWidth:0 }}>
                  <div style={{
                    width:44, height:44, borderRadius:'50%', flexShrink:0,
                    background: 'linear-gradient(135deg, var(--pink-medium), var(--pink-strong))',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    color:'#fff', fontWeight:900, fontSize:'1rem'
                  }}>
                    {u.nombre[0].toUpperCase()}
                  </div>
                  <div style={{ flex:1, minWidth:0, overflowWrap:'anywhere' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'0.35rem', flexWrap:'wrap' }}>
                      <span style={{ fontWeight:800, wordBreak:'break-word' }}>{u.nombre}</span>
                      <span className={`badge ${ROL_BADGE[u.rol] || 'badge-gray'}`}>{ROL_LABEL[u.rol]}</span>
                      {!u.activo && <span className="badge badge-red">Inactiva</span>}
                    </div>
                    <div style={{ fontSize:'0.78rem', color:'var(--text-muted)', marginTop:'0.2rem', wordBreak:'break-all' }}>
                      @{u.usuario} · Desde {fmtDate(u.creado_en)}
                    </div>
                  </div>
                </div>

                <div style={{ display:'flex', gap:'0.4rem', flexWrap:'nowrap' }}>
                  <button
                    className="btn btn-ghost"
                    style={{ minHeight:'unset', padding:'0.5rem 0.65rem', fontSize:'0.78rem' }}
                    onClick={() => setSelectedPromotora(u)}
                  >
                    📊 Historial
                  </button>
                  <button
                    className={`btn ${u.activo ? 'btn-ghost' : 'btn-primary'} btn-icon`}
                    style={{ minHeight:'unset', padding:'0.5rem 0.65rem', fontSize:'0.8rem' }}
                    onClick={() => handleToggle(u)}
                    id={`btn-toggle-usuario-${u.id}`}
                    title={u.activo ? 'Desactivar' : 'Activar'}
                  >
                    {u.activo ? <UserX size={16}/> : <UserCheck size={16}/>}
                  </button>
                </div>
              </div>
            </div>
          ))}
          {usuarios.filter(u => u.rol !== 'admin').length === 0 && (
            <div style={{ textAlign:'center', padding:'3rem', color:'var(--text-muted)' }}>Sin promotoras registradas</div>
          )}
        </div>
      )}

      {showModal && <NuevaPromotoraModal onClose={() => setShowModal(false)} onCreada={handleCreada} />}
      {selectedPromotora && <HistorialModal promotora={selectedPromotora} onClose={() => setSelectedPromotora(null)} />}
    </div>
  );
}
