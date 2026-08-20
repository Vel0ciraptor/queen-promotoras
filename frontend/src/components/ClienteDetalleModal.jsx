import { useState, useEffect } from 'react';
import { X, Crown, Plus, MessageCircle } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import api from '../lib/api';
import AlertaDescuentoModal from './AlertaDescuentoModal';

const fmt = n => new Intl.NumberFormat('es-BO', { style: 'currency', currency: 'BOB', minimumFractionDigits: 0 }).format(n || 0);
const fmtDate = d => new Date(d).toLocaleDateString('es-BO', { day: '2-digit', month: 'short', year: 'numeric' });

export default function ClienteDetalleModal({ cliente: initialCliente, onClose, onIngresoRegistrado }) {
  const toast = useToast();
  const [cliente, setCliente] = useState(initialCliente);
  const [historial, setHistorial] = useState([]);
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [monto, setMonto] = useState('');
  const [nota, setNota] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [tab, setTab] = useState('info'); // info | historial
  const [alertasCreadas, setAlertasCreadas] = useState([]);

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
      onIngresoRegistrado(data.cliente, data.nuevas_notificaciones || []);
      toast.success(`Ingreso de ${fmt(m)} registrado`);
      const todasLasAlertas = [
        ...(data.nuevas_notificaciones || []).filter(a => a.tipo === 'lograda'),
        ...(data.alertas_creadas || []).map(a => ({ ...a, tipo: 'progreso' }))
      ];
      if (todasLasAlertas.length > 0) {
        setAlertasCreadas(todasLasAlertas);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error');
      setSubmitting(false);
    }
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
              <div key={h.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 0', borderBottom: '1px solid var(--border)' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{fmt(h.monto)}</div>
                  {h.nota && <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{h.nota}</div>}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{fmtDate(h.fecha)}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{h.registrado_por_nombre}</div>
                </div>
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
          onClose={() => setAlertasCreadas([])}
          onEnviar={(id) => {
            api.post(`/ranking/alertas/${id}/enviar`).catch(() => {});
            setAlertasCreadas(prev => prev.filter(a => a.id !== id));
          }}
        />
      )}
    </div>
  );
}
