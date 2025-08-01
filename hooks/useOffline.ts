import { useState, useEffect, useCallback } from 'react';
import { offlineStorage, OfflineAPI, networkMonitor } from '@/lib/offline/offline-storage';
import { message } from 'antd';

interface OfflineState {
  isOnline: boolean;
  pendingActions: number;
  syncing: boolean;
}

export function useOffline() {
  const [state, setState] = useState<OfflineState>({
    isOnline: typeof window !== 'undefined' ? navigator.onLine : true,
    pendingActions: 0,
    syncing: false,
  });

  // Initialize offline storage
  useEffect(() => {
    const initOffline = async () => {
      try {
        await offlineStorage.init();
        const pendingActions = await offlineStorage.getPendingActions();
        setState(prev => ({ ...prev, pendingActions: pendingActions.length }));
      } catch (error) {
        console.error('Failed to initialize offline storage:', error);
      }
    };

    initOffline();
  }, []);

  // Monitor network status
  useEffect(() => {
    const handleStatusChange = async (online: boolean) => {
      setState(prev => ({ ...prev, isOnline: online }));
      
      if (online) {
        message.info('បានភ្ជាប់អ៊ីនធឺណិតឡើងវិញ');
        // Auto-sync when coming back online
        await syncData();
      } else {
        message.warning('អ្នកកំពុងប្រើប្រាស់ក្រៅបណ្តាញ');
      }
    };

    networkMonitor.addListener(handleStatusChange);
    
    return () => {
      networkMonitor.removeListener(handleStatusChange);
    };
  }, []);

  // Sync data function
  const syncData = useCallback(async () => {
    setState(prev => ({ ...prev, syncing: true }));
    
    try {
      const result = await offlineStorage.syncOfflineData();
      
      if (result.synced > 0) {
        message.success(`បានធ្វើសមកាលកម្ម ${result.synced} សកម្មភាព`);
      }
      
      if (result.failed > 0) {
        message.error(`មិនអាចធ្វើសមកាលកម្ម ${result.failed} សកម្មភាព`);
      }
      
      const remainingActions = await offlineStorage.getPendingActions();
      setState(prev => ({ 
        ...prev, 
        pendingActions: remainingActions.length,
        syncing: false,
      }));
    } catch (error) {
      console.error('Sync failed:', error);
      message.error('មានបញ្ហាក្នុងការធ្វើសមកាលកម្ម');
      setState(prev => ({ ...prev, syncing: false }));
    }
  }, []);

  // Clear cache
  const clearCache = useCallback(async () => {
    try {
      await offlineStorage.clearOldCache();
      message.success('បានសម្អាតឃ្លាំងសម្ងាត់');
    } catch (error) {
      console.error('Failed to clear cache:', error);
      message.error('មិនអាចសម្អាតឃ្លាំងសម្ងាត់បាន');
    }
  }, []);

  return {
    ...state,
    syncData,
    clearCache,
    OfflineAPI,
  };
}

// Hook for offline-capable data fetching
export function useOfflineData<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: {
    ttl?: number;
    refetchOnReconnect?: boolean;
  } = {}
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { isOnline } = useOffline();

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Try to get cached data first
      const cached = await offlineStorage.getCachedResponse(key);
      if (cached) {
        setData(cached);
        setLoading(false);
        
        // If online, fetch fresh data in background
        if (isOnline) {
          fetcher().then(freshData => {
            setData(freshData);
            offlineStorage.cacheResponse(key, freshData, options.ttl);
          }).catch(console.error);
        }
        return;
      }

      // No cache, fetch from network
      if (isOnline) {
        const freshData = await fetcher();
        setData(freshData);
        await offlineStorage.cacheResponse(key, freshData, options.ttl);
      } else {
        throw new Error('No cached data available offline');
      }
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [key, fetcher, isOnline, options.ttl]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Refetch when reconnecting
  useEffect(() => {
    if (isOnline && options.refetchOnReconnect) {
      fetchData();
    }
  }, [isOnline, options.refetchOnReconnect, fetchData]);

  return { data, loading, error, refetch: fetchData };
}