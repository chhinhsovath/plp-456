'use client';

import { useState, useEffect } from 'react';
import { Layout, Menu, Avatar, Dropdown, Space, Typography } from 'antd';
import {
  DashboardOutlined,
  UserOutlined,
  FormOutlined,
  BarChartOutlined,
  TeamOutlined,
  SettingOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  MessageOutlined,
} from '@ant-design/icons';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { OfflineIndicator } from '@/components/OfflineIndicator';
import { PWAInstallPrompt } from '@/components/PWAInstallPrompt';
import { MobileNavigation, MobileHeader } from '@/components/MobileNavigation';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

const menuItems = [
  {
    key: '/dashboard',
    icon: <DashboardOutlined />,
    label: 'Dashboard',
  },
  {
    key: '/dashboard/evaluations',
    icon: <FormOutlined />,
    label: 'Evaluations',
  },
  {
    key: '/dashboard/mentoring',
    icon: <TeamOutlined />,
    label: 'ប្រព័ន្ធណែនាំ',
    children: [
      {
        key: '/dashboard/mentoring',
        label: 'ទំព័រដើម',
      },
      {
        key: '/dashboard/mentoring/analytics',
        label: 'វិភាគទិន្នន័យ',
      },
      {
        key: '/dashboard/mentoring/resources',
        label: 'បណ្ណាល័យធនធាន',
      },
      {
        key: '/dashboard/mentoring/export',
        label: 'ទាញយកទិន្នន័យ',
      },
      {
        key: '/dashboard/mentoring/achievements',
        label: 'សមិទ្ធផល',
      },
      {
        key: '/dashboard/mentoring/ai-assistant',
        label: 'ជំនួយការ AI',
      },
    ],
  },
  {
    key: '/dashboard/teachers',
    icon: <TeamOutlined />,
    label: 'Teachers',
  },
  {
    key: '/dashboard/analytics',
    icon: <BarChartOutlined />,
    label: 'Analytics',
  },
  {
    key: '/dashboard/chat',
    icon: <MessageOutlined />,
    label: 'AI Mentoring',
  },
  {
    key: '/dashboard/users',
    icon: <UserOutlined />,
    label: 'Users',
  },
  {
    key: '/dashboard/settings',
    icon: <SettingOutlined />,
    label: 'Settings',
  },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileNavVisible, setMobileNavVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setMobileNavVisible(false);
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleLogout = () => {
    document.cookie = 'auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    router.push('/login');
  };

  const userMenu = (
    <Menu>
      <Menu.Item key="profile" icon={<UserOutlined />}>
        <Link href="/dashboard/profile">Profile</Link>
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item key="logout" icon={<LogoutOutlined />} onClick={handleLogout}>
        Logout
      </Menu.Item>
    </Menu>
  );

  return (
    <>
      {/* Mobile Navigation */}
      {isMobile && (
        <>
          <MobileHeader onMenuClick={() => setMobileNavVisible(true)} />
          <MobileNavigation
            visible={mobileNavVisible}
            onClose={() => setMobileNavVisible(false)}
          />
        </>
      )}

      {/* Desktop/Tablet Layout */}
      <Layout className="min-h-screen">
        <Sider
          trigger={null}
          collapsible
          collapsed={collapsed}
          theme="dark"
          width={256}
          className={isMobile ? 'hidden' : ''}
          breakpoint="md"
          collapsedWidth={isMobile ? 0 : 80}
        >
          <div className="h-16 flex items-center justify-center">
            <Text strong className="text-white text-lg">
              {collapsed ? 'TOT' : 'Teacher Observation'}
            </Text>
          </div>
          <Menu
            theme="dark"
            mode="inline"
            selectedKeys={[pathname]}
            items={menuItems}
            onClick={({ key }) => router.push(key)}
          />
        </Sider>
        <Layout>
          {!isMobile && (
            <Header className="bg-white px-4 flex items-center justify-between shadow-sm">
              <div
                className="cursor-pointer text-lg hover:text-primary-color transition-colors"
                onClick={() => setCollapsed(!collapsed)}
              >
                {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              </div>
              <Dropdown overlay={userMenu} trigger={['click']}>
                <Space className="cursor-pointer">
                  <Avatar icon={<UserOutlined />} />
                  <Text>Admin</Text>
                </Space>
              </Dropdown>
            </Header>
          )}
          <Content className={`${isMobile ? 'mt-16' : 'm-6 p-6'} bg-white ${!isMobile && 'rounded-lg'} safe-area-inset`}>
            {children}
          </Content>
        </Layout>
        <OfflineIndicator />
        <PWAInstallPrompt />
      </Layout>
    </>
  );
}