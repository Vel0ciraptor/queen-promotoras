import { useState, useEffect, useCallback } from 'react';
import { Search, Edit2, Upload, Download, X, Trash2, ArrowUpDown, ArrowUp, ArrowDown, Phone, CreditCard, Calendar, ShoppingBag, LayoutGrid, Table as TableIcon, MapPin, History } from 'lucide-react';
import * as XLSX from 'xlsx';
import api from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import ImportarExcelModal from '../../components/ImportarExcelModal';
import ClienteDetalleModal from '../../components/ClienteDetalleModal';
import { DEPARTAMENTOS, NACIONALIDADES, provinciasDe, OTRA_PROVINCIA } from '../../lib/ubicaciones';

const fmt = n => new Intl.NumberFormat('es-BO', { style: 'currency', currency: 'BOB', minimumFractionDigits: 0 }).format(n || 0);
const fmtDate = d => new Date(d).toLocaleDateString('es-BO', { day: '2-digit', month: 'short', year: 'numeric' });

function EditarClienteModal({ cliente, onClose, onGuardado }) {
  const toast = useToast();
  // Si el valor guardado no está en la lista (país escrito a mano), marcamos "Otra"
  const nacGuardada = cliente.nacionalidad || '';
  const esOtroPais = nacGuardada !== '' && nacGuardada !== 'Otra' && !NACIONALIDADES.includes(nacGuardada);
  // Ídem para la provincia/localidad guardada
  const provGuardada = cliente.provincia || '';
  const esOtraProvincia = provGuardada !== '' && !provinciasDe(cliente.departamento || '').includes(provGuardada);
  const [form, setForm] = useState({
    nombre_completo: cliente.nombre_completo,
    carnet_identidad: cliente.carnet_identidad || '',
    celular: cliente.celular || '',
    nacionalidad: esOtroPais ? 'Otra' : nacGuardada,
    otroPais: esOtroPais ? nacGuardada : '',
    departamento: cliente.departamento || '',
    provincia: esOtraProvincia ? OTRA_PROVINCIA : provGuardada,
    otraProvincia: esOtraProvincia ? provGuardada : '',
    comentario: ''
  });
  const [loading, setLoading] = useState(false);

  const provincias = provinciasDe(form.departamento);
  const escribiendoOtraProvincia = form.provincia === OTRA_PROVINCIA;

  // Al cambiar el departamento, la provincia se conserva solo si sigue válida
  const changeDepartamento = e => {
    const nuevo = e.target.value;
    setForm(f => {
      if (f.provincia === OTRA_PROVINCIA) return { ...f, departamento: nuevo };
      if (f.provincia && provinciasDe(nuevo).includes(f.provincia)) return { ...f, departamento: nuevo };
      return { ...f, departamento: nuevo, provincia: '', otraProvincia: '' };
    });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.comentario.trim()) return toast.error('El comentario es obligatorio');
    setLoading(true);
    try {
      const { data } = await api.put(`/clientes/${cliente.id}`, {
        ...form,
        nacionalidad: form.nacionalidad === 'Otra'
          ? (form.otroPais.trim() || 'Otra')
          : form.nacionalidad,
        provincia: escribiendoOtraProvincia ? form.otraProvincia.trim() : form.provincia
      });
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
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem' }}>
            <div className="form-group">
              <label className="form-label">Nacionalidad</label>
              <select className="input" value={form.nacionalidad} onChange={e => setForm(f=>({...f,nacionalidad:e.target.value}))}>
                <option value="">Sin especificar</option>
                {NACIONALIDADES.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Departamento</label>
              <select className="input" value={form.departamento} onChange={changeDepartamento}>
                <option value="">Sin especificar</option>
                {DEPARTAMENTOS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Provincia / Localidad</label>
            <select className="input" value={form.provincia} onChange={e => setForm(f=>({...f,provincia:e.target.value}))} disabled={!form.departamento}>
              <option value="">{form.departamento ? 'Sin especificar' : 'Elige un departamento primero'}</option>
              {provincias.map(p => <option key={p} value={p}>{p}</option>)}
              <option value={OTRA_PROVINCIA}>Otra localidad…</option>
            </select>
          </div>
          {escribiendoOtraProvincia && (
            <div className="form-group">
              <input className="input" placeholder="Escribe la localidad (ej: Villamontes, Puertas del Sur...)" maxLength={80} value={form.otraProvincia} onChange={e => setForm(f=>({...f,otraProvincia:e.target.value}))} />
            </div>
          )}
          {form.nacionalidad === 'Otra' && (
            <div className="form-group">
              <label className="form-label">¿De qué país viene la compra? (opcional)</label>
              <input className="input" maxLength={30} placeholder="Ej: Uruguay, Alemania..." value={form.otroPais} onChange={e => setForm(f=>({...f,otroPais:e.target.value}))} />
            </div>
          )}
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
  const [exporting, setExporting] = useState(false);
  const [editando, setEditando] = useState(null);
  const [showImport, setShowImport] = useState(false);
  const [editandoMonto, setEditandoMonto] = useState(null);
  const [eliminando, setEliminando] = useState(null);
  const [viendoDetalle, setViendoDetalle] = useState(null);
  const [sortBy, setSortBy] = useState('fecha');
  const [sortOrder, setSortOrder] = useState('desc');
  // Tabla en escritorio, tarjetas en móvil/tablet (y el usuario puede cambiarlo cuando quiera)
  const [viewMode, setViewMode] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches ? 'table' : 'cards'
  );

  const fetch = useCallback(async (query, pg, sort = sortBy, order = sortOrder) => {
    setLoading(true);
    try {
      const { data } = await api.get('/clientes', { params: { q: query, page: pg, limit: 15, sortBy: sort, sortOrder: order } });
      if (pg === 1) setClientes(data.clientes);
      else setClientes(prev => [...prev, ...data.clientes]);
      setTotal(data.total);
    } catch { toast.error('Error cargando clientes'); }
    finally { setLoading(false); }
  }, [toast, sortBy, sortOrder]);

  useEffect(() => { fetch('', 1); }, []);

  const handleSearch = e => {
    const v = e.target.value; setQ(v);
    clearTimeout(window._csearch);
    window._csearch = setTimeout(() => { setPage(1); fetch(v, 1); }, 350);
  };

  const handleSort = (column) => {
    let newOrder = 'desc';
    if (sortBy === column) {
      newOrder = sortOrder === 'desc' ? 'asc' : 'desc';
    }
    setSortBy(column);
    setSortOrder(newOrder);
    setPage(1);
    fetch(q, 1, column, newOrder);
  };

  const SortIcon = ({ column }) => {
    if (sortBy !== column) return <ArrowUpDown size={12} style={{ opacity: 0.4 }} />;
    return sortOrder === 'desc' ? <ArrowDown size={12} /> : <ArrowUp size={12} />;
  };

  // Encabezado ordenable: el contenido va en un span (nunca flex directo en <th>,
  // eso rompía la alineación de las columnas)
  const thOrden = (column, label, extraClass = '') => (
    <th
      className={`th-sortable ${extraClass}`.trim()}
      onClick={() => handleSort(column)}
      aria-sort={sortBy === column ? (sortOrder === 'asc' ? 'ascending' : 'descending') : 'none'}
    >
      <span className="th-sort">{label}<SortIcon column={column} /></span>
    </th>
  );

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

  // Mantiene la lista al día cuando el detalle corrige/elimina una compra
  const sincronizarCliente = updated => {
    setClientes(prev => prev.map(c => c.id === updated.id ? { ...c, ...updated } : c));
  };

  // Exportar Base de Datos Completa a Excel
  const handleExportBD = async () => {
    setExporting(true);
    try {
      const { data } = await api.get('/clientes/export');
      const rows = data.clientes.map(c => ({
        'ID': c.id,
        'Nombre Completo': c.nombre_completo,
        'CI': c.carnet_identidad || 'N/A',
        'Celular': c.celular || 'N/A',
        'Nacionalidad': c.nacionalidad || 'N/A',
        'Departamento': c.departamento || 'N/A',
        'Provincia': c.provincia || 'N/A',
        'Monto Acumulado (Bs)': parseFloat(c.monto_acumulado || 0),
        'Visitas Totales': c.visitas_totales || 0,
        'Fecha Registro': new Date(c.fecha_registro).toLocaleString('es-BO'),
        'Registrado Por': c.creado_por_nombre || 'Sistema'
      }));

      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Clientas Queen');
      XLSX.writeFile(wb, `Base_Datos_Clientas_Queen_${new Date().toISOString().slice(0, 10)}.xlsx`);
      toast.success('¡Base de datos exportada en Excel!');
    } catch (err) {
      toast.error('Error al exportar la base de datos');
    } finally { setExporting(false); }
  };

  // Exportar Historial de Promotoras a Excel
  const handleExportHistorial = async () => {
    setExporting(true);
    try {
      const { data } = await api.get('/clientes/export-historial');
      const rows = data.historial.map(h => ({
        'ID Transacción': h.id,
        'Fecha y Hora': new Date(h.fecha).toLocaleString('es-BO'),
        'Clienta': h.cliente_nombre,
        'CI Clienta': h.cliente_ci || 'N/A',
        'Monto Registrado (Bs)': parseFloat(h.monto || 0),
        'Promotora': h.registrado_por_promotora || 'N/A',
        'Usuario Promotora': h.promotora_usuario || 'N/A',
        'Nota': h.nota || ''
      }));

      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Historial Promotoras');
      XLSX.writeFile(wb, `Historial_Promotoras_Queen_${new Date().toISOString().slice(0, 10)}.xlsx`);
      toast.success('¡Historial de promotoras exportado en Excel!');
    } catch (err) {
      toast.error('Error al exportar el historial');
    } finally { setExporting(false); }
  };

  return (
    <div className="gap-stack" style={{ gap: '1.25rem' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'0.75rem' }}>
        <div>
          <h1 style={{ fontSize:'1.5rem', fontWeight:900 }}>Clientas 👥</h1>
          <span style={{ color:'var(--text-muted)', fontSize:'0.85rem' }}>{total} registradas en total</span>
        </div>

        <div style={{ display:'flex', alignItems:'center', gap:'0.5rem', flexWrap:'wrap' }}>
          <button
            id="btn-importar-excel"
            className="btn btn-ghost"
            onClick={() => setShowImport(true)}
            style={{ fontSize:'0.8rem', display:'flex', alignItems:'center', gap:'0.35rem', padding:'0.45rem 0.75rem' }}
          >
            <Upload size={15} /> Importar Excel
          </button>
          
          <button
            id="btn-exportar-bd"
            className="btn btn-primary"
            onClick={handleExportBD}
            disabled={exporting}
            style={{ fontSize:'0.8rem', display:'flex', alignItems:'center', gap:'0.35rem', padding:'0.45rem 0.75rem' }}
            title="Descargar todos los clientes en Excel"
          >
            <Download size={15} /> Exportar BD
          </button>

          <button
            id="btn-exportar-historial"
            className="btn btn-gold"
            onClick={handleExportHistorial}
            disabled={exporting}
            style={{ fontSize:'0.8rem', display:'flex', alignItems:'center', gap:'0.35rem', padding:'0.45rem 0.75rem' }}
            title="Descargar historial de ventas e ingresos de promotoras"
          >
            <Download size={15} /> Exportar Historial
          </button>
        </div>
      </div>

      <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
        <div className="input-wrapper" style={{ flex: 1, minWidth: 0 }}>
          <Search size={18} className="input-icon"/>
          <input id="admin-buscar-cliente" className="input input-search" placeholder="Buscar por nombre, CI o celular..." value={q} onChange={handleSearch} />
        </div>

        {/* Selector de vista: tarjetas (móvil) o tabla (escritorio) */}
        <div className="view-mode-toggle" role="group" aria-label="Formato de la lista">
          <button
            className={`btn btn-ghost ${viewMode === 'cards' ? 'active' : ''}`}
            onClick={() => setViewMode('cards')}
            aria-pressed={viewMode === 'cards'}
            title="Vista tarjetas"
          >
            <LayoutGrid size={16}/> <span className="view-mode-label">Tarjetas</span>
          </button>
          <button
            className={`btn btn-ghost ${viewMode === 'table' ? 'active' : ''}`}
            onClick={() => setViewMode('table')}
            aria-pressed={viewMode === 'table'}
            title="Vista tabla"
          >
            <TableIcon size={16}/> <span className="view-mode-label">Tabla</span>
          </button>
        </div>
      </div>

      {loading && clientes.length === 0 ? (
        Array.from({length:5}).map((_,i) => <div key={i} className="skeleton" style={{height:72,borderRadius:'1rem'}}/>)
      ) : (
        <>
          {/* Vista Adaptativa de Tarjetas (Optimizada para Móviles como iPhone & Pantallas Pequeñas) */}
          <div className={`admin-clientes-cards ${viewMode === 'table' ? 'hidden-cards' : ''}`}>
            {clientes.map(c => (
              <div key={c.id} className="card admin-cliente-card-item" style={{ display:'flex', flexDirection:'column', gap:'0.75rem', position:'relative' }}>
                <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:'0.5rem' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'0.75rem', flex: 1, minWidth: 0 }}>
                    <div className="client-avatar" style={{ width:42, height:42, fontSize:'1rem' }}>
                      {c.nombre_completo ? c.nombre_completo[0].toUpperCase() : 'C'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight:800, fontSize:'1rem', color:'var(--text-primary)', textOverflow:'ellipsis', overflow:'hidden', whiteSpace:'nowrap' }}>
                        {c.nombre_completo}
                      </div>
                      <div style={{ fontSize:'0.78rem', color:'var(--text-muted)', display:'flex', alignItems:'center', gap:'0.4rem', marginTop:'0.15rem' }}>
                        <Calendar size={12} /> {fmtDate(c.fecha_registro)}
                      </div>
                    </div>
                  </div>

                  <div style={{ display:'flex', gap:'0.2rem' }}>
                    <button
                      className="btn btn-ghost btn-icon"
                      style={{ minHeight:'unset', padding:'0.4rem' }}
                      onClick={() => setViendoDetalle(c)}
                      title="Ver historial de compras"
                      id={`btn-historial-${c.id}`}
                    >
                      <History size={15}/>
                    </button>
                    <button
                      className="btn btn-ghost btn-icon"
                      style={{ minHeight:'unset', padding:'0.4rem' }}
                      onClick={() => setEditando(c)}
                      title="Editar datos"
                    >
                      <Edit2 size={15}/>
                    </button>
                    <button
                      className="btn btn-ghost btn-icon"
                      style={{ minHeight:'unset', padding:'0.4rem', color:'#DC2626' }}
                      onClick={() => setEliminando(c)}
                      title="Eliminar clienta"
                    >
                      <Trash2 size={15}/>
                    </button>
                  </div>
                </div>

                <div style={{ display:'grid', gridTemplateColumns:'repeat(2, 1fr)', gap:'0.5rem', background:'var(--surface2)', padding:'0.65rem 0.85rem', borderRadius:'0.875rem' }}>
                  <div>
                    <div style={{ fontSize:'0.72rem', color:'var(--text-muted)', fontWeight:700, display:'flex', alignItems:'center', gap:'0.25rem' }}>
                      <CreditCard size={12} /> CI
                    </div>
                    <div style={{ fontWeight:700, fontSize:'0.85rem', marginTop:'0.1rem' }}>{c.carnet_identidad || '—'}</div>
                  </div>

                  <div>
                    <div style={{ fontSize:'0.72rem', color:'var(--text-muted)', fontWeight:700, display:'flex', alignItems:'center', gap:'0.25rem' }}>
                      <Phone size={12} /> Celular
                    </div>
                    <div style={{ fontWeight:700, fontSize:'0.85rem', marginTop:'0.1rem' }}>{c.celular || '—'}</div>
                  </div>

                  <div style={{ gridColumn:'1 / -1' }}>
                    <div style={{ fontSize:'0.72rem', color:'var(--text-muted)', fontWeight:700, display:'flex', alignItems:'center', gap:'0.25rem' }}>
                      <MapPin size={12} /> Origen
                    </div>
                    <div style={{ fontWeight:700, fontSize:'0.85rem', marginTop:'0.1rem' }}>
                      {[c.provincia, c.departamento, c.nacionalidad].filter(Boolean).join(' · ') || '—'}
                    </div>
                  </div>
                </div>

                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', paddingTop:'0.25rem' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'0.35rem', fontSize:'0.8rem', color:'var(--text-secondary)' }}>
                    <ShoppingBag size={14} /> <strong>{c.visitas_totales}</strong> compras
                  </div>

                  <div
                    onClick={() => setEditandoMonto(c)}
                    style={{
                      background:'linear-gradient(135deg, rgba(255,61,143,0.1), rgba(255,111,165,0.2))',
                      border:'1px solid var(--border)', borderRadius:'0.75rem', padding:'0.35rem 0.75rem',
                      cursor:'pointer', textAlign:'right'
                    }}
                    title="Hacer clic para ajustar monto acumulado"
                  >
                    <div style={{ fontSize:'0.68rem', color:'var(--text-muted)', fontWeight:700 }}>ACUMULADO</div>
                    <div style={{ fontSize:'1.05rem', fontWeight:900, color:'var(--pink-strong)' }}>
                      {fmt(c.monto_acumulado)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Vista Tabla de Escritorio */}
          <div className={`table-wrapper admin-clientes-table ${viewMode === 'cards' ? 'hidden-table' : ''}`}>
            <table>
              <thead>
                <tr>
                  {thOrden('nombre', 'Nombre')}
                  {thOrden('carnet', 'CI')}
                  <th><span className="th-sort">Celular</span></th>
                  <th className="table-hide-md"><span className="th-sort">Origen</span></th>
                  {thOrden('monto', 'Acumulado', 'td-num')}
                  {thOrden('visitas', 'Visitas', 'td-num')}
                  {thOrden('fecha', 'Registro', 'table-hide-md')}
                  <th className="th-actions"><span className="th-sort">Acciones</span></th>
                </tr>
              </thead>
              <tbody>
                {clientes.map(c => (
                  <tr key={c.id}>
                    <td className="td-name" title={c.nombre_completo} style={{ fontWeight:700 }}>{c.nombre_completo}</td>
                    <td style={{ color:'var(--text-muted)', whiteSpace:'nowrap' }}>{c.carnet_identidad || '—'}</td>
                    <td style={{ color:'var(--text-muted)', whiteSpace:'nowrap' }}>{c.celular || '—'}</td>
                    <td className="table-hide-md" style={{ color:'var(--text-muted)', fontSize:'0.8rem' }}>
                      {[c.provincia, c.departamento, c.nacionalidad].filter(Boolean).join(' · ') || '—'}
                    </td>
                    <td className="td-num" style={{ fontWeight:800, color:'var(--pink-strong)', cursor:'pointer' }} onClick={() => setEditandoMonto(c)} title="Ajustar monto">
                      {fmt(c.monto_acumulado)}
                    </td>
                    <td className="td-num" style={{ color:'var(--text-muted)' }}>{c.visitas_totales}</td>
                    <td className="table-hide-md" style={{ color:'var(--text-muted)', fontSize:'0.8rem', whiteSpace:'nowrap' }}>{fmtDate(c.fecha_registro)}</td>
                    <td className="td-actions">
                      <div style={{ display:'flex', gap:'0.25rem' }}>
                        <button
                          className="btn btn-ghost btn-icon"
                          style={{ minHeight:'unset', padding:'0.4rem' }}
                          onClick={() => setViendoDetalle(c)}
                          title="Ver historial de compras"
                          id={`btn-historial-tabla-${c.id}`}
                        >
                          <History size={15}/>
                        </button>
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
          </div>

          {clientes.length < total && (
            <div style={{ padding:'1rem', textAlign:'center' }}>
              <button className="btn btn-ghost" onClick={() => { const np = page+1; setPage(np); fetch(q, np); }} disabled={loading}>
                Ver más ▼
              </button>
            </div>
          )}

          {clientes.length === 0 && !loading && (
            <div style={{ padding:'3rem', textAlign:'center', color:'var(--text-muted)' }}>Sin resultados de clientas</div>
          )}
        </>
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

      {viendoDetalle && (
        <ClienteDetalleModal
          cliente={viendoDetalle}
          onClose={() => setViendoDetalle(null)}
          onIngresoRegistrado={sincronizarCliente}
          onClienteActualizado={sincronizarCliente}
        />
      )}

      {showImport && (
        <ImportarExcelModal onClose={() => setShowImport(false)} onImportado={handleImportado} />
      )}
    </div>
  );
}
