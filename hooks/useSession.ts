import { useState, useEffect } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export function useSession() {
  const [user, setUser] = useState<User | null>({ id: 'demo', name: 'Demo User', email: 'demo@example.com', role: 'ADMIN' });
  const [status, setStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>('authenticated');

  // Skip session check completely - just return mock authenticated user
  useEffect(() => {
    // Do nothing - skip all auth checks
  }, []);

  const checkSession = async () => {
    // Skip session check - always return authenticated
    setUser({ id: 'demo', name: 'Demo User', email: 'demo@example.com', role: 'ADMIN' });
    setStatus('authenticated');
  };

  return { 
    data: user,
    status,
    refresh: checkSession
  };
}