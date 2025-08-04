'use client';

import React, { useState, useEffect, ReactNode } from 'react';
import { Skeleton, Alert, Card, Empty, Spin, Button, Space, Result } from 'antd';
import { 
  WifiOutlined, 
  ReloadOutlined, 
  CloudOutlined, 
  ExclamationCircleOutlined,
  DatabaseOutlined,
  ApiOutlined 
} from '@ant-design/icons';

// Service status types
export type ServiceStatus = 'online' | 'offline' | 'degraded' | 'unknown';

export interface ServiceState {
  status: ServiceStatus;
  lastChecked: Date;
  error?: string;
}

export interface GracefulDegradationProps {
  children: ReactNode;
  fallback?: ReactNode;
  serviceName?: string;
  checkInterval?: number;
  retryButton?: boolean;
  showOfflineMessage?: boolean;
  degradedMode?: ReactNode;
  onServiceStatusChange?: (status: ServiceStatus) => void;
}

// Context for service status
const ServiceStatusContext = React.createContext<{
  services: Record<string, ServiceState>;
  updateServiceStatus: (service: string, status: ServiceStatus, error?: string) => void;
  isOnline: boolean;
}>({
  services: {},
  updateServiceStatus: () => {},
  isOnline: true,
});

// Service Status Provider
export const ServiceStatusProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [services, setServices] = useState<Record<string, ServiceState>>({});
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const updateServiceStatus = (service: string, status: ServiceStatus, error?: string) => {
    setServices(prev => ({
      ...prev,
      [service]: {
        status,
        lastChecked: new Date(),
        error,
      },
    }));
  };

  return (
    <ServiceStatusContext.Provider value={{ services, updateServiceStatus, isOnline }}>
      {children}
    </ServiceStatusContext.Provider>
  );
};

// Hook to use service status
export const useServiceStatus = (serviceName?: string) => {
  const context = React.useContext(ServiceStatusContext);
  const service = serviceName ? context.services[serviceName] : null;
  
  return {
    ...context,
    serviceStatus: service?.status || 'unknown',
    serviceError: service?.error,
    lastChecked: service?.lastChecked,
  };
};

// Main Graceful Degradation Component
export const GracefulDegradation: React.FC<GracefulDegradationProps> = ({
  children,
  fallback,
  serviceName = 'default',
  checkInterval = 30000,
  retryButton = true,
  showOfflineMessage = true,
  degradedMode,
  onServiceStatusChange,
}) => {
  const { updateServiceStatus, serviceStatus, serviceError, isOnline } = useServiceStatus(serviceName);
  const [isRetrying, setIsRetrying] = useState(false);

  // Health check function
  const performHealthCheck = async () => {
    try {
      const response = await fetch('/api/health', {
        method: 'GET',
        headers: { 'Cache-Control': 'no-cache' },
      });

      if (response.ok) {
        updateServiceStatus(serviceName, 'online');
        onServiceStatusChange?.('online');
      } else {
        updateServiceStatus(serviceName, 'degraded', `HTTP ${response.status}`);
        onServiceStatusChange?.('degraded');
      }
    } catch (error) {
      updateServiceStatus(serviceName, 'offline', (error as Error).message);
      onServiceStatusChange?.('offline');
    }
  };

  // Retry function
  const handleRetry = async () => {
    setIsRetrying(true);
    await performHealthCheck();
    setTimeout(() => setIsRetrying(false), 1000);
  };

  // Periodic health check
  useEffect(() => {
    performHealthCheck();
    const interval = setInterval(performHealthCheck, checkInterval);
    return () => clearInterval(interval);
  }, [serviceName, checkInterval]);

  // Network status effect
  useEffect(() => {
    if (!isOnline && showOfflineMessage) {
      updateServiceStatus(serviceName, 'offline', 'No internet connection');
    } else if (isOnline && serviceStatus === 'offline') {
      performHealthCheck();
    }
  }, [isOnline, showOfflineMessage]);

  // Render offline fallback
  if (!isOnline && showOfflineMessage) {
    return (
      <OfflineFallback 
        onRetry={retryButton ? handleRetry : undefined}
        isRetrying={isRetrying}
      />
    );
  }

  // Render service offline fallback
  if (serviceStatus === 'offline') {
    if (fallback) {
      return <>{fallback}</>;
    }
    return (
      <ServiceOfflineFallback
        serviceName={serviceName}
        error={serviceError}
        onRetry={retryButton ? handleRetry : undefined}
        isRetrying={isRetrying}
      />
    );
  }

  // Render degraded mode
  if (serviceStatus === 'degraded' && degradedMode) {
    return <>{degradedMode}</>;
  }

  // Render children if service is online or unknown
  return <>{children}</>;
};

