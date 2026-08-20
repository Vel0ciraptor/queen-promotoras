import { useState, useEffect, useCallback } from 'react';
import api from '../lib/api';
import { Users, Bell, MessageCircle, Trophy, Star } from 'lucide-react';

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
      {/* Tabs */}
      <div className="ranking-tabs">
        <button
          className={`ranking-tab ${tab === 'top' ? 'active' : ''}`}
          onClick={() => setTab('top')}
        >
          <Trophy size={14} /> Top Clientas
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
    </div>
  );
}
