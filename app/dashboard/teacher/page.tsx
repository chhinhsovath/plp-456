'use client';

import { Card, Row, Col, Statistic, Typography, Progress, Timeline, Alert, List, Tag } from 'antd';
import { 
  TrophyOutlined, 
  CalendarOutlined, 
  ClockCircleOutlined, 
  BookOutlined,
  StarOutlined,
  CheckCircleOutlined 
} from '@ant-design/icons';

const { Title, Text } = Typography;

export default function TeacherDashboard() {
  const stats = {
    totalObservations: 12,
    averageScore: 82,
    nextObservation: '2024-01-28',
    improvement: 15,
  };

  const recentFeedback = [
    {
      date: '2024-01-20',
      mentor: 'សុខ វិសាល',
      subject: 'គណិតវិទ្យា',
      score: 85,
      feedback: 'ការបង្រៀនល្អ! សូមបន្តការប្រើប្រាស់ឧទាហរណ៍ជាក់ស្តែង',
    },
    {
      date: '2024-01-15',
      mentor: 'ចាន់ សុភា',
      subject: 'ភាសាខ្មែរ',
      score: 78,
      feedback: 'ត្រូវបង្កើនការចូលរួមរបស់សិស្ស',
    },
  ];

  const achievements = [
    { title: 'ការកែលម្អ 10%', icon: <TrophyOutlined />, color: 'gold' },
    { title: 'ការសង្កេត 10 លើក', icon: <StarOutlined />, color: 'blue' },
    { title: 'ពិន្ទុលើស 80%', icon: <CheckCircleOutlined />, color: 'green' },
  ];

  const upcomingTasks = [
    { task: 'រៀបចំផែនការបង្រៀនសប្តាហ៍ក្រោយ', due: '2 ថ្ងៃ' },
    { task: 'ចូលរួមវគ្គបណ្តុះបណ្តាល', due: '5 ថ្ងៃ' },
    { task: 'ស្នើសុំសម្ភារៈបង្រៀន', due: '1 សប្តាហ៍' },
  ];

  return (
    <div className="min-h-screen w-full bg-gray-50">
      <div className="w-full p-6 lg:p-8">
      <div className="mb-8">
        <Title level={2}>ផ្ទាំងគ្រប់គ្រងគ្រូបង្រៀន</Title>
        <Text type="secondary">ស្វាគមន៍! នេះជាការវិភាគអំពីការអនុវត្តរបស់អ្នក</Text>
      </div>

      <Alert
        message="ការសង្កេតបន្ទាប់"
        description={`អ្នកនឹងត្រូវបានសង្កេតនៅថ្ងៃទី ${stats.nextObservation}`}
        type="info"
        showIcon
        className="mb-6"
      />

      <Row gutter={[32, 32]} className="mb-8">
        <Col xs={24} sm={12} lg={6}>
          <Card className="hover:shadow-lg transition-shadow">
            <Statistic
              title="ការសង្កេតសរុប"
              value={stats.totalObservations}
              prefix={<BookOutlined className="text-blue-600" />}
              suffix="លើក"
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="hover:shadow-lg transition-shadow">
            <Statistic
              title="ពិន្ទុមធ្យម"
              value={stats.averageScore}
              prefix={<StarOutlined className="text-yellow-600" />}
              suffix="%"
            />
            <Progress percent={stats.averageScore} showInfo={false} strokeColor="#faad14" />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="hover:shadow-lg transition-shadow">
            <Statistic
              title="ការកែលម្អ"
              value={stats.improvement}
              prefix={<TrophyOutlined className="text-green-600" />}
              suffix="%"
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card className="hover:shadow-lg transition-shadow">
            <Statistic
              title="ការសង្កេតបន្ទាប់"
              value="7"
              prefix={<CalendarOutlined className="text-purple-600" />}
              suffix="ថ្ងៃទៀត"
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[32, 32]}>
        <Col xs={24} lg={14}>
          <Card title="មតិយោបល់ថ្មីៗ" className="shadow-sm">
            <List
              dataSource={recentFeedback}
              renderItem={(item) => (
                <List.Item>
                  <div className="w-full">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <Text strong>{item.subject}</Text>
                        <Text type="secondary" className="ml-3">
                          <CalendarOutlined className="mr-1" />
                          {item.date}
                        </Text>
                      </div>
                      <Tag color={item.score >= 80 ? 'green' : 'orange'}>
                        {item.score}%
                      </Tag>
                    </div>
                    <Text className="text-gray-600">អ្នកណែនាំ: {item.mentor}</Text>
                    <div className="mt-2 p-3 bg-gray-50 rounded">
                      <Text>{item.feedback}</Text>
                    </div>
                  </div>
                </List.Item>
              )}
            />
          </Card>
        </Col>

        <Col xs={24} lg={10}>
          <Card title="សមិទ្ធផល" className="shadow-sm mb-4">
            <div className="grid grid-cols-3 gap-4">
              {achievements.map((achievement, index) => (
                <div key={index} className="text-center">
                  <div className={`text-3xl text-${achievement.color}-500 mb-2`}>
                    {achievement.icon}
                  </div>
                  <Text className="text-xs">{achievement.title}</Text>
                </div>
              ))}
            </div>
          </Card>

          <Card title="កិច្ចការដែលត្រូវធ្វើ" className="shadow-sm">
            <Timeline>
              {upcomingTasks.map((task, index) => (
                <Timeline.Item 
                  key={index}
                  dot={<ClockCircleOutlined className="text-blue-600" />}
                >
                  <div>
                    <Text>{task.task}</Text>
                    <br />
                    <Text type="secondary" className="text-xs">
                      រយៈពេល: {task.due}
                    </Text>
                  </div>
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