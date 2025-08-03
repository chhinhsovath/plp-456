'use client';

interface StorageData {
  sessionKey?: string;
  step: number;
  sessionInfo: any;
  evaluationData: any;
  studentAssessment: any;
  lastSaved: string;
  isDirty: boolean;
}

export class HybridStorage {
  private readonly STORAGE_KEY = 'observation_draft_backup';
  
  // Save to localStorage
  saveLocal(data: StorageData): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify({
        ...data,
        lastSaved: new Date().toISOString()
      }));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  }
  
  // Load from localStorage
  loadLocal(): StorageData | null {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Failed to load from localStorage:', error);
      return null;
    }
  }
  
  // Clear localStorage
  clearLocal(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear localStorage:', error);
    }
  }
  
  // Save to server with fallback to localStorage
  async saveToServer(
    data: StorageData,
    onSuccess?: () => void,
    onError?: (error: any) => void
  ): Promise<boolean> {
    try {
      const response = await fetch('/api/observations/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionKey: data.sessionKey,
          step: data.step,
          sessionInfo: data.sessionInfo,
          evaluationData: data.evaluationData,
          studentAssessment: data.studentAssessment
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server save failed:', response.status, errorText);
        
        // If draft not found (404), clear the sessionKey and retry as a new draft
        if (response.status === 404 && data.sessionKey) {
          console.log('Draft not found, creating new draft...');
          const retryResponse = await fetch('/api/observations/draft', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sessionKey: null, // Force creation of new draft
              step: data.step,
              sessionInfo: data.sessionInfo,
              evaluationData: data.evaluationData,
              studentAssessment: data.studentAssessment
            })
          });
          
          if (retryResponse.ok) {
            const result = await retryResponse.json();
            data.sessionKey = result.sessionKey;
            this.saveLocal(data);
            if (onSuccess) onSuccess();
            return true;
          }
        }
        
        throw new Error(`Server save failed: ${response.status} ${response.statusText}`);
      }
      
      let result;
      try {
        result = await response.json();
      } catch (e) {
        console.error('Failed to parse server response:', e);
        throw new Error('Invalid server response');
      }
      
      // Update local storage with server response
      if (!data.sessionKey && result.sessionKey) {
        data.sessionKey = result.sessionKey;
        this.saveLocal(data);
      }
      
      if (onSuccess) onSuccess();
      return true;
    } catch (error) {
      // Save to localStorage as backup
      this.saveLocal({ ...data, isDirty: true });
      if (onError) onError(error);
      return false;
    }
  }
  
  // Load from server with fallback to localStorage
  async loadFromServer(sessionKey: string): Promise<StorageData | null> {
    try {
      const response = await fetch(`/api/observations/draft?sessionKey=${sessionKey}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          console.warn('Draft not found on server for key:', sessionKey);
          return null; // Draft doesn't exist, return null instead of throwing
        }
        const errorText = await response.text();
        console.error('Server load failed:', response.status, errorText);
        throw new Error(`Server load failed: ${response.status} ${response.statusText}`);
      }
      
      let data;
      try {
        data = await response.json();
      } catch (e) {
        console.error('Failed to parse server response:', e);
        throw new Error('Invalid server response');
      }
      
      // Convert server format to local format
      const storageData: StorageData = {
        sessionKey: data.sessionKey,
        step: data.step,
        sessionInfo: data.sessionInfo || {},
        evaluationData: data.evaluationData || {},
        studentAssessment: data.studentAssessment || {},
        lastSaved: data.updatedAt,
        isDirty: false
      };
      
      // Update localStorage backup
      this.saveLocal(storageData);
      
      return storageData;
    } catch (error) {
      console.error('Failed to load from server, checking localStorage:', error);
      
      // Try to load from localStorage
      const localData = this.loadLocal();
      if (localData && localData.sessionKey === sessionKey) {
        return localData;
      }
      
      return null;
    }
  }
  
  // Sync local changes to server when online
  async syncToServer(): Promise<boolean> {
    const localData = this.loadLocal();
    
    if (!localData || !localData.isDirty) {
      return true; // Nothing to sync
    }
    
    if (!navigator.onLine) {
      return false; // Can't sync while offline
    }
    
    try {
      const success = await this.saveToServer(localData);
      if (success) {
        // Mark as synced
        this.saveLocal({ ...localData, isDirty: false });
      }
      return success;
    } catch (error) {
      console.error('Sync failed:', error);
      return false;
    }
  }
  
  // Check if we have unsaved local changes
  hasUnsavedChanges(): boolean {
    const localData = this.loadLocal();
    return localData?.isDirty || false;
  }
  
  // Merge server and local data (local takes precedence for conflicts)
  mergeData(serverData: StorageData, localData: StorageData): StorageData {
    // If local data is newer and dirty, prefer local
    if (localData.isDirty && new Date(localData.lastSaved) > new Date(serverData.lastSaved)) {
      return localData;
    }
    
    // Otherwise, merge intelligently
    return {
      sessionKey: serverData.sessionKey || localData.sessionKey,
      step: Math.max(serverData.step, localData.step),
      sessionInfo: { ...serverData.sessionInfo, ...localData.sessionInfo },
      evaluationData: { ...serverData.evaluationData, ...localData.evaluationData },
      studentAssessment: { ...serverData.studentAssessment, ...localData.studentAssessment },
      lastSaved: new Date().toISOString(),
      isDirty: localData.isDirty
    };
  }
}

export const hybridStorage = new HybridStorage();