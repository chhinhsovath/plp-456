'use client';

import { Card, Row, Col, Statistic, Progress, Typography, Space, List, Avatar, Tag } from 'antd';
import { 
  UserOutlined, 
  TeamOutlined, 
  FileTextOutlined, 
  CheckCircleOutlined,
  ClockCircleOutlined,
  BookOutlined,
  TrophyOutlined,
  RiseOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;

export default function DashboardPage() {
  const stats = [
    {
      title: 'Total Teachers',
      value: 156,
      icon: <UserOutlined />,
      color: '#1890ff',
      trend: '+12%',
    },
    {
      title: 'Active Mentorships',
      value: 48,
      icon: <TeamOutlined />,
      color: '#52c41a',
      trend: '+8%',
    },
    {
      title: 'Evaluations',
      value: 234,
      icon: <FileTextOutlined />,
      color: '#faad14',
      trend: '+15%',
    },
    {
      title: 'Completed Sessions',
      value: 892,
      icon: <CheckCircleOutlined />,
      color: '#722ed1',
      trend: '+20%',
    },
  ];

  const recentActivities = [
    {
      title: 'New evaluation submitted',
      description: 'John Doe completed evaluation for Jane Smith',
      time: '2 hours ago',
      type: 'evaluation',
    },
    {
      title: 'Mentoring session completed',
      description: 'Sarah Johnson completed session with Mike Wilson',
      time: '5 hours ago',
      type: 'session',
    },
    {
      title: 'Resource uploaded',
      description: 'New teaching material added to resource library',
      time: '1 day ago',
      type: 'resource',
    },
    {
      title: 'Achievement unlocked',
      description: 'Tom Brown earned "Master Mentor" badge',
      time: '2 days ago',
      type: 'achievement',
    },
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'evaluation':
        return <FileTextOutlined style={{ color: '#faad14' }} />;
      case 'session':
        return <ClockCircleOutlined style={{ color: '#52c41a' }} />;
      case 'resource':
        return <BookOutlined style={{ color: '#1890ff' }} />;
      case 'achievement':
        return <TrophyOutlined style={{ color: '#722ed1' }} />;
      default:
        return <CheckCircleOutlined />;
    }
  };

  return (
    <div>
      <Title level={2}>Dashboard Overview</Title>
      
      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        {stats.map((stat, index) => (
          <Col xs={24} sm={12} lg={6} key={index}>
            <Card>
              <Space>
                <div style={{
                  width: 48,
                  height: 48,
                  borderRadius: 8,
                  backgroundColor: `${stat.color}20`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 24,
                  color: stat.color,
                }}>
                  {stat.icon}
                </div>
                <Statistic
                  title={stat.title}
                  value={stat.value}
                  suffix={
                    <Text type="success" style={{ fontSize: 14 }}>
                      <RiseOutlined /> {stat.trend}
                    </Text>
                  }
                />
              </Space>
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24} lg={12}>
          <Card title="Performance Overview">
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <Text>Teacher Performance</Text>
                <Progress percent={78} status="active" />
              </div>
              <div>
                <Text>Student Progress</Text>
                <Progress percent={65} status="active" strokeColor="#52c41a" />
              </div>
              <div>
                <Text>Resource Utilization</Text>
                <Progress percent={82} status="active" strokeColor="#faad14" />
              </div>
              <div>
                <Text>Session Completion</Text>
                <Progress percent={91} status="active" strokeColor="#722ed1" />
              </div>
            </Space>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title="Recent Activities">
            <List
              itemLayout="horizontal"
              dataSource={recentActivities}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={
                      <Avatar 
                        icon={getActivityIcon(item.type)} 
                        style={{ backgroundColor: '#f0f2f5' }}
                      />
                    }
                    title={item.title}
                    description={
                      <Space direction="vertical" size={0}>
                        <Text type="secondary">{item.description}</Text>
                        <Text type="secondary" style={{ fontSize: 12 }}>{item.time}</Text>
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
        <Col xs={24}>
          <Card title="Quick Actions">
            <Space size="large" wrap>
              <Card 
                size="small" 
                style={{ cursor: 'pointer' }}
                bodyStyle={{ padding: 16, textAlign: 'center' }}
              >
                <FileTextOutlined style={{ fontSize: 24, color: '#1890ff' }} />
                <div style={{ marginTop: 8 }}>
                  <Text>New Evaluation</Text>
                </div>
              </Card>
              <Card 
                size="small" 
                style={{ cursor: 'pointer' }}
                bodyStyle={{ padding: 16, textAlign: 'center' }}
              >
                <TeamOutlined style={{ fontSize: 24, color: '#52c41a' }} />
                <div style={{ marginTop: 8 }}>
                  <Text>Schedule Session</Text>
                </div>
              </Card>
              <Card 
                size="small" 
                style={{ cursor: 'pointer' }}
                bodyStyle={{ padding: 16, textAlign: 'center' }}
              >
                <BookOutlined style={{ fontSize: 24, color: '#faad14' }} />
                <div style={{ marginTop: 8 }}>
                  <Text>Upload Resource</Text>
                </div>
              </Card>
              <Card 
                size="small" 
                style={{ cursor: 'pointer' }}
                bodyStyle={{ padding: 16, textAlign: 'center' }}
              >
                <UserOutlined style={{ fontSize: 24, color: '#722ed1' }} />
                <div style={{ marginTop: 8 }}>
                  <Text>Add Teacher</Text>
                </div>
              </Card>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
}