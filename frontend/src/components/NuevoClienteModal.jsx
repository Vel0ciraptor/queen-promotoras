import { useState } from 'react';
import { X } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import api from '../lib/api';
import { DEPARTAMENTOS, NACIONALIDADES, provinciasDe, OTRA_PROVINCIA } from '../lib/ubicaciones';

export default function NuevoClienteModal({ onClose, onCreado }) {
  const toast = useToast();
  const [form, setForm] = useState({
    nombre_completo: '', carnet_identidad: '', celular: '',
    nacionalidad: 'Boliviana', otroPais: '', departamento: '', provincia: '', otraProvincia: '', monto_inicial: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const set = key => e => setForm(f => ({ ...f, [key]: e.target.value }));

  // Al cambiar el departamento, la provincia vuelve a empezar
  const setDepartamento = e => setForm(f => ({ ...f, departamento: e.target.value, provincia: '', otraProvincia: '' }));

  const provincias = provinciasDe(form.departamento);
  const esOtraProvincia = form.provincia === OTRA_PROVINCIA;

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.nombre_completo.trim()) return toast.error('El nombre es requerido');
    setLoading(true);
    try {
      const { data } = await api.post('/clientes', {
        ...form,
        nacionalidad: form.nacionalidad === 'Otra'
          ? (form.otroPais.trim() || 'Otra')
          : form.nacionalidad,
        provincia: esOtraProvincia ? form.otraProvincia.trim() : form.provincia,
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
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="nc-nacionalidad">Nacionalidad</label>
                <select id="nc-nacionalidad" className="input" value={form.nacionalidad} onChange={set('nacionalidad')}>
                  {NACIONALIDADES.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="nc-departamento">Departamento</label>
                <select id="nc-departamento" className="input" value={form.departamento} onChange={setDepartamento}>
                  <option value="">Sin especificar</option>
                  {DEPARTAMENTOS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label" htmlFor="nc-provincia">Provincia / Localidad</label>
              <select id="nc-provincia" className="input" value={form.provincia} onChange={set('provincia')} disabled={!form.departamento}>
                <option value="">{form.departamento ? 'Sin especificar' : 'Elige un departamento primero'}</option>
                {provincias.map(p => <option key={p} value={p}>{p}</option>)}
                <option value={OTRA_PROVINCIA}>Otra localidad…</option>
              </select>
            </div>
            {esOtraProvincia && (
              <div className="form-group">
                <input className="input" placeholder="Escribe la localidad (ej: Villamontes, Puertas del Sur...)" maxLength={80} value={form.otraProvincia} onChange={set('otraProvincia')} />
              </div>
            )}
            {form.nacionalidad === 'Otra' && (
              <div className="form-group">
                <label className="form-label" htmlFor="nc-otro-pais">¿De qué país viene la compra? (opcional)</label>
                <input id="nc-otro-pais" className="input" placeholder="Ej: Uruguay, Alemania..." maxLength={30} value={form.otroPais} onChange={set('otroPais')} />
              </div>
            )}
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
