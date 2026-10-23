import { useState, useEffect } from 'react';
import { X, Crown, Plus, MessageCircle, Pencil, Trash2 } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';
import AlertaDescuentoModal from './AlertaDescuentoModal';

const fmt = n => new Intl.NumberFormat('es-BO', { style: 'currency', currency: 'BOB', minimumFractionDigits: 0 }).format(n || 0);
const fmtDate = d => new Date(d).toLocaleDateString('es-BO', { day: '2-digit', month: 'short', year: 'numeric' });

// Fecha ISO → valor para <input type="datetime-local"> (hora local)
const toInputFecha = d => {
  const x = new Date(d);
  if (isNaN(x.getTime())) return '';
  x.setMinutes(x.getMinutes() - x.getTimezoneOffset());
  return x.toISOString().slice(0, 16);
};

// Modal para corregir una compra registrada con falla (solo admin)
function EditarCompraModal({ cliente, compra, onClose, onGuardado }) {
  const toast = useToast();
  const [form, setForm] = useState({
    monto: Number(compra.monto) || 0,
    fecha: toInputFecha(compra.fecha),
    nota: compra.nota || '',
    comentario: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.comentario.trim()) return toast.error('El comentario es obligatorio');
    setLoading(true);
    try {
      const { data } = await api.patch(`/clientes/${cliente.id}/historial/${compra.id}`, {
        monto: parseFloat(form.monto),
        fecha: form.fecha,
        nota: form.nota,
        comentario: form.comentario.trim()
      });
      onGuardado(data);
      toast.success('Compra corregida');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al guardar');
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-sheet">
        <div className="modal-handle"/>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1.25rem' }}>
          <h2 style={{ color:'var(--pink-strong)', fontSize:'1.2rem' }}>✏️ Corregir compra</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose} style={{ minHeight:'unset' }}><X size={18}/></button>
        </div>

        <div style={{ background:'#FEF3C7', borderRadius:'0.875rem', padding:'0.75rem 1rem', marginBottom:'1rem', fontSize:'0.85rem', color:'#92400E', fontWeight:600 }}>
          ⚠️ Toda corrección queda registrada en auditoría con tu nombre, fecha y motivo.
        </div>

        <form onSubmit={handleSubmit} className="gap-stack">
          <div className="form-group">
            <label className="form-label">Monto de compra (Bs.)</label>
            <input className="input" type="number" min="0" step="0.01" value={form.monto} onChange={e => setForm(f => ({ ...f, monto: e.target.value }))} required />
          </div>
          <div className="form-group">
            <label className="form-label">Fecha de la compra</label>
            <input className="input" type="datetime-local" value={form.fecha} onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))} required />
          </div>
          <div className="form-group">
            <label className="form-label">Nota</label>
            <input className="input" placeholder="Ej: Compra aretes dorados" value={form.nota} onChange={e => setForm(f => ({ ...f, nota: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label" style={{ color:'var(--magenta-deep)' }}>Motivo / Comentario * (obligatorio)</label>
            <textarea
              className="input"
              style={{ resize:'none', minHeight:80 }}
              placeholder="Ej: Corrección de monto por error de captura"
              value={form.comentario}
              onChange={e => setForm(f => ({ ...f, comentario: e.target.value }))}
              required
            />
          </div>
          <div style={{ display:'flex', gap:'0.75rem' }}>
            <button type="button" className="btn btn-ghost" style={{ flex:1 }} onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary" style={{ flex:2 }} disabled={loading}>
              {loading ? '⏳ Guardando...' : '💾 Guardar corrección'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Modal para eliminar una compra registrada por error / duplicada (solo admin)
function EliminarCompraModal({ cliente, compra, onClose, onEliminado }) {
  const toast = useToast();
  const [comentario, setComentario] = useState('');
  const [loading, setLoading] = useState(false);

  const handleEliminar = async e => {
    e.preventDefault();
    if (!comentario.trim()) return toast.error('El comentario es obligatorio');
    setLoading(true);
    try {
      const { data } = await api.delete(`/clientes/${cliente.id}/historial/${compra.id}`, { data: { comentario: comentario.trim() } });
      onEliminado(data);
      toast.success('Compra eliminada');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al eliminar');
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-sheet">
        <div className="modal-handle"/>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1.25rem' }}>
          <h2 style={{ color:'#DC2626', fontSize:'1.2rem' }}>🗑️ Eliminar compra</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose} style={{ minHeight:'unset' }}><X size={18}/></button>
        </div>

        <div style={{ background:'#FEE2E2', borderRadius:'0.875rem', padding:'0.75rem 1rem', marginBottom:'1rem', fontSize:'0.85rem', color:'#991B1B', fontWeight:600 }}>
          ⚠️ Se descontará {fmt(compra.monto)} del acumulado y una visita. Todo queda en auditoría.
        </div>

        <p style={{ fontSize:'0.9rem', marginBottom:'1.25rem' }}>
          ¿Eliminar la compra de <strong>{fmt(compra.monto)}</strong> del {fmtDate(compra.fecha)}
          {compra.nota && <> — <em>{compra.nota}</em></>}?
        </p>

        <form onSubmit={handleEliminar} className="gap-stack">
          <div className="form-group">
            <label className="form-label" style={{ color:'var(--magenta-deep)' }}>Motivo / Comentario * (obligatorio)</label>
            <textarea
              className="input"
              style={{ resize:'none', minHeight:80 }}
              placeholder="Ej: Registro duplicado por error de captura"
              value={comentario}
              onChange={e => setComentario(e.target.value)}
              required
            />
          </div>
          <div style={{ display:'flex', gap:'0.75rem' }}>
            <button type="button" className="btn btn-ghost" style={{ flex:1 }} onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn" style={{ flex:2, background:'#DC2626', color:'#fff', fontWeight:700 }} disabled={loading}>
              {loading ? '⏳ Eliminando...' : '🗑️ Sí, eliminar compra'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function ClienteDetalleModal({ cliente: initialCliente, onClose, onIngresoRegistrado, onClienteActualizado }) {
  const toast = useToast();
  const { user } = useAuth();
  const esAdmin = user?.rol === 'admin';
  const [cliente, setCliente] = useState(initialCliente);
  const [historial, setHistorial] = useState([]);
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [monto, setMonto] = useState('');
  const [nota, setNota] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [tab, setTab] = useState(esAdmin ? 'historial' : 'info'); // info | historial
  const [alertasCreadas, setAlertasCreadas] = useState([]);
  const [pendingIngreso, setPendingIngreso] = useState(null);
  const [editandoCompra, setEditandoCompra] = useState(null);
  const [eliminandoCompra, setEliminandoCompra] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [{ data: det }, { data: nots }] = await Promise.all([
          api.get(`/clientes/${cliente.id}`),
          api.get(`/clientes/${cliente.id}/notificaciones`)
        ]);
        setCliente(det.cliente);
        setHistorial(det.historial);
        setNotifs(nots.notificaciones);
      } catch { toast.error('Error cargando detalle'); }
      finally { setLoading(false); }
    };
    load();
  }, [cliente.id]);

  const handleIngreso = async e => {
    e.preventDefault();
    const m = parseFloat(monto);
    if (!m || m <= 0) return toast.error('Monto inválido');
    setSubmitting(true);
    try {
      const { data } = await api.post(`/clientes/${cliente.id}/ingreso`, { monto: m, nota });
      toast.success(`Ingreso de ${fmt(m)} registrado`);
      const todasLasAlertas = [
        ...(data.nuevas_notificaciones || []).filter(a => a.tipo === 'lograda'),
        ...(data.alertas_creadas || []).map(a => ({ ...a, tipo: 'progreso' }))
      ];
      setPendingIngreso({ cliente: data.cliente, nuevasNotifs: data.nuevas_notificaciones || [] });
      if (todasLasAlertas.length > 0) {
        setAlertasCreadas(todasLasAlertas);
      } else {
        onIngresoRegistrado(data.cliente, data.nuevas_notificaciones || []);
        setPendingIngreso(null);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error');
      setSubmitting(false);
    }
  };

  const handleAlertasCerradas = () => {
    setAlertasCreadas([]);
    if (pendingIngreso) {
      onIngresoRegistrado(pendingIngreso.cliente, pendingIngreso.nuevasNotifs);
      setPendingIngreso(null);
    }
  };

  // Sincronizar el cliente en los padres (lista del admin, cards de promotora)
  const sincronizarCliente = clienteActualizado => {
    setCliente(prev => ({ ...prev, ...clienteActualizado }));
    onClienteActualizado?.(clienteActualizado);
  };

  const handleCompraCorregida = ({ ingreso, cliente: clienteActualizado }) => {
    setHistorial(prev => prev.map(h => h.id === ingreso.id ? { ...h, ...ingreso } : h));
    sincronizarCliente(clienteActualizado);
    setEditandoCompra(null);
  };

  const handleCompraEliminada = ({ eliminado, cliente: clienteActualizado }) => {
    setHistorial(prev => prev.filter(h => h.id !== eliminado.id));
    sincronizarCliente(clienteActualizado);
    setEliminandoCompra(null);
  };

  const initials = cliente.nombre_completo.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-sheet">
        <div className="modal-handle" />

        {/* Header cliente */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
          <div className="client-avatar" style={{ width: 56, height: 56, fontSize: '1.3rem' }}>{initials}</div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <h2 style={{ fontWeight: 900, fontSize: '1.1rem' }}>{cliente.nombre_completo}</h2>
              {notifs.length > 0 && <span className="badge badge-gold"><Crown size={10}/> Descuento</span>}
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
              {cliente.celular && <span>📱 {cliente.celular} · </span>}
              {cliente.departamento && <span>📍 {cliente.departamento} · </span>}
              {cliente.nacionalidad && <span>🌎 {cliente.nacionalidad} · </span>}
              <span>Desde {fmtDate(cliente.fecha_registro)}</span>
            </div>
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose} style={{ minHeight: 'unset' }}><X size={18}/></button>
        </div>

        {/* Stats rápidos */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <div className="stat-card" style={{ padding: '1rem', textAlign: 'center' }}>
            <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--pink-strong)' }}>{fmt(cliente.monto_acumulado)}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>Acumulado</div>
          </div>
          <div className="stat-card" style={{ padding: '1rem', textAlign: 'center' }}>
            <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--pink-strong)' }}>{cliente.visitas_totales}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>Visitas</div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', background: 'var(--surface2)', borderRadius: '0.875rem', padding: '0.25rem' }}>
          {['info', 'historial'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              style={{
                flex: 1, padding: '0.5rem', borderRadius: '0.625rem', border: 'none', cursor: 'pointer',
                fontFamily: 'inherit', fontWeight: 700, fontSize: '0.85rem',
                background: tab === t ? 'var(--surface)' : 'transparent',
                color: tab === t ? 'var(--pink-strong)' : 'var(--text-muted)',
                boxShadow: tab === t ? 'var(--shadow)' : 'none',
                transition: 'all 0.2s'
              }}>
              {t === 'info' ? '💰 Registrar ingreso' : '📋 Historial'}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="skeleton" style={{ height: 120, borderRadius: '1rem' }} />
        ) : tab === 'info' ? (
          <form onSubmit={handleIngreso} className="gap-stack">
            {notifs.length > 0 && (
              <div style={{ background: 'linear-gradient(135deg,#FFF3C4,#FFE08A)', borderRadius: '1rem', padding: '0.875rem 1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <Crown size={18} style={{ color: '#7A5200', flexShrink: 0 }} />
                  <div style={{ fontWeight: 800, fontSize: '0.9rem', color: '#7A5200' }}>¡Descuento disponible!</div>
                </div>
                {notifs.map(n => (
                  <div key={n.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.35rem 0', borderTop: '1px solid rgba(122,82,0,0.1)' }}>
                    <div style={{ fontSize: '0.82rem', color: '#5C3A00' }}>
                      {n.descuento_nombre}: <strong>{n.porcentaje}% OFF</strong>
                    </div>
                    {cliente.celular && (
                      <button
                        onClick={() => {
                          const cell = cliente.celular?.replace(/\D/g, '');
                          if (!cell) return;
                          const msg = encodeURIComponent(
                            `¡Felicidades ${cliente.nombre_completo}! 🎉👑\nDe la tienda Queen Style te informamos que ya alcanzaste tu descuento de ${n.porcentaje}% OFF por "${n.descuento_nombre}".\n¡Ven y disfrútalo! 💖`
                          );
                          window.open(`https://wa.me/${cell}?text=${msg}`, '_blank');
                          api.patch(`/clientes/${cliente.id}/notificaciones/visto`).catch(() => {});
                        }}
                        style={{
                          display: 'inline-flex', alignItems: 'center', gap: '0.3rem',
                          background: '#25D366', color: '#fff', border: 'none', borderRadius: '99px',
                          padding: '0.3rem 0.6rem', fontSize: '0.72rem', fontWeight: 700,
                          cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0
                        }}
                      >
                        <MessageCircle size={12} /> Avisar
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
            <div className="form-group">
              <label className="form-label" htmlFor="ingreso-monto">Monto de compra (Bs.) *</label>
              <input id="ingreso-monto" className="input" type="number" min="1" step="0.01" placeholder="0.00" value={monto} onChange={e => setMonto(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="ingreso-nota">Nota (opcional)</label>
              <input id="ingreso-nota" className="input" placeholder="Ej: Compra aretes dorados" value={nota} onChange={e => setNota(e.target.value)} />
            </div>
            <button id="btn-registrar-ingreso" type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={submitting}>
              {submitting ? '⏳ Guardando...' : <><Plus size={18}/> Registrar ingreso</>}
            </button>
          </form>
        ) : (
          <div className="gap-stack" style={{ maxHeight: 300, overflowY: 'auto' }}>
            {historial.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem 0', fontSize: '0.9rem' }}>Sin historial aún</p>
            ) : historial.map(h => (
              <div key={h.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 0', borderBottom: '1px solid var(--border)' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{fmt(h.monto)}</div>
                  {h.nota && <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{h.nota}</div>}
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{fmtDate(h.fecha)}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{h.registrado_por_nombre}</div>
                </div>
                {esAdmin && (
                  <div style={{ display: 'flex', gap: '0.15rem', flexShrink: 0 }}>
                    <button
                      className="btn btn-ghost btn-icon"
                      style={{ minHeight: 'unset', padding: '0.35rem' }}
                      onClick={() => setEditandoCompra(h)}
                      title="Corregir compra"
                      id={`btn-corregir-compra-${h.id}`}
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      className="btn btn-ghost btn-icon"
                      style={{ minHeight: 'unset', padding: '0.35rem', color: '#DC2626' }}
                      onClick={() => setEliminandoCompra(h)}
                      title="Eliminar compra"
                      id={`btn-eliminar-compra-${h.id}`}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de alertas WhatsApp */}
      {alertasCreadas.length > 0 && (
        <AlertaDescuentoModal
          alertas={alertasCreadas}
          cliente={cliente}
          onClose={handleAlertasCerradas}
          onEnviar={(id) => {
            api.post(`/ranking/alertas/${id}/enviar`).catch(() => {});
            setAlertasCreadas(prev => prev.filter(a => a.id !== id));
          }}
        />
      )}

      {/* Corrección / eliminación de una compra (solo admin) */}
      {editandoCompra && (
        <EditarCompraModal
          cliente={cliente}
          compra={editandoCompra}
          onClose={() => setEditandoCompra(null)}
          onGuardado={handleCompraCorregida}
        />
      )}
      {eliminandoCompra && (
        <EliminarCompraModal
          cliente={cliente}
          compra={eliminandoCompra}
          onClose={() => setEliminandoCompra(null)}
          onEliminado={handleCompraEliminada}
        />
      )}
    </div>
  );
}
