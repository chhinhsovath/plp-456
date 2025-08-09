// Simple toast utility for showing notifications
export function showToast(message: string, type: 'success' | 'error' | 'warning' | 'info' = 'success') {
  // Create container if it doesn't exist
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 99999;
      display: flex;
      flex-direction: column;
      gap: 12px;
    `;
    document.body.appendChild(container);
  }

  // Create toast element
  const toast = document.createElement('div');
  const toastId = `toast-${Date.now()}`;
  toast.id = toastId;
  
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
    animation: slideIn 0.3s ease-out;
    position: relative;
    border-left: 4px solid ${colors[type]};
  `;

  toast.innerHTML = `
    <div style="
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
    ">
      ${icons[type]}
    </div>
    <div style="flex: 1;">
      <p style="margin: 0; font-size: 15px; font-weight: 500; color: #1a1a1a; line-height: 1.5;">
        ${message}
      </p>
    </div>
    <button onclick="document.getElementById('${toastId}').remove()" style="
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
    ">×</button>
  `;

  // Add animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from { transform: translateX(400px); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
      from { transform: translateX(0); opacity: 1; }
      to { transform: translateX(400px); opacity: 0; }
    }
  `;
  
  if (!document.querySelector('#toast-animations')) {
    style.id = 'toast-animations';
    document.head.appendChild(style);
  }

  container.appendChild(toast);

  // Auto remove after 3 seconds
  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease-out';
    setTimeout(() => {
      toast.remove();
      // Remove container if empty
      if (container && container.children.length === 0) {
        container.remove();
      }
    }, 300);
  }, 3000);
}