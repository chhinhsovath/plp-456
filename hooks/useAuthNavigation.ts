import { useRouter } from 'next/navigation';
import { getAuthToken } from '@/lib/auth-client';

export function useAuthNavigation() {
  const router = useRouter();
  
  const navigateWithAuth = (path: string) => {
    if (process.env.NODE_ENV === 'development') {
      // In development, ensure token exists before navigation
      const token = getAuthToken();
      if (token) {
        // Force a page reload to ensure middleware picks up the token
        window.location.href = path;
      } else {
        router.push(path);
      }
    } else {
      // In production, use normal navigation
      router.push(path);
    }
  };
  
  return { navigateWithAuth };
}