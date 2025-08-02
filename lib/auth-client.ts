// Client-side auth utilities

export function getAuthToken(): string | null {
  // In development, check localStorage first
  if (process.env.NODE_ENV === 'development') {
    const token = localStorage.getItem('auth-token');
    if (token) return token;
  }
  
  // In production, rely on httpOnly cookies
  return null;
}

export function setAuthToken(token: string) {
  localStorage.setItem('auth-token', token);
}

export function clearAuthToken() {
  localStorage.removeItem('auth-token');
}

// Add auth header to requests
export function getAuthHeaders(): HeadersInit {
  const token = getAuthToken();
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}