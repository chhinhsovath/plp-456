'use client';

import { useSimpleSession } from '@/hooks/useSimpleSession';
import { useRouter } from 'next/navigation';

export default function SimpleDashboard() {
  const { user, loading } = useSimpleSession();
  const router = useRouter();

  const logout = async () => {
    try {
      await fetch('/api/simple-logout', {
        method: 'POST',
        credentials: 'include',
      });
      window.location.href = '/simple-login';
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        <div>Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center' 
      }}>
        <h1>Not Logged In</h1>
        <button
          onClick={() => router.push('/simple-login')}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Go to Login
        </button>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
      <header style={{
        backgroundColor: 'white',
        padding: '1rem 2rem',
        borderBottom: '1px solid #dee2e6',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h1>Simple Dashboard</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span>Welcome, {user.name}</span>
          <button
            onClick={logout}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Logout
          </button>
        </div>
      </header>
      
      <main style={{ padding: '2rem' }}>
        <div style={{
          backgroundColor: 'white',
          padding: '2rem',
          borderRadius: '8px',
          marginBottom: '2rem'
        }}>
          <h2>User Information</h2>
          <p><strong>ID:</strong> {user.id}</p>
          <p><strong>Name:</strong> {user.name}</p>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Role:</strong> {user.role}</p>
        </div>
        
        <div style={{
          backgroundColor: 'white',
          padding: '2rem',
          borderRadius: '8px'
        }}>
          <h2>Navigation</h2>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => router.push('/dashboard')}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Go to Original Dashboard
            </button>
            <button
              onClick={() => router.push('/dashboard/observations')}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#17a2b8',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              View Observations
            </button>
            <button
              onClick={() => router.push('/dashboard/users')}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#6f42c1',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Manage Users
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}