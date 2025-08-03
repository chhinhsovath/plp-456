'use client';

// Suppress specific console warnings
export function suppressWarnings() {
  if (typeof window === 'undefined') return;

  const originalWarn = console.warn;
  const originalError = console.error;

  // List of warnings to suppress
  const suppressPatterns = [
    'antd v5 support React is 16 ~ 18',
    '[antd: compatible]',
    'antd v5 support React',
    'see https://u.ant.design/v5-for-19',
    'Instance created by `useForm` is not connected to any Form element',
    'findDOMNode is deprecated in StrictMode',
    'Accessing element.ref was removed in React 19'
  ];

  console.warn = (...args) => {
    const message = args[0]?.toString() || '';
    if (suppressPatterns.some(pattern => message.includes(pattern))) {
      return;
    }
    originalWarn.apply(console, args);
  };

  console.error = (...args) => {
    const message = args[0]?.toString() || '';
    if (suppressPatterns.some(pattern => message.includes(pattern))) {
      return;
    }
    originalError.apply(console, args);
  };
}

// Call this function to activate warning suppression
suppressWarnings();