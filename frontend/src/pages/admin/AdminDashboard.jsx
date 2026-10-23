import { useState, useEffect, useRef } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../../lib/api';

const fmt = n => new Intl.NumberFormat('es-BO', { style: 'currency', currency: 'BOB', minimumFractionDigits: 0 }).format(n || 0);
const num = n => new Intl.NumberFormat('es-BO').format(parseInt(n) || 0);
const fmtFecha = d => (d ? new Date(d).toLocaleDateString('es-BO', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');

const tooltipStyle = { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '0.75rem' };

const STATS = [
  { key: 'total_clientes',        label: 'Clientas', icon: '👥', color: '#FF3D8F' },
  { key: 'monto_total_fidelizado', label: 'Fidelizado total', icon: '💎', color: '#e0007b', money: true },
  { key: 'ingresos_del_mes',       label: 'Ingresos del mes', icon: '📈', color: '#F4C95D', money: true },
  { key: 'promotoras_activas',     label: 'Promotoras activas', icon: '⭐', color: '#FF6FA5' },
];

const VENTAS_KPI = [
  { key: 'hoy',             label: 'Ventas hoy',       icon: '🔥', color: '#FF3D8F' },
  { key: 'semana',          label: 'Últimos 7 días',   icon: '📅', color: '#FF6FA5' },
  { key: 'mes',             label: 'Este mes',         icon: '💰', color: '#e0007b' },
  { key: 'anio',            label: 'Este año',         icon: '🏆', color: '#F4C95D' },
  { key: 'ticket_promedio', label: 'Ticket promedio',  icon: '🧾', color: '#7C3AED' },
];

const PERIODOS = [
  { key: 'dia',  label: 'Diario' },
  { key: 'mes',  label: 'Mensual' },
  { key: 'anio', label: 'Anual' },
];

// Las APIs devuelven SUM/COUNT como string (numeric de pg): convertir a número
const toNumber = (row, campos) => ({
  ...row,
  ...Object.fromEntries(campos.map(c => [c, typeof row[c] === 'string' ? parseFloat(row[c]) || 0 : row[c]]))
});

export default function AdminDashboard() {
  const [resumen, setResumen] = useState(null);
  const [ventas, setVentas] = useState(null);
  const [topClientes, setTopClientes] = useState([]);
  const [ingresosTiempo, setIngresosTiempo] = useState([]);
  const [fidTiempo, setFidTiempo] = useState([]);
  const [porPromotora, setPorPromotora] = useState([]);
  const [periodo, setPeriodo] = useState('mes');
  const [historial, setHistorial] = useState([]);
  const [histUnidad, setHistUnidad] = useState('mes');
  const [histLoading, setHistLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const carruselRef = useRef(null);

  useEffect(() => {
    Promise.all([
      api.get('/dashboard/resumen'),
      api.get('/dashboard/ingresos-tiempo?meses=6'),
      api.get('/dashboard/fidelizaciones-tiempo?meses=6'),
      api.get('/dashboard/por-promotora'),
    ]).then(([r, it, ft, pp]) => {
      setResumen(r.data);
      setIngresosTiempo(it.data.data);
      setFidTiempo(ft.data.data);
      setPorPromotora(pp.data.data);
    }).catch(() => {}).finally(() => setLoading(false));

    // KPIs de ventas y ranking de clientas (independientes para no tumbar el Resumen si fallan)
    Promise.all([
      api.get('/dashboard/ventas-resumen'),
      api.get('/dashboard/top-clientes?limit=10'),
    ]).then(([vr, tc]) => {
      setVentas(vr.data);
      setTopClientes((tc.data.data || []).map(c => toNumber(c, ['total', 'compras'])));
    }).catch(() => {});
  }, []);

  // Historial diario / mensual / anual según el periodo elegido
  useEffect(() => {
    let vivo = true;
    setHistLoading(true);
    api.get('/dashboard/ventas', { params: { periodo } })
      .then(({ data }) => {
        if (!vivo) return;
        setHistorial((data.data || []).map(d => toNumber(d, ['total', 'compras', 'clientas'])));
        setHistUnidad(data.unidad);
      })
      .catch(() => { if (vivo) setHistorial([]); })
      .finally(() => { if (vivo) setHistLoading(false); });
    return () => { vivo = false; };
  }, [periodo]);

  const moverCarrusel = dir => {
    const el = carruselRef.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.75, behavior: 'smooth' });
  };

  const maxHistorial = historial.reduce((m, h) => Math.max(m, h.total), 0);
  const serieCronologica = [...historial].reverse(); // la API responde del más reciente al más antiguo

  if (loading) return (
    <div className="gap-stack">
      {Array.from({length:4}).map((_,i) => <div key={i} className="skeleton" style={{height:100,borderRadius:'1.25rem'}}/>)}
    </div>
  );

  return (
    <div className="gap-stack" style={{ gap: '1.5rem' }}>
      <div>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 900 }}>Resumen 📊</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.25rem' }}>Vista general del negocio</p>
      </div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
        {STATS.map(s => (
          <div key={s.key} className="stat-card">
            <div className="stat-icon" style={{ background: s.color + '22' }}>
              <span>{s.icon}</span>
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 900, color: s.color }}>
              {resumen ? (s.money ? fmt(resumen[s.key]) : resumen[s.key]) : '—'}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem', fontWeight: 600 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Ventas: KPIs ─────────────────────────────────────── */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          <h3 style={{ fontWeight: 800 }}>🛍️ Ventas</h3>
          {ventas && ventas.variacion_mes !== null && ventas.variacion_mes !== undefined && (
            <span className={`badge ${ventas.variacion_mes >= 0 ? 'badge-green' : 'badge-red'}`}>
              {ventas.variacion_mes >= 0 ? '▲' : '▼'} {Math.abs(ventas.variacion_mes).toFixed(1)}% vs mes anterior
            </span>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.75rem' }}>
          {VENTAS_KPI.map(s => (
            <div key={s.key} style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: '1rem', padding: '0.85rem 1rem' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {s.icon} {s.label}
              </div>
              <div style={{ fontSize: '1.3rem', fontWeight: 900, color: s.color, marginTop: '0.3rem' }}>
                {ventas ? fmt(ventas[s.key]) : '—'}
              </div>
              {s.key === 'hoy' && ventas && (
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Ayer: {fmt(ventas.ayer)}</div>
              )}
              {s.key === 'ticket_promedio' && (
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>por compra (mes)</div>
              )}
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginTop: '0.9rem', fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>
          <span>🧾 {ventas ? num(ventas.compras_hoy) : '—'} compras hoy</span>
          <span>🧾 {ventas ? num(ventas.compras_mes) : '—'} compras este mes</span>
          <span>👥 {ventas ? num(ventas.clientas_mes) : '—'} clientas atendidas este mes</span>
          <span>📈 {ventas ? num(ventas.compras_anio) : '—'} compras en el año</span>
        </div>
      </div>

      {/* ── Clientas que más compran ─────────────────────────── */}
      <div className="card">
        <h3 style={{ fontWeight: 800, marginBottom: '0.35rem' }}>🏆 Clientas que más compran</h3>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
          Ordenado por monto total comprado, de mayor a menor
        </p>

        {topClientes.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem', fontSize: '0.9rem' }}>Sin compras registradas aún</p>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={Math.max(180, topClientes.length * 34)}>
              <BarChart data={topClientes} layout="vertical" margin={{ top: 5, right: 15, left: 5, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="nombre_completo"
                  width={115}
                  interval={0}
                  tick={{ fontSize: 11, fill: 'var(--text-muted)' }}
                  tickFormatter={v => (v && v.length > 16 ? `${v.slice(0, 15)}…` : v)}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(255,61,143,0.06)' }}
                  contentStyle={tooltipStyle}
                  formatter={(v, name, item) => [fmt(v), item?.payload?.compras !== undefined ? `${num(item.payload.compras)} compras` : 'Total']}
                />
                <Bar dataKey="total" fill="#FF3D8F" radius={[0, 6, 6, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>

            <div className="gap-stack" style={{ marginTop: '1rem' }}>
              {topClientes.map((c, i) => (
                <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.55rem 0', borderBottom: i < topClientes.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.75rem', fontWeight: 900,
                    background: i < 3 ? 'linear-gradient(135deg,#FFF3C4,#FFE08A)' : 'var(--surface2)',
                    color: i < 3 ? '#7A5200' : 'var(--text-muted)'
                  }}>
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {c.nombre_completo}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      {num(c.compras)} compras · última: {fmtFecha(c.ultima_compra)}
                    </div>
                  </div>
                  <div style={{ fontWeight: 900, color: 'var(--pink-strong)', fontSize: '0.95rem', whiteSpace: 'nowrap' }}>
                    {fmt(c.total)}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── Historial de ventas: diario / mensual / anual ────── */}
      <div className="card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          <h3 style={{ fontWeight: 800 }}>📅 Historial de ventas</h3>
          <div style={{ display: 'flex', background: 'var(--surface2)', borderRadius: '0.75rem', padding: '0.2rem', gap: '0.2rem' }}>
            {PERIODOS.map(p => (
              <button
                key={p.key}
                onClick={() => setPeriodo(p.key)}
                data-periodo={p.key}
                style={{
                  padding: '0.4rem 0.8rem', borderRadius: '0.6rem', border: 'none', cursor: 'pointer',
                  fontFamily: 'inherit', fontWeight: 700, fontSize: '0.8rem',
                  background: periodo === p.key ? 'var(--surface)' : 'transparent',
                  color: periodo === p.key ? 'var(--pink-strong)' : 'var(--text-muted)',
                  boxShadow: periodo === p.key ? 'var(--shadow)' : 'none',
                  transition: 'all 0.2s'
                }}>
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {historial.length === 0 && !histLoading ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem', fontSize: '0.9rem' }}>Sin ventas registradas</p>
        ) : (
          <>
            {/* Gráfica del periodo elegido */}
            <div style={{ opacity: histLoading ? 0.5 : 1, transition: 'opacity 0.2s' }}>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={serieCronologica} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="label" interval="preserveStartEnd" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                  <YAxis
                    tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
                    width={42}
                    tickFormatter={v => (Math.abs(v) >= 1000 ? `${Math.round(v / 1000)}k` : v)}
                  />
                  <Tooltip formatter={v => [fmt(v), 'Ventas']} contentStyle={tooltipStyle} />
                  <Bar dataKey="total" fill="#FF6FA5" radius={[5, 5, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Carrusel de periodos */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginTop: '1rem' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                Desliza para ver cada {histUnidad}
              </span>
              <div style={{ display: 'flex', gap: '0.35rem' }}>
                <button className="btn btn-ghost btn-icon" onClick={() => moverCarrusel(-1)} title="Anterior" style={{ minHeight: 'unset', padding: '0.4rem' }}>
                  <ChevronLeft size={16} />
                </button>
                <button className="btn btn-ghost btn-icon" onClick={() => moverCarrusel(1)} title="Siguiente" style={{ minHeight: 'unset', padding: '0.4rem' }}>
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>

            <div ref={carruselRef} className="carrusel-scroll" style={{ marginTop: '0.6rem', opacity: histLoading ? 0.5 : 1, transition: 'opacity 0.2s' }}>
              {historial.map(h => (
                <div key={h.key} style={{
                  background: 'var(--surface2)', border: '1px solid var(--border)',
                  borderRadius: '1rem', padding: '0.9rem 1rem', minWidth: 0
                }}>
                  <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {h.label}
                  </div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 900, color: h.total > 0 ? 'var(--pink-strong)' : 'var(--text-muted)', marginTop: '0.3rem' }}>
                    {fmt(h.total)}
                  </div>
                  <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '0.35rem', fontWeight: 600 }}>
                    <span>🧾 {num(h.compras)} compras</span>
                    <span>👥 {num(h.clientas)} clientas</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 99, background: 'var(--border)', marginTop: '0.65rem', overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', borderRadius: 99,
                      width: `${maxHistorial > 0 ? Math.max((h.total / maxHistorial) * 100, h.total > 0 ? 3 : 0) : 0}%`,
                      background: 'linear-gradient(90deg, #FF6FA5, #FF3D8F)'
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Ingresos en el tiempo */}
      <div className="card">
        <h3 style={{ fontWeight: 800, marginBottom: '1.25rem' }}>💰 Ingresos últimos 6 meses</h3>
        {ingresosTiempo.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem', fontSize: '0.9rem' }}>Sin datos aún</p>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={ingresosTiempo} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="mes" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} tickFormatter={v => `${v}`} />
              <Tooltip formatter={v => [fmt(v), 'Ingresos']} contentStyle={tooltipStyle} />
              <Line type="monotone" dataKey="total" stroke="#FF3D8F" strokeWidth={3} dot={{ fill: '#FF3D8F', strokeWidth: 2, r: 5 }} activeDot={{ r: 7 }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Fidelizaciones */}
      <div className="card">
        <h3 style={{ fontWeight: 800, marginBottom: '1.25rem' }}>👥 Nuevas clientas por mes</h3>
        {fidTiempo.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem', fontSize: '0.9rem' }}>Sin datos aún</p>
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={fidTiempo} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="mes" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} allowDecimals={false} />
              <Tooltip formatter={v => [v, 'Clientas']} contentStyle={tooltipStyle} />
              <Bar dataKey="total" fill="#FF6FA5" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Por promotora */}
      {porPromotora.length > 0 && (
        <div className="card">
          <h3 style={{ fontWeight: 800, marginBottom: '1rem' }}>⭐ Actividad por promotora</h3>
          <div className="gap-stack">
            {porPromotora.map((p, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.625rem 0', borderBottom: '1px solid var(--border)' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{p.nombre}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{p.clientes_registrados} clientas registradas</div>
                </div>
                <div style={{ fontWeight: 800, color: 'var(--pink-strong)', fontSize: '0.95rem' }}>{fmt(p.monto_total)}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
