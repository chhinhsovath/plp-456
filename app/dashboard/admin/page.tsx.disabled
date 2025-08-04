'use client';

import { Card, Row, Col, Statistic, Typography, Space, Table, Tag, Progress, Button, Avatar, ConfigProvider } from 'antd';
import { 
  UserOutlined, 
  TeamOutlined, 
  BookOutlined, 
  BarChartOutlined,
  HomeOutlined,
  TrophyOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  RiseOutlined,
  FallOutlined
} from '@ant-design/icons';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import khKH from 'antd/locale/km_KH';

const { Title, Text } = Typography;

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Simulate loading
    setTimeout(() => setLoading(false), 500);
  }, []);

  if (!mounted) {
    return null;
  }

  // Mock data for demonstration
  const stats = {
    totalTeachers: 1245,
    totalMentors: 89,
    totalSchools: 234,
    totalObservations: 5678,
    activeUsers: 567,
    completionRate: 78.5,
  };

  const recentActivities = [
    {
      key: '1',
      user: 'សុខ សុភាព',
      role: 'Mentor',
      action: 'បានបញ្ចប់ការសង្កេត',
      school: 'បឋមសិក្សា ភូមិថ្មី',
      time: '5 នាទីមុន',
      status: 'completed'
    },
    {
      key: '2',
      user: 'ចាន់ ដារា',
      role: 'Teacher',
      action: 'បានចុះឈ្មោះថ្មី',
      school: 'បឋមសិក្សា អូរស្វាយ',
      time: '30 នាទីមុន',
      status: 'new'
    },
    {
      key: '3',
      user: 'លី សុវណ្ណ',
      role: 'Mentor',
      action: 'កំពុងធ្វើការសង្កេត',
      school: 'បឋមសិក្សា ព្រែកលៀប',
      time: '1 ម៉ោងមុន',
      status: 'progress'
    },
  ];

  const columns = [
    {
      title: 'អ្នកប្រើប្រាស់',
      dataIndex: 'user',
      key: 'user',
      render: (text: string, record: any) => (
        <Space size="middle">
          <Avatar 
            icon={<UserOutlined />} 
            className="bg-blue-100 text-blue-600"
          />
          <div>
            <div className="font-medium text-gray-800">{text}</div>
            <Text type="secondary" className="text-xs">{record.role}</Text>
          </div>
        </Space>
      ),
    },
    {
      title: 'សកម្មភាព',
      dataIndex: 'action',
      key: 'action',
    },
    {
      title: 'សាលារៀន',
      dataIndex: 'school',
      key: 'school',
    },
    {
      title: 'ពេលវេលា',
      dataIndex: 'time',
      key: 'time',
    },
    {
      title: 'ស្ថានភាព',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const config = {
          completed: { color: 'success', text: 'បានបញ្ចប់' },
          new: { color: 'blue', text: 'ថ្មី' },
          progress: { color: 'processing', text: 'កំពុងដំណើរការ' },
        };
        const { color, text } = config[status as keyof typeof config] || { color: 'default', text: status };
        return <Tag color={color}>{text}</Tag>;
      },
    },
  ];

  return (
    <ConfigProvider locale={khKH}>
      <div className="min-h-screen w-full" style={{ backgroundColor: '#f0f2f5' }}>
        <div className="w-full" style={{ padding: '24px', maxWidth: '1600px', margin: '0 auto' }}>
        {/* Header Section */}
        <div className="mb-8">
          <Title level={2} className="mb-2 text-gray-800">ផ្ទាំងគ្រប់គ្រងប្រព័ន្ធ</Title>
          <Text type="secondary" className="text-base">ទិដ្ឋភាពទូទៅនៃប្រព័ន្ធគ្រប់គ្រងការអប់រំ</Text>
        </div>

        {/* Statistics Cards */}
        <Row gutter={{ xs: 8, sm: 16, md: 16, lg: 24 }} className="mb-8">
          <Col xs={24} sm={12} md={12} lg={6} xl={6} xxl={6}>
            <Card 
              loading={loading} 
              className="h-full hover:shadow-xl transition-all duration-300 border-0 rounded-lg"
              styles={{ body: { padding: '24px' } }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <UserOutlined className="text-blue-600 text-xl" />
                </div>
                <Tag color="blue" className="border-0">
                  <RiseOutlined /> 12%
                </Tag>
              </div>
              <Statistic
                title={<span className="text-gray-600 font-medium">គ្រូបង្រៀនសរុប</span>}
                value={stats.totalTeachers}
                suffix="នាក់"
                valueStyle={{ fontSize: '28px', fontWeight: 600, color: '#1a1a1a' }}
              />
              <div className="mt-4">
                <Progress 
                  percent={85} 
                  showInfo={false} 
                  strokeColor="#3b82f6"
                  size="small"
                  className="mb-0"
                />
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={12} lg={6} xl={6} xxl={6}>
            <Card 
              loading={loading} 
              className="h-full hover:shadow-xl transition-all duration-300 border-0 rounded-lg"
              styles={{ body: { padding: '24px' } }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <TeamOutlined className="text-green-600 text-xl" />
                </div>
                <Tag color="green" className="border-0">
                  <RiseOutlined /> 8%
                </Tag>
              </div>
              <Statistic
                title={<span className="text-gray-600 font-medium">អ្នកណែនាំ</span>}
                value={stats.totalMentors}
                suffix="នាក់"
                valueStyle={{ fontSize: '28px', fontWeight: 600, color: '#1a1a1a' }}
              />
              <div className="mt-4">
                <Progress 
                  percent={92} 
                  showInfo={false} 
                  strokeColor="#10b981"
                  size="small"
                  className="mb-0"
                />
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={12} lg={6} xl={6} xxl={6}>
            <Card 
              loading={loading} 
              className="h-full hover:shadow-xl transition-all duration-300 border-0 rounded-lg"
              styles={{ body: { padding: '24px' } }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <HomeOutlined className="text-purple-600 text-xl" />
                </div>
                <Tag color="purple" className="border-0">
                  <RiseOutlined /> 5%
                </Tag>
              </div>
              <Statistic
                title={<span className="text-gray-600 font-medium">សាលារៀនសរុប</span>}
                value={stats.totalSchools}
                suffix="សាលា"
                valueStyle={{ fontSize: '28px', fontWeight: 600, color: '#1a1a1a' }}
              />
              <div className="mt-4">
                <Progress 
                  percent={78} 
                  showInfo={false} 
                  strokeColor="#8b5cf6"
                  size="small"
                  className="mb-0"
                />
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={12} lg={6} xl={6} xxl={6}>
            <Card 
              loading={loading} 
              className="h-full hover:shadow-xl transition-all duration-300 border-0 rounded-lg"
              styles={{ body: { padding: '24px' } }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <BookOutlined className="text-orange-600 text-xl" />
                </div>
                <Tag color="orange" className="border-0">
                  <RiseOutlined /> 15%
                </Tag>
              </div>
              <Statistic
                title={<span className="text-gray-600 font-medium">ការសង្កេតសរុប</span>}
                value={stats.totalObservations}
                suffix="លើក"
                valueStyle={{ fontSize: '28px', fontWeight: 600, color: '#1a1a1a' }}
              />
              <div className="mt-4">
                <Progress 
                  percent={stats.completionRate} 
                  showInfo={false} 
                  strokeColor="#f97316"
                  size="small"
                  className="mb-0"
                />
              </div>
            </Card>
          </Col>
        </Row>

        {/* Quick Actions */}
        <Row gutter={[16, 16]} className="mb-8">
          <Col span={24}>
            <Card 
              className="border-0 rounded-lg"
              styles={{ 
                body: { padding: '24px' },
                header: { 
                  backgroundColor: '#2563eb',
                  color: 'white',
                  borderRadius: '8px 8px 0 0',
                  padding: '16px 24px'
                }
              }}
              title={
                <div className="flex items-center gap-3">
                  <UserOutlined className="text-xl" />
                  <span className="text-lg font-medium">គ្រប់គ្រងអ្នកប្រើប្រាស់</span>
                </div>
              }
            >
              <Row gutter={[12, 12]}>
                <Col xs={24} sm={12} md={6}>
                  <Button 
                    size="large"
                    icon={<HomeOutlined />} 
                    onClick={() => router.push('/dashboard/schools')}
                    className="w-full h-12 flex items-center justify-center gap-2 border-gray-200 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 transition-all"
                  >
                    គ្រប់គ្រងសាលារៀន
                  </Button>
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Button 
                    size="large"
                    icon={<BarChartOutlined />} 
                    onClick={() => router.push('/dashboard/analytics')}
                    className="w-full h-12 flex items-center justify-center gap-2 border-gray-200 hover:border-green-500 hover:text-green-600 hover:bg-green-50 transition-all"
                  >
                    របាយការណ៍
                  </Button>
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Button 
                    size="large"
                    icon={<TrophyOutlined />} 
                    onClick={() => router.push('/dashboard/achievements')}
                    className="w-full h-12 flex items-center justify-center gap-2 border-gray-200 hover:border-purple-500 hover:text-purple-600 hover:bg-purple-50 transition-all"
                  >
                    សមិទ្ធផល
                  </Button>
                </Col>
                <Col xs={24} sm={12} md={6}>
                  <Button 
                    type="primary"
                    size="large"
                    onClick={() => router.push('/dashboard/users')}
                    className="w-full h-12 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 border-0"
                  >
                    មើលទាំងអស់
                  </Button>
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>

        {/* Recent Activities */}
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Card 
              title={
                <Space className="text-lg font-semibold text-gray-800">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <ClockCircleOutlined className="text-blue-600" />
                  </div>
                  <span>សកម្មភាពថ្មីៗ</span>
                </Space>
              }
              extra={
                <Button 
                  type="link" 
                  onClick={() => router.push('/dashboard/activities')}
                  className="text-blue-600 hover:text-blue-700"
                >
                  មើលទាំងអស់
                </Button>
              }
              className="shadow-md hover:shadow-lg transition-all duration-300 border-0 rounded-lg"
              styles={{ body: { padding: 0 } }}
            >
              <Table
                columns={columns}
                dataSource={recentActivities}
                pagination={false}
                loading={loading}
                className="custom-table"
                rowClassName="hover:bg-gray-50 transition-colors"
              />
            </Card>
          </Col>
        </Row>

        {/* Additional Stats */}
        <Row gutter={[16, 16]} className="mt-8">
          <Col xs={24} sm={24} md={24} lg={12} xl={12} xxl={12}>
            <Card 
              title={<span className="text-lg font-semibold text-gray-800">ស្ថិតិប្រចាំខែ</span>}
              loading={loading} 
              className="h-full shadow-md hover:shadow-lg transition-all duration-300 border-0 rounded-lg"
              styles={{ body: { padding: '32px' } }}
            >
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <BarChartOutlined className="text-3xl text-gray-400" />
                </div>
                <Text type="secondary" className="text-base">ក្រាហ្វិកស្ថិតិនឹងបង្ហាញនៅទីនេះ</Text>
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={24} md={24} lg={12} xl={12} xxl={12}>
            <Card 
              title={<span className="text-lg font-semibold text-gray-800">ការប្រើប្រាស់ប្រព័ន្ធ</span>}
              loading={loading} 
              className="h-full shadow-md hover:shadow-lg transition-all duration-300 border-0 rounded-lg"
              styles={{ body: { padding: '32px' } }}
            >
              <Space direction="vertical" className="w-full" size="large">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <Text className="text-base text-gray-600">អ្នកប្រើប្រាស់សកម្ម</Text>
                    <Text strong className="text-lg">{stats.activeUsers} នាក់</Text>
                  </div>
                  <Progress 
                    percent={Math.round((stats.activeUsers / stats.totalTeachers) * 100)} 
                    size="default"
                    strokeColor="#3b82f6"
                    trailColor="#e5e7eb"
                  />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <Text className="text-base text-gray-600">អត្រាបញ្ចប់ការសង្កេត</Text>
                    <Text strong className="text-lg">{stats.completionRate}%</Text>
                  </div>
                  <Progress 
                    percent={stats.completionRate} 
                    strokeColor="#10b981" 
                    size="default"
                    trailColor="#e5e7eb"
                  />
                </div>
              </Space>
            </Card>
          </Col>
        </Row>
        </div>
      </div>
    </ConfigProvider>
  );
}