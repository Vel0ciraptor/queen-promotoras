import { useState } from 'react';
import { X } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import api from '../lib/api';

export default function NuevoClienteModal({ onClose, onCreado }) {
  const toast = useToast();
  const [form, setForm] = useState({ nombre_completo: '', carnet_identidad: '', celular: '', monto_inicial: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const set = key => e => setForm(f => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.nombre_completo.trim()) return toast.error('El nombre es requerido');
    setLoading(true);
    try {
      const { data } = await api.post('/clientes', {
        ...form,
        monto_inicial: parseFloat(form.monto_inicial) || 0
      });
      setSuccess(true);
      setTimeout(() => onCreado(data.cliente, data.nuevas_notificaciones || []), 700);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al crear cliente');
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-sheet">
        <div className="modal-handle" />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <h2 style={{ color: 'var(--pink-strong)', fontSize: '1.25rem' }}>✨ Nueva clienta</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose} style={{ minHeight: 'unset' }}>
            <X size={18} />
          </button>
        </div>

        {success ? (
          <div style={{ textAlign: 'center', padding: '2rem 0' }}>
            <div className="animate-checkmark" style={{ fontSize: '4rem', display: 'block' }}>✅</div>
            <p style={{ fontWeight: 800, marginTop: '0.75rem', color: 'var(--pink-strong)' }}>¡Clienta registrada!</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="gap-stack">
            <div className="form-group">
              <label className="form-label" htmlFor="nc-nombre">Nombre completo *</label>
              <input id="nc-nombre" className="input" placeholder="María García" value={form.nombre_completo} onChange={set('nombre_completo')} required />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="nc-ci">Carnet de Identidad</label>
              <input id="nc-ci" className="input" placeholder="12345678" value={form.carnet_identidad} onChange={set('carnet_identidad')} />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="nc-celular">Celular</label>
              <input id="nc-celular" className="input" type="tel" placeholder="70000000" value={form.celular} onChange={set('celular')} />
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="nc-monto">Monto inicial (Bs.)</label>
              <input id="nc-monto" className="input" type="number" min="0" step="0.01" placeholder="0" value={form.monto_inicial} onChange={set('monto_inicial')} />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>Cancelar</button>
              <button id="btn-crear-cliente" type="submit" className="btn btn-primary" style={{ flex: 2 }} disabled={loading}>
                {loading ? '⏳ Guardando...' : '✨ Registrar'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
