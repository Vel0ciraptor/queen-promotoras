import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  LayoutDashboard, Users, UserPlus, Tag, Settings, LogOut, Moon, Sun, Menu, X
} from 'lucide-react';
import queenLogo from '../assets/copiaqueenlogo.png';

import AdminDashboard from './admin/AdminDashboard';
import AdminClientes from './admin/AdminClientes';
import AdminDescuentos from './admin/AdminDescuentos';
import AdminPromotoras from './admin/AdminPromotoras';
import AdminConfiguracion from './admin/AdminConfiguracion';

const NAV = [
  { key: 'dashboard',    label: 'Resumen',    Icon: LayoutDashboard },
  { key: 'clientes',     label: 'Clientes',   Icon: Users },
  { key: 'descuentos',   label: 'Descuentos', Icon: Tag },
  { key: 'promotoras',   label: 'Promotoras', Icon: UserPlus },
  { key: 'config',       label: 'Config',     Icon: Settings },
];

export default function AdminPage() {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();
  const [section, setSection] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const Sección = {
    dashboard:  AdminDashboard,
    clientes:   AdminClientes,
    descuentos: AdminDescuentos,
    promotoras: AdminPromotoras,
    config:     AdminConfiguracion,
  }[section] || AdminDashboard;

  const navTo = key => { setSection(key); setSidebarOpen(false); };

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0 0.5rem', marginBottom: '2rem' }}>
        <img src={queenLogo} alt="Queen Style" style={{ width: 40, height: 22, borderRadius: '0.4rem', objectFit: 'contain', flexShrink: 0 }} />
        <div>
          <div style={{ fontWeight: 900, fontSize: '1rem', color: 'var(--pink-strong)' }}>Queen Style</div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Panel Admin</div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1 }} className="gap-stack">
        {NAV.map(({ key, label, Icon }) => (
          <button
            key={key}
            id={`nav-${key}`}
            className={`sidebar-nav-item ${section === key ? 'active' : ''}`}
            onClick={() => navTo(key)}
          >
            <Icon size={18} />
            {label}
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', padding: '0 0.5rem' }}>{user?.nombre}</div>
        <button className="sidebar-nav-item" onClick={toggle}>
          {theme === 'dark' ? <Sun size={16}/> : <Moon size={16}/>}
          {theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
        </button>
        <button className="sidebar-nav-item" onClick={logout}>
          <LogOut size={16}/> Cerrar sesión
        </button>
      </div>
    </>
  );

  return (
    <div className="admin-layout">
      {/* Sidebar desktop */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        {sidebarOpen && (
          <button onClick={() => setSidebarOpen(false)}
            style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
            <X size={20}/>
          </button>
        )}
        <SidebarContent />
      </aside>

      {/* Overlay mobile sidebar */}
      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 79 }} />
      )}

      {/* Content */}
      <main className="admin-content">
        {/* Mobile top bar */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '1rem 1.25rem', background: 'var(--surface)',
          borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 30
        }} className="md:hidden">
          <button onClick={() => setSidebarOpen(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-primary)' }}>
            <Menu size={22}/>
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--pink-strong)', fontWeight: 900 }}>
            <img src={queenLogo} alt="Queen Style" style={{ width: 28, height: 16, borderRadius: '0.3rem', objectFit: 'contain' }}/> Queen Style
          </div>
          <button onClick={toggle} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
            {theme === 'dark' ? <Sun size={18}/> : <Moon size={18}/>}
          </button>
        </div>

        <div style={{ padding: '1.5rem', paddingBottom: '5rem' }}>
          <Sección />
        </div>

        {/* Mobile bottom nav */}
        <nav className="mobile-nav-bar">
          {NAV.map(({ key, label, Icon }) => (
            <button key={key} id={`mobile-nav-${key}`} className={`mobile-nav-item ${section === key ? 'active' : ''}`} onClick={() => navTo(key)}>
              <Icon size={20} className="mobile-nav-icon" />
              {label}
            </button>
          ))}
        </nav>
      </main>
    </div>
  );
}
