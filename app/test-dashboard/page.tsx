'use client';

import { useSession } from '@/hooks/useSession';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function TestDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    console.log('Session status:', status);
    console.log('Session data:', session);
  }, [status, session]);

  if (status === 'loading') {
    return <div>Loading session...</div>;
  }

  if (status === 'unauthenticated') {
    return (
      <div style={{ padding: '20px' }}>
        <h1>Not authenticated</h1>
        <p>You are not logged in.</p>
        <button onClick={() => router.push('/login')}>Go to Login</button>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1>Test Dashboard - Authenticated\!</h1>
      <h2>Session Info:</h2>
      <pre>{JSON.stringify(session, null, 2)}</pre>
      
      <h2>Navigation Test:</h2>
      <button onClick={() => router.push('/dashboard')}>Go to Main Dashboard</button>
      <button onClick={() => router.push('/dashboard/observations')}>Go to Observations</button>
      <button onClick={() => router.push('/dashboard/observations/new')}>New Observation</button>
    </div>
  );
}
