'use client';

import { useState, useEffect } from 'react';
import { Button, Card, message } from 'antd';

export default function SessionDebug() {
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const checkDebugSession = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/debug-session', {
        credentials: 'include',
      });
      const data = await response.json();
      setDebugInfo(data);
      
      if (data.cookies?.authToken || data.cookies?.devAuthToken) {
        message.success('Cookies found!');
      } else {
        message.warning('No auth cookies found');
      }
    } catch (error: any) {
      message.error('Failed to check session: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const testLogin = async () => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          email: 'teacher@openplp.com',
          password: 'teacher123',
        }),
      });

      const data = await response.json();
      if (response.ok) {
        message.success('Login successful! Checking session in 2 seconds...');
        setTimeout(checkDebugSession, 2000);
      } else {
        message.error('Login failed: ' + data.error);
      }
    } catch (error: any) {
      message.error('Login error: ' + error.message);
    }
  };

  useEffect(() => {
    checkDebugSession();
  }, []);

  return (
    <div style={{ padding: 20, maxWidth: 800, margin: '0 auto' }}>
      <h1>Session Debug</h1>
      
      <Card style={{ marginBottom: 20 }}>
        <Button onClick={checkDebugSession} loading={loading} style={{ marginRight: 10 }}>
          Check Session Debug
        </Button>
        <Button onClick={testLogin} type="primary">
          Test Login
        </Button>
      </Card>

      {debugInfo && (
        <Card title="Debug Information">
          <pre style={{ 
            background: '#f0f0f0', 
            padding: 10, 
            borderRadius: 4,
            overflow: 'auto',
            maxHeight: 600,
          }}>
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </Card>
      )}
    </div>
  );
}