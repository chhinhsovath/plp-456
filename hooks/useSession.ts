import { useState, useEffect } from 'react';

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

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const response = await fetch('/api/auth/session', {
          credentials: 'include',
        });
        
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
          setStatus('authenticated');
        } else {
          setUser(null);
          setStatus('unauthenticated');
        }
      } catch (error) {
        console.error('Session fetch error:', error);
        setUser(null);
        setStatus('unauthenticated');
      }
    };

    fetchSession();
  }, []);

  // Return user data directly with userId for compatibility
  return { 
    data: user ? {
      ...user,
      userId: user.id  // Add userId field for components expecting it
    } : null,
    status 
  };
}