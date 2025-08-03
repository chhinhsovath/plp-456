'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Form, Input, Button, Card, Typography, Space, Row, Col, message } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const [form] = Form.useForm();

  const handleLogin = async (values: { email: string; password: string }) => {
    setLoading(true);
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        message.success('Login successful!');
        // Simple redirect to dashboard
        router.push('/dashboard');
      } else {
        message.error(data.error || 'Login failed');
      }
    } catch (error) {
      message.error('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Demo accounts for easy testing
  const demoAccounts = [
    { role: 'Administrator', email: 'admin@openplp.com', password: 'admin123' },
    { role: 'Teacher', email: 'teacher@openplp.com', password: 'teacher123' },
    { role: 'Mentor', email: 'mentor@openplp.com', password: 'mentor123' },
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
              onFinish={handleLogin}
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

            {/* Demo accounts for quick testing */}
            <div>
              <Text type="secondary" strong>Demo Accounts:</Text>
              <Space direction="vertical" size="small" style={{ width: '100%', marginTop: 8 }}>
                {demoAccounts.map((account) => (
                  <Button
                    key={account.email}
                    block
                    onClick={() => {
                      form.setFieldsValue({ 
                        email: account.email, 
                        password: account.password 
                      });
                      form.submit();
                    }}
                    style={{ textAlign: 'left' }}
                  >
                    <div>{account.role}</div>
                    <div style={{ fontSize: 12, color: '#666' }}>
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