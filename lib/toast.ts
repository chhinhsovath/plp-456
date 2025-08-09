// Toast type definitions
export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastOptions {
  duration?: number;
  persistent?: boolean;
  id?: string;
}

interface ActiveToast {
  id: string;
  element: HTMLElement;
  timer?: NodeJS.Timeout;
}

// Active toast tracking to prevent memory leaks
const activeToasts = new Map<string, ActiveToast>();
let toastCounter = 0;

// Cleanup function for when page unloads
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    activeToasts.forEach(toast => {
      if (toast.timer) clearTimeout(toast.timer);
      toast.element.remove();
    });
    activeToasts.clear();
  });
}

// Sanitize message content to prevent XSS
function sanitizeMessage(message: string): string {
  if (typeof message !== 'string') return '';
  const div = document.createElement('div');
  div.textContent = message;
  return div.innerHTML.slice(0, 500); // Limit length
}

// Simple toast utility for showing notifications
export function showToast(
  message: string, 
  type: ToastType = 'success', 
  options: ToastOptions = {}
): string | null {
  // Input validation
  if (!message || typeof message !== 'string') {
    console.warn('showToast: Invalid message provided');
    return null;
  }

  if (!['success', 'error', 'warning', 'info'].includes(type)) {
    console.warn('showToast: Invalid toast type provided');
    type = 'info';
  }

  // Generate unique ID
  const toastId = options.id || `toast-${Date.now()}-${++toastCounter}`;
  
  // Remove existing toast with same ID if any
  if (activeToasts.has(toastId)) {
    removeToast(toastId);
  }

  // Create container if it doesn't exist
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.setAttribute('aria-live', 'polite');
    container.setAttribute('aria-label', 'Notifications');
    container.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 99999;
      display: flex;
      flex-direction: column;
      gap: 12px;
      max-width: 500px;
      pointer-events: none;
    `;
    document.body.appendChild(container);
  }

  // Create toast element
  const toast = document.createElement('div');
  toast.id = toastId;
  toast.setAttribute('role', 'alert');
  toast.setAttribute('aria-live', 'assertive');
  
  // Set color based on type
  const colors = {
    success: '#52c41a',
    error: '#ff4d4f',
    warning: '#faad14',
    info: '#1890ff'
  };
  
  const bgColors = {
    success: '#f6ffed',
    error: '#fff2f0',
    warning: '#fffbe6',
    info: '#e6f7ff'
  };

  const icons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ'
  };

  toast.style.cssText = `
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 320px;
    max-width: 500px;
    padding: 16px;
    background: white;
    border-radius: 12px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
    position: relative;
    border-left: 4px solid ${colors[type]};
    pointer-events: auto;
  `;

  // Create icon element
  const iconElement = document.createElement('div');
  iconElement.style.cssText = `
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: ${bgColors[type]};
    color: ${colors[type]};
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: bold;
    font-size: 18px;
    flex-shrink: 0;
  `;
  iconElement.textContent = icons[type];

  // Create message element
  const messageElement = document.createElement('div');
  messageElement.style.cssText = 'flex: 1; padding: 0 8px;';
  const messageText = document.createElement('p');
  messageText.style.cssText = 'margin: 0; font-size: 15px; font-weight: 500; color: #1a1a1a; line-height: 1.5;';
  messageText.innerHTML = sanitizeMessage(message);
  messageElement.appendChild(messageText);

  // Create close button
  const closeButton = document.createElement('button');
  closeButton.style.cssText = `
    position: absolute;
    top: 8px;
    right: 8px;
    width: 24px;
    height: 24px;
    border: none;
    background: transparent;
    color: #8c8c8c;
    cursor: pointer;
    font-size: 18px;
    line-height: 1;
    padding: 0;
    border-radius: 4px;
    transition: background-color 0.2s;
  `;
  closeButton.textContent = '×';
  closeButton.setAttribute('aria-label', 'Close notification');
  closeButton.addEventListener('click', () => removeToast(toastId));
  closeButton.addEventListener('mouseenter', () => {
    closeButton.style.backgroundColor = 'rgba(0,0,0,0.1)';
  });
  closeButton.addEventListener('mouseleave', () => {
    closeButton.style.backgroundColor = 'transparent';
  });

  // Assemble toast
  toast.appendChild(iconElement);
  toast.appendChild(messageElement);
  toast.appendChild(closeButton);

  // Add animation styles if not already present
  if (!document.querySelector('#toast-animations')) {
    const style = document.createElement('style');
    style.id = 'toast-animations';
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(400px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(400px); opacity: 0; }
      }
      .toast-entering { animation: slideIn 0.3s ease-out; }
      .toast-exiting { animation: slideOut 0.3s ease-out; }
    `;
    document.head.appendChild(style);
  }

  // Add initial animation class
  toast.classList.add('toast-entering');
  
  container.appendChild(toast);

  // Set up auto-removal timer (unless persistent)
  let timer: NodeJS.Timeout | undefined;
  const duration = options.duration ?? 3000;
  
  if (!options.persistent && duration > 0) {
    timer = setTimeout(() => {
      removeToast(toastId);
    }, duration);
  }

  // Track active toast
  activeToasts.set(toastId, { id: toastId, element: toast, timer });
  
  // Return toast ID for manual removal
  return toastId;
}

// Function to remove a specific toast
export function removeToast(toastId: string): void {
  const activeToast = activeToasts.get(toastId);
  if (!activeToast) return;
  
  const { element, timer } = activeToast;
  
  // Clear timer
  if (timer) {
    clearTimeout(timer);
  }
  
  // Add exit animation
  element.classList.remove('toast-entering');
  element.classList.add('toast-exiting');
  
  // Remove after animation
  setTimeout(() => {
    try {
      element.remove();
      activeToasts.delete(toastId);
      
      // Clean up container if empty
      const container = document.getElementById('toast-container');
      if (container && container.children.length === 0) {
        container.remove();
      }
    } catch (error) {
      console.warn('Error removing toast:', error);
    }
  }, 300);
}

// Function to remove all toasts
export function removeAllToasts(): void {
  activeToasts.forEach((_, toastId) => {
    removeToast(toastId);
  });
}

// Function to check if a toast with given ID exists
export function hasToast(toastId: string): boolean {
  return activeToasts.has(toastId);
}