"use client";

import { useEffect, useState, useCallback, useRef } from 'react';
import styles from './Toast.module.css';

// Maximum number of toasts to prevent memory issues
const MAX_TOASTS = 5;

export interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  onClose?: () => void;
}

export function Toast({ message, type = 'success', duration = 3000, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [isLeaving, setIsLeaving] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isUnmountedRef = useRef(false);

  const handleClose = useCallback(() => {
    if (isUnmountedRef.current) return;
    
    setIsLeaving(true);
    setTimeout(() => {
      if (!isUnmountedRef.current) {
        setIsVisible(false);
        onClose?.();
      }
    }, 300);
  }, [onClose]);

  useEffect(() => {
    if (duration <= 0) return; // Don't auto-close if duration is 0 or negative
    
    timerRef.current = setTimeout(handleClose, duration);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [duration, handleClose]);

  useEffect(() => {
    return () => {
      isUnmountedRef.current = true;
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  if (!isVisible) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return (
          <svg className={styles.icon} viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
            <path d="M8 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        );
      case 'error':
        return (
          <svg className={styles.icon} viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
            <path d="M15 9l-6 6M9 9l6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        );
      case 'warning':
        return (
          <svg className={styles.icon} viewBox="0 0 24 24" fill="none">
            <path d="M12 9v4M12 17h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="currentColor" strokeWidth="2"/>
          </svg>
        );
      case 'info':
        return (
          <svg className={styles.icon} viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
            <path d="M12 16v-4M12 8h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        );
    }
  };

  return (
    <div className={`${styles.toast} ${styles[type]} ${isLeaving ? styles.leaving : ''}`}>
      <div className={styles.iconWrapper}>
        {getIcon()}
      </div>
      <div className={styles.content}>
        <p className={styles.message}>{message}</p>
      </div>
      <button 
        className={styles.closeButton} 
        onClick={handleClose}
        aria-label="Close notification"
        type="button"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M13 1L1 13M1 1l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
        </svg>
      </button>
    </div>
  );
}

// Toast container component
export function ToastContainer({ children }: { children: React.ReactNode }) {
  return <div className={styles.toastContainer}>{children}</div>;
}

// Hook for using toast with better type safety
type ToastCallback = (props: ToastProps) => void;
let toastCallback: ToastCallback | null = null;

export function useToast() {
  const show = useCallback((props: ToastProps | string) => {
    if (typeof props === 'string') {
      if (props.trim().length === 0) {
        console.warn('useToast: Empty message provided');
        return;
      }
      toastCallback?.({ message: props, type: 'success' });
    } else {
      if (!props.message || props.message.trim().length === 0) {
        console.warn('useToast: Invalid or empty message provided');
        return;
      }
      toastCallback?.(props);
    }
  }, []);

  const dismiss = useCallback((id?: string) => {
    // This would be implemented if we had ID-based dismissal
    console.log('Dismiss toast:', id);
  }, []);

  return { show, dismiss };
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Array<ToastProps & { id: string }>>([]);
  const toastIdCounterRef = useRef(0);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  useEffect(() => {
    toastCallback = (props: ToastProps) => {
      // Validate props
      if (!props.message || props.message.trim().length === 0) {
        console.warn('ToastProvider: Invalid message provided');
        return;
      }

      const id = `toast-${Date.now()}-${++toastIdCounterRef.current}`;
      
      setToasts(prev => {
        // Limit the number of toasts to prevent memory issues
        const newToasts = [...prev, { ...props, id }];
        if (newToasts.length > MAX_TOASTS) {
          return newToasts.slice(-MAX_TOASTS); // Keep only the last MAX_TOASTS
        }
        return newToasts;
      });
    };

    return () => {
      toastCallback = null;
    };
  }, []);

  return (
    <>
      {children}
      <ToastContainer>
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            duration={toast.duration}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </ToastContainer>
    </>
  );
}