// Offline Fallback Component
const OfflineFallback: React.FC<{
  onRetry?: () => void;
  isRetrying?: boolean;
}> = ({ onRetry, isRetrying }) => (
  <div className="flex flex-col items-center justify-center min-h-[200px] p-8">
    <Result
      icon={<WifiOutlined style={{ color: '#ff4d4f' }} />}
      title="គ្មានការភ្ជាប់អ៊ីនធឺណិត"
      subTitle="សូមពិនិត្យការភ្ជាប់អ៊ីនធឺណិតរបស់អ្នក និងព្យាយាមម្តងទៀត។"
      extra={
        onRetry && (
          <Button 
            type="primary" 
            icon={<ReloadOutlined />} 
            onClick={onRetry}
            loading={isRetrying}
          >
            ព្យាយាមម្តងទៀត
          </Button>
        )
      }
    />
  </div>
);

// Service Offline Fallback Component
const ServiceOfflineFallback: React.FC<{
  serviceName: string;
  error?: string;
  onRetry?: () => void;
  isRetrying?: boolean;
}> = ({ serviceName, error, onRetry, isRetrying }) => (
  <div className="flex flex-col items-center justify-center min-h-[200px] p-8">
    <Result
      icon={<CloudOutlined style={{ color: '#ff4d4f' }} />}
      title="សេវាកម្មមិនអាចប្រើបានទេ"
      subTitle={`សេវាកម្ម ${serviceName} កំពុងមានបញ្ហា។ សូមព្យាយាមម្តងទៀតក្នុងពេលបន្តិច។`}
      extra={
        <Space direction="vertical" align="center">
          {error && (
            <Alert
              message="ព័ត៌មានបច្ចេកទេស"
              description={error}
              type="warning"
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}
          {onRetry && (
            <Button 
              type="primary" 
              icon={<ReloadOutlined />} 
              onClick={onRetry}
              loading={isRetrying}
            >
              ព្យាយាមម្តងទៀត
            </Button>
          )}
        </Space>
      }
    />
  </div>
);

// Data Loading with Graceful Degradation
export const DataLoader: React.FC<{
  children: ReactNode;
  loading?: boolean;
  error?: Error | null;
  empty?: boolean;
  emptyMessage?: string;
  skeleton?: ReactNode;
  retryFn?: () => void;
}> = ({ 
  children, 
  loading, 
  error, 
  empty, 
  emptyMessage = 'គ្មានទិន្នន័យ',
  skeleton,
  retryFn 
}) => {
  if (loading) {
    return skeleton || <DataSkeleton />;
  }

  if (error) {
    return (
      <Alert
        message="មានបញ្ហាក្នុងការទាញយកទិន្នន័យ"
        description={error.message}
        type="error"
        showIcon
        action={
          retryFn && (
            <Button size="small" onClick={retryFn}>
              ព្យាយាមម្តងទៀត
            </Button>
          )
        }
      />
    );
  }

  if (empty) {
    return (
      <Empty
        description={emptyMessage}
        image={Empty.PRESENTED_IMAGE_SIMPLE}
      />
    );
  }

  return <>{children}</>;
};

// Default Skeleton Component
const DataSkeleton: React.FC = () => (
  <Card>
    <Skeleton active paragraph={{ rows: 4 }} />
  </Card>
);

// Chart Skeleton Component
export const ChartSkeleton: React.FC = () => (
  <Card>
    <Skeleton.Input style={{ width: '100%', height: 300 }} active />
    <div style={{ marginTop: 16 }}>
      <Skeleton active paragraph={{ rows: 2 }} />
    </div>
  </Card>
);

// Table Skeleton Component
export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => (
  <Card>
    {Array.from({ length: rows }).map((_, index) => (
      <div key={index} style={{ marginBottom: 16 }}>
        <Skeleton active paragraph={{ rows: 1 }} />
      </div>
    ))}
  </Card>
);

// Service Status Indicator
export const ServiceStatusIndicator: React.FC<{
  serviceName: string;
  showLabel?: boolean;
}> = ({ serviceName, showLabel = true }) => {
  const { serviceStatus, serviceError } = useServiceStatus(serviceName);

  const getStatusConfig = (status: ServiceStatus) => {
    switch (status) {
      case 'online':
        return { color: '#52c41a', icon: <DatabaseOutlined />, text: 'ដំណើរការធម្មតា' };
      case 'degraded':
        return { color: '#faad14', icon: <ExclamationCircleOutlined />, text: 'ដំណើរការយឺត' };
      case 'offline':
        return { color: '#ff4d4f', icon: <ApiOutlined />, text: 'មិនអាចប្រើបាន' };
      default:
        return { color: '#d9d9d9', icon: <ApiOutlined />, text: 'មិនស្គាល់ស្ថានភាព' };
    }
  };

  const config = getStatusConfig(serviceStatus);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          backgroundColor: config.color,
        }}
      />
      {showLabel && (
        <span style={{ fontSize: 12, color: '#666' }}>
          {config.text}
        </span>
      )}
    </div>
  );
};

// Progressive Enhancement Component
export const ProgressiveEnhancement: React.FC<{
  children: ReactNode;
  fallback: ReactNode;
  condition: boolean;
}> = ({ children, fallback, condition }) => {
  return condition ? <>{children}</> : <>{fallback}</>;
};

// Network Quality Indicator
export const NetworkQualityIndicator: React.FC = () => {
  const [quality, setQuality] = useState<'good' | 'poor' | 'offline'>('good');
  const { isOnline } = useServiceStatus();

  useEffect(() => {
    if (!isOnline) {
      setQuality('offline');
      return;
    }

    // Simple network quality check based on connection type
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      if (connection) {
        const { effectiveType } = connection;
        setQuality(effectiveType === 'slow-2g' || effectiveType === '2g' ? 'poor' : 'good');
      }
    }
  }, [isOnline]);

  const getQualityConfig = () => {
    switch (quality) {
      case 'good':
        return { color: '#52c41a', text: 'បណ្តាញល្អ' };
      case 'poor':
        return { color: '#faad14', text: 'បណ្តាញយឺត' };
      case 'offline':
        return { color: '#ff4d4f', text: 'គ្មានបណ្តាញ' };
    }
  };

  const config = getQualityConfig();

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <WifiOutlined style={{ color: config.color, fontSize: 12 }} />
      <span style={{ fontSize: 11, color: config.color }}>
        {config.text}
      </span>
    </div>
  );
};

// Optimistic Update Component
export const OptimisticUpdate: React.FC<{
  children: ReactNode;
  pendingState: ReactNode;
  isPending: boolean;
  error?: Error | null;
  onRetry?: () => void;
}> = ({ children, pendingState, isPending, error, onRetry }) => {
  if (error) {
    return (
      <div style={{ position: 'relative' }}>
        {children}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(255, 77, 79, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 4,
          }}
        >
          <Alert
            message="បរាជ័យក្នុងការរក្សាទុក"
            type="error"
            action={
              onRetry && (
                <Button size="small" onClick={onRetry}>
                  ព្យាយាមម្តងទៀត
                </Button>
              )
            }
          />
        </div>
      </div>
    );
  }

  if (isPending) {
    return (
      <div style={{ position: 'relative' }}>
        {pendingState}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.05)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 4,
          }}
        >
          <Spin size="small" />
        </div>
      </div>
    );
  }

  return <>{children}</>;
};