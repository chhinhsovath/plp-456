'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Form, Input, Button, Card, Typography, Space, Row, Col } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useMessage } from '@/hooks/useAntdApp';

const { Title, Text } = Typography;

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const [form] = Form.useForm();
  const message = useMessage();

  const handleDemoLogin = async (email: string, password: string) => {
    form.setFieldsValue({ email, password });
    setTimeout(() => form.submit(), 50);
  };

  const onFinish = async (values: { email: string; password: string }) => {
    setLoading(true);
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      if (data.user) {
        message.success('Login successful!');
        
        // Determine redirect path based on role
        let redirectPath = '/dashboard';
        switch (data.user.role) {
          case 'ADMINISTRATOR':
            redirectPath = '/dashboard/admin';
            break;
          case 'PROVINCIAL':
          case 'ZONE':
            redirectPath = '/dashboard/director';
            break;
          case 'MENTOR':
            redirectPath = '/dashboard/mentor';
            break;
          case 'TEACHER':
            redirectPath = '/dashboard/teacher';
            break;
          case 'OFFICER':
            redirectPath = '/dashboard';
            break;
        }
        
        // Wait a moment for cookie to be set, then redirect directly
        setTimeout(() => {
          window.location.href = redirectPath;
        }, 100);
      }
    } catch (error: any) {
      message.error(error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const demoAccounts = [
    { role: 'Administrator', email: 'admin@openplp.com', password: 'admin123', color: '#1890ff' },
    { role: 'Provincial Director', email: 'provincial@openplp.com', password: 'provincial123', color: '#52c41a' },
    { role: 'District Director', email: 'district@openplp.com', password: 'district123', color: '#faad14' },
    { role: 'Mentor', email: 'mentor@openplp.com', password: 'mentor123', color: '#722ed1' },
    { role: 'Teacher', email: 'teacher@openplp.com', password: 'teacher123', color: '#eb2f96' },
    { role: 'Officer', email: 'officer@openplp.com', password: 'officer123', color: '#13c2c2' },
  ];

  return (
    <Row justify="center" align="middle" style={{ minHeight: '100vh', backgroundColor: '#f0f2f5' }}>
      <Col xs={22} sm={20} md={16} lg={12} xl={8}>
        <Card>
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <div style={{ textAlign: 'center' }}>
              <Title level={2}>Teacher Observation System</Title>
              <Text type="secondary">Sign in to your account</Text>
            </div>

            <Form
              form={form}
              name="login"
              onFinish={onFinish}
              layout="vertical"
              size="large"
            >
              <Form.Item
                name="email"
                label="Email"
                rules={[
                  { required: true, message: 'Please input your email!' },
                  { type: 'email', message: 'Please enter a valid email!' }
                ]}
              >
                <Input 
                  prefix={<UserOutlined />} 
                  placeholder="email@example.com" 
                  autoComplete="email"
                />
              </Form.Item>

              <Form.Item
                name="password"
                label="Password"
                rules={[{ required: true, message: 'Please input your password!' }]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                />
              </Form.Item>

              <Form.Item>
                <Button 
                  type="primary" 
                  htmlType="submit" 
                  loading={loading}
                  block
                >
                  Sign In
                </Button>
              </Form.Item>
            </Form>

            <div>
              <Text type="secondary" strong>Demo Accounts:</Text>
              <Space direction="vertical" size="small" style={{ width: '100%', marginTop: 8 }}>
                {demoAccounts.map((account) => (
                  <Button
                    key={account.email}
                    block
                    onClick={() => handleDemoLogin(account.email, account.password)}
                    style={{ textAlign: 'left', height: 'auto', padding: '12px' }}
                  >
                    <div style={{ color: account.color, fontWeight: 500 }}>
                      {account.role}
                    </div>
                    <div style={{ fontSize: 12, color: '#666', fontFamily: 'monospace' }}>
                      {account.email} / {account.password}
                    </div>
                  </Button>
                ))}
              </Space>
            </div>
          </Space>
        </Card>
      </Col>
    </Row>
  );
}