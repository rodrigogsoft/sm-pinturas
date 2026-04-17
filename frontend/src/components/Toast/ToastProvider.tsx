import React, { useState, useCallback, useEffect } from 'react';
import { Snackbar, Alert } from '@mui/material';
import { AlertColor } from '@mui/material';

export interface ToastMessage {
  id?: string;
  message: string;
  severity: AlertColor;
  duration?: number;
  action?: React.ReactNode;
}

export interface ToastContextType {
  showToast: (message: ToastMessage) => void;
  hideToast: (id?: string) => void;
}

export const ToastContext = React.createContext<ToastContextType | undefined>(undefined);

/**
 * Hook para usar Toast em qualquer componente
 * Exemplo:
 * const { showToast } = useToast();
 * showToast({
 *   message: 'Sucesso!',
 *   severity: 'success',
 *   duration: 3000
 * });
 */
export const useToast = () => {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('useToast deve ser usado dentro de ToastProvider');
  }
  return context;
};

/**
 * Componente Toast Provider
 * Deve ser colocado no topo da aplicação, acima de qualquer página que use Toast
 */
export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const showToast = useCallback((message: ToastMessage) => {
    const id = message.id || `toast-${Date.now()}-${Math.random()}`;
    const duration = message.duration ?? 4000;

    setToasts((prev) => [
      ...prev,
      {
        ...message,
        id,
      },
    ]);

    // Auto-remove após duração
    if (duration > 0) {
      setTimeout(() => {
        hideToast(id);
      }, duration);
    }
  }, []);

  const hideToast = useCallback((id?: string) => {
    if (id) {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    } else {
      setToasts([]);
    }
  }, []);

  const value: ToastContextType = {
    showToast,
    hideToast,
  };

  useEffect(() => {
    const globalToast = (opts: { message: string; severity: string }) => {
      const severity = (opts?.severity || 'info') as AlertColor;
      showToast({ message: opts?.message || '', severity });
    };

    (window as any).showToast = globalToast;

    return () => {
      if ((window as any).showToast === globalToast) {
        delete (window as any).showToast;
      }
    };
  }, [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} onClose={hideToast} />
    </ToastContext.Provider>
  );
};

/**
 * Container que renderiza todos os Toasts
 */
const ToastContainer: React.FC<{
  toasts: ToastMessage[];
  onClose: (id: string) => void;
}> = ({ toasts, onClose }) => {
  return (
    <>
      {toasts.map((toast) => (
        <ToastItem
          key={toast.id}
          toast={toast}
          onClose={() => onClose(toast.id!)}
        />
      ))}
    </>
  );
};

/**
 * Item individual de Toast com animação
 */
const ToastItem: React.FC<{
  toast: ToastMessage;
  onClose: () => void;
}> = ({ toast, onClose }) => {
  const isError = toast.severity === 'error';

  return (
    <Snackbar
      open={true}
      autoHideDuration={toast.duration ?? 4000}
      onClose={onClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
    >
      <Alert
        onClose={onClose}
        severity={toast.severity}
        sx={{
          width: '100%',
          minWidth: '300px',
          maxWidth: '500px',
          boxShadow: 3,
          animation: isError ? 'shake 0.5s ease-in-out' : 'none',
          '@keyframes shake': {
            '0%, 100%': {
              transform: 'translateX(0)',
            },
            '25%': {
              transform: 'translateX(-10px)',
            },
            '75%': {
              transform: 'translateX(10px)',
            },
          },
        }}
        action={toast.action}
      >
        {toast.message}
      </Alert>
    </Snackbar>
  );
};
