import { useState, useEffect, useCallback } from 'react';
import { Search, Edit2, Upload, X, Trash2, DollarSign } from 'lucide-react';
import api from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import ImportarExcelModal from '../../components/ImportarExcelModal';

const fmt = n => new Intl.NumberFormat('es-BO', { style: 'currency', currency: 'BOB', minimumFractionDigits: 0 }).format(n || 0);
const fmtDate = d => new Date(d).toLocaleDateString('es-BO', { day: '2-digit', month: 'short', year: 'numeric' });

function EditarClienteModal({ cliente, onClose, onGuardado }) {
  const toast = useToast();
  const [form, setForm] = useState({ nombre_completo: cliente.nombre_completo, carnet_identidad: cliente.carnet_identidad || '', celular: cliente.celular || '', comentario: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.comentario.trim()) return toast.error('El comentario es obligatorio');
    setLoading(true);
    try {
      const { data } = await api.put(`/clientes/${cliente.id}`, form);
      onGuardado(data.cliente);
      toast.success('Cliente actualizada');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al guardar');
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-sheet">
        <div className="modal-handle"/>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1.25rem' }}>
          <h2 style={{ color:'var(--pink-strong)', fontSize:'1.2rem' }}>✏️ Editar clienta</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose} style={{ minHeight:'unset' }}><X size={18}/></button>
        </div>

        <div style={{ background:'#FEF3C7', borderRadius:'0.875rem', padding:'0.75rem 1rem', marginBottom:'1rem', fontSize:'0.85rem', color:'#92400E', fontWeight:600 }}>
          ⚠️ Toda edición queda registrada en auditoría con tu nombre y fecha.
        </div>

        <form onSubmit={handleSubmit} className="gap-stack">
          <div className="form-group">
            <label className="form-label">Nombre completo</label>
            <input className="input" value={form.nombre_completo} onChange={e => setForm(f=>({...f,nombre_completo:e.target.value}))} required />
          </div>
          <div className="form-group">
            <label className="form-label">CI</label>
            <input className="input" value={form.carnet_identidad} onChange={e => setForm(f=>({...f,carnet_identidad:e.target.value}))} />
          </div>
          <div className="form-group">
            <label className="form-label">Celular</label>
            <input className="input" value={form.celular} onChange={e => setForm(f=>({...f,celular:e.target.value}))} />
          </div>
          <div className="form-group">
            <label className="form-label" style={{ color:'var(--magenta-deep)' }}>Motivo / Comentario * (obligatorio)</label>
            <textarea
              className="input"
              style={{ resize:'none', minHeight:80 }}
              placeholder="Ej: Corrección de nombre por error de tipeo"
              value={form.comentario}
              onChange={e => setForm(f=>({...f,comentario:e.target.value}))}
              required
            />
          </div>
          <div style={{ display:'flex', gap:'0.75rem' }}>
            <button type="button" className="btn btn-ghost" style={{ flex:1 }} onClick={onClose}>Cancelar</button>
            <button id="btn-guardar-edicion" type="submit" className="btn btn-primary" style={{ flex:2 }} disabled={loading}>
              {loading ? '⏳ Guardando...' : '💾 Guardar cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditarMontoModal({ cliente, onClose, onGuardado }) {
  const toast = useToast();
  const [monto, setMonto] = useState(cliente.monto_acumulado || 0);
  const [comentario, setComentario] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();
    if (!comentario.trim()) return toast.error('El comentario es obligatorio');
    setLoading(true);
    try {
      const { data } = await api.patch(`/clientes/${cliente.id}/monto`, { monto: parseFloat(monto), comentario });
      onGuardado(data.cliente);
      toast.success('Monto actualizado');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al guardar');
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-sheet">
        <div className="modal-handle"/>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1.25rem' }}>
          <h2 style={{ color:'var(--pink-strong)', fontSize:'1.2rem' }}>💰 Ajustar monto</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose} style={{ minHeight:'unset' }}><X size={18}/></button>
        </div>

        <div style={{ background:'#FEF3C7', borderRadius:'0.875rem', padding:'0.75rem 1rem', marginBottom:'1rem', fontSize:'0.85rem', color:'#92400E', fontWeight:600 }}>
          ⚠️ Toda edición queda registrada en auditoría.
        </div>

        <p style={{ fontSize:'0.85rem', color:'var(--text-muted)', marginBottom:'0.75rem' }}>
          <strong>{cliente.nombre_completo}</strong> — Monto actual: {fmt(cliente.monto_acumulado)}
        </p>

        <form onSubmit={handleSubmit} className="gap-stack">
          <div className="form-group">
            <label className="form-label">Nuevo monto (Bs.)</label>
            <input className="input" type="number" min="0" step="0.01" value={monto} onChange={e => setMonto(e.target.value)} required />
          </div>
          <div className="form-group">
            <label className="form-label" style={{ color:'var(--magenta-deep)' }}>Motivo / Comentario * (obligatorio)</label>
            <textarea
              className="input"
              style={{ resize:'none', minHeight:80 }}
              placeholder="Ej: Corrección de monto por error de captura"
              value={comentario}
              onChange={e => setComentario(e.target.value)}
              required
            />
          </div>
          <div style={{ display:'flex', gap:'0.75rem' }}>
            <button type="button" className="btn btn-ghost" style={{ flex:1 }} onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary" style={{ flex:2 }} disabled={loading}>
              {loading ? '⏳ Guardando...' : '💾 Guardar monto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EliminarClienteModal({ cliente, onClose, onEliminado }) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);

  const handleEliminar = async () => {
    setLoading(true);
    try {
      await api.delete(`/clientes/${cliente.id}`);
      onEliminado(cliente.id);
      toast.success(`${cliente.nombre_completo} eliminada`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al eliminar');
    } finally { setLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-sheet">
        <div className="modal-handle"/>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1.25rem' }}>
          <h2 style={{ color:'#DC2626', fontSize:'1.2rem' }}>🗑️ Eliminar clienta</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose} style={{ minHeight:'unset' }}><X size={18}/></button>
        </div>

        <div style={{ background:'#FEE2E2', borderRadius:'0.875rem', padding:'0.75rem 1rem', marginBottom:'1rem', fontSize:'0.85rem', color:'#991B1B', fontWeight:600 }}>
          ⚠️ Esta acción es irreversible. Se eliminarán todos los datos de la clienta.
        </div>

        <p style={{ fontSize:'0.9rem', marginBottom:'1.25rem' }}>
          ¿Estás segura de eliminar a <strong>{cliente.nombre_completo}</strong>?
          {cliente.carnet_identidad && <span> (CI: {cliente.carnet_identidad})</span>}
        </p>

        <div style={{ display:'flex', gap:'0.75rem' }}>
          <button className="btn btn-ghost" style={{ flex:1 }} onClick={onClose}>Cancelar</button>
          <button className="btn" style={{ flex:2, background:'#DC2626', color:'#fff', fontWeight:700 }} onClick={handleEliminar} disabled={loading}>
            {loading ? '⏳ Eliminando...' : '🗑️ Sí, eliminar'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminClientes() {
  const toast = useToast();
  const [clientes, setClientes] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(true);
  const [editando, setEditando] = useState(null);
  const [showImport, setShowImport] = useState(false);
  const [editandoMonto, setEditandoMonto] = useState(null);
  const [eliminando, setEliminando] = useState(null);

  const fetch = useCallback(async (query, pg) => {
    setLoading(true);
    try {
      const { data } = await api.get('/clientes', { params: { q: query, page: pg, limit: 15 } });
      if (pg === 1) setClientes(data.clientes);
      else setClientes(prev => [...prev, ...data.clientes]);
      setTotal(data.total);
    } catch { toast.error('Error cargando clientes'); }
    finally { setLoading(false); }
  }, [toast]);

  useEffect(() => { fetch('', 1); }, []);

  const handleSearch = e => {
    const v = e.target.value; setQ(v);
    clearTimeout(window._csearch);
    window._csearch = setTimeout(() => { setPage(1); fetch(v, 1); }, 350);
  };

  const handleGuardado = updated => {
    setClientes(prev => prev.map(c => c.id === updated.id ? { ...c, ...updated } : c));
    setEditando(null);
  };

  const handleImportado = () => {
    setShowImport(false);
    setPage(1);
    fetch(q, 1);
  };

  const handleMontoGuardado = updated => {
    setClientes(prev => prev.map(c => c.id === updated.id ? { ...c, ...updated } : c));
    setEditandoMonto(null);
  };

  const handleEliminado = id => {
    setClientes(prev => prev.filter(c => c.id !== id));
    setTotal(t => t - 1);
    setEliminando(null);
  };

  return (
    <div className="gap-stack" style={{ gap: '1.25rem' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'0.75rem' }}>
        <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
          <h1 style={{ fontSize:'1.5rem', fontWeight:900 }}>Clientas 👥</h1>
          <button
            id="btn-importar-excel"
            className="btn btn-ghost"
            onClick={() => setShowImport(true)}
            style={{ fontSize:'0.8rem', display:'flex', alignItems:'center', gap:'0.35rem', padding:'0.4rem 0.75rem', border:'1px solid var(--border)', borderRadius:'0.5rem' }}
          >
            <Upload size={14} /> Importar Excel
          </button>
        </div>
        <span style={{ color:'var(--text-muted)', fontSize:'0.85rem' }}>{total} registradas</span>
      </div>

      <div className="input-wrapper">
        <Search size={18} className="input-icon"/>
        <input id="admin-buscar-cliente" className="input input-search" placeholder="Nombre, CI o celular..." value={q} onChange={handleSearch} />
      </div>

      {loading && clientes.length === 0 ? (
        Array.from({length:5}).map((_,i) => <div key={i} className="skeleton" style={{height:56,borderRadius:'0.75rem'}}/>)
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>CI</th>
                <th>Celular</th>
                <th>Acumulado</th>
                <th>Visitas</th>
                <th>Registro</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {clientes.map(c => (
                <tr key={c.id}>
                  <td style={{ fontWeight:700 }}>{c.nombre_completo}</td>
                  <td style={{ color:'var(--text-muted)' }}>{c.carnet_identidad || '—'}</td>
                  <td style={{ color:'var(--text-muted)' }}>{c.celular || '—'}</td>
                  <td style={{ fontWeight:800, color:'var(--pink-strong)', cursor:'pointer' }} onClick={() => setEditandoMonto(c)} title="Ajustar monto">
                    {fmt(c.monto_acumulado)}
                  </td>
                  <td style={{ color:'var(--text-muted)' }}>{c.visitas_totales}</td>
                  <td style={{ color:'var(--text-muted)', fontSize:'0.8rem' }}>{fmtDate(c.fecha_registro)}</td>
                  <td>
                    <div style={{ display:'flex', gap:'0.25rem' }}>
                      <button
                        className="btn btn-ghost btn-icon"
                        style={{ minHeight:'unset', padding:'0.4rem' }}
                        onClick={() => setEditando(c)}
                        title="Editar"
                        id={`btn-editar-${c.id}`}
                      >
                        <Edit2 size={15}/>
                      </button>
                      <button
                        className="btn btn-ghost btn-icon"
                        style={{ minHeight:'unset', padding:'0.4rem', color:'#DC2626' }}
                        onClick={() => setEliminando(c)}
                        title="Eliminar"
                        id={`btn-eliminar-${c.id}`}
                      >
                        <Trash2 size={15}/>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {clientes.length < total && (
            <div style={{ padding:'1rem', textAlign:'center' }}>
              <button className="btn btn-ghost" onClick={() => { const np = page+1; setPage(np); fetch(q, np); }} disabled={loading}>
                Ver más ▼
              </button>
            </div>
          )}

          {clientes.length === 0 && !loading && (
            <div style={{ padding:'3rem', textAlign:'center', color:'var(--text-muted)' }}>Sin resultados</div>
          )}
        </div>
      )}

      {editando && (
        <EditarClienteModal cliente={editando} onClose={() => setEditando(null)} onGuardado={handleGuardado} />
      )}

      {editandoMonto && (
        <EditarMontoModal cliente={editandoMonto} onClose={() => setEditandoMonto(null)} onGuardado={handleMontoGuardado} />
      )}

      {eliminando && (
        <EliminarClienteModal cliente={eliminando} onClose={() => setEliminando(null)} onEliminado={handleEliminado} />
      )}

      {showImport && (
        <ImportarExcelModal onClose={() => setShowImport(false)} onImportado={handleImportado} />
      )}
    </div>
  );
}
