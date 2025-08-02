// Client-side authentication utilities
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function useAuthCheck() {
  const router = useRouter();
  
  useEffect(() => {
    // Check if we have a token in localStorage
    const token = localStorage.getItem('auth-token');
    if (!token) {
      router.push('/login');
    }
  }, [router]);
}

// Add auth token to fetch requests
export async function authenticatedFetch(url: string, options: RequestInit = {}) {
  const token = localStorage.getItem('auth-token');
  
  const headers = new Headers(options.headers);
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  
  return fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });
}