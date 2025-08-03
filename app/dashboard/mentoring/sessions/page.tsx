'use client';

import { useState, useEffect } from 'react';
import { Table, Card, Button, Space, Tag, Modal, Form, Input, Select, DatePicker, TimePicker, Typography, Row, Col, Statistic, Avatar, Progress, Rate, App } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, CalendarOutlined, ClockCircleOutlined, TeamOutlined, CheckCircleOutlined, VideoCameraOutlined, CommentOutlined, StarOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import dayjs from '@/lib/dayjs-config';
import { formatDateForDisplay, formatDateTimeForDisplay, DATE_FORMATS, formatDateForAPI } from '@/lib/date-utils';
import { useMessage } from '@/hooks/useAntdApp';

const { Title, Text, TextArea } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

interface Session {
  id: number;
  title: string;
  description?: string;
  type: string;
  status: string;
  date: string;
  duration?: number;
  location?: string;
  objectives?: string;
  outcomes?: string;
  feedback?: string;
  rating?: number;
  schoolId: number;
  facilitatorId: number;
  createdAt: string;
  updatedAt: string;
}

const sessionTypes = {
  observation: 'ការសង្កេតក្នុងថ្នាក់',
  coaching: 'ការបង្វឹក',
  planning: 'ការរៀបចំផែនការ',
  workshop: 'សិក្ខាសាលា',
  feedback: 'ការផ្តល់មតិយោបល់',
};

const sessionStatus = {
  scheduled: 'បានកំណត់ពេល',
  in_progress: 'កំពុងដំណើរការ',
  completed: 'បានបញ្ចប់',
  cancelled: 'បានលុបចោល',
};

const statusColors = {
  scheduled: 'blue',
  in_progress: 'processing',
  completed: 'success',
  cancelled: 'error',
};

export default function MentoringSessionsPage() {
  const message = useMessage();
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<Session | null>(null);
  const [form] = Form.useForm();
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [filters, setFilters] = useState({
    search: '',
    type: '',
    status: '',
    dateRange: null as [dayjs.Dayjs, dayjs.Dayjs] | null,
  });
  const [stats, setStats] = useState({
    total: 0,
    scheduled: 0,
    completed: 0,
    averageRating: 0,
  });

  // Fetch sessions
  const fetchSessions = async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pageSize.toString(),
      });

      if (filters.search) params.append('search', filters.search);
      if (filters.type) params.append('type', filters.type);
      if (filters.status) params.append('status', filters.status);

      const response = await fetch(`/api/mentoring/sessions?${params}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch sessions');
      }

      const data = await response.json();
      setSessions(data.sessions || []);
      setPagination({
        current: data.pagination?.page || 1,
        pageSize: data.pagination?.limit || 10,
        total: data.pagination?.total || 0,
      });

      // Calculate stats
      const stats = {
        total: data.pagination?.total || 0,
        scheduled: 0,
        completed: 0,
        averageRating: 0,
      };

      let totalRating = 0;
      let ratedSessions = 0;

      (data.sessions || []).forEach((session: Session) => {
        if (session.status === 'scheduled') stats.scheduled++;
        if (session.status === 'completed') stats.completed++;
        if (session.rating) {
          totalRating += session.rating;
          ratedSessions++;
        }
      });

      stats.averageRating = ratedSessions > 0 ? totalRating / ratedSessions : 0;
      setStats(stats);
    } catch (error) {
      // Mock data for development
      const mockSessions = [
        {
          id: 1,
          title: 'ការសង្កេតការបង្រៀនភាសាខ្មែរ',
          description: 'សង្កេតវិធីសាស្ត្របង្រៀនអាន និងសរសេរ',
          type: 'observation',
          status: 'completed',
          date: '2024-03-15T09:00:00',
          duration: 60,
          location: 'ថ្នាក់ទី៤ក',
          objectives: 'ពិនិត្យមើលវិធីសាស្ត្របង្រៀន',
          outcomes: 'គ្រូបានអនុវត្តបច្ចេកទេសថ្មីក្នុងការបង្រៀន',
          feedback: 'ការបង្រៀនមានប្រសិទ្ធភាពល្អ',
          rating: 4,
          schoolId: 1,
          facilitatorId: 1,
          createdAt: '2024-03-10T10:00:00',
          updatedAt: '2024-03-15T11:00:00',
        },
        {
          id: 2,
          title: 'សិក្ខាសាលាស្តីពីការវាយតម្លៃសិស្ស',
          type: 'workshop',
          status: 'scheduled',
          date: '2024-03-20T14:00:00',
          duration: 120,
          location: 'បន្ទប់ប្រជុំ',
          schoolId: 1,
          facilitatorId: 1,
          createdAt: '2024-03-12T10:00:00',
          updatedAt: '2024-03-12T10:00:00',
        },
      ];
      setSessions(mockSessions);
      setPagination({ current: 1, pageSize: 10, total: 2 });
      setStats({ total: 2, scheduled: 1, completed: 1, averageRating: 4 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [filters]);

  // Handle submit
  const handleSubmit = async (values: any) => {
    try {
      const url = editingSession ? `/api/mentoring/sessions/${editingSession.id}` : '/api/mentoring/sessions';
      const method = editingSession ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          ...values,
          date: formatDateForAPI(values.date),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save session');
      }

      message.success(editingSession ? 'វគ្គបានធ្វើបច្ចុប្បន្នភាពដោយជោគជ័យ' : 'វគ្គបានបង្កើតដោយជោគជ័យ');
      setIsModalOpen(false);
      form.resetFields();
      setEditingSession(null);
      fetchSessions(pagination.current, pagination.pageSize);
    } catch (error) {
      message.error('មានបញ្ហាក្នុងការរក្សាទុកវគ្គ');
    }
  };

  // Handle delete
  const handleDelete = async (sessionId: number) => {
    try {
      const response = await fetch(`/api/mentoring/sessions/${sessionId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to delete session');
      }

      message.success('វគ្គបានលុបដោយជោគជ័យ');
      fetchSessions(pagination.current, pagination.pageSize);
    } catch (error) {
      message.error('មានបញ្ហាក្នុងការលុបវគ្គ');
    }
  };

  // Handle edit
  const handleEdit = (session: Session) => {
    setEditingSession(session);
    form.setFieldsValue({
      ...session,
      date: dayjs(session.date),
    });
    setIsModalOpen(true);
  };

  // Table columns
  const columns = [
    {
      title: 'ចំណងជើង',
      dataIndex: 'title',
      key: 'title',
      render: (text: string, record: Session) => (
        <div>
          <div className="font-medium">{text}</div>
          {record.description && (
            <Text type="secondary" className="text-xs">{record.description}</Text>
          )}
        </div>
      ),
    },
    {
      title: 'ប្រភេទ',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => (
        <Tag color="blue">
          {sessionTypes[type as keyof typeof sessionTypes] || type}
        </Tag>
      ),
    },
    {
      title: 'កាលបរិច្ឆេទ',
      dataIndex: 'date',
      key: 'date',
      render: (date: string) => (
        <Space>
          <CalendarOutlined />
          {formatDateTimeForDisplay(date)}
        </Space>
      ),
    },
    {
      title: 'រយៈពេល',
      dataIndex: 'duration',
      key: 'duration',
      render: (duration: number) => duration ? `${duration} នាទី` : '-',
    },
    {
      title: 'ទីតាំង',
      dataIndex: 'location',
      key: 'location',
      render: (location: string) => location || '-',
    },
    {
      title: 'ស្ថានភាព',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={statusColors[status as keyof typeof statusColors] || 'default'}>
          {sessionStatus[status as keyof typeof sessionStatus] || status}
        </Tag>
      ),
    },
    {
      title: 'ការវាយតម្លៃ',
      dataIndex: 'rating',
      key: 'rating',
      render: (rating: number) => rating ? <Rate disabled value={rating} /> : '-',
    },
    {
      title: 'សកម្មភាព',
      key: 'actions',
      render: (_: any, record: Session) => (
        <Space size="middle">
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            កែប្រែ
          </Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
          >
            លុប
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="min-h-screen w-full">
      <div className="w-full px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Title level={2}>វគ្គសង្កេត និងណែនាំ</Title>
          <Text type="secondary">គ្រប់គ្រងវគ្គសង្កេត និងការណែនាំគ្រូបង្រៀន</Text>
        </div>

        {/* Statistics */}
        <Row gutter={[16, 16]} className="mb-6">
          <Col xs={12} sm={12} md={6} lg={6} xl={6}>
            <Card>
              <Statistic
                title="វគ្គសរុប"
                value={stats.total}
                prefix={<CalendarOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={12} md={6} lg={6} xl={6}>
            <Card>
              <Statistic
                title="បានកំណត់ពេល"
                value={stats.scheduled}
                prefix={<ClockCircleOutlined />}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={12} md={6} lg={6} xl={6}>
            <Card>
              <Statistic
                title="បានបញ្ចប់"
                value={stats.completed}
                prefix={<CheckCircleOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={12} sm={12} md={6} lg={6} xl={6}>
            <Card>
              <Statistic
                title="ការវាយតម្លៃមធ្យម"
                value={stats.averageRating}
                suffix="/ 5"
                prefix={<StarOutlined />}
                valueStyle={{ color: '#faad14' }}
                precision={1}
              />
            </Card>
          </Col>
        </Row>

        {/* Filters and Actions */}
        <Card className="mb-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <Space wrap className="w-full lg:w-auto">
              <Input
                placeholder="ស្វែងរកតាមចំណងជើង"
                prefix={<SearchOutlined />}
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="w-full sm:w-64 md:w-72 lg:w-80"
                allowClear
              />
              <Select
                placeholder="ប្រភេទ"
                value={filters.type}
                onChange={(value) => setFilters({ ...filters, type: value })}
                className="w-full sm:w-48 md:w-52 lg:w-56"
                allowClear
              >
                {Object.entries(sessionTypes).map(([value, label]) => (
                  <Option key={value} value={value}>{label}</Option>
                ))}
              </Select>
              <Select
                placeholder="ស្ថានភាព"
                value={filters.status}
                onChange={(value) => setFilters({ ...filters, status: value })}
                className="w-full sm:w-36 md:w-40 lg:w-44"
                allowClear
              >
                {Object.entries(sessionStatus).map(([value, label]) => (
                  <Option key={value} value={value}>{label}</Option>
                ))}
              </Select>
            </Space>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => {
                setEditingSession(null);
                form.resetFields();
                setIsModalOpen(true);
              }}
            >
              បង្កើតវគ្គថ្មី
            </Button>
          </div>
        </Card>

        {/* Sessions Table */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <Table
              columns={columns}
              dataSource={sessions}
              rowKey="id"
              loading={loading}
              scroll={{ x: 'max-content' }}
              pagination={{
                ...pagination,
                showSizeChanger: true,
                showTotal: (total) => `សរុប ${total} វគ្គ`,
                onChange: (page, pageSize) => {
                  fetchSessions(page, pageSize);
                },
              }}
            />
          </div>
        </Card>

        {/* Create/Edit Modal */}
        <Modal
          title={editingSession ? 'កែប្រែវគ្គ' : 'បង្កើតវគ្គថ្មី'}
          open={isModalOpen}
          onCancel={() => {
            setIsModalOpen(false);
            form.resetFields();
            setEditingSession(null);
          }}
          footer={null}
          width={800}
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
          >
            <Row gutter={16}>
              <Col span={24}>
                <Form.Item
                  label="ចំណងជើង"
                  name="title"
                  rules={[{ required: true, message: 'សូមបញ្ចូលចំណងជើង' }]}
                >
                  <Input placeholder="បញ្ចូលចំណងជើងវគ្គ" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="ប្រភេទ"
                  name="type"
                  rules={[{ required: true, message: 'សូមជ្រើសរើសប្រភេទ' }]}
                >
                  <Select placeholder="ជ្រើសរើសប្រភេទ">
                    {Object.entries(sessionTypes).map(([value, label]) => (
                      <Option key={value} value={value}>{label}</Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="ស្ថានភាព"
                  name="status"
                  initialValue="scheduled"
                >
                  <Select>
                    {Object.entries(sessionStatus).map(([value, label]) => (
                      <Option key={value} value={value}>{label}</Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="កាលបរិច្ឆេទ និងពេលវេលា"
                  name="date"
                  rules={[{ required: true, message: 'សូមជ្រើសរើសកាលបរិច្ឆេទ' }]}
                >
                  <DatePicker
                    showTime
                    format={DATE_FORMATS.DISPLAY_DATE_TIME}
                    className="w-full"
                    placeholder="ជ្រើសរើសកាលបរិច្ឆេទ និងពេលវេលា"
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="រយៈពេល (នាទី)"
                  name="duration"
                >
                  <Input type="number" placeholder="60" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={24}>
                <Form.Item
                  label="ទីតាំង"
                  name="location"
                >
                  <Input placeholder="បញ្ចូលទីតាំង (ឧ. ថ្នាក់ទី៤ក, បន្ទប់ប្រជុំ)" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={24}>
                <Form.Item
                  label="ការពិពណ៌នា"
                  name="description"
                >
                  <TextArea rows={3} placeholder="បញ្ចូលការពិពណ៌នាអំពីវគ្គ" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={24}>
                <Form.Item
                  label="គោលបំណង"
                  name="objectives"
                >
                  <TextArea rows={3} placeholder="បញ្ចូលគោលបំណងនៃវគ្គ" />
                </Form.Item>
              </Col>
            </Row>

            {editingSession && editingSession.status === 'completed' && (
              <>
                <Row gutter={16}>
                  <Col span={24}>
                    <Form.Item
                      label="លទ្ធផល"
                      name="outcomes"
                    >
                      <TextArea rows={3} placeholder="បញ្ចូលលទ្ធផលនៃវគ្គ" />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col span={24}>
                    <Form.Item
                      label="មតិយោបល់"
                      name="feedback"
                    >
                      <TextArea rows={3} placeholder="បញ្ចូលមតិយោបល់" />
                    </Form.Item>
                  </Col>
                </Row>

                <Row gutter={16}>
                  <Col span={24}>
                    <Form.Item
                      label="ការវាយតម្លៃ"
                      name="rating"
                    >
                      <Rate />
                    </Form.Item>
                  </Col>
                </Row>
              </>
            )}

            <Form.Item className="mb-0">
              <Space className="w-full justify-end">
                <Button onClick={() => {
                  setIsModalOpen(false);
                  form.resetFields();
                  setEditingSession(null);
                }}>
                  បោះបង់
                </Button>
                <Button type="primary" htmlType="submit">
                  {editingSession ? 'រក្សាទុក' : 'បង្កើត'}
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </div>
  );
}