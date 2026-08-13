import { useState } from 'react';
import { X, Check, AlertCircle } from 'lucide-react';
import api from '../lib/api';
import { useToast } from '../context/ToastContext';

export default function CompletarInfoModal({ cliente, onClose, onGuardado }) {
  const toast = useToast();
  const [carnet_identidad, setCarnet] = useState('');
  const [celular, setCelular] = useState('');
  const [loading, setLoading] = useState(false);

  const hasCarnet = cliente.carnet_identidad && cliente.carnet_identidad.trim() !== '';
  const hasCelular = cliente.celular && cliente.celular.trim() !== '';

  const canSubmit = (!hasCarnet && carnet_identidad.trim()) || (!hasCelular && celular.trim());

  const handleSubmit = async e => {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    try {
      const payload = {};
      if (!hasCarnet && carnet_identidad.trim()) payload.carnet_identidad = carnet_identidad.trim();
      if (!hasCelular && celular.trim()) payload.celular = celular.trim();

      const { data } = await api.patch(`/clientes/${cliente.id}/completar`, payload);
      onGuardado(data.cliente);
      toast.success('Información completada');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al guardar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-sheet">
        <div className="modal-handle" />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <h2 style={{ color: 'var(--pink-strong)', fontSize: '1.2rem' }}>✏️ Completar información</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose} style={{ minHeight: 'unset' }}><X size={18} /></button>
        </div>

        <div style={{ background: '#DBEAFE', borderRadius: '0.875rem', padding: '0.75rem 1rem', marginBottom: '1rem', fontSize: '0.85rem', color: '#1E40AF', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <AlertCircle size={16} /> Solo puedes agregar información que esté vacía. No se permite editar datos existentes.
        </div>

        <p style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '1rem' }}>
          {cliente.nombre_completo}
        </p>

        <form onSubmit={handleSubmit} className="gap-stack">
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>CI (Carnet de Identidad)</span>
              {hasCarnet ? (
                <span style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 600 }}>✓ Ya registrado</span>
              ) : (
                <span style={{ fontSize: '0.75rem', color: '#D97706', fontWeight: 600 }}>Vacío</span>
              )}
            </label>
            <input
              className="input"
              value={hasCarnet ? cliente.carnet_identidad : carnet_identidad}
              onChange={e => setCarnet(e.target.value)}
              disabled={hasCarnet}
              placeholder={hasCarnet ? '' : 'Agregar CI...'}
              style={hasCarnet ? { background: 'var(--bg-secondary)', opacity: 0.7 } : {}}
            />
          </div>

          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>Celular</span>
              {hasCelular ? (
                <span style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 600 }}>✓ Ya registrado</span>
              ) : (
                <span style={{ fontSize: '0.75rem', color: '#D97706', fontWeight: 600 }}>Vacío</span>
              )}
            </label>
            <input
              className="input"
              value={hasCelular ? cliente.celular : celular}
              onChange={e => setCelular(e.target.value)}
              disabled={hasCelular}
              placeholder={hasCelular ? '' : 'Agregar celular...'}
              style={hasCelular ? { background: 'var(--bg-secondary)', opacity: 0.7 } : {}}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button type="button" className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>Cancelar</button>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ flex: 2 }}
              disabled={loading || !canSubmit}
            >
              {loading ? '⏳ Guardando...' : '💾 Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
