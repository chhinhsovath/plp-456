// Helper to check if we're in development
export const isDevelopment = () => {
  return typeof window !== 'undefined' && window.location.hostname === 'localhost';
};

// Store token in both cookie and localStorage for development
export const storeAuthToken = (token: string) => {
  // Always store in localStorage for development
  if (typeof window !== 'undefined') {
    localStorage.setItem('auth-token', token);
    
    // Also try to set a non-httpOnly cookie for development
    if (isDevelopment()) {
      document.cookie = `dev-auth-token=${token}; path=/; max-age=2592000; SameSite=Lax`;
    }
  }
};

// Get token from localStorage or cookie
export const getStoredToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  
  // Check localStorage first
  const localToken = localStorage.getItem('auth-token');
  if (localToken) return localToken;
  
  // Check dev cookie
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'dev-auth-token') {
      return value;
    }
  }
  
  return null;
};

// Clear all auth tokens
export const clearAuthTokens = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('auth-token');
    document.cookie = 'dev-auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC';
  }
};