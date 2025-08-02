'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/hooks/useSession';

export default function AuthCheck({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    // Debug logging
    console.log('AuthCheck - Status:', status);
    console.log('AuthCheck - Session:', session);
    
    if (status === 'loading') return;
    
    if (status === 'unauthenticated') {
      console.log('AuthCheck - Redirecting to login');
      router.push('/login');
    }
  }, [status, router, session]);

  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  if (status === 'unauthenticated') {
    return null;
  }

  return <>{children}</>;
}