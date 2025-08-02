'use client';

import { App } from 'antd';

/**
 * Custom hooks to use Ant Design's App utilities
 * This ensures compatibility with the App component's context
 */

export function useMessage() {
  const { message } = App.useApp();
  return message;
}

export function useModal() {
  const { modal } = App.useApp();
  return modal;
}

export function useNotification() {
  const { notification } = App.useApp();
  return notification;
}

// Export the entire App.useApp hook for cases where all utilities are needed
export function useAntdApp() {
  return App.useApp();
}