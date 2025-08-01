'use client';

import { useState, useEffect } from 'react';
import { Drawer, Menu, Avatar, Typography, Space } from 'antd';
import {
  MenuOutlined,
  DashboardOutlined,
  TeamOutlined,
  UserOutlined,
  BarChartOutlined,
  BookOutlined,
  TrophyOutlined,
  SettingOutlined,
  LogoutOutlined,
} from '@ant-design/icons';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

const { Text } = Typography;

interface MobileNavigationProps {
  visible: boolean;
  onClose: () => void;
}

const menuItems = [
  {
    key: '/dashboard',
    icon: <DashboardOutlined />,
    label: 'ទំព័រដើម',
  },
  {
    key: 'mentoring',
    icon: <TeamOutlined />,
    label: 'ប្រព័ន្ធណែនាំ',
    children: [
      {
        key: '/dashboard/mentoring',
        label: 'ទិដ្ឋភាពទូទៅ',
      },
      {
        key: '/dashboard/mentoring/sessions',
        label: 'វគ្គណែនាំ',
      },
      {
        key: '/dashboard/mentoring/resources',
        label: 'ធនធាន',
      },
      {
        key: '/dashboard/mentoring/achievements',
        icon: <TrophyOutlined />,
        label: 'សមិទ្ធផល',
      },
    ],
  },
  {
    key: '/dashboard/analytics',
    icon: <BarChartOutlined />,
    label: 'វិភាគទិន្នន័យ',
  },
  {
    key: '/dashboard/profile',
    icon: <UserOutlined />,
    label: 'ប្រវត្តិរូប',
  },
  {
    key: '/dashboard/settings',
    icon: <SettingOutlined />,
    label: 'ការកំណត់',
  },
];

export function MobileNavigation({ visible, onClose }: MobileNavigationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);

  useEffect(() => {
    setSelectedKeys([pathname]);
  }, [pathname]);

  const handleMenuClick = ({ key }: { key: string }) => {
    router.push(key);
    onClose();
  };

  const handleLogout = () => {
    document.cookie = 'auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    router.push('/login');
  };

  return (
    <Drawer
      title={
        <Space>
          <Avatar icon={<UserOutlined />} />
          <div>
            <Text strong>គ្រូណែនាំ</Text>
            <br />
            <Text type="secondary" className="text-xs">mentor@plp.edu.kh</Text>
          </div>
        </Space>
      }
      placement="left"
      onClose={onClose}
      open={visible}
      width={280}
      className="mobile-navigation-drawer"
    >
      <Menu
        mode="inline"
        selectedKeys={selectedKeys}
        onClick={handleMenuClick}
        items={menuItems}
        style={{ borderRight: 0 }}
      />
      
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t">
        <Menu
          mode="inline"
          items={[
            {
              key: 'logout',
              icon: <LogoutOutlined />,
              label: 'ចាកចេញ',
              onClick: handleLogout,
            },
          ]}
        />
      </div>
    </Drawer>
  );
}

export function MobileHeader({ onMenuClick }: { onMenuClick: () => void }) {
  const pathname = usePathname();
  
  const getPageTitle = () => {
    if (pathname.includes('mentoring')) return 'ប្រព័ន្ធណែនាំ';
    if (pathname.includes('analytics')) return 'វិភាគទិន្នន័យ';
    if (pathname.includes('profile')) return 'ប្រវត្តិរូប';
    if (pathname.includes('settings')) return 'ការកំណត់';
    return 'ប្រព័ន្ធគ្រប់គ្រង';
  };

  return (
    <div className="mobile-header flex items-center justify-between p-4 bg-white shadow-sm md:hidden">
      <MenuOutlined
        onClick={onMenuClick}
        style={{ fontSize: 20 }}
        className="cursor-pointer"
      />
      <Text strong className="text-lg">{getPageTitle()}</Text>
      <Avatar icon={<UserOutlined />} size="small" />
    </div>
  );
}