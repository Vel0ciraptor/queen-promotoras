import { Crown } from 'lucide-react';

export default function ClientCard({ cliente, onClick }) {
  const initials = cliente.nombre_completo
    .split(' ')
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const tieneDescuento = parseInt(cliente.descuentos_activos) > 0;

  const formatMonto = n => new Intl.NumberFormat('es-BO', { style: 'currency', currency: 'BOB', minimumFractionDigits: 0 }).format(n);

  return (
    <button
      className={`client-card ${tieneDescuento ? 'gold-glow' : ''}`}
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
          {tieneDescuento && (
            <span className="badge badge-gold" style={{ animation: 'pulse-gold 2s ease infinite' }}>
              <Crown size={10} /> {cliente.descuentos_activos > 1 ? `${cliente.descuentos_activos} descuentos` : 'Descuento'}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '1rem', marginTop: '0.3rem', fontSize: '0.82rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
          {cliente.carnet_identidad && <span>🪪 {cliente.carnet_identidad}</span>}
          <span>🛍️ {cliente.visitas_totales} visita{cliente.visitas_totales !== 1 ? 's' : ''}</span>
          {cliente.celular && <span>📱 {cliente.celular}</span>}
        </div>
      </div>

      <span style={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>›</span>
    </button>
  );
}
