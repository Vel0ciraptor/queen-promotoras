import { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);
let uid = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'gold', duration = 3500) => {
    const id = ++uid;
    setToasts(t => [...t, { id, message, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), duration);
  }, []);

  const success = useCallback((m) => addToast(m, 'success'), [addToast]);
  const error   = useCallback((m) => addToast(m, 'error', 4500), [addToast]);
  const crown   = useCallback((m) => addToast(m, 'gold'), [addToast]);
  const info    = useCallback((m) => addToast(m, 'info'), [addToast]);

  return (
    <ToastContext.Provider value={{ success, error, crown, info }}>
      {children}
      <div className="toast-container" style={{ pointerEvents: 'none' }}>
        {toasts.map(t => (
          <div key={t.id} className={`toast toast-${t.type}`} style={{ marginBottom: '0.5rem', pointerEvents: 'auto' }}>
            {t.type === 'gold' && <span style={{ fontSize: '1.3rem' }}>👑</span>}
            {t.type === 'success' && <span style={{ fontSize: '1.3rem' }}>✅</span>}
            {t.type === 'error' && <span style={{ fontSize: '1.3rem' }}>❌</span>}
            {t.type === 'info' && <span style={{ fontSize: '1.3rem' }}>⚡</span>}
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
