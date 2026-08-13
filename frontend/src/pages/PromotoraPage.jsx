import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../context/ThemeContext';
import api from '../lib/api';
import ClientCard from '../components/ClientCard';
import NuevoClienteModal from '../components/NuevoClienteModal';
import ClienteDetalleModal from '../components/ClienteDetalleModal';
import CompletarInfoModal from '../components/CompletarInfoModal';
import { Search, Plus, LogOut, Moon, Sun, ArrowUpDown } from 'lucide-react';
import queenLogo from '../assets/logoqueen.png';

const LIMIT = 7;
const CHIME_SRC = '/chime.mp3';

export default function PromotoraPage() {
  const { user, logout } = useAuth();
  const toast = useToast();
  const { theme, toggle } = useTheme();

  const [clientes, setClientes] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);
  const [showNuevo, setShowNuevo] = useState(false);
  const [selected, setSelected] = useState(null);
  const [sortBy, setSortBy] = useState('fecha');
  const [sortOrder, setSortOrder] = useState('desc');
  const [completandoInfo, setCompletandoInfo] = useState(null);

  const chimeRef = useRef(null);
  const searchDebounce = useRef(null);

  const fetchClientes = useCallback(async (query, pg, sort = sortBy, order = sortOrder) => {
    setLoading(true);
    try {
      const { data } = await api.get('/clientes', { params: { q: query, page: pg, limit: LIMIT, sortBy: sort, sortOrder: order } });
      if (pg === 1) setClientes(data.clientes);
      else setClientes(prev => [...prev, ...data.clientes]);
      setTotal(data.total);
    } catch {
      toast.error('Error cargando clientes');
    } finally {
      setLoading(false);
    }
  }, [toast, sortBy, sortOrder]);

  useEffect(() => {
    fetchClientes(q, 1);
    setPage(1);
  }, []);

  const handleSearch = e => {
    const val = e.target.value;
    setQ(val);
    clearTimeout(searchDebounce.current);
    searchDebounce.current = setTimeout(() => {
      setPage(1);
      fetchClientes(val, 1);
    }, 350);
  };

  const handleSort = (newSortBy) => {
    let newOrder = 'desc';
    if (sortBy === newSortBy) {
      newOrder = sortOrder === 'desc' ? 'asc' : 'desc';
    } else {
      newOrder = newSortBy === 'nombre' ? 'asc' : 'desc';
    }
    setSortBy(newSortBy);
    setSortOrder(newOrder);
    setPage(1);
    fetchClientes(q, 1, newSortBy, newOrder);
  };

  const sortOptions = [
    { key: 'fecha', label: 'Más recientes' },
    { key: 'nombre', label: 'Nombre A-Z' },
    { key: 'monto', label: 'Mayor monto' },
    { key: 'visitas', label: 'Más visitas' }
  ];

  const handleCargarMas = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchClientes(q, nextPage);
  };

  const handleClienteCreado = (cliente, nuevasNotifs = []) => {
    setClientes(prev => [cliente, ...prev]);
    setTotal(t => t + 1);
    setShowNuevo(false);
    toast.success(`¡${cliente.nombre_completo} registrada! ✨`);
    if (nuevasNotifs.length) {
      setTimeout(() => {
        nuevasNotifs.forEach(d => toast.crown(`¡${cliente.nombre_completo} alcanzó ${d.porcentaje}% de descuento!`));
        chimeRef.current?.play?.().catch(() => {});
      }, 800);
    }
  };

  const handleIngresoRegistrado = (clienteActualizado, nuevasNotifs = []) => {
    setClientes(prev => prev.map(c => c.id === clienteActualizado.id ? { ...c, ...clienteActualizado } : c));
    if (nuevasNotifs.length) {
      nuevasNotifs.forEach(d => toast.crown(`¡${clienteActualizado.nombre_completo} alcanzó ${d.porcentaje}% OFF!`));
      chimeRef.current?.play?.().catch(() => {});
    }
    setSelected(null);
  };

  const handleInfoCompletada = (clienteActualizado) => {
    setClientes(prev => prev.map(c => c.id === clienteActualizado.id ? { ...c, ...clienteActualizado } : c));
    setCompletandoInfo(null);
    toast.success('Información actualizada');
  };

  const hayMas = clientes.length < total;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh', maxWidth: 480, margin: '0 auto' }}>
      {/* Audio chime precargado */}
      <audio ref={chimeRef} src={CHIME_SRC} preload="auto" />

      {/* Header */}
      <header className="app-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <img src={queenLogo} alt="Queen Style" style={{ width: 36, height: 20, borderRadius: '0.35rem', objectFit: 'contain' }} />
          <span style={{ fontWeight: 900, fontSize: '1.15rem', letterSpacing: '-0.01em' }}>Queen Style</span>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <span style={{ fontSize: '0.8rem', opacity: 0.85 }}>{user?.nombre}</span>
          <button className="btn-icon btn" onClick={toggle} title="Cambiar tema" style={{ background: 'rgba(255,255,255,0.2)', color:'#fff', minHeight:'unset' }}>
            {theme === 'dark' ? <Sun size={16}/> : <Moon size={16}/>}
          </button>
          <button className="btn-icon btn" onClick={logout} title="Salir" style={{ background: 'rgba(255,255,255,0.2)', color:'#fff', minHeight:'unset' }}>
            <LogOut size={16}/>
          </button>
        </div>
      </header>

      {/* Search sticky */}
      <div className="search-sticky">
        <div className="input-wrapper">
          <Search size={18} className="input-icon" />
          <input
            id="buscar-cliente"
            className="input input-search"
            type="search"
            placeholder="Nombre, CI o celular..."
            value={q}
            onChange={handleSearch}
            autoComplete="off"
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.5rem', paddingLeft: '0.25rem' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            {total} cliente{total !== 1 ? 's' : ''} registrada{total !== 1 ? 's' : ''}
          </span>
          <div style={{ display: 'flex', gap: '0.35rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
            {sortOptions.map(opt => (
              <button
                key={opt.key}
                onClick={() => handleSort(opt.key)}
                style={{
                  fontSize: '0.72rem',
                  padding: '0.25rem 0.5rem',
                  borderRadius: '1rem',
                  border: 'none',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  fontWeight: sortBy === opt.key ? 700 : 500,
                  background: sortBy === opt.key ? 'var(--pink-strong)' : 'var(--bg-secondary)',
                  color: sortBy === opt.key ? '#fff' : 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.2rem',
                  transition: 'all 0.15s ease'
                }}
              >
                <ArrowUpDown size={10} />
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Lista clientes */}
      <div style={{ flex: 1, padding: '0.75rem 1rem', paddingBottom: '6rem' }} className="gap-stack">
        {loading && clientes.length === 0 ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 76, borderRadius: '1.25rem' }} />
          ))
        ) : clientes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>🔍</div>
            <p style={{ fontWeight: 700 }}>Sin resultados</p>
            <p style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>Intenta con otro nombre o CI</p>
          </div>
        ) : (
          <>
            {clientes.map(c => (
              <ClientCard key={c.id} cliente={c} onClick={() => setSelected(c)} onCompletar={(cliente) => setCompletandoInfo(cliente)} />
            ))}
            {hayMas && (
              <button
                className="btn btn-ghost"
                style={{ width: '100%' }}
                onClick={handleCargarMas}
                disabled={loading}
                id="btn-cargar-mas"
              >
                {loading ? '⏳ Cargando...' : `Ver más ▼  (${total - clientes.length} restantes)`}
              </button>
            )}
          </>
        )}
      </div>

      {/* FAB */}
      <button className="btn-fab" onClick={() => setShowNuevo(true)} id="btn-nuevo-cliente" title="Agregar cliente">
        <Plus size={28} />
      </button>

      {/* Modales */}
      {showNuevo && (
        <NuevoClienteModal onClose={() => setShowNuevo(false)} onCreado={handleClienteCreado} />
      )}
      {selected && (
        <ClienteDetalleModal
          cliente={selected}
          onClose={() => setSelected(null)}
          onIngresoRegistrado={handleIngresoRegistrado}
        />
      )}
      {completandoInfo && (
        <CompletarInfoModal
          cliente={completandoInfo}
          onClose={() => setCompletandoInfo(null)}
          onGuardado={handleInfoCompletada}
        />
      )}
    </div>
  );
}
