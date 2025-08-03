import { useState, useEffect, useCallback, useRef } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface SessionData {
  data: { user: User } | null;
  status: 'loading' | 'authenticated' | 'unauthenticated';
}

export function useSession() {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading');
  
  // Use refs to track component mount state and prevent race conditions
  const isMountedRef = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchSession = useCallback(async () => {
    // Cancel any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Create new abort controller for this request
    abortControllerRef.current = new AbortController();
    
    try {
      // Check localStorage for token as immediate feedback
      const localToken = localStorage.getItem('auth-token');
      
      const response = await fetch('/api/auth/session', {
        method: 'GET',
        credentials: 'include',
        signal: abortControllerRef.current.signal,
        headers: localToken ? {
          'Authorization': `Bearer ${localToken}`
        } : {},
      });
      
      // Only update state if component is still mounted
      if (!isMountedRef.current) return;
      
      if (response.ok) {
        const data = await response.json();
        
        // Validate the response structure
        if (data?.user && typeof data.user === 'object') {
          setUser(data.user);
          setStatus('authenticated');
        } else {
          console.warn('Invalid user data received from session API');
          setUser(null);
          setStatus('unauthenticated');
        }
      } else {
        // Log the specific error for debugging
        if (response.status !== 401) {
          console.warn('Session fetch failed with status:', response.status);
        }
        setUser(null);
        setStatus('unauthenticated');
      }
    } catch (error) {
      // Only log errors if not due to request cancellation
      if (!isMountedRef.current) return;
      
      if (error instanceof Error && error.name === 'AbortError') {
        // Request was cancelled, this is expected
        return;
      }
      
      console.error('Session fetch error:', error);
      setUser(null);
      setStatus('unauthenticated');
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    fetchSession();

    // Cleanup function
    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchSession]);

  // Improved refresh function with proper loading state management
  const refresh = useCallback(() => {
    if (!isMountedRef.current) return;
    
    setStatus('loading');
    // Use a small delay to prevent rapid successive calls
    const timeoutId = setTimeout(() => {
      if (isMountedRef.current) {
        fetchSession();
      }
    }, 100);

    // Return cleanup function
    return () => clearTimeout(timeoutId);
  }, [fetchSession]);

  // Return user data with proper type safety and compatibility
  return { 
    data: user ? {
      ...user,
      userId: user.id  // Add userId field for components expecting it
    } : null,
    status,
    refresh 
  };
}