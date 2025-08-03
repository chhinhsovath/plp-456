'use client';

import { useState, useEffect } from 'react';
import { Button, Card, Space, Input, message } from 'antd';

export default function DebugAuth() {
  const [logs, setLogs] = useState<string[]>([]);
  const [email, setEmail] = useState('teacher@openplp.com');
  const [password, setPassword] = useState('teacher123');

  const addLog = (msg: string) => {
    const timestamp = new Date().toISOString();
    setLogs(prev => [...prev, `[${timestamp}] ${msg}`]);
    console.log(`[Debug] ${msg}`);
  };

  useEffect(() => {
    addLog('Page loaded');
    checkInitialState();
  }, []);

  const checkInitialState = async () => {
    // Check cookies
    addLog(`Document.cookie: ${document.cookie || '(empty)'}`);
    
    // Check session
    try {
      const response = await fetch('/api/auth/session', {
        credentials: 'include',
      });
      const data = await response.json();
      addLog(`Initial session check: ${response.status} - ${JSON.stringify(data)}`);
    } catch (error: any) {
      addLog(`Initial session error: ${error.message}`);
    }
  };

  const testLogin = async () => {
    try {
      addLog(`Attempting login with ${email}`);
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });

      const data = await response.json();
      addLog(`Login response: ${response.status}`);
      addLog(`Login data: ${JSON.stringify(data, null, 2)}`);

      // Check Set-Cookie headers
      const setCookie = response.headers.get('set-cookie');
      addLog(`Set-Cookie header: ${setCookie || '(none)'}`);

      if (response.ok) {
        message.success('Login successful!');
        
        // Wait and check session
        addLog('Waiting 1 second before checking session...');
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        await testSession();
      } else {
        message.error(data.error || 'Login failed');
      }
    } catch (error: any) {
      addLog(`Login error: ${error.message}`);
      message.error(error.message);
    }
  };

  const testSession = async () => {
    try {
      addLog('Checking session...');
      addLog(`Current cookies: ${document.cookie || '(empty)'}`);
      
      const response = await fetch('/api/auth/session', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      addLog(`Session response: ${response.status}`);
      addLog(`Session data: ${JSON.stringify(data, null, 2)}`);

      if (response.ok) {
        message.success('Session valid!');
      } else {
        message.warning('Session invalid');
      }
    } catch (error: any) {
      addLog(`Session error: ${error.message}`);
      message.error(error.message);
    }
  };

  const testCookieEndpoint = async () => {
    try {
      addLog('Testing cookie verification endpoint...');
      
      const response = await fetch('/api/auth/verify-cookie', {
        credentials: 'include',
      });

      const data = await response.json();
      addLog(`Cookie verification: ${JSON.stringify(data, null, 2)}`);
    } catch (error: any) {
      addLog(`Cookie verification error: ${error.message}`);
    }
  };

  const clearLogs = () => {
    setLogs([]);
    addLog('Logs cleared');
  };

  return (
    <div style={{ padding: 20, maxWidth: 1200, margin: '0 auto' }}>
      <h1>Authentication Debug Page</h1>
      
      <Card title="Login Test" style={{ marginBottom: 20 }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Input
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input.Password
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Space>
            <Button type="primary" onClick={testLogin}>Test Login</Button>
            <Button onClick={testSession}>Check Session</Button>
            <Button onClick={testCookieEndpoint}>Verify Cookies</Button>
            <Button onClick={clearLogs}>Clear Logs</Button>
          </Space>
        </Space>
      </Card>

      <Card title="Debug Logs">
        <div style={{ 
          fontFamily: 'monospace', 
          fontSize: 12, 
          whiteSpace: 'pre-wrap',
          maxHeight: 600,
          overflow: 'auto',
          background: '#f0f0f0',
          padding: 10,
          borderRadius: 4,
        }}>
          {logs.map((log, index) => (
            <div key={index}>{log}</div>
          ))}
        </div>
      </Card>
    </div>
  );
}