import { useState, useEffect } from 'react';
import { Plus, X, Trash2, Pencil } from 'lucide-react';
import api from '../../lib/api';
import { useToast } from '../../context/ToastContext';

const fmt = n => new Intl.NumberFormat('es-BO', { style: 'currency', currency: 'BOB', minimumFractionDigits: 0 }).format(n || 0);
const fmtDate = d => d ? new Date(d).toLocaleDateString('es-BO', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

function DescuentoModal({ onClose, onGuardado }) {
  const toast = useToast();
  const [form, setForm] = useState({
    nombre: '', porcentaje: '', monto_minimo_requerido: '',
    vigencia_valor: '', vigencia_unidad: 'meses',
    duracion_activo_valor: '', duracion_activo_unidad: 'dias',
    alerta_distancia: '', alertas_activas: true
  });
  const [loading, setLoading] = useState(false);
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/descuentos', form);
      onGuardado(data.descuento);
      toast.success('Descuento creado ✨');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error');
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-sheet">
        <div className="modal-handle"/>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1.25rem' }}>
          <h2 style={{ color:'var(--pink-strong)', fontSize:'1.2rem' }}>✨ Nuevo descuento</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose} style={{ minHeight:'unset' }}><X size={18}/></button>
        </div>
        <form onSubmit={handleSubmit} className="gap-stack">
          <div className="form-group">
            <label className="form-label">Nombre del descuento</label>
            <input className="input" placeholder="Ej: 15% por fidelidad" value={form.nombre} onChange={set('nombre')} required />
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem' }}>
            <div className="form-group">
              <label className="form-label">Porcentaje (%)</label>
              <input className="input" type="number" min="1" max="100" step="0.01" placeholder="15" value={form.porcentaje} onChange={set('porcentaje')} required />
            </div>
            <div className="form-group">
              <label className="form-label">Monto mínimo (Bs.)</label>
              <input className="input" type="number" min="0" step="0.01" placeholder="500" value={form.monto_minimo_requerido} onChange={set('monto_minimo_requerido')} required />
            </div>
          </div>
          <div>
            <label className="form-label" style={{ marginBottom:'0.375rem', display:'block' }}>Vigencia del descuento (para el cliente)</label>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem' }}>
              <input className="input" type="number" min="1" placeholder="3" value={form.vigencia_valor} onChange={set('vigencia_valor')} required />
              <select className="input" value={form.vigencia_unidad} onChange={set('vigencia_unidad')}>
                <option value="meses">Meses</option>
                <option value="años">Años</option>
              </select>
            </div>
          </div>
          <div>
            <label className="form-label" style={{ marginBottom:'0.375rem', display:'block' }}>Duración activo (auto-desaparece después de)</label>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem' }}>
              <input className="input" type="number" min="1" placeholder="30" value={form.duracion_activo_valor} onChange={set('duracion_activo_valor')} required />
              <select className="input" value={form.duracion_activo_unidad} onChange={set('duracion_activo_unidad')}>
                <option value="dias">Días</option>
                <option value="meses">Meses</option>
              </select>
            </div>
          </div>

          {/* Configuración de alertas */}
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <label className="form-label" style={{ marginBottom: 0 }}>🔔 Alertas a promotoras</label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={form.alertas_activas}
                  onChange={e => setForm(f => ({ ...f, alertas_activas: e.target.checked }))}
                  style={{ width: 16, height: 16, accentColor: 'var(--pink-strong)' }}
                />
                <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                  {form.alertas_activas ? 'Activas' : 'Inactivas'}
                </span>
              </label>
            </div>
            {form.alertas_activas && (
              <div className="form-group">
                <label className="form-label">Distancia de alerta (Bs.)</label>
                <input
                  className="input"
                  type="number"
                  min="1"
                  step="0.01"
                  placeholder="Ej: 100 (alertar cuando falten 100 Bs.)"
                  value={form.alerta_distancia}
                  onChange={set('alerta_distancia')}
                />
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  La promotora recibirá una alerta cuando una clienta esté a esta distancia de alcanzar el descuento
                </span>
              </div>
            )}
          </div>

          <div style={{ display:'flex', gap:'0.75rem', marginTop:'0.25rem' }}>
            <button type="button" className="btn btn-ghost" style={{ flex:1 }} onClick={onClose}>Cancelar</button>
            <button id="btn-crear-descuento" type="submit" className="btn btn-primary" style={{ flex:2 }} disabled={loading}>
              {loading ? '⏳ Guardando...' : '✨ Crear descuento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditarDescuentoModal({ descuento, onClose, onGuardado }) {
  const toast = useToast();
  const [form, setForm] = useState({
    nombre: descuento.nombre || '',
    porcentaje: descuento.porcentaje || '',
    monto_minimo_requerido: descuento.monto_minimo_requerido || '',
    vigencia_valor: descuento.vigencia_valor || '',
    vigencia_unidad: descuento.vigencia_unidad || 'meses',
    duracion_activo_valor: descuento.duracion_activo_valor || '',
    duracion_activo_unidad: descuento.duracion_activo_unidad || 'dias',
    alerta_distancia: descuento.alerta_distancia || '',
    alertas_activas: descuento.alertas_activas !== false,
  });
  const [loading, setLoading] = useState(false);
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.put(`/descuentos/${descuento.id}`, form);
      onGuardado(data.descuento);
      toast.success('Descuento actualizado ✨');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error');
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-sheet">
        <div className="modal-handle"/>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1.25rem' }}>
          <h2 style={{ color:'var(--pink-strong)', fontSize:'1.2rem' }}>✏️ Editar descuento</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose} style={{ minHeight:'unset' }}><X size={18}/></button>
        </div>
        <form onSubmit={handleSubmit} className="gap-stack">
          <div className="form-group">
            <label className="form-label">Nombre del descuento</label>
            <input className="input" placeholder="Ej: 15% por fidelidad" value={form.nombre} onChange={set('nombre')} required />
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem' }}>
            <div className="form-group">
              <label className="form-label">Porcentaje (%)</label>
              <input className="input" type="number" min="1" max="100" step="0.01" placeholder="15" value={form.porcentaje} onChange={set('porcentaje')} required />
            </div>
            <div className="form-group">
              <label className="form-label">Monto mínimo (Bs.)</label>
              <input className="input" type="number" min="0" step="0.01" placeholder="500" value={form.monto_minimo_requerido} onChange={set('monto_minimo_requerido')} required />
            </div>
          </div>
          <div>
            <label className="form-label" style={{ marginBottom:'0.375rem', display:'block' }}>Vigencia del descuento</label>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem' }}>
              <input className="input" type="number" min="1" placeholder="3" value={form.vigencia_valor} onChange={set('vigencia_valor')} required />
              <select className="input" value={form.vigencia_unidad} onChange={set('vigencia_unidad')}>
                <option value="meses">Meses</option>
                <option value="años">Años</option>
              </select>
            </div>
          </div>
          <div>
            <label className="form-label" style={{ marginBottom:'0.375rem', display:'block' }}>Duración activo</label>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem' }}>
              <input className="input" type="number" min="1" placeholder="30" value={form.duracion_activo_valor} onChange={set('duracion_activo_valor')} required />
              <select className="input" value={form.duracion_activo_unidad} onChange={set('duracion_activo_unidad')}>
                <option value="dias">Días</option>
                <option value="meses">Meses</option>
              </select>
            </div>
          </div>

          {/* Configuración de alertas */}
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
              <label className="form-label" style={{ marginBottom: 0 }}>🔔 Alertas a promotoras</label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={form.alertas_activas}
                  onChange={e => setForm(f => ({ ...f, alertas_activas: e.target.checked }))}
                  style={{ width: 16, height: 16, accentColor: 'var(--pink-strong)' }}
                />
                <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                  {form.alertas_activas ? 'Activas' : 'Inactivas'}
                </span>
              </label>
            </div>
            {form.alertas_activas && (
              <div className="form-group">
                <label className="form-label">Distancia de alerta (Bs.)</label>
                <input
                  className="input"
                  type="number"
                  min="1"
                  step="0.01"
                  placeholder="Ej: 100 (alertar cuando falten 100 Bs.)"
                  value={form.alerta_distancia}
                  onChange={set('alerta_distancia')}
                />
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  La promotora recibirá una alerta cuando una clienta esté a esta distancia de alcanzar el descuento
                </span>
              </div>
            )}
          </div>

          <div style={{ display:'flex', gap:'0.75rem', marginTop:'0.25rem' }}>
            <button type="button" className="btn btn-ghost" style={{ flex:1 }} onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary" style={{ flex:2 }} disabled={loading}>
              {loading ? '⏳ Guardando...' : '💾 Guardar cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminDescuentos() {
  const toast = useToast();
  const [descuentos, setDescuentos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState(null);

  useEffect(() => {
    api.get('/descuentos').then(({ data }) => setDescuentos(data.descuentos)).catch(() => toast.error('Error')).finally(() => setLoading(false));
  }, []);

  const handleGuardado = d => { setDescuentos(prev => [d, ...prev]); setShowModal(false); };

  const handleEditado = d => { setDescuentos(prev => prev.map(x => x.id === d.id ? d : x)); setEditando(null); };

  const handleToggle = async d => {
    try {
      const { data } = await api.put(`/descuentos/${d.id}`, { activo: !d.activo });
      setDescuentos(prev => prev.map(x => x.id === d.id ? data.descuento : x));
    } catch { toast.error('Error'); }
  };

  const handleDelete = async id => {
    if (!window.confirm('¿Eliminar este descuento?')) return;
    try {
      await api.delete(`/descuentos/${id}`);
      setDescuentos(prev => prev.filter(d => d.id !== id));
      toast.success('Descuento eliminado');
    } catch { toast.error('Error'); }
  };

  const activos = descuentos.filter(d => d.activo);
  const expirados = descuentos.filter(d => !d.activo);

  return (
    <div className="gap-stack" style={{ gap:'1.25rem' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'0.75rem' }}>
        <h1 style={{ fontSize:'1.5rem', fontWeight:900 }}>Descuentos 🏷️</h1>
        <button id="btn-nuevo-descuento" className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={18}/> Nuevo
        </button>
      </div>

      {loading ? (
        Array.from({length:3}).map((_,i) => <div key={i} className="skeleton" style={{height:90,borderRadius:'1.25rem'}}/>)
      ) : (
        <>
          {activos.length > 0 && (
            <div>
              <h2 style={{ fontWeight:800, fontSize:'1rem', color:'var(--text-secondary)', marginBottom:'0.75rem' }}>✅ Activos ({activos.length})</h2>
              <div className="gap-stack">
                {activos.map(d => <DescuentoRow key={d.id} d={d} onToggle={handleToggle} onDelete={handleDelete} onEdit={setEditando} />)}
              </div>
            </div>
          )}
          {expirados.length > 0 && (
            <div>
              <h2 style={{ fontWeight:800, fontSize:'1rem', color:'var(--text-muted)', marginBottom:'0.75rem' }}>⏳ Expirados / Desactivados ({expirados.length})</h2>
              <div className="gap-stack">
                {expirados.map(d => <DescuentoRow key={d.id} d={d} onToggle={handleToggle} onDelete={handleDelete} onEdit={setEditando} />)}
              </div>
            </div>
          )}
          {descuentos.length === 0 && (
            <div style={{ textAlign:'center', padding:'3rem', color:'var(--text-muted)' }}>
              <div style={{ fontSize:'3rem', marginBottom:'0.75rem' }}>🏷️</div>
              <p style={{ fontWeight:700 }}>Sin descuentos aún</p>
              <p style={{ fontSize:'0.85rem' }}>Crea el primero con el botón de arriba</p>
            </div>
          )}
        </>
      )}

      {showModal && <DescuentoModal onClose={() => setShowModal(false)} onGuardado={handleGuardado} />}
      {editando && <EditarDescuentoModal descuento={editando} onClose={() => setEditando(null)} onGuardado={handleEditado} />}
    </div>
  );
}

function DescuentoRow({ d, onToggle, onDelete, onEdit }) {
  const fmt = n => new Intl.NumberFormat('es-BO', { style: 'currency', currency: 'BOB', minimumFractionDigits: 0 }).format(n || 0);
  return (
    <div className="card" style={{ opacity: d.activo ? 1 : 0.65 }}>
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:'0.75rem', flexWrap:'wrap' }}>
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', flexWrap:'wrap' }}>
            <span style={{ fontWeight:800, fontSize:'1rem' }}>{d.nombre}</span>
            <span className={`badge ${d.activo ? 'badge-green' : 'badge-gray'}`}>{d.activo ? 'Activo' : 'Inactivo'}</span>
            {d.alertas_activas && d.alerta_distancia > 0 && (
              <span className="badge" style={{ background: '#DBEAFE', color: '#1E40AF' }}>🔔 Alertas ON</span>
            )}
          </div>
          <div style={{ fontSize:'0.82rem', color:'var(--text-muted)', marginTop:'0.4rem', display:'flex', flexWrap:'wrap', gap:'0.75rem' }}>
            <span>🎁 {d.porcentaje}% OFF</span>
            <span>💰 Mín. {fmt(d.monto_minimo_requerido)}</span>
            <span>⏱️ Vigencia: {d.vigencia_valor} {d.vigencia_unidad}</span>
            <span>📅 Expira: {fmtDate(d.fecha_expiracion)}</span>
          </div>
          {d.alertas_activas && d.alerta_distancia > 0 && (
            <div style={{ fontSize:'0.75rem', color: '#3B82F6', marginTop:'0.3rem', fontWeight: 600 }}>
              🔔 Alerta a {fmt(d.alerta_distancia)} antes del descuento
            </div>
          )}
        </div>
        <div style={{ display:'flex', gap:'0.5rem', flexShrink:0 }}>
          <button
            className="btn btn-ghost btn-icon"
            style={{ minHeight:'unset', padding:'0.4rem', color:'var(--pink-strong)' }}
            onClick={() => onEdit(d)}
            title="Editar descuento"
            id={`btn-edit-descuento-${d.id}`}
          >
            <Pencil size={15}/>
          </button>
          <button
            className={`btn btn-ghost btn-icon`}
            style={{ minHeight:'unset', padding:'0.4rem', fontSize:'0.8rem' }}
            onClick={() => onToggle(d)}
            title={d.activo ? 'Desactivar' : 'Activar'}
            id={`btn-toggle-descuento-${d.id}`}
          >
            {d.activo ? '⏸' : '▶️'}
          </button>
          <button
            className="btn btn-ghost btn-icon"
            style={{ minHeight:'unset', padding:'0.4rem', color:'#e53e3e' }}
            onClick={() => onDelete(d.id)}
            title="Eliminar"
            id={`btn-delete-descuento-${d.id}`}
          >
            <Trash2 size={15}/>
          </button>
        </div>
      </div>
    </div>
  );
}


