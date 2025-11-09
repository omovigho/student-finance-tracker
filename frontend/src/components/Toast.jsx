import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { XMarkIcon } from '@heroicons/react/24/outline';
import clsx from 'clsx';

const ToastContext = createContext({
  pushToast: () => {},
  dismissToast: () => {}
});

const createId = () => {
  if (typeof crypto !== 'undefined' && crypto?.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const shouldReduceMotion = useReducedMotion();

  const dismissToast = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const pushToast = useCallback((message, variant = 'success') => {
    const id = createId();
    setToasts((current) => [...current, { id, message, variant }]);
    const timeout = window.setTimeout(() => dismissToast(id), 5000);
    return () => {
      window.clearTimeout(timeout);
      dismissToast(id);
    };
  }, [dismissToast]);

  const value = useMemo(() => ({ pushToast, dismissToast }), [pushToast, dismissToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-0 flex flex-col items-end gap-2 px-4 py-6 sm:px-6">
        <AnimatePresence initial={false}>
          {toasts.map((toast) => (
            <motion.div
              key={toast.id}
              initial={shouldReduceMotion ? false : { opacity: 0, x: 40 }}
              animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, x: 0 }}
              exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: 40 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className={clsx(
                'pointer-events-auto w-full max-w-sm rounded-xl border px-4 py-3 shadow-soft backdrop-blur-sm',
                toast.variant === 'error' && 'border-red-200 bg-white text-red-700',
                toast.variant === 'success' && 'border-emerald-200 bg-white text-emerald-700',
                toast.variant === 'info' && 'border-primary/20 bg-white text-primary'
              )}
            >
              <div className="flex items-start gap-3">
                <p className="text-sm font-medium leading-6">{toast.message}</p>
                <button
                  type="button"
                  onClick={() => dismissToast(toast.id)}
                  className="rounded-full p-1 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                  aria-label="Close notification"
                >
                  <XMarkIcon className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => useContext(ToastContext);

const Toast = ({ message, variant = 'success', onClose }) => {
  const shouldReduceMotion = useReducedMotion();
  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
      animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0 }}
      exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 10 }}
      className={clsx(
        'pointer-events-auto flex w-full max-w-sm items-center justify-between rounded-xl border px-4 py-3 shadow-sm',
        variant === 'error' && 'border-red-200 bg-red-50 text-red-700',
        variant === 'success' && 'border-emerald-200 bg-emerald-50 text-emerald-700',
        variant === 'info' && 'border-primary/20 bg-blue-50 text-primary'
      )}
    >
      <p className="text-sm font-medium leading-6">{message}</p>
      <button
        type="button"
        onClick={onClose}
        className="rounded-full p-1 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        aria-label="Close notification"
      >
        <XMarkIcon className="h-4 w-4" aria-hidden="true" />
      </button>
    </motion.div>
  );
};

export default Toast;
