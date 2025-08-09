'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function TestSessionPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const router = useRouter();

  const testAccounts = [
    { email: 'admin@openplp.com', password: 'admin123', role: 'ADMINISTRATOR' },
    { email: 'teacher@openplp.com', password: 'teacher123', role: 'TEACHER' },
    { email: 'mentor@openplp.com', password: 'mentor123', role: 'MENTOR' },
    { email: 'officer@openplp.com', password: 'officer123', role: 'OFFICER' },
  ];

  const login = async (email: string, password: string) => {
    setLoading(true);
    setMessage('');
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include'
      });

      const data = await response.json();
      
      if (response.ok) {
        setMessage('Login successful\! Redirecting...');
        setTimeout(() => {
          router.push('/dashboard');
        }, 1000);
      } else {
        setMessage('Login failed: ' + (data.error || 'Unknown error'));
      }
    } catch (error: any) {
      setMessage('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>MENTOR Quick Login</h1>
      
      {message && (
        <div style={{ 
          padding: '10px', 
          margin: '10px 0', 
          background: message.includes('failed') || message.includes('Error') ? '#fee' : '#efe',
          border: '1px solid ' + (message.includes('failed') || message.includes('Error') ? '#fcc' : '#cfc')
        }}>
          {message}
        </div>
      )}

      <h2>Click to login:</h2>
      {testAccounts.map(account => (
        <div key={account.email} style={{ 
          border: '1px solid #ccc', 
          padding: '15px', 
          margin: '10px 0',
          borderRadius: '5px',
          background: '#f9f9f9'
        }}>
          <strong>{account.role}</strong><br />
          <small>{account.email}</small><br />
          <button 
            onClick={() => login(account.email, account.password)}
            disabled={loading}
            style={{
              marginTop: '10px',
              padding: '10px 20px',
              fontSize: '16px',
              cursor: loading ? 'not-allowed' : 'pointer',
              background: loading ? '#ccc' : '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '5px'
            }}
          >
            {loading ? 'Logging in...' : 'Login as ' + account.role}
          </button>
        </div>
      ))}

      <h2>Quick Navigation:</h2>
      <div style={{ marginTop: '20px' }}>
        <button onClick={() => router.push('/dashboard')} style={{ margin: '5px' }}>
          Dashboard
        </button>
        <button onClick={() => router.push('/dashboard/observations')} style={{ margin: '5px' }}>
          Observations
        </button>
        <button onClick={() => router.push('/dashboard/observations/new')} style={{ margin: '5px' }}>
          New Observation
        </button>
      </div>
    </div>
  );
}