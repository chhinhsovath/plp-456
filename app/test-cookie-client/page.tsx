'use client';

import { useState } from 'react';

export default function TestCookieClient() {
  const [results, setResults] = useState<any[]>([]);

  const addResult = (message: string, data?: any) => {
    setResults(prev => [...prev, { 
      time: new Date().toISOString(), 
      message, 
      data 
    }]);
  };

  const testSession = async () => {
    try {
      addResult('Testing session with fetch...');
      const response = await fetch('/api/auth/session', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      addResult(`Session response (${response.status}):`, data);
      
      // Also check headers
      const headers: any = {};
      response.headers.forEach((value, key) => {
        headers[key] = value;
      });
      addResult('Response headers:', headers);
      
    } catch (error: any) {
      addResult('Session error:', error.message);
    }
  };

  const testLogin = async () => {
    try {
      addResult('Testing login...');
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'teacher1@school.edu',
          password: 'password123',
        }),
      });
      
      const data = await response.json();
      addResult(`Login response (${response.status}):`, data);
      
      if (response.ok) {
        // Wait a bit then test session
        setTimeout(() => testSession(), 1000);
      }
      
    } catch (error: any) {
      addResult('Login error:', error.message);
    }
  };

  const checkCookies = () => {
    addResult('Document cookies:', document.cookie || '(empty)');
  };

  const testCookieEndpoint = async () => {
    try {
      addResult('Testing cookie test endpoint...');
      const response = await fetch('/api/auth/cookie-test', {
        method: 'GET',
        credentials: 'include',
      });
      
      const data = await response.json();
      addResult('Cookie test response:', data);
      
    } catch (error: any) {
      addResult('Cookie test error:', error.message);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Client-Side Cookie Test</h1>
      
      <div style={{ marginBottom: 20 }}>
        <button onClick={checkCookies} style={{ marginRight: 10 }}>
          Check Document Cookies
        </button>
        <button onClick={testCookieEndpoint} style={{ marginRight: 10 }}>
          Test Cookie Endpoint
        </button>
        <button onClick={testSession} style={{ marginRight: 10 }}>
          Test Session
        </button>
        <button onClick={testLogin} style={{ marginRight: 10 }}>
          Test Login
        </button>
        <button onClick={() => setResults([])}>
          Clear Results
        </button>
      </div>
      
      <div style={{ background: '#f0f0f0', padding: 10, borderRadius: 5 }}>
        <h3>Results:</h3>
        {results.map((result, index) => (
          <div key={index} style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 12, color: '#666' }}>{result.time}</div>
            <div style={{ fontWeight: 'bold' }}>{result.message}</div>
            {result.data && (
              <pre style={{ fontSize: 12, overflow: 'auto' }}>
                {JSON.stringify(result.data, null, 2)}
              </pre>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}