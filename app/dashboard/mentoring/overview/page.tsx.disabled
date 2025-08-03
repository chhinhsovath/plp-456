'use client';

import { useState } from 'react';
import {
  Card,
  Row,
  Col,
  Statistic,
  Typography,
  Progress,
  Table,
  Tag,
  Space,
  Button,
  Avatar,
  Timeline,
  List,
  Badge,
  Tooltip,
  Select,
  DatePicker,
} from 'antd';
import {
  UserOutlined,
  TeamOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  RiseOutlined,
  CalendarOutlined,
  BookOutlined,
  TrophyOutlined,
  FileTextOutlined,
  EyeOutlined,
  MessageOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;
const { RangePicker } = DatePicker;

export default function MentoringOverviewPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState<any>([dayjs().startOf('month'), dayjs()]);

  // Mock statistics
  const statistics = {
    totalSessions: 156,
    completedSessions: 142,
    upcomingSessions: 14,
    totalTeachers: 89,
    averageRating: 4.7,
    improvementRate: 85,
  };

  // Mock recent sessions
  const recentSessions = [
    {
      key: '1',
      teacher: { name: 'សុខ សុភា', school: 'បឋមសិក្សា ភូមិថ្មី' },
      mentor: 'ចាន់ ដារា',
      date: '2024-01-15 09:00',
      subject: 'គណិតវិទ្យា',
      status: 'completed',
      rating: 5,
    },
    {
      key: '2',
      teacher: { name: 'លី សុវណ្ណ', school: 'បឋមសិក្សា អូរស្វាយ' },
      mentor: 'សៀម បូរី',
      date: '2024-01-16 14:00',
      subject: 'ភាសាខ្មែរ',
      status: 'scheduled',
      rating: null,
    },
    {
      key: '3',
      teacher: { name: 'ហេង សំអាត', school: 'បឋមសិក្សា ព្រែកលៀប' },
      mentor: 'ចាន់ ដារា',
      date: '2024-01-14 10:00',
      subject: 'វិទ្យាសាស្ត្រ',
      status: 'completed',
      rating: 4,
    },
  ];

  // Mock top performers
  const topPerformers = [
    { name: 'សុខ សុភា', school: 'បឋមសិក្សា ភូមិថ្មី', improvement: 92, sessions: 12 },
    { name: 'លី សុវណ្ណ', school: 'បឋមសិក្សា អូរស្វាយ', improvement: 88, sessions: 10 },
    { name: 'ហេង សំអាត', school: 'បឋមសិក្សា ព្រែកលៀប', improvement: 85, sessions: 11 },
    { name: 'ពេជ្រ សុផល', school: 'បឋមសិក្សា ស្វាយរៀង', improvement: 83, sessions: 9 },
    { name: 'សុង ចន្ថា', school: 'បឋមសិក្សា កំពង់ស្ពឺ', improvement: 80, sessions: 8 },
  ];

  // Mock upcoming activities
  const upcomingActivities = [
    {
      time: '09:00',
      title: 'សង្កេតការបង្រៀន - សុខ សុភា',
      description: 'គណិតវិទ្យា ថ្នាក់ទី៤',
      type: 'observation',
    },
    {
      time: '10:30',
      title: 'ការប្រជុំពិភាក្សា',
      description: 'ពិភាក្សាអំពីវិធីសាស្ត្របង្រៀនថ្មី',
      type: 'meeting',
    },
    {
      time: '14:00',
      title: 'វគ្គបណ្តុះបណ្តាល',
      description: 'ការប្រើប្រាស់បច្ចេកវិទ្យាក្នុងការបង្រៀន',
      type: 'training',
    },
    {
      time: '15:30',
      title: 'ការវាយតម្លៃ - លី សុវណ្ណ',
      description: 'ភាសាខ្មែរ ថ្នាក់ទី៥',
      type: 'evaluation',
    },
  ];

  const columns = [
    {
      title: 'គ្រូបង្រៀន',
      dataIndex: 'teacher',
      key: 'teacher',
      render: (teacher: any) => (
        <Space>
          <Avatar icon={<UserOutlined />} />
          <div>
            <Text strong>{teacher.name}</Text>
            <div>
              <Text type="secondary" className="text-xs">{teacher.school}</Text>
            </div>
          </div>
        </Space>
      ),
    },
    {
      title: 'អ្នកណែនាំ',
      dataIndex: 'mentor',
      key: 'mentor',
    },
    {
      title: 'កាលបរិច្ឆេទ',
      dataIndex: 'date',
      key: 'date',
      render: (date: string) => dayjs(date).format('DD/MM/YYYY HH:mm'),
    },
    {
      title: 'មុខវិជ្ជា',
      dataIndex: 'subject',
      key: 'subject',
    },
    {
      title: 'ស្ថានភាព',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const config = {
          completed: { color: 'success', text: 'បានបញ្ចប់' },
          scheduled: { color: 'processing', text: 'បានកំណត់ពេល' },
        };
        const { color, text } = config[status as keyof typeof config] || { color: 'default', text: status };
        return <Tag color={color}>{text}</Tag>;
      },
    },
    {
      title: 'ការវាយតម្លៃ',
      dataIndex: 'rating',
      key: 'rating',
      render: (rating: number) => rating ? `${rating}/5 ⭐` : '-',
    },
    {
      title: 'សកម្មភាព',
      key: 'action',
      render: () => (
        <Button type="link" icon={<EyeOutlined />} onClick={() => router.push('/dashboard/mentoring/sessions')}>
          មើលលម្អិត
        </Button>
      ),
    },
  ];

  return (
    <div className="min-h-screen w-full bg-gray-50">
      <div className="w-full p-6 lg:p-8">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <Title level={2}>ទិដ្ឋភាពទូទៅនៃការណែនាំ</Title>
          <Text type="secondary">ទិដ្ឋភាពរួមនៃសកម្មភាពណែនាំគ្រូបង្រៀន</Text>
        </div>
        <Space>
          <RangePicker 
            value={dateRange}
            onChange={setDateRange}
            format="DD/MM/YYYY"
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={() => router.push('/dashboard/mentoring/sessions/new')}>
            បង្កើតវគ្គថ្មី
          </Button>
        </Space>
      </div>

      {/* Statistics Cards */}
      <Row gutter={[32, 32]} className="mb-6">
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <Statistic
              title="វគ្គសរុប"
              value={statistics.totalSessions}
              prefix={<CalendarOutlined className="text-blue-600" />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <Statistic
              title="បានបញ្ចប់"
              value={statistics.completedSessions}
              valueStyle={{ color: '#52c41a' }}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <Statistic
              title="នឹងមកដល់"
              value={statistics.upcomingSessions}
              valueStyle={{ color: '#1890ff' }}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <Statistic
              title="គ្រូបង្រៀនសរុប"
              value={statistics.totalTeachers}
              prefix={<TeamOutlined className="text-purple-600" />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <Statistic
              title="ការវាយតម្លៃមធ្យម"
              value={statistics.averageRating}
              suffix="/5"
              prefix={<TrophyOutlined className="text-yellow-600" />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8} lg={4}>
          <Card className="shadow-sm hover:shadow-md transition-shadow">
            <Statistic
              title="អត្រាកែលម្អ"
              value={statistics.improvementRate}
              suffix="%"
              valueStyle={{ color: '#52c41a' }}
              prefix={<RiseOutlined />}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[32, 32]}>
        {/* Recent Sessions */}
        <Col xs={24} lg={16}>
          <Card 
            title="វគ្គណែនាំថ្មីៗ" 
            extra={<Button type="link" onClick={() => router.push('/dashboard/mentoring/sessions')}>មើលទាំងអស់</Button>}
            className="shadow-sm"
          >
            <Table
              columns={columns}
              dataSource={recentSessions}
              pagination={false}
              loading={loading}
            />
          </Card>
        </Col>

        {/* Today's Activities */}
        <Col xs={24} lg={8}>
          <Card 
            title={
              <Space>
                <CalendarOutlined />
                សកម្មភាពថ្ងៃនេះ
              </Space>
            }
            className="shadow-sm h-full"
          >
            <Timeline>
              {upcomingActivities.map((activity, index) => (
                <Timeline.Item 
                  key={index}
                  color={
                    activity.type === 'observation' ? 'blue' :
                    activity.type === 'meeting' ? 'green' :
                    activity.type === 'training' ? 'purple' :
                    'orange'
                  }
                  dot={
                    activity.type === 'observation' ? <EyeOutlined /> :
                    activity.type === 'meeting' ? <TeamOutlined /> :
                    activity.type === 'training' ? <BookOutlined /> :
                    <FileTextOutlined />
                  }
                >
                  <div className="pb-4">
                    <div className="flex justify-between mb-1">
                      <Text strong>{activity.time}</Text>
                    </div>
                    <Text>{activity.title}</Text>
                    <div>
                      <Text type="secondary" className="text-xs">{activity.description}</Text>
                    </div>
                  </div>
                </Timeline.Item>
              ))}
            </Timeline>
          </Card>
        </Col>

        {/* Top Performers */}
        <Col xs={24} lg={12}>
          <Card 
            title={
              <Space>
                <TrophyOutlined />
                គ្រូបង្រៀនពូកែបំផុត
              </Space>
            }
            className="shadow-sm"
          >
            <List
              dataSource={topPerformers}
              renderItem={(item, index) => (
                <List.Item
                  actions={[
                    <Badge count={item.sessions} showZero style={{ backgroundColor: '#52c41a' }}>
                      <Text type="secondary">វគ្គ</Text>
                    </Badge>
                  ]}
                >
                  <List.Item.Meta
                    avatar={
                      <Avatar 
                        size="large" 
                        style={{ backgroundColor: index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : index === 2 ? '#CD7F32' : '#1890ff' }}
                      >
                        {index + 1}
                      </Avatar>
                    }
                    title={<Text strong>{item.name}</Text>}
                    description={
                      <div>
                        <Text type="secondary" className="text-xs">{item.school}</Text>
                        <Progress 
                          percent={item.improvement} 
                          size="small" 
                          strokeColor={item.improvement >= 90 ? '#52c41a' : item.improvement >= 80 ? '#1890ff' : '#faad14'}
                        />
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>

        {/* Quick Actions */}
        <Col xs={24} lg={12}>
          <Card 
            title="សកម្មភាពរហ័ស" 
            className="shadow-sm"
          >
            <Row gutter={[32, 32]}>
              <Col span={12}>
                <Button 
                  type="default" 
                  block 
                  size="large" 
                  icon={<CalendarOutlined />}
                  onClick={() => router.push('/dashboard/mentoring/sessions/new')}
                >
                  កំណត់វគ្គថ្មី
                </Button>
              </Col>
              <Col span={12}>
                <Button 
                  type="default" 
                  block 
                  size="large" 
                  icon={<FileTextOutlined />}
                  onClick={() => router.push('/dashboard/mentoring/reports')}
                >
                  របាយការណ៍
                </Button>
              </Col>
              <Col span={12}>
                <Button 
                  type="default" 
                  block 
                  size="large" 
                  icon={<MessageOutlined />}
                  onClick={() => router.push('/dashboard/mentoring/feedback')}
                >
                  មតិយោបល់
                </Button>
              </Col>
              <Col span={12}>
                <Button 
                  type="default" 
                  block 
                  size="large" 
                  icon={<TeamOutlined />}
                  onClick={() => router.push('/dashboard/mentoring/relationships')}
                >
                  ទំនាក់ទំនង
                </Button>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
      </div>

    </div>
  );
}