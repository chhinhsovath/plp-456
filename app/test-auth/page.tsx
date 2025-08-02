'use client';

import { useEffect, useState } from 'react';

export default function TestAuthPage() {
  const [sessionData, setSessionData] = useState<any>(null);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check cookies
        console.log('Cookies:', document.cookie);
        
        // Fetch session
        const response = await fetch('/api/auth/session', {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          }
        });
        
        console.log('Session response status:', response.status);
        
        const data = await response.json();
        console.log('Session data:', data);
        
        if (response.ok) {
          setSessionData(data);
        } else {
          setError(`Error: ${response.status} - ${JSON.stringify(data)}`);
        }
      } catch (err) {
        console.error('Auth check error:', err);
        setError(`Failed to check auth: ${err}`);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div style={{ padding: '20px' }}>
      <h1>Authentication Test Page</h1>
      
      <h2>Session Status:</h2>
      {error ? (
        <div style={{ color: 'red' }}>
          <p>Error:</p>
          <pre>{error}</pre>
        </div>
      ) : (
        <div style={{ color: 'green' }}>
          <p>Authenticated\!</p>
          <pre>{JSON.stringify(sessionData, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
