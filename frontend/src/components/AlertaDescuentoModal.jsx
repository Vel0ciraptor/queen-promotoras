import { X, MessageCircle, Bell, Gift, Crown } from 'lucide-react';

const fmt = n => new Intl.NumberFormat('es-BO', { style: 'currency', currency: 'BOB', minimumFractionDigits: 0 }).format(n || 0);

export default function AlertaDescuentoModal({ alertas, cliente, onClose, onEnviar }) {
  if (!alertas || alertas.length === 0) return null;

  const celular = cliente?.celular?.replace(/\D/g, '');
  const tieneLogradas = alertas.some(a => a.tipo === 'lograda');

  const handleEnviarWhatsApp = (alerta) => {
    if (!celular) return;
    let mensaje;
    if (alerta.tipo === 'lograda') {
      mensaje = encodeURIComponent(
        `¡Felicidades ${cliente.nombre_completo}! 🎉👑\nDe la tienda Queen Style te informamos que ya alcanzaste tu descuento de ${alerta.porcentaje}% OFF por "${alerta.nombre_descuento}".\n¡Ven y disfrútalo! 💖`
      );
    } else {
      mensaje = encodeURIComponent(
        `¡Hola ${cliente.nombre_completo}! 🌟\nDe la tienda Queen Style te informamos que estás a solo ${fmt(alerta.monto_faltante)} de alcanzar tu descuento de ${alerta.porcentaje}% OFF.\n¡No dejes pasar esta oportunidad! 💖`
      );
    }
    window.open(`https://wa.me/${celular}?text=${mensaje}`, '_blank');
    if (onEnviar) onEnviar(alerta.id);
  };

  const handleEnviarTodas = () => {
    if (!celular) return;
    const lineas = alertas.map(a => {
      if (a.tipo === 'lograda') return `• 🎉 ${a.nombre_descuento}: ¡Ya lo alcanzaste! (${a.porcentaje}% OFF)`;
      return `• ${a.nombre_descuento}: le faltan ${fmt(a.monto_faltante)} para ${a.porcentaje}% OFF`;
    }).join('\n');
    const mensaje = encodeURIComponent(
      `¡Hola ${cliente.nombre_completo}! 🌟\nDe la tienda Queen Style:\n${lineas}\n¡Visítanos! 💖`
    );
    window.open(`https://wa.me/${celular}?text=${mensaje}`, '_blank');
    if (onEnviar) {
      alertas.forEach(a => onEnviar(a.id));
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-sheet">
        <div className="modal-handle" />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h2 style={{ color: tieneLogradas ? '#16A34A' : 'var(--pink-strong)', fontSize: '1.1rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            {tieneLogradas ? <><Crown size={18} /> ¡Felicitación!</> : <><Bell size={18} /> ¡Descuento cerca!</>}
          </h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose} style={{ minHeight: 'unset' }}>
            <X size={18} />
          </button>
        </div>

        {/* Info de la clienta */}
        <div style={{
          background: 'var(--surface2)', borderRadius: '1rem', padding: '0.875rem',
          marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem'
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
            background: tieneLogradas
              ? 'linear-gradient(135deg, #22C55E, #16A34A)'
              : 'linear-gradient(135deg, var(--pink-strong), var(--pink-medium))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 900, fontSize: '1rem'
          }}>
            {cliente?.nombre_completo?.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()}
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
              {cliente?.nombre_completo}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Acumula {fmt(cliente?.monto_acumulado)}
            </div>
          </div>
        </div>

        {/* Lista de alertas */}
        <div className="gap-stack" style={{ gap: '0.6rem', marginBottom: '1rem' }}>
          {alertas.map((a, i) => {
            const esLograda = a.tipo === 'lograda';
            return (
              <div key={i} style={{
                background: 'var(--surface)',
                border: esLograda ? '1.5px solid #22C55E' : '1.5px solid var(--gold)',
                borderRadius: '1rem', padding: '0.875rem', position: 'relative', overflow: 'hidden'
              }}>
                <div style={{
                  position: 'absolute', inset: 0,
                  background: esLograda
                    ? 'linear-gradient(135deg, rgba(34,197,94,0.06), transparent)'
                    : 'linear-gradient(135deg, rgba(244,201,93,0.06), transparent)',
                  pointerEvents: 'none'
                }} />
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.25rem' }}>
                      {esLograda
                        ? <Crown size={14} style={{ color: '#16A34A' }} />
                        : <Gift size={14} style={{ color: 'var(--gold)' }} />}
                      <span style={{ fontWeight: 800, fontSize: '0.88rem', color: 'var(--text-primary)' }}>
                        {a.nombre_descuento}
                      </span>
                    </div>
                    {esLograda ? (
                      <div style={{ fontSize: '0.78rem', color: '#16A34A', fontWeight: 600 }}>
                        🎉 ¡Alcanzó <strong>{a.porcentaje}% OFF</strong>!
                      </div>
                    ) : (
                      <>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          Le faltan <strong style={{ color: 'var(--pink-strong)' }}>{fmt(a.monto_faltante)}</strong> para <strong>{a.porcentaje}% OFF</strong>
                        </div>
                        <div className="alert-proximity" style={{ marginTop: '0.35rem', display: 'inline-flex' }}>
                          ⚡ Muy cerca del descuento
                        </div>
                      </>
                    )}
                  </div>
                  {celular && a.id && (
                    <button
                      className="btn-whatsapp"
                      onClick={() => handleEnviarWhatsApp(a)}
                      style={esLograda ? { background: '#22C55E', flexShrink: 0 } : { flexShrink: 0 }}
                    >
                      <MessageCircle size={14} /> {esLograda ? 'Felicitar' : 'Enviar'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Botones */}
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>
            Recordar después
          </button>
          {celular && alertas.length > 1 && (
            <button className="btn-whatsapp" style={{ flex: 2, padding: '0.75rem 1rem', fontSize: '0.88rem' }} onClick={handleEnviarTodas}>
              <MessageCircle size={16} /> Enviar todas por WhatsApp
            </button>
          )}
          {celular && alertas.length === 1 && (
            <button className="btn-whatsapp" style={{ flex: 2, padding: '0.75rem 1rem', fontSize: '0.88rem' }} onClick={() => handleEnviarWhatsApp(alertas[0])}>
              <MessageCircle size={16} /> {alertas[0].tipo === 'lograda' ? 'Felicitar por WhatsApp' : 'Enviar por WhatsApp'}
            </button>
          )}
          {!celular && (
            <div style={{ flex: 2, padding: '0.75rem 1rem', fontSize: '0.78rem', color: 'var(--text-muted)', textAlign: 'center', background: 'var(--surface2)', borderRadius: '0.75rem' }}>
              📱 Sin número registrado
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
