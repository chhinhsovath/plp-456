'use client';

import { useEffect, useState } from 'react';
import { Card, Typography, Button, Space, Divider } from 'antd';
import { useRouter } from 'next/navigation';

const { Title, Text, Paragraph } = Typography;

export default function DebugPage() {
  const [sessionData, setSessionData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  
  useEffect(() => {
    checkSession();
  }, []);
  
  const checkSession = async () => {
    try {
      const response = await fetch('/api/auth/session', {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error(`Session check failed: ${response.status}`);
      }
      
      const data = await response.json();
      setSessionData(data);
    } catch (err: any) {
      setError(err.message);
    }
  };
  
  const testNavigation = (path: string) => {
    console.log(`Navigating to ${path}`);
    router.push(path);
  };
  
  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <Card>
        <Title level={2}>Debug Page</Title>
        
        <Divider />
        
        <Title level={4}>Session Status</Title>
        {error ? (
          <Text type="danger">Error: {error}</Text>
        ) : sessionData ? (
          <Paragraph>
            <pre>{JSON.stringify(sessionData, null, 2)}</pre>
          </Paragraph>
        ) : (
          <Text>Loading...</Text>
        )}
        
        <Divider />
        
        <Title level={4}>Test Navigation</Title>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Button onClick={() => testNavigation('/dashboard')}>Go to Dashboard</Button>
          <Button onClick={() => testNavigation('/dashboard/analytics')}>Go to Analytics</Button>
          <Button onClick={() => testNavigation('/dashboard/evaluations')}>Go to Evaluations</Button>
          <Button onClick={() => testNavigation('/dashboard/mentoring')}>Go to Mentoring</Button>
          <Button onClick={() => testNavigation('/dashboard/schools')}>Go to Schools</Button>
          <Button onClick={() => testNavigation('/dashboard/users')}>Go to Users</Button>
          <Button onClick={() => testNavigation('/dashboard/settings')}>Go to Settings</Button>
        </Space>
        
        <Divider />
        
        <Title level={4}>Direct Links (window.location)</Title>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Button onClick={() => window.location.href = '/dashboard/analytics'}>
            Direct: Analytics
          </Button>
          <Button onClick={() => window.location.href = '/dashboard/evaluations'}>
            Direct: Evaluations
          </Button>
        </Space>
        
        <Divider />
        
        <Title level={4}>Cookies</Title>
        <Paragraph>
          <code>{document.cookie || 'No cookies visible (httpOnly)'}</code>
        </Paragraph>
      </Card>
    </div>
  );
}