'use client';

import { useOffline } from '@/hooks/useOffline';
import { Badge, Button, Space, Tooltip } from 'antd';
import { CloudOutlined, CloudSyncOutlined, CloudOffOutlined } from '@ant-design/icons';

export function OfflineIndicator() {
  const { isOnline, pendingActions, syncing, syncData } = useOffline();

  if (isOnline && pendingActions === 0) {
    return null; // Don't show when fully synced and online
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Space>
        {!isOnline && (
          <Tooltip title="អ្នកកំពុងប្រើប្រាស់ក្រៅបណ្តាញ">
            <Badge
              count={<CloudOffOutlined style={{ color: '#ff4d4f' }} />}
              className="bg-white rounded-full p-2 shadow-lg"
            >
              <span className="text-sm px-2">ក្រៅបណ្តាញ</span>
            </Badge>
          </Tooltip>
        )}
        
        {pendingActions > 0 && (
          <Tooltip title={`សកម្មភាពរង់ចាំ: ${pendingActions}`}>
            <Badge
              count={pendingActions}
              className="bg-white rounded-full p-2 shadow-lg"
            >
              <Button
                type="text"
                icon={syncing ? <CloudSyncOutlined spin /> : <CloudOutlined />}
                onClick={syncData}
                disabled={!isOnline || syncing}
              >
                {syncing ? 'កំពុងធ្វើសមកាលកម្ម...' : 'ធ្វើសមកាលកម្ម'}
              </Button>
            </Badge>
          </Tooltip>
        )}
      </Space>
    </div>
  );
}