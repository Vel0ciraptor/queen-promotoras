import { AlertCircle } from 'lucide-react';

const CORONAS = [
  { nombre: 'Platinum Rosa', monto: 10000, color: '#E5E4E2', textColor: '#5A3050', border: '#FFB6C1', icono: '💎' },
  { nombre: 'Oro Rosa', monto: 7500, color: '#F4C95D', textColor: '#5A3000', border: '#FF6FA5', icono: '👑' },
  { nombre: 'Plata Rosa', monto: 5000, color: '#D4A0B0', textColor: '#4A3040', border: '#C0C0C0', icono: '👑' },
  { nombre: 'Bronce Rosa', monto: 3500, color: '#CD7F6B', textColor: '#fff', border: '#E8967E', icono: '👑' },
  { nombre: 'Rosa Intensa', monto: 2000, color: '#FF3D8F', textColor: '#fff', border: '#e0007b', icono: '👑' },
  { nombre: 'Rosa Vibrante', monto: 1000, color: '#FF6FA5', textColor: '#fff', border: '#FF3D8F', icono: '👑' },
  { nombre: 'Rosa Suave', monto: 500, color: '#FFD1E3', textColor: '#7A0033', border: '#FF6FA5', icono: '👑' },
];

function getCorona(monto) {
  const m = parseFloat(monto) || 0;
  for (const c of CORONAS) {
    if (m >= c.monto) return c;
  }
  return null;
}

export default function ClientCard({ cliente, onClick, onCompletar }) {
  const initials = cliente.nombre_completo
    .split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const tieneDescuento = parseInt(cliente.descuentos_activos) > 0;
  const tieneInfoFaltante = !cliente.carnet_identidad || !cliente.celular;
  const corona = getCorona(cliente.monto_acumulado);

  let descuentosInfo = [];
  try {
    descuentosInfo = typeof cliente.descuentos_info === 'string'
      ? JSON.parse(cliente.descuentos_info)
      : (cliente.descuentos_info || []);
  } catch { descuentosInfo = []; }

  return (
    <button
      className={`client-card ${tieneDescuento ? 'gold-glow' : ''} ${tieneInfoFaltante ? 'needs-info' : ''}`}
      onClick={onClick}
      style={{ width: '100%', textAlign: 'left', border: 'none', cursor: 'pointer' }}
      id={`cliente-card-${cliente.id}`}
    >
      {/* Avatar con corona encima */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        {corona && (
          <span style={{
            position: 'absolute', top: '-6px', left: '-4px', zIndex: 2,
            fontSize: '1.1rem', lineHeight: 1, filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.25))'
          }}>
            {corona.icono}
          </span>
        )}
        <div
          className="client-avatar"
          style={corona ? {
            background: `linear-gradient(135deg, ${corona.color}, ${corona.border})`,
            color: corona.textColor,
            border: `2px solid ${corona.border}`
          } : {}}
        >
          {initials}
        </div>
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Nombre + badges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 800, fontSize: '0.97rem', color: 'var(--text-primary)', truncate: true }}>
            {cliente.nombre_completo}
          </span>
          {corona && (
            <span style={{
              fontSize: '0.62rem', fontWeight: 800, padding: '0.12rem 0.4rem',
              borderRadius: '99px', background: corona.color, color: corona.textColor,
              border: `1px solid ${corona.border}`, whiteSpace: 'nowrap'
            }}>
              {corona.nombre}
            </span>
          )}
          {tieneInfoFaltante && (
            <span
              className="badge badge-warning"
              style={{
                background: '#FEF3C7', color: '#92400E',
                padding: '0.12rem 0.35rem', borderRadius: '0.75rem',
                fontSize: '0.6rem', fontWeight: 700,
                display: 'flex', alignItems: 'center', gap: '0.15rem', cursor: 'pointer'
              }}
              onClick={e => { e.stopPropagation(); onCompletar?.(cliente); }}
            >
              <AlertCircle size={9} /> Info
            </span>
          )}
        </div>

        {/* Descuentos visibles */}
        {tieneDescuento && descuentosInfo.length > 0 && (
          <div style={{ display: 'flex', gap: '0.3rem', marginTop: '0.25rem', flexWrap: 'wrap' }}>
            {descuentosInfo.map((d, i) => (
              <span key={i} style={{
                fontSize: '0.65rem', fontWeight: 800, padding: '0.15rem 0.45rem',
                borderRadius: '99px', background: 'linear-gradient(135deg, #FFF3C4, #FFE08A)',
                color: '#7A5200', border: '1px solid #F4C95D', whiteSpace: 'nowrap',
                display: 'inline-flex', alignItems: 'center', gap: '0.2rem'
              }}>
                🎁 {d.porcentaje}% OFF
              </span>
            ))}
          </div>
        )}

        {/* Datos */}
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.25rem', fontSize: '0.78rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
          {cliente.carnet_identidad ? (
            <span>🪪 {cliente.carnet_identidad}</span>
          ) : (
            <span style={{ color: '#D97706', fontStyle: 'italic' }}>🪪 Sin CI</span>
          )}
          <span>🛍️ {cliente.visitas_totales}</span>
          {cliente.celular ? (
            <span>📱 {cliente.celular}</span>
          ) : (
            <span style={{ color: '#D97706', fontStyle: 'italic' }}>📱 Sin cel</span>
          )}
        </div>
      </div>

      <span style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>›</span>
    </button>
  );
}
