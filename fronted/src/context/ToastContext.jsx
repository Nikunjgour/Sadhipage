// Ye ToastContext pure application me notification messages (success/error/info) show karne ke liye hai
import React, { createContext, useContext, useState, useCallback } from 'react';
import Toast from '../components/Toast';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  // toasts list state me store hoti hai
  const [toasts, setToasts] = useState([]);

  // Toast add karne ka function (message, type = 'success' | 'error' | 'info')
  const addToast = useCallback((message, type = 'success', duration = 4000) => {
    const id = Date.now() + Math.random();
    setToasts((prevToasts) => [...prevToasts, { id, message, type }]);

    // Specified duration ke baad auto-remove
    setTimeout(() => {
      removeToast(id);
    }, duration);
  }, []);

  // Toast remove karne ka helper function
  const removeToast = useCallback((id) => {
    setToasts((prevToasts) => prevToasts.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      {/* Screen ke corner me toasts render hote hain */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <Toast toast={toast} onClose={() => removeToast(toast.id)} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

// Custom hook: components me toast call karne ke liye
export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
