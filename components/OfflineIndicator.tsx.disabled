'use client';

import { useState, useEffect } from 'react';
import { Badge, Button, Space, Tooltip } from 'antd';
import { CloudOutlined, CloudSyncOutlined, DisconnectOutlined, WifiOutlined } from '@ant-design/icons';
import { App } from 'antd';
// Removed offline storage imports as we're using server-side storage now

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const { message } = App.useApp();

  useEffect(() => {
    // Check initial online status
    setIsOnline(navigator.onLine);
    updatePendingCount();

    // Set up listeners
    const handleOnline = () => {
      setIsOnline(true);
      // Auto-sync when coming back online
      handleSync();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check pending observations periodically
    const interval = setInterval(() => {
      updatePendingCount();
    }, 10000); // Every 10 seconds

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  const updatePendingCount = async () => {
    // This can be implemented to check server-side draft count if needed
    setPendingCount(0);
  };

  const handleSync = async () => {
    if (!isOnline || isSyncing) return;

    setIsSyncing(true);
    try {
      // Server-side drafts are automatically available when online
      message.info('Data is automatically synced with server');
      await updatePendingCount();
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  if (isOnline && pendingCount === 0) {
    return null; // Don't show when fully synced and online
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Space>
        {!isOnline && (
          <Tooltip title="You are working offline">
            <Badge
              count={<DisconnectOutlined style={{ color: '#ff4d4f' }} />}
              className="bg-white rounded-full p-2 shadow-lg"
            >
              <span className="text-sm px-2">Offline</span>
            </Badge>
          </Tooltip>
        )}
        
        {pendingCount > 0 && (
          <Tooltip title={`Pending observations: ${pendingCount}`}>
            <Badge
              count={pendingCount}
              className="bg-white rounded-full p-2 shadow-lg"
            >
              <Button
                type="text"
                icon={isSyncing ? <CloudSyncOutlined spin /> : <CloudOutlined />}
                onClick={handleSync}
                disabled={!isOnline || isSyncing}
              >
                {isSyncing ? 'Syncing...' : 'Sync'}
              </Button>
            </Badge>
          </Tooltip>
        )}
      </Space>
    </div>
  );
}