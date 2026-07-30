import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';

import LoginPage from './pages/LoginPage';
import PromotoraPage from './pages/PromotoraPage';
import AdminPage from './pages/AdminPage';

function RequireAuth({ children, roles }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.rol)) return <Navigate to={user.rol === 'admin' ? '/admin' : '/promotora'} replace />;
  return children;
}

function RootRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.rol === 'admin') return <Navigate to="/admin" replace />;
  return <Navigate to="/promotora" replace />;
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<RootRedirect />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/promotora" element={
                <RequireAuth roles={['promotora', 'promotora_lider']}>
                  <PromotoraPage />
                </RequireAuth>
              } />
              <Route path="/admin/*" element={
                <RequireAuth roles={['admin']}>
                  <AdminPage />
                </RequireAuth>
              } />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
