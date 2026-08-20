import { Crown, AlertCircle } from 'lucide-react';

const CORONAS = [
  { nombre: 'Platinum Rosa', monto: 10000, clase: 'crown-7', icono: '💎' },
  { nombre: 'Oro Rosa', monto: 7500, clase: 'crown-6', icono: '👑' },
  { nombre: 'Plata Rosa', monto: 5000, clase: 'crown-5', icono: '👑' },
  { nombre: 'Bronce Rosa', monto: 3500, clase: 'crown-4', icono: '👑' },
  { nombre: 'Rosa Intensa', monto: 2000, clase: 'crown-3', icono: '👑' },
  { nombre: 'Rosa Vibrante', monto: 1000, clase: 'crown-2', icono: '👑' },
  { nombre: 'Rosa Suave', monto: 500, clase: 'crown-1', icono: '👑' },
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

  return (
    <button
      className={`client-card ${tieneDescuento ? 'gold-glow' : ''} ${tieneInfoFaltante ? 'needs-info' : ''}`}
      onClick={onClick}
      style={{ width: '100%', textAlign: 'left', border: 'none', cursor: 'pointer' }}
      id={`cliente-card-${cliente.id}`}
    >
      <div className="client-avatar">{initials}</div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 800, fontSize: '0.97rem', color: 'var(--text-primary)', truncate: true }}>
            {cliente.nombre_completo}
          </span>
          {corona && (
            <span className={`crown-badge ${corona.clase}`}>
              {corona.icono} {corona.nombre}
            </span>
          )}
          {tieneDescuento && (
            <span className="badge badge-gold" style={{ animation: 'pulse-gold 2s ease infinite' }}>
              <Crown size={10} /> {cliente.descuentos_activos > 1 ? `${cliente.descuentos_activos} descuentos` : 'Descuento'}
            </span>
          )}
          {tieneInfoFaltante && (
            <span
              className="badge badge-warning"
              style={{
                background: '#FEF3C7',
                color: '#92400E',
                padding: '0.15rem 0.4rem',
                borderRadius: '0.75rem',
                fontSize: '0.65rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '0.2rem'
              }}
              onClick={e => {
                e.stopPropagation();
                onCompletar?.(cliente);
              }}
            >
              <AlertCircle size={10} /> Info faltante
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '1rem', marginTop: '0.3rem', fontSize: '0.82rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
          {cliente.carnet_identidad ? (
            <span>🪪 {cliente.carnet_identidad}</span>
          ) : (
            <span style={{ color: '#D97706', fontStyle: 'italic' }}>🪪 Sin CI</span>
          )}
          <span>🛍️ {cliente.visitas_totales} visita{cliente.visitas_totales !== 1 ? 's' : ''}</span>
          {cliente.celular ? (
            <span>📱 {cliente.celular}</span>
          ) : (
            <span style={{ color: '#D97706', fontStyle: 'italic' }}>📱 Sin celular</span>
          )}
        </div>
      </div>

      <span style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>›</span>
    </button>
  );
}
