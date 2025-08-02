'use client';

import { Card, Row, Col, Statistic, Typography, Space, Table, Tag, Progress } from 'antd';
import { 
  UserOutlined, 
  BankOutlined, 
  BookOutlined, 
  BarChartOutlined,
  TeamOutlined,
  CheckCircleOutlined 
} from '@ant-design/icons';

const { Title, Text } = Typography;

export default function DirectorDashboard() {
  const stats = {
    totalSchools: 45,
    totalTeachers: 423,
    totalMentors: 12,
    completedObservations: 156,
    averageScore: 82.5,
  };

  const schoolData = [
    {
      key: '1',
      name: 'បឋមសិក្សា ភូមិថ្មី',
      teachers: 23,
      observations: 45,
      avgScore: 85,
      status: 'active'
    },
    {
      key: '2',
      name: 'បឋមសិក្សា អូរស្វាយ',
      teachers: 18,
      observations: 32,
      avgScore: 78,
      status: 'active'
    },
    {
      key: '3',
      name: 'បឋមសិក្សា ព្រែកលៀប',
      teachers: 15,
      observations: 28,
      avgScore: 82,
      status: 'active'
    },
  ];

  const columns = [
    {
      title: 'សាលារៀន',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'ចំនួនគ្រូ',
      dataIndex: 'teachers',
      key: 'teachers',
    },
    {
      title: 'ការសង្កេត',
      dataIndex: 'observations',
      key: 'observations',
    },
    {
      title: 'ពិន្ទុមធ្យម',
      dataIndex: 'avgScore',
      key: 'avgScore',
      render: (score: number) => (
        <Progress type="circle" percent={score} width={50} format={() => `${score}`} />
      ),
    },
    {
      title: 'ស្ថានភាព',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'active' ? 'green' : 'orange'}>
          {status === 'active' ? 'សកម្ម' : 'អសកម្ម'}
        </Tag>
      ),
    },
  ];

  return (
    <div className="min-h-screen w-full bg-gray-50">
      <div className="w-full p-6 lg:p-8">
      <div className="mb-8">
        <Title level={2}>ផ្ទាំងគ្រប់គ្រងថ្នាក់ខេត្ត/ស្រុក</Title>
        <Text type="secondary">ទិដ្ឋភាពទូទៅនៃសាលារៀននៅក្នុងតំបន់របស់អ្នក</Text>
      </div>

      <Row gutter={[32, 32]} className="mb-8">
        <Col xs={24} sm={12} lg={6}>
          <Card className="hover:shadow-lg transition-shadow">
            <Statistic
              title="សាលារៀនសរុប"
              value={stats.totalSchools}
              prefix={<BankOutlined className="text-blue-600" />}
              suffix="សាលា"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="hover:shadow-lg transition-shadow">
            <Statistic
              title="គ្រូបង្រៀនសរុប"
              value={stats.totalTeachers}
              prefix={<UserOutlined className="text-green-600" />}
              suffix="នាក់"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="hover:shadow-lg transition-shadow">
            <Statistic
              title="អ្នកណែនាំ"
              value={stats.totalMentors}
              prefix={<TeamOutlined className="text-purple-600" />}
              suffix="នាក់"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="hover:shadow-lg transition-shadow">
            <Statistic
              title="ពិន្ទុមធ្យម"
              value={stats.averageScore}
              prefix={<BarChartOutlined className="text-orange-600" />}
              suffix="%"
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[32, 32]}>
        <Col span={24}>
          <Card title="សាលារៀនក្នុងតំបន់" className="shadow-sm">
            <Table
              columns={columns}
              dataSource={schoolData}
              pagination={false}
            />
          </Card>
        </Col>
      </Row>
      </div>

    </div>
  );
}