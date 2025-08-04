'use client';

import { Spin, ConfigProvider } from 'antd';
import khKH from 'antd/locale/km_KH';

interface PageLoadingProps {
  tip?: string;
  size?: 'small' | 'default' | 'large';
  fullScreen?: boolean;
}

export default function PageLoading({ 
  tip = 'កំពុងផ្ទុក...', 
  size = 'large',
  fullScreen = true 
}: PageLoadingProps) {
  const content = (
    <div 
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '16px',
        padding: '40px',
        ...(fullScreen ? {
          minHeight: '100vh',
          backgroundColor: '#f0f2f5'
        } : {})
      }}
    >
      <Spin size={size} />
      {tip && (
        <div style={{ 
          fontSize: '16px', 
          color: '#666',
          fontFamily: "'Hanuman', 'Noto Sans Khmer', sans-serif"
        }}>
          {tip}
        </div>
      )}
    </div>
  );

  return (
    <ConfigProvider locale={khKH}>
      {content}
    </ConfigProvider>
  );
}