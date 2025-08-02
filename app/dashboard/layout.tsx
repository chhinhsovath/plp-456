'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Layout, Menu, Button, Avatar, Dropdown, Space, Typography, theme } from 'antd';
import {
  DashboardOutlined,
  UserOutlined,
  TeamOutlined,
  FileTextOutlined,
  SettingOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  BankOutlined,
  SolutionOutlined,
  BookOutlined,
  BarChartOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { useSession } from '@/hooks/useSession';
import PageLoading from '@/components/PageLoading';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const {
    token: { colorBgContainer },
  } = theme.useToken();

  // Simplified authentication check for development
  useEffect(() => {
    if (status === 'loading') return;
    
    // In development, only redirect if there's no session AND no cookies at all
    if (status === 'unauthenticated' && process.env.NODE_ENV === 'production') {
      router.push('/login');
    }
  }, [status, router]);

  // Show loading while checking authentication
  if (status === 'loading') {
    return <PageLoading />;
  }

  // In development, always render dashboard even if not authenticated
  if (status === 'unauthenticated' && process.env.NODE_ENV === 'production') {
    return null;
  }

  const menuItems: MenuProps['items'] = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
      onClick: () => router.push('/dashboard'),
    },
    {
      key: '/dashboard/observations',
      icon: <SolutionOutlined />,
      label: 'Observations',
      onClick: () => router.push('/dashboard/observations'),
    },
    {
      key: '/dashboard/evaluations',
      icon: <FileTextOutlined />,
      label: 'Evaluations',
      onClick: () => router.push('/dashboard/evaluations'),
    },
    {
      key: '/dashboard/mentoring',
      icon: <SolutionOutlined />,
      label: 'Mentoring',
      children: [
        {
          key: '/dashboard/mentoring/sessions',
          label: 'Sessions',
          onClick: () => router.push('/dashboard/mentoring/sessions'),
        },
        {
          key: '/dashboard/mentoring/relationships',
          label: 'Relationships',
          onClick: () => router.push('/dashboard/mentoring/relationships'),
        },
        {
          key: '/dashboard/mentoring/resources',
          label: 'Resources',
          onClick: () => router.push('/dashboard/mentoring/resources'),
        },
      ],
    },
    {
      key: '/dashboard/schools',
      icon: <BankOutlined />,
      label: 'Schools',
      onClick: () => router.push('/dashboard/schools'),
    },
    {
      key: '/dashboard/users',
      icon: <TeamOutlined />,
      label: 'Users',
      onClick: () => router.push('/dashboard/users'),
    },
    {
      key: '/dashboard/analytics',
      icon: <BarChartOutlined />,
      label: 'Analytics',
      onClick: () => router.push('/dashboard/analytics'),
    },
    {
      key: '/dashboard/settings',
      icon: <SettingOutlined />,
      label: 'Settings',
      onClick: () => router.push('/dashboard/settings'),
    },
  ];

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Profile',
      onClick: () => router.push('/dashboard/profile'),
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Settings',
      onClick: () => router.push('/dashboard/settings'),
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
      danger: true,
      onClick: async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        router.push('/login');
      },
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        breakpoint="lg"
        onBreakpoint={(broken) => {
          setCollapsed(broken);
        }}
      >
        <div style={{
          height: 64,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        }}>
          <Text style={{ color: 'white', fontSize: collapsed ? 14 : 18, fontWeight: 600 }}>
            {collapsed ? 'TOS' : 'Teacher Observation'}
          </Text>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[pathname]}
          defaultOpenKeys={['/dashboard/mentoring']}
          items={menuItems}
          style={{ borderRight: 0 }}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            padding: 0,
            background: colorBgContainer,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
          }}
        >
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{
              fontSize: '16px',
              width: 64,
              height: 64,
            }}
          />
          <div style={{ paddingRight: 24 }}>
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <Space style={{ cursor: 'pointer' }}>
                <Avatar icon={<UserOutlined />} />
                <Text>{session?.name || session?.email || 'User'}</Text>
              </Space>
            </Dropdown>
          </div>
        </Header>
        <Content
          style={{
            margin: '24px',
            padding: 24,
            minHeight: 280,
            background: colorBgContainer,
            borderRadius: 8,
          }}
        >
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}