import { useState, useEffect, useCallback } from 'react';
import api from '../lib/api';
import { Users, Bell, MessageCircle, Trophy, Star, Info, X } from 'lucide-react';

const CORONAS_NIVELES = [
  { orden: 1, nombre: 'Rosa Suave',    monto: 500,    color: 'linear-gradient(135deg, #FFD1E3, #FF6FA5)', textColor: '#7A0033', icono: '👑', desc: 'Al acumular 500 Bs. en compras' },
  { orden: 2, nombre: 'Rosa Vibrante', monto: 1000,   color: 'linear-gradient(135deg, #FF6FA5, #FF3D8F)', textColor: '#fff', icono: '👑', desc: 'Al acumular 1,000 Bs. en compras' },
  { orden: 3, nombre: 'Rosa Intensa',  monto: 2000,   color: 'linear-gradient(135deg, #FF3D8F, #e0007b)', textColor: '#fff', icono: '👑', desc: 'Al acumular 2,000 Bs. en compras' },
  { orden: 4, nombre: 'Bronce Rosa',   monto: 3500,   color: 'linear-gradient(135deg, #CD7F6B, #E8967E)', textColor: '#fff', icono: '👑', desc: 'Al acumular 3,500 Bs. en compras' },
  { orden: 5, nombre: 'Plata Rosa',    monto: 5000,   color: 'linear-gradient(135deg, #C0C0C0, #D4A0B0)', textColor: '#4A3040', icono: '👑', desc: 'Al acumular 5,000 Bs. en compras' },
  { orden: 6, nombre: 'Oro Rosa',      monto: 7500,   color: 'linear-gradient(135deg, #F4C95D, #FF6FA5)', textColor: '#5A3000', icono: '👑', desc: 'Al acumular 7,500 Bs. en compras' },
  { orden: 7, nombre: 'Platinum Rosa', monto: 10000,  color: 'linear-gradient(135deg, #E5E4E2, #FFB6C1, #E5E4E2, #FFD1E3)', textColor: '#5A3050', icono: '💎', desc: 'Al acumular 10,000 Bs. en compras' },
];

function CoronasInfoModal({ onClose }) {
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-sheet">
        <div className="modal-handle" />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h2 style={{ color: 'var(--pink-strong)', fontSize: '1.1rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            👑 Niveles de Corona
          </h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose} style={{ minHeight: 'unset' }}><X size={18} /></button>
        </div>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1rem', lineHeight: 1.5 }}>
          Cada clienta obtiene una corona según el monto total que ha acumulado en compras. A mayor acumulado, más exclusiva la corona.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          {CORONAS_NIVELES.map(c => (
            <div key={c.orden} style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              padding: '0.75rem', borderRadius: '1rem',
              background: 'var(--surface)', border: '1px solid var(--border)'
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                background: c.color, display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontSize: '1.3rem',
                boxShadow: '0 2px 10px rgba(0,0,0,0.12)'
              }}>
                {c.icono}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 800, fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                  {c.nombre}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {c.desc}
                </div>
              </div>
              <div style={{
                padding: '0.25rem 0.6rem', borderRadius: '99px', fontSize: '0.72rem',
                fontWeight: 800, background: c.color, color: c.textColor, flexShrink: 0
              }}>
                +{fmt(c.monto)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const fmt = n => new Intl.NumberFormat('es-BO', { style: 'currency', currency: 'BOB', minimumFractionDigits: 0 }).format(n || 0);

function CrownBadge({ corona }) {
  if (!corona) return null;
  const clase = `crown-badge crown-${corona.orden}`;
  return (
    <span className={`crown-wrapper`} style={{ position: 'relative' }}>
      <span className={clase}>
        {corona.icono} {corona.nombre}
      </span>
      <span className="crown-tooltip">Mín. {fmt(corona.monto_minimo)}</span>
    </span>
  );
}

function PodiumAvatar({ cliente, className }) {
  const initials = cliente.nombre_completo
    .split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  return (
    <div className={`podium-avatar ${className}`}>
      {initials}
    </div>
  );
}

function Podium({ top3 }) {
  if (!top3.length) return null;
  const order = top3.length >= 3 ? [top3[1], top3[0], top3[2]] : top3.length === 2 ? [top3[1], top3[0]] : [top3[0]];
  const sizes = ['second', 'first', 'third'];
  const posLabels = ['2da', '1ra', '3ra'];

  return (
    <div className="ranking-podium">
      {order.map((c, i) => (
        <div key={c.id} className="podium-item" style={{ order: i === 0 ? 0 : i === 1 ? -1 : 2 }}>
          <CrownBadge corona={c.corona} />
          <PodiumAvatar cliente={c} className={sizes[i]} />
          <span className="podium-name">{c.nombre_completo}</span>
          <span className="podium-monto">{fmt(c.monto_acumulado)}</span>
          <span className="podium-position">{posLabels[i]}</span>
        </div>
      ))}
    </div>
  );
}

function RankingItem({ cliente, onAlerta }) {
  const initials = cliente.nombre_completo
    .split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div className={`ranking-item ${cliente.posicion <= 3 ? 'top3' : ''}`}>
      <div className="ranking-pos">{cliente.posicion}</div>
      <div className="ranking-avatar-sm">{initials}</div>
      <div className="ranking-info">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
          <span className="ranking-name">{cliente.nombre_completo}</span>
          <CrownBadge corona={cliente.corona} />
        </div>
        <div className="ranking-stats">
          <span>💰 {fmt(cliente.monto_acumulado)}</span>
          <span>🛍️ {cliente.visitas_totales} visita{cliente.visitas_totales !== 1 ? 's' : ''}</span>
        </div>
      </div>
      {cliente.tiene_alerta && (
        <button
          className="btn-whatsapp"
          onClick={(e) => { e.stopPropagation(); onAlerta?.(cliente); }}
          title="Enviar recordatorio por WhatsApp"
        >
          <MessageCircle size={14} />
        </button>
      )}
    </div>
  );
}

function AlertaItem({ alerta, onEnviar }) {
  const handleWhatsApp = () => {
    const celular = alerta.cliente_celular?.replace(/\D/g, '');
    if (!celular) return;
    const mensaje = encodeURIComponent(
      `¡Hola ${alerta.cliente_nombre}! 🌟\nDe la tienda Queen Style te informamos que estás a solo ${fmt(alerta.monto_faltante)} de alcanzar tu descuento de ${alerta.porcentaje}% OFF.\n¡No dejes pasar esta oportunidad! 💖`
    );
    window.open(`https://wa.me/${celular}?text=${mensaje}`, '_blank');
    onEnviar(alerta.id);
  };

  return (
    <div className="whatsapp-alert-card">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
            {alerta.cliente_nombre}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
            Le faltan <strong style={{ color: 'var(--pink-strong)' }}>{fmt(alerta.monto_faltante)}</strong> para su descuento
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
            <span className="alert-proximity">
              🎁 {alerta.porcentaje}% OFF — {alerta.nombre_descuento}
            </span>
          </div>
        </div>
        <button className="btn-whatsapp" onClick={handleWhatsApp} style={{ flexShrink: 0 }}>
          <MessageCircle size={14} /> WhatsApp
        </button>
      </div>
    </div>
  );
}

export default function RankingPanel() {
  const [tab, setTab] = useState('top');
  const [ranking, setRanking] = useState([]);
  const [miEquipo, setMiEquipo] = useState([]);
  const [alertas, setAlertas] = useState([]);
  const [proximas, setProximas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showInfo, setShowInfo] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [rankRes, alertRes, proxRes] = await Promise.all([
        api.get('/ranking'),
        api.get('/ranking/alertas'),
        api.get('/ranking/proximas-alertas')
      ]);
      setRanking(rankRes.data.clientas || []);
      setAlertas(alertRes.data.alertas || []);
      setProximas(proxRes.data.proximas || []);
    } catch {
      // sin backend, sin datos
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const fetchMiEquipo = useCallback(async () => {
    try {
      const { data } = await api.get('/ranking/mi-equipo');
      setMiEquipo(data.clientas || []);
    } catch {
      // sin backend
    }
  }, []);

  useEffect(() => {
    if (tab === 'equipo' && miEquipo.length === 0) fetchMiEquipo();
  }, [tab, miEquipo.length, fetchMiEquipo]);

  const handleEnviarAlerta = async (alertaId) => {
    try {
      await api.post(`/ranking/alertas/${alertaId}/enviar`);
      setAlertas(prev => prev.filter(a => a.id !== alertaId));
    } catch {
      // silent
    }
  };

  const top3 = ranking.slice(0, 3);
  const resto = ranking.slice(3);
  const alertCount = alertas.length + proximas.length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {/* Header con tabs + botón info */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <div className="ranking-tabs" style={{ flex: 1 }}>
          <button
            className={`ranking-tab ${tab === 'top' ? 'active' : ''}`}
            onClick={() => setTab('top')}
          >
            <Trophy size={14} /> Top
          </button>
          <button
            className={`ranking-tab ${tab === 'equipo' ? 'active' : ''}`}
            onClick={() => setTab('equipo')}
          >
            <Users size={14} /> Mis Clientas
          </button>
          <button
            className={`ranking-tab ${tab === 'alertas' ? 'active' : ''}`}
            onClick={() => setTab('alertas')}
            style={{ position: 'relative' }}
          >
            <Bell size={14} /> Alertas
            {alertCount > 0 && (
              <span style={{
                position: 'absolute', top: '-4px', right: '-4px',
                background: '#e53e3e', color: '#fff', borderRadius: '50%',
                width: '18px', height: '18px', fontSize: '0.6rem', fontWeight: 900,
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                {alertCount}
              </span>
            )}
          </button>
        </div>
        <button
          className="btn btn-ghost btn-icon"
          onClick={() => setShowInfo(true)}
          title="¿Qué significan las coronas?"
          style={{ flexShrink: 0, width: 40, height: 40, borderRadius: '50%', border: '1.5px solid var(--border)' }}
        >
          <Info size={16} />
        </button>
      </div>

      {loading ? (
        <div className="gap-stack">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 64, borderRadius: '1rem' }} />
          ))}
        </div>
      ) : (
        <>
          {/* TAB: Top Clientas Global */}
          {tab === 'top' && (
            <>
              <Podium top3={top3} />
              {resto.length > 0 && (
                <div className="gap-stack">
                  {resto.map(c => (
                    <RankingItem key={c.id} cliente={c} />
                  ))}
                </div>
              )}
              {ranking.length === 0 && (
                <div className="ranking-empty">
                  <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>👑</div>
                  <p style={{ fontWeight: 700 }}>Sin clientas registradas aún</p>
                </div>
              )}
            </>
          )}

          {/* TAB: Mis Clientas (equipo de la promotora) */}
          {tab === 'equipo' && (
            <>
              {miEquipo.length > 0 ? (
                <>
                  <Podium top3={miEquipo.slice(0, 3)} />
                  {miEquipo.length > 3 && (
                    <div className="gap-stack">
                      {miEquipo.slice(3).map(c => (
                        <RankingItem key={c.id} cliente={c} />
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="ranking-empty">
                  <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📝</div>
                  <p style={{ fontWeight: 700 }}>Aún no has registrado clientas</p>
                  <p style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>Las clientas que registres aparecerán aquí</p>
                </div>
              )}
            </>
          )}

          {/* TAB: Alertas WhatsApp */}
          {tab === 'alertas' && (
            <>
              {/* Alertas pendientes (ya creadas) */}
              {alertas.length > 0 && (
                <div>
                  <h3 style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Bell size={14} /> Pendientes de enviar ({alertas.length})
                  </h3>
                  <div className="gap-stack">
                    {alertas.map(a => (
                      <AlertaItem key={a.id} alerta={a} onEnviar={handleEnviarAlerta} />
                    ))}
                  </div>
                </div>
              )}

              {/* Próximas a alcanzar (sugerencias) */}
              {proximas.length > 0 && (
                <div>
                  <h3 style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Star size={14} /> Cerca de alcanzar descuento ({proximas.length})
                  </h3>
                  <div className="gap-stack">
                    {proximas.map((p, i) => (
                      <div key={`${p.id}-${p.descuento_id}-${i}`} className="whatsapp-alert-card" style={{ borderColor: 'var(--gold)' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                              {p.nombre_completo}
                            </div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
                              Acumula <strong style={{ color: 'var(--pink-strong)' }}>{fmt(p.monto_acumulado)}</strong> — Necesita <strong style={{ color: '#e53e3e' }}>{fmt(p.monto_minimo_requerido)}</strong>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                              <span className="alert-proximity">
                                ⚡ Le faltan {fmt(p.monto_faltante)}
                              </span>
                              <span className="alert-proximity" style={{ background: 'linear-gradient(135deg, #DCFCE7, #86EFAC)', color: '#166534', borderColor: '#22C55E' }}>
                                🎁 {p.porcentaje}% OFF
                              </span>
                            </div>
                          </div>
                          {p.celular && (
                            <button
                              className="btn-whatsapp"
                              onClick={() => {
                                const cell = p.celular?.replace(/\D/g, '');
                                if (!cell) return;
                                const msg = encodeURIComponent(
                                  `¡Hola ${p.nombre_completo}! 🌟\nDe la tienda Queen Style te informamos que estás a solo ${fmt(p.monto_faltante)} de alcanzar tu descuento de ${p.porcentaje}% OFF.\n¡No dejes pasar esta oportunidad! 💖`
                                );
                                window.open(`https://wa.me/${cell}?text=${msg}`, '_blank');
                              }}
                            >
                              <MessageCircle size={14} /> WhatsApp
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Empty state */}
              {alertas.length === 0 && proximas.length === 0 && (
                <div className="ranking-empty">
                  <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🔔</div>
                  <p style={{ fontWeight: 700 }}>Sin alertas pendientes</p>
                  <p style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>Las clientas cercanas a sus descuentos aparecerán aquí</p>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* Modal info coronas */}
      {showInfo && <CoronasInfoModal onClose={() => setShowInfo(false)} />}
    </div>
  );
}
