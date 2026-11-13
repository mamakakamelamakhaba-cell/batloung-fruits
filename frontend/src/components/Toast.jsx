import { useState, useCallback, createContext, useContext, useRef } from 'react';

const ToastContext = createContext(null);

let _toastId = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const push = useCallback((msg, type = 'success', duration = 3500) => {
    const id = ++_toastId;
    setToasts(ts => [...ts, { id, msg, type }]);
    setTimeout(() => setToasts(ts => ts.filter(t => t.id !== id)), duration);
  }, []);

  const dismiss = useCallback((id) => {
    setToasts(ts => ts.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={push}>
      {children}
      {toasts.length > 0 && (
        <div className="toast-container">
          {toasts.map(t => (
            <div
              key={t.id}
              className={`toast ${t.type}`}
              onClick={() => dismiss(t.id)}
              style={{ cursor: 'pointer' }}
            >
              <span style={{ fontSize: '16px', flexShrink: 0 }}>
                {t.type === 'success' ? '✅' : t.type === 'error' ? '❌' : 'ℹ️'}
              </span>
              <span style={{ flex: 1 }}>{t.msg}</span>
              <span style={{ fontSize: '12px', opacity: 0.6, marginLeft: '8px' }}>✕</span>
            </div>
          ))}
        </div>
      )}
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
