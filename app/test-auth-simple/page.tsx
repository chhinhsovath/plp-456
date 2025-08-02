'use client';

import { useState } from 'react';
import { Button, Card, Space, Typography, Alert } from 'antd';

const { Title, Text } = Typography;

export default function SimpleAuthTest() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const login = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          email: 'teacher@openplp.com',
          password: 'teacher123'
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setResult({
          type: 'success',
          message: `✅ Login successful! User: ${data.user.email} (${data.user.role})`
        });
      } else {
        setResult({
          type: 'error',
          message: `❌ Login failed: ${data.error}`
        });
      }
    } catch (error: any) {
      setResult({
        type: 'error',
        message: `❌ Error: ${error.message}`
      });
    } finally {
      setLoading(false);
    }
  };

  const checkSession = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/session', {
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setResult({
          type: 'success',
          message: `✅ Session valid! User: ${data.user.email} (${data.user.role})`
        });
      } else {
        setResult({
          type: 'error',
          message: `❌ Not logged in: ${data.error}`
        });
      }
    } catch (error: any) {
      setResult({
        type: 'error',
        message: `❌ Error: ${error.message}`
      });
    } finally {
      setLoading(false);
    }
  };

  const goToDashboard = () => {
    window.location.href = '/dashboard';
  };

  const testAPI = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/observations', {
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setResult({
          type: 'success',
          message: `✅ API Access successful! Observations count: ${Array.isArray(data) ? data.length : 0}`
        });
      } else {
        setResult({
          type: 'error',
          message: `❌ API Access failed: ${data.error}`
        });
      }
    } catch (error: any) {
      setResult({
        type: 'error',
        message: `❌ Error: ${error.message}`
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <Title level={2}>Simple Authentication Test</Title>
      <Text type="secondary">No HTTPS or security restrictions - development mode</Text>
      
      <Card style={{ marginTop: '20px' }}>
        <Space wrap>
          <Button type="primary" onClick={login} loading={loading}>
            1. Login
          </Button>
          <Button onClick={checkSession} loading={loading}>
            2. Check Session
          </Button>
          <Button onClick={goToDashboard} loading={loading}>
            3. Go to Dashboard
          </Button>
          <Button onClick={testAPI} loading={loading}>
            4. Test API
          </Button>
        </Space>
      </Card>

      {result && (
        <Card style={{ marginTop: '20px' }}>
          <Alert
            message="Result"
            description={result.message}
            type={result.type}
            showIcon
          />
        </Card>
      )}
    </div>
  );
}