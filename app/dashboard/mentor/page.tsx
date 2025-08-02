'use client';

import { Card, Row, Col, Statistic, Typography, List, Button, Tag, Timeline, Avatar } from 'antd';
import { 
  UserOutlined, 
  CalendarOutlined, 
  ClockCircleOutlined, 
  CheckCircleOutlined,
  TeamOutlined,
  BookOutlined 
} from '@ant-design/icons';
import { useRouter } from 'next/navigation';

const { Title, Text } = Typography;

export default function MentorDashboard() {
  const router = useRouter();

  const stats = {
    assignedTeachers: 24,
    completedSessions: 45,
    upcomingSessions: 3,
    averageScore: 78.5,
  };

  const upcomingObservations = [
    {
      id: 1,
      teacher: 'សុខ សុភាព',
      school: 'បឋមសិក្សា ភូមិថ្មី',
      subject: 'គណិតវិទ្យា',
      date: '2024-01-25',
      time: '08:00',
    },
    {
      id: 2,
      teacher: 'ចាន់ ដារា',
      school: 'បឋមសិក្សា អូរស្វាយ',
      subject: 'ភាសាខ្មែរ',
      date: '2024-01-26',
      time: '10:00',
    },
    {
      id: 3,
      teacher: 'លី សុវណ្ណ',
      school: 'បឋមសិក្សា ព្រែកលៀប',
      subject: 'វិទ្យាសាស្ត្រ',
      date: '2024-01-27',
      time: '14:00',
    },
  ];

  const recentActivities = [
    {
      time: '2 ម៉ោងមុន',
      content: 'បានបញ្ចប់ការសង្កេតគ្រូ សុខ សុភា',
      color: 'green',
    },
    {
      time: 'ម្សិលមិញ',
      content: 'បានផ្តល់មតិយោបល់លើការបង្រៀនភាសាខ្មែរ',
      color: 'blue',
    },
    {
      time: '3 ថ្ងៃមុន',
      content: 'បានចូលរួមវគ្គបណ្តុះបណ្តាលអ្នកណែនាំ',
      color: 'purple',
    },
  ];

  return (
    <div className="min-h-screen w-full bg-gray-50">
      <div className="w-full p-6 lg:p-8">
      <div className="mb-8">
        <Title level={2}>ផ្ទាំងគ្រប់គ្រងអ្នកណែនាំ</Title>
        <Text type="secondary">ស្វាគមន៍! អ្នកមានការសង្កេត {stats.upcomingSessions} ដែលនឹងមកដល់</Text>
      </div>

      <Row gutter={[32, 32]} className="mb-8">
        <Col xs={24} sm={12} lg={6}>
          <Card className="hover:shadow-lg transition-shadow">
            <Statistic
              title="គ្រូដែលទទួលខុសត្រូវ"
              value={stats.assignedTeachers}
              prefix={<UserOutlined className="text-blue-600" />}
              suffix="នាក់"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="hover:shadow-lg transition-shadow">
            <Statistic
              title="ការសង្កេតបានបញ្ចប់"
              value={stats.completedSessions}
              prefix={<CheckCircleOutlined className="text-green-600" />}
              suffix="លើក"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="hover:shadow-lg transition-shadow">
            <Statistic
              title="ការសង្កេតនឹងមកដល់"
              value={stats.upcomingSessions}
              prefix={<CalendarOutlined className="text-orange-600" />}
              suffix="លើក"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="hover:shadow-lg transition-shadow">
            <Statistic
              title="ពិន្ទុមធ្យម"
              value={stats.averageScore}
              prefix={<BookOutlined className="text-purple-600" />}
              suffix="%"
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[32, 32]}>
        <Col xs={24} lg={14}>
          <Card 
            title="ការសង្កេតនឹងមកដល់" 
            className="shadow-sm"
            extra={
              <Button type="primary" onClick={() => router.push('/dashboard/evaluations/new')}>
                ការសង្កេតថ្មី
              </Button>
            }
          >
            <List
              dataSource={upcomingObservations}
              renderItem={(item) => (
                <List.Item
                  actions={[
                    <Button key="view" type="link">មើល</Button>,
                    <Button key="start" type="primary">ចាប់ផ្តើម</Button>,
                  ]}
                >
                  <List.Item.Meta
                    avatar={<Avatar icon={<UserOutlined />} />}
                    title={
                      <div>
                        <Text strong>{item.teacher}</Text>
                        <Tag color="blue" className="ml-2">{item.subject}</Tag>
                      </div>
                    }
                    description={
                      <div className="text-gray-600">
                        <div>{item.school}</div>
                        <div className="mt-1">
                          <CalendarOutlined className="mr-1" />
                          {item.date}
                          <ClockCircleOutlined className="ml-3 mr-1" />
                          {item.time}
                        </div>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
        
        <Col xs={24} lg={10}>
          <Card title="សកម្មភាពថ្មីៗ" className="shadow-sm">
            <Timeline>
              {recentActivities.map((activity, index) => (
                <Timeline.Item key={index} color={activity.color}>
                  <Text type="secondary">{activity.time}</Text>
                  <br />
                  <Text>{activity.content}</Text>
                </Timeline.Item>
              ))}
            </Timeline>
          </Card>
        </Col>
      </Row>
      </div>

    </div>
  );
}