import { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import api from '../../lib/api';

const fmt = n => new Intl.NumberFormat('es-BO', { style: 'currency', currency: 'BOB', minimumFractionDigits: 0 }).format(n || 0);

const STATS = [
  { key: 'total_clientes',        label: 'Clientas', icon: '👥', color: '#FF3D8F' },
  { key: 'monto_total_fidelizado', label: 'Fidelizado total', icon: '💎', color: '#e0007b', money: true },
  { key: 'ingresos_del_mes',       label: 'Ingresos del mes', icon: '📈', color: '#F4C95D', money: true },
  { key: 'promotoras_activas',     label: 'Promotoras activas', icon: '⭐', color: '#FF6FA5' },
];

export default function AdminDashboard() {
  const [resumen, setResumen] = useState(null);
  const [ingresosTiempo, setIngresosTiempo] = useState([]);
  const [fidTiempo, setFidTiempo] = useState([]);
  const [porPromotora, setPorPromotora] = useState([]);
  const [loading, setLoading] = useState(true);

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
  }, []);

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
              <Tooltip formatter={v => [fmt(v), 'Ingresos']} contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '0.75rem' }} />
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
              <Tooltip formatter={v => [v, 'Clientas']} contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '0.75rem' }} />
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
