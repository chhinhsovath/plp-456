'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react';
import styles from './Toast.module.css';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  onClose?: () => void;
  show: boolean;
}

const iconMap = {
  success: CheckCircle,
  error: XCircle,
  info: Info,
  warning: AlertTriangle,
};

const Toast: React.FC<ToastProps> = ({
  type,
  title,
  message,
  duration = 5000,
  onClose,
  show
}) => {
  const [visible, setVisible] = useState(show);
  const [isExiting, setIsExiting] = useState(false);
  const Icon = iconMap[type];

  useEffect(() => {
    if (show) {
      setVisible(true);
      setIsExiting(false);
      
      if (duration > 0) {
        const timer = setTimeout(() => {
          handleClose();
        }, duration);
        
        return () => clearTimeout(timer);
      }
    } else {
      handleClose();
    }
  }, [show, duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      setVisible(false);
      onClose?.();
    }, 300); // Match animation duration
  };

  if (!visible) return null;

  return (
    <div className={`${styles.toast} ${styles[type]} ${isExiting ? styles.exit : ''}`}>
      <div className={styles.iconContainer}>
        <Icon className={styles.icon} size={24} />
      </div>
      <div className={styles.content}>
        <h4 className={styles.title}>{title}</h4>
        {message && <p className={styles.message}>{message}</p>}
      </div>
      <button 
        className={styles.closeButton} 
        onClick={handleClose}
        aria-label="Close notification"
      >
        <X size={18} />
      </button>
    </div>
  );
};

// Toast Container Component
interface ToastContainerProps {
  children?: React.ReactNode;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ children }) => {
  return (
    <>
      {children}
      <div className={styles.toastContainer} id="toast-container" />
    </>
  );
};

// Hook for using toast notifications
interface ToastOptions {
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

export const useToast = () => {
  const showToast = (options: ToastOptions) => {
    // Create toast element
    const toastElement = document.createElement('div');
    const container = document.getElementById('toast-container') || document.body;
    
    // Create a root for the toast
    const root = require('react-dom/client').createRoot(toastElement);
    
    // Render the toast
    root.render(
      <Toast
        {...options}
        show={true}
        onClose={() => {
          root.unmount();
          toastElement.remove();
        }}
      />
    );
    
    container.appendChild(toastElement);
  };

  return {
    success: (title: string, message?: string, duration?: number) =>
      showToast({ type: 'success', title, message, duration }),
    error: (title: string, message?: string, duration?: number) =>
      showToast({ type: 'error', title, message, duration }),
    info: (title: string, message?: string, duration?: number) =>
      showToast({ type: 'info', title, message, duration }),
    warning: (title: string, message?: string, duration?: number) =>
      showToast({ type: 'warning', title, message, duration }),
  };
};

export default Toast;