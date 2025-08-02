'use client';

import { useState, useEffect } from 'react';
import { Table, Card, Button, Space, Tag, Typography, Row, Col, Statistic, Avatar, Input, Select, App } from 'antd';
import { UserOutlined, TeamOutlined, BookOutlined, StarOutlined, SearchOutlined, FilterOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { useMessage } from '@/hooks/useAntdApp';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;

interface Teacher {
  id: number;
  name: string;
  email: string;
  school?: {
    id: number;
    name: string;
    code: string;
  };
  subjects?: string[];
  grade?: string;
  evaluationCount?: number;
  averageScore?: number;
  lastEvaluation?: string;
  mentorName?: string;
}

export default function TeachersPage() {
  const message = useMessage();
  const router = useRouter();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [filters, setFilters] = useState({
    search: '',
    schoolId: '',
    grade: '',
  });
  const [stats, setStats] = useState({
    total: 0,
    withMentor: 0,
    averageScore: 0,
    evaluatedThisMonth: 0,
  });

  // Fetch teachers
  const fetchTeachers = async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pageSize.toString(),
        role: 'TEACHER',
      });

      if (filters.search) params.append('search', filters.search);
      if (filters.schoolId) params.append('schoolId', filters.schoolId);

      const response = await fetch(`/api/users?${params}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch teachers');
      }

      const data = await response.json();
      
      // Transform users to teachers format
      const teachersData = data.users.map((user: any) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        school: user.school,
        subjects: ['គណិតវិទ្យា', 'ភាសាខ្មែរ'], // Mock data
        grade: 'ថ្នាក់ទី៤',
        evaluationCount: Math.floor(Math.random() * 20),
        averageScore: Math.floor(Math.random() * 30) + 70,
        lastEvaluation: '2024-01-15',
        mentorName: 'សុខ វិសាល',
      }));

      setTeachers(teachersData);
      setPagination({
        current: data.pagination.page,
        pageSize: data.pagination.limit,
        total: data.pagination.total,
      });

      // Calculate stats
      setStats({
        total: data.pagination.total,
        withMentor: Math.floor(data.pagination.total * 0.8),
        averageScore: 82,
        evaluatedThisMonth: Math.floor(data.pagination.total * 0.6),
      });
    } catch (error) {
      message.error('មានបញ្ហាក្នុងការទាញយកទិន្នន័យគ្រូបង្រៀន');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, [filters]);

  const columns = [
    {
      title: 'គ្រូបង្រៀន',
      key: 'teacher',
      render: (record: Teacher) => (
        <Space>
          <Avatar icon={<UserOutlined />} />
          <div>
            <div className="font-medium">{record.name}</div>
            <Text type="secondary" className="text-xs">{record.email}</Text>
          </div>
        </Space>
      ),
    },
    {
      title: 'សាលារៀន',
      key: 'school',
      render: (record: Teacher) => (
        <div>
          <div>{record.school?.name || '-'}</div>
          <Text type="secondary" className="text-xs">{record.school?.code || ''}</Text>
        </div>
      ),
    },
    {
      title: 'មុខវិជ្ជា',
      dataIndex: 'subjects',
      key: 'subjects',
      render: (subjects: string[]) => (
        <>
          {subjects?.map(subject => (
            <Tag key={subject} color="blue">{subject}</Tag>
          ))}
        </>
      ),
    },
    {
      title: 'ថ្នាក់',
      dataIndex: 'grade',
      key: 'grade',
    },
    {
      title: 'ការវាយតម្លៃ',
      key: 'evaluations',
      render: (record: Teacher) => (
        <div>
          <Text>{record.evaluationCount || 0} លើក</Text>
          <br />
          <Text type="secondary" className="text-xs">
            ពិន្ទុមធ្យម: {record.averageScore || '-'}%
          </Text>
        </div>
      ),
    },
    {
      title: 'អ្នកណែនាំ',
      dataIndex: 'mentorName',
      key: 'mentorName',
      render: (mentor: string) => mentor || <Text type="secondary">មិនទាន់កំណត់</Text>,
    },
    {
      title: 'សកម្មភាព',
      key: 'actions',
      render: (_: any, record: Teacher) => (
        <Space size="middle">
          <Button 
            type="link" 
            onClick={() => router.push(`/dashboard/teachers/${record.id}`)}
          >
            មើលលម្អិត
          </Button>
          <Button 
            type="link" 
            onClick={() => router.push(`/dashboard/evaluations/new?teacherId=${record.id}`)}
          >
            វាយតម្លៃ
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="min-h-screen w-full">
      <div className="w-full px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Title level={2}>គ្រូបង្រៀន</Title>
          <Text type="secondary">គ្រប់គ្រងព័ត៌មានគ្រូបង្រៀន និងការវាយតម្លៃ</Text>
        </div>

      {/* Statistics */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={12} sm={12} md={6} lg={6} xl={6}>
          <Card>
            <Statistic
              title="គ្រូបង្រៀនសរុប"
              value={stats.total}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6} lg={6} xl={6}>
          <Card>
            <Statistic
              title="មានអ្នកណែនាំ"
              value={stats.withMentor}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6} lg={6} xl={6}>
          <Card>
            <Statistic
              title="ពិន្ទុមធ្យម"
              value={stats.averageScore}
              suffix="%"
              prefix={<StarOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6} lg={6} xl={6}>
          <Card>
            <Statistic
              title="វាយតម្លៃខែនេះ"
              value={stats.evaluatedThisMonth}
              prefix={<BookOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card className="mb-6">
        <Space size="middle" wrap>
          <Search
            placeholder="ស្វែងរកតាមឈ្មោះ ឬអ៊ីមែល"
            allowClear
            onSearch={(value) => setFilters({ ...filters, search: value })}
            className="w-full sm:w-64 md:w-72 lg:w-80"
            prefix={<SearchOutlined />}
          />
          <Select
            placeholder="ជ្រើសរើសសាលារៀន"
            className="w-full sm:w-48 md:w-52 lg:w-56"
            allowClear
            onChange={(value) => setFilters({ ...filters, schoolId: value })}
          >
            <Option value="">ទាំងអស់</Option>
            {/* Schools will be loaded dynamically */}
          </Select>
          <Select
            placeholder="ជ្រើសរើសថ្នាក់"
            className="w-full sm:w-36 md:w-40 lg:w-44"
            allowClear
            onChange={(value) => setFilters({ ...filters, grade: value })}
          >
            <Option value="">ទាំងអស់</Option>
            <Option value="4">ថ្នាក់ទី៤</Option>
            <Option value="5">ថ្នាក់ទី៥</Option>
            <Option value="6">ថ្នាក់ទី៦</Option>
          </Select>
          <Button icon={<FilterOutlined />}>តម្រង</Button>
        </Space>
      </Card>

      {/* Teachers Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <Table
            columns={columns}
            dataSource={teachers}
            rowKey="id"
            loading={loading}
            scroll={{ x: 'max-content' }}
            pagination={{
              ...pagination,
              showSizeChanger: true,
              showTotal: (total) => `សរុប ${total} គ្រូបង្រៀន`,
              onChange: (page, pageSize) => {
                fetchTeachers(page, pageSize);
              },
            }}
          />
        </div>
      </Card>
      </div>
    </div>
  );
}