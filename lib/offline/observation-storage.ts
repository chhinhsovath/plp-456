'use client';

import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface ObservationDB extends DBSchema {
  observations: {
    key: string;
    value: {
      id: string;
      sessionInfo: any;
      evaluationData: any;
      studentAssessment: any;
      currentStep: number;
      createdAt: Date;
      updatedAt: Date;
      status: 'draft' | 'pending' | 'submitted';
      syncStatus: 'synced' | 'pending' | 'failed';
      userId?: string;
      userEmail?: string;
    };
    indexes: { 'by-status': string; 'by-sync': string; 'by-date': Date };
  };
  indicators: {
    key: number;
    value: {
      fieldId: number;
      indicatorSequence: number;
      indicatorMain: string;
      indicatorMainEn: string;
      indicatorSub: string;
      indicatorSubEn: string;
      evaluationLevel: number;
      aiContext: string;
      cachedAt: Date;
    };
  };
}

class ObservationStorage {
  private db: IDBPDatabase<ObservationDB> | null = null;
  private readonly DB_NAME = 'observation-offline-db';
  private readonly DB_VERSION = 1;

  async initDB() {
    if (this.db) return this.db;

    this.db = await openDB<ObservationDB>(this.DB_NAME, this.DB_VERSION, {
      upgrade(db) {
        // Create observations store
        if (!db.objectStoreNames.contains('observations')) {
          const observationStore = db.createObjectStore('observations', {
            keyPath: 'id'
          });
          observationStore.createIndex('by-status', 'status');
          observationStore.createIndex('by-sync', 'syncStatus');
          observationStore.createIndex('by-date', 'updatedAt');
        }

        // Create indicators cache store
        if (!db.objectStoreNames.contains('indicators')) {
          db.createObjectStore('indicators', {
            keyPath: 'fieldId'
          });
        }
      }
    });

    return this.db;
  }

  // Save observation draft
  async saveObservation(data: {
    id?: string;
    sessionInfo: any;
    evaluationData: any;
    studentAssessment: any;
    currentStep: number;
    status?: 'draft' | 'pending' | 'submitted';
    userId?: string;
    userEmail?: string;
  }) {
    const db = await this.initDB();
    const id = data.id || `obs-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const observation = {
      ...data,
      id,
      status: data.status || 'draft',
      syncStatus: 'pending' as const,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await db.put('observations', observation);
    return id;
  }

  // Get observation by ID
  async getObservation(id: string) {
    const db = await this.initDB();
    return db.get('observations', id);
  }

  // Get all pending observations
  async getPendingObservations() {
    const db = await this.initDB();
    const tx = db.transaction('observations', 'readonly');
    const index = tx.store.index('by-sync');
    return index.getAll('pending');
  }

  // Update observation sync status
  async updateSyncStatus(id: string, status: 'synced' | 'pending' | 'failed') {
    const db = await this.initDB();
    const observation = await db.get('observations', id);
    if (observation) {
      observation.syncStatus = status;
      observation.updatedAt = new Date();
      await db.put('observations', observation);
    }
  }

  // Delete observation
  async deleteObservation(id: string) {
    const db = await this.initDB();
    await db.delete('observations', id);
  }

  // Cache indicators for offline use
  async cacheIndicators(indicators: any[]) {
    const db = await this.initDB();
    const tx = db.transaction('indicators', 'readwrite');
    
    for (const indicator of indicators) {
      await tx.store.put({
        ...indicator,
        cachedAt: new Date()
      });
    }
    
    await tx.done;
  }

  // Get cached indicators
  async getCachedIndicators() {
    const db = await this.initDB();
    return db.getAll('indicators');
  }

  // Clear old drafts (older than 30 days)
  async clearOldDrafts() {
    const db = await this.initDB();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const tx = db.transaction('observations', 'readwrite');
    const index = tx.store.index('by-date');
    const range = IDBKeyRange.upperBound(thirtyDaysAgo);
    
    for await (const cursor of index.iterate(range)) {
      if (cursor.value.status === 'draft') {
        await cursor.delete();
      }
    }
  }
}

export const observationStorage = new ObservationStorage();