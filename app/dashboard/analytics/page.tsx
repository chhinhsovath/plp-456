'use client';

import { Card, Row, Col, Statistic, Typography, Select, DatePicker, Space, Progress, Table, Tag } from 'antd';
import { 
  UserOutlined, 
  BankOutlined, 
  FileTextOutlined, 
  RiseOutlined,
  TeamOutlined,
  TrophyOutlined,
  BarChartOutlined,
  LineChartOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

export default function AnalyticsPage() {
  // Sample data for statistics
  const monthlyProgress = [
    { month: 'មករា', value: 75 },
    { month: 'កុម្ភៈ', value: 78 },
    { month: 'មីនា', value: 80 },
    { month: 'មេសា', value: 82 },
    { month: 'ឧសភា', value: 81 },
    { month: 'មិថុនា', value: 85 },
  ];

  const schoolPerformance = [
    { school: 'បឋមសិក្សា ភូមិថ្មី', score: 85, trend: 'up' },
    { school: 'បឋមសិក្សា អូរស្វាយ', score: 78, trend: 'down' },
    { school: 'បឋមសិក្សា ព្រែកលៀប', score: 82, trend: 'up' },
    { school: 'បឋមសិក្សា ចំការលើ', score: 79, trend: 'up' },
    { school: 'បឋមសិក្សា ទួលគោក', score: 83, trend: 'down' },
  ];

  const performanceDistribution = [
    { type: 'ល្អប្រសើរ', value: 25, color: '#52c41a' },
    { type: 'ល្អ', value: 45, color: '#1890ff' },
    { type: 'មធ្យម', value: 20, color: '#faad14' },
    { type: 'ត្រូវកែលម្អ', value: 10, color: '#ff4d4f' },
  ];

  const topTeachers = [
    { key: '1', rank: 1, name: 'សុខ សុភាព', school: 'បឋមសិក្សា ភូមិថ្មី', score: 95 },
    { key: '2', rank: 2, name: 'ចាន់ ដារា', school: 'បឋមសិក្សា អូរស្វាយ', score: 92 },
    { key: '3', rank: 3, name: 'លី សុវណ្ណ', school: 'បឋមសិក្សា ព្រែកលៀប', score: 90 },
    { key: '4', rank: 4, name: 'ហេង ចំរើន', school: 'បឋមសិក្សា ចំការលើ', score: 88 },
    { key: '5', rank: 5, name: 'សៀម រតនា', school: 'បឋមសិក្សា ទួលគោក', score: 87 },
  ];

  const getProgressColor = (value: number) => {
    if (value >= 85) return '#52c41a';
    if (value >= 70) return '#1890ff';
    if (value >= 50) return '#faad14';
    return '#ff4d4f';
  };

  return (
    <div className="min-h-screen w-full bg-gray-50">
      <div className="w-full p-6 lg:p-8">
        <div className="mb-6">
          <Title level={2}>របាយការណ៍ និងស្ថិតិ</Title>
          <Text type="secondary">ទិដ្ឋភាពទូទៅនៃប្រព័ន្ធវាយតម្លៃការបង្រៀន</Text>
        </div>

      {/* Filters */}
      <Card className="mb-6">
        <Space size="middle" wrap>
          <RangePicker placeholder={['កាលបរិច្ឆេទចាប់ផ្តើម', 'កាលបរិច្ឆេទបញ្ចប់']} />
          <Select defaultValue="all" style={{ width: 200 }}>
            <Option value="all">គ្រប់ខេត្តទាំងអស់</Option>
            <Option value="pp">រាជធានីភ្នំពេញ</Option>
            <Option value="kd">ខេត្តកណ្តាល</Option>
          </Select>
          <Select defaultValue="all" style={{ width: 200 }}>
            <Option value="all">គ្រប់សាលាទាំងអស់</Option>
          </Select>
        </Space>
      </Card>

      {/* Statistics Overview */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="សាលារៀនសរុប"
              value={245}
              prefix={<BankOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
            <Progress percent={100} showInfo={false} strokeColor="#1890ff" />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="គ្រូបង្រៀនសរុប"
              value={1456}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
            <div className="mt-2">
              <Text type="success">
                <RiseOutlined /> 12% ពីខែមុន
              </Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="ការវាយតម្លៃសរុប"
              value={3842}
              prefix={<FileTextOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
            <div className="mt-2">
              <Text>មធ្យម 15.7 ក្នុងមួយគ្រូ</Text>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="ពិន្ទុមធ្យម"
              value={82.5}
              suffix="%"
              prefix={<TrophyOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
            <Progress 
              percent={82.5} 
              showInfo={false} 
              strokeColor="#722ed1"
              status="active"
            />
          </Card>
        </Col>
      </Row>

      {/* Charts */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} lg={12}>
          <Card title="និន្នាការពិន្ទុមធ្យមប្រចាំខែ" extra={<LineChartOutlined />}>
            <div className="space-y-4">
              {monthlyProgress.map((item, index) => (
                <div key={index}>
                  <div className="flex justify-between mb-1">
                    <Text>{item.month}</Text>
                    <Text strong>{item.value}%</Text>
                  </div>
                  <Progress 
                    percent={item.value} 
                    strokeColor={getProgressColor(item.value)}
                    showInfo={false}
                  />
                </div>
              ))}
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="ពិន្ទុមធ្យមតាមសាលារៀន" extra={<BarChartOutlined />}>
            <div className="space-y-4">
              {schoolPerformance.map((item, index) => (
                <div key={index}>
                  <div className="flex justify-between items-center mb-1">
                    <Text>{item.school}</Text>
                    <Space>
                      <Text strong>{item.score}%</Text>
                      {item.trend === 'up' ? (
                        <Text type="success"><ArrowUpOutlined /></Text>
                      ) : (
                        <Text type="danger"><ArrowDownOutlined /></Text>
                      )}
                    </Space>
                  </div>
                  <Progress 
                    percent={item.score} 
                    strokeColor={getProgressColor(item.score)}
                    showInfo={false}
                  />
                </div>
              ))}
            </div>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={8}>
          <Card title="ការបែងចែកតាមលទ្ធផល">
            <div className="space-y-4">
              {performanceDistribution.map((item, index) => (
                <div key={index}>
                  <div className="flex justify-between items-center mb-2">
                    <Space>
                      <div 
                        className="w-4 h-4 rounded" 
                        style={{ backgroundColor: item.color }}
                      />
                      <Text>{item.type}</Text>
                    </Space>
                    <Text strong>{item.value}%</Text>
                  </div>
                  <Progress 
                    percent={item.value} 
                    strokeColor={item.color}
                    showInfo={false}
                  />
                </div>
              ))}
              <div className="mt-6 text-center">
                <Statistic 
                  title="សរុបគ្រូវាយតម្លៃ"
                  value={1456}
                  suffix="នាក់"
                />
              </div>
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={16}>
          <Card title="គ្រូបង្រៀនពូកែ TOP 5" extra={<TrophyOutlined />}>
            <Table
              dataSource={topTeachers}
              rowKey="key"
              columns={[
                {
                  title: 'លំដាប់',
                  dataIndex: 'rank',
                  key: 'rank',
                  width: 80,
                  render: (rank: number) => (
                    <div className={`font-bold ${rank <= 3 ? 'text-orange-500' : ''}`}>
                      #{rank}
                    </div>
                  ),
                },
                {
                  title: 'ឈ្មោះគ្រូ',
                  dataIndex: 'name',
                  key: 'name',
                },
                {
                  title: 'សាលារៀន',
                  dataIndex: 'school',
                  key: 'school',
                },
                {
                  title: 'ពិន្ទុមធ្យម',
                  dataIndex: 'score',
                  key: 'score',
                  render: (score: number) => (
                    <Progress
                      percent={score}
                      size="small"
                      strokeColor={score >= 90 ? '#52c41a' : '#1890ff'}
                    />
                  ),
                },
              ]}
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
      </Row>
      </div>
    </div>
  );
}