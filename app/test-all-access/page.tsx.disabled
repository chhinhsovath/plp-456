'use client';

import { useState } from 'react';
import { Button, Card, Space, Typography, Alert, List } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

export default function TestAllAccess() {
  const [results, setResults] = useState<any[]>([]);
  const [testing, setTesting] = useState(false);

  const testRoutes = [
    { name: 'Dashboard', url: '/dashboard' },
    { name: 'Observations List', url: '/dashboard/observations' },
    { name: 'New Observation', url: '/dashboard/observations/new' },
    { name: 'Evaluations', url: '/dashboard/evaluations' },
    { name: 'Schools', url: '/dashboard/schools' },
    { name: 'Users', url: '/dashboard/users' },
    { name: 'Analytics', url: '/dashboard/analytics' },
    { name: 'Settings', url: '/dashboard/settings' },
  ];

  const testAPIs = [
    { name: 'Observations API', url: '/api/observations' },
    { name: 'Evaluations API', url: '/api/evaluations' },
    { name: 'Users API', url: '/api/users' },
    { name: 'Schools API', url: '/api/schools' },
  ];

  const testAllAccess = async () => {
    setTesting(true);
    const newResults = [];

    // Test Page Access
    for (const route of testRoutes) {
      try {
        const response = await fetch(route.url, {
          method: 'HEAD',
          credentials: 'include'
        });
        newResults.push({
          type: 'Page',
          name: route.name,
          url: route.url,
          success: response.status === 200,
          status: response.status
        });
      } catch (error) {
        newResults.push({
          type: 'Page',
          name: route.name,
          url: route.url,
          success: false,
          error: (error as Error).message
        });
      }
    }

    // Test API Access
    for (const api of testAPIs) {
      try {
        const response = await fetch(api.url, {
          credentials: 'include'
        });
        const data = await response.json();
        newResults.push({
          type: 'API',
          name: api.name,
          url: api.url,
          success: response.status === 200,
          status: response.status,
          data: data
        });
      } catch (error) {
        newResults.push({
          type: 'API',
          name: api.name,
          url: api.url,
          success: false,
          error: (error as Error).message
        });
      }
    }

    setResults(newResults);
    setTesting(false);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <Title level={2}>Test All Access - Administrator Role</Title>
      <Text type="secondary">
        This page tests access to all dashboard pages and APIs to ensure there are no role restrictions.
      </Text>
      
      <Card style={{ marginTop: '20px' }}>
        <Space>
          <Button 
            type="primary" 
            onClick={testAllAccess} 
            loading={testing}
            size="large"
          >
            Test All Access
          </Button>
          <Button onClick={() => setResults([])}>
            Clear Results
          </Button>
        </Space>
      </Card>

      {results.length > 0 && (
        <Card title="Test Results" style={{ marginTop: '20px' }}>
          <List
            dataSource={results}
            renderItem={(item) => (
              <List.Item>
                <div style={{ width: '100%' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <Text strong>{item.name}</Text>
                      <br />
                      <Text type="secondary">{item.type}: {item.url}</Text>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      {item.success ? (
                        <CheckCircleOutlined style={{ color: '#52c41a', fontSize: '20px' }} />
                      ) : (
                        <CloseCircleOutlined style={{ color: '#ff4d4f', fontSize: '20px' }} />
                      )}
                      <br />
                      <Text type="secondary">
                        {item.status ? `Status: ${item.status}` : ''}
                        {item.error ? `Error: ${item.error}` : ''}
                      </Text>
                    </div>
                  </div>
                  {item.success && item.type === 'API' && (
                    <Alert
                      message="API Response"
                      description={<pre style={{ fontSize: '12px' }}>{JSON.stringify(item.data, null, 2)}</pre>}
                      type="info"
                      style={{ marginTop: '10px' }}
                    />
                  )}
                </div>
              </List.Item>
            )}
          />
          
          <div style={{ marginTop: '20px' }}>
            <Alert
              message={`Summary: ${results.filter(r => r.success).length}/${results.length} tests passed`}
              type={results.every(r => r.success) ? 'success' : 'warning'}
              showIcon
            />
          </div>
        </Card>
      )}

      <Card title="Quick Navigation" style={{ marginTop: '20px' }}>
        <Space wrap>
          {testRoutes.map(route => (
            <Button 
              key={route.url}
              onClick={() => window.location.href = route.url}
            >
              {route.name}
            </Button>
          ))}
        </Space>
      </Card>
    </div>
  );
}