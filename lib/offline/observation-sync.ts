'use client';

import { observationStorage } from './observation-storage';

class ObservationSyncService {
  private syncInterval: NodeJS.Timeout | null = null;
  private isSyncing = false;

  // Start periodic sync
  startPeriodicSync(intervalMs = 30000) { // 30 seconds
    if (this.syncInterval) return;

    this.syncInterval = setInterval(() => {
      this.syncPendingObservations();
    }, intervalMs);

    // Also sync immediately
    this.syncPendingObservations();
  }

  // Stop periodic sync
  stopPeriodicSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
  }

  // Sync all pending observations
  async syncPendingObservations() {
    if (this.isSyncing || !navigator.onLine) return;

    this.isSyncing = true;
    try {
      const pendingObservations = await observationStorage.getPendingObservations();
      
      for (const observation of pendingObservations) {
        if (observation.status === 'pending') {
          await this.syncObservation(observation);
        }
      }
    } catch (error) {
      console.error('Sync error:', error);
    } finally {
      this.isSyncing = false;
    }
  }

  // Sync a single observation
  private async syncObservation(observation: any) {
    try {
      const response = await fetch('/api/observations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionInfo: observation.sessionInfo,
          evaluationData: observation.evaluationData,
          studentAssessment: observation.studentAssessment,
          createdBy: observation.userEmail,
          offlineId: observation.id
        }),
      });

      if (response.ok) {
        const result = await response.json();
        // Mark as synced
        await observationStorage.updateSyncStatus(observation.id, 'synced');
        
        // Optionally delete after successful sync
        // await observationStorage.deleteObservation(observation.id);
        
        return result;
      } else {
        throw new Error(`Sync failed: ${response.status}`);
      }
    } catch (error) {
      console.error('Failed to sync observation:', error);
      await observationStorage.updateSyncStatus(observation.id, 'failed');
      throw error;
    }
  }

  // Submit observation (online or queue for offline)
  async submitObservation(data: any) {
    const observationData = {
      ...data,
      status: 'pending' as const,
      userId: data.userId || 'unknown',
      userEmail: data.createdBy || 'unknown'
    };

    // Save to local storage first
    const id = await observationStorage.saveObservation(observationData);

    // If online, try to sync immediately
    if (navigator.onLine) {
      try {
        const result = await this.syncObservation({
          ...observationData,
          id
        });
        return { success: true, online: true, result };
      } catch (error) {
        return { success: true, online: false, id, message: 'Saved offline. Will sync when online.' };
      }
    } else {
      return { success: true, online: false, id, message: 'Saved offline. Will sync when online.' };
    }
  }
}

export const observationSync = new ObservationSyncService();