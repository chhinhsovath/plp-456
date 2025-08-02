// IndexedDB wrapper for offline storage
class OfflineStorage {
  private dbName = 'PLPMentoringOffline';
  private version = 1;
  private db: IDBDatabase | null = null;

  // Store names
  private stores = {
    sessions: 'mentoring_sessions',
    observations: 'observations',
    feedback: 'feedback',
    resources: 'resources',
    pendingActions: 'pending_actions',
    cache: 'api_cache',
  };

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create stores if they don't exist
        Object.values(this.stores).forEach(storeName => {
          if (!db.objectStoreNames.contains(storeName)) {
            const store = db.createObjectStore(storeName, { 
              keyPath: 'id',
              autoIncrement: storeName === this.stores.pendingActions 
            });

            // Add indexes
            if (storeName === this.stores.sessions) {
              store.createIndex('relationshipId', 'relationshipId', { unique: false });
              store.createIndex('scheduledDate', 'scheduledDate', { unique: false });
            }
            if (storeName === this.stores.cache) {
              store.createIndex('url', 'url', { unique: true });
              store.createIndex('timestamp', 'timestamp', { unique: false });
            }
          }
        });
      };
    });
  }

  // Save data to IndexedDB
  async save(storeName: string, data: any): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(data);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Get data from IndexedDB
  async get(storeName: string, id: string): Promise<any> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Get all data from a store
  async getAll(storeName: string): Promise<any[]> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  // Delete data
  async delete(storeName: string, id: string): Promise<void> {
    if (!this.db) await this.init();
    
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([storeName], 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Queue action for sync
  async queueAction(action: {
    url: string;
    method: string;
    headers?: any;
    body?: any;
    timestamp?: number;
  }): Promise<void> {
    const actionWithTimestamp = {
      ...action,
      timestamp: action.timestamp || Date.now(),
    };
    
    await this.save(this.stores.pendingActions, actionWithTimestamp);
    
    // Request background sync if available
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
      const registration = await navigator.serviceWorker.ready;
      await (registration as any).sync.register('sync-mentoring-data');
    }
  }

  // Cache API response
  async cacheResponse(url: string, data: any, ttl: number = 3600000): Promise<void> {
    await this.save(this.stores.cache, {
      id: url,
      url,
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  // Get cached response
  async getCachedResponse(url: string): Promise<any | null> {
    const cached = await this.get(this.stores.cache, url);
    
    if (!cached) return null;
    
    // Check if cache is still valid
    if (Date.now() - cached.timestamp > cached.ttl) {
      await this.delete(this.stores.cache, url);
      return null;
    }
    
    return cached.data;
  }

  // Clear old cache entries
  async clearOldCache(): Promise<void> {
    const allCache = await this.getAll(this.stores.cache);
    const now = Date.now();
    
    for (const item of allCache) {
      if (now - item.timestamp > item.ttl) {
        await this.delete(this.stores.cache, item.id);
      }
    }
  }

  // Get pending actions
  async getPendingActions(): Promise<any[]> {
    return this.getAll(this.stores.pendingActions);
  }

  // Clear pending action
  async clearPendingAction(id: string): Promise<void> {
    await this.delete(this.stores.pendingActions, id);
  }

  // Sync offline data
  async syncOfflineData(): Promise<{ 
    synced: number; 
    failed: number; 
    errors: any[] 
  }> {
    const pendingActions = await this.getPendingActions();
    let synced = 0;
    let failed = 0;
    const errors: any[] = [];

    for (const action of pendingActions) {
      try {
        const response = await fetch(action.url, {
          method: action.method,
          headers: action.headers,
          body: action.body ? JSON.stringify(action.body) : undefined,
        });

        if (response.ok) {
          await this.clearPendingAction(action.id);
          synced++;
        } else {
          failed++;
          errors.push({
            action,
            error: `HTTP ${response.status}: ${response.statusText}`,
          });
        }
      } catch (error) {
        failed++;
        errors.push({ action, error });
      }
    }

    return { synced, failed, errors };
  }
}

// Singleton instance
export const offlineStorage = new OfflineStorage();

// Offline-capable API wrapper
export class OfflineAPI {
  static async fetch(url: string, options: RequestInit = {}): Promise<Response> {
    const isOnline = navigator.onLine;
    
    // Try online first
    if (isOnline) {
      try {
        const response = await fetch(url, options);
        
        // Cache successful GET requests
        if (options.method === 'GET' && response.ok) {
          const data = await response.clone().json();
          await offlineStorage.cacheResponse(url, data);
        }
        
        return response;
      } catch (error) {
        // Fall through to offline handling
      }
    }

    // Handle offline scenarios
    if (options.method === 'GET') {
      // Try to get from cache
      const cachedData = await offlineStorage.getCachedResponse(url);
      if (cachedData) {
        return new Response(JSON.stringify(cachedData), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    } else {
      // Queue non-GET requests for sync
      await offlineStorage.queueAction({
        url,
        method: options.method || 'POST',
        headers: options.headers,
        body: options.body ? JSON.parse(options.body as string) : undefined,
      });
      
      // Return a synthetic response
      return new Response(JSON.stringify({ 
        queued: true, 
        message: 'Action queued for sync' 
      }), {
        status: 202,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // If no cached data available
    throw new Error('No network connection and no cached data available');
  }
}

// Network status monitor
export class NetworkMonitor {
  private listeners: Set<(online: boolean) => void> = new Set();

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.handleStatusChange(true));
      window.addEventListener('offline', () => this.handleStatusChange(false));
    }
  }

  private handleStatusChange(online: boolean) {
    this.listeners.forEach(listener => listener(online));
    
    if (online) {
      // Trigger sync when coming back online
      this.syncData();
    }
  }

  async syncData() {
    try {
      const result = await offlineStorage.syncOfflineData();
      
      if (result.synced > 0) {
        // Show notification
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('ទិន្នន័យបានធ្វើសមកាលកម្ម', {
            body: `បានបញ្ជូន ${result.synced} សកម្មភាព`,
            icon: '/icon-192x192.png',
          });
        }
      }
      
      if (result.failed > 0) {
        console.error('Some actions failed to sync:', result.errors);
      }
    } catch (error) {
      console.error('Sync failed:', error);
    }
  }

  addListener(listener: (online: boolean) => void) {
    this.listeners.add(listener);
  }

  removeListener(listener: (online: boolean) => void) {
    this.listeners.delete(listener);
  }

  isOnline(): boolean {
    return navigator.onLine;
  }
}

export const networkMonitor = new NetworkMonitor();