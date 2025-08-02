'use client';

import { useState, useEffect } from 'react';
import { Table, Card, Button, Space, Tag, Modal, Form, Input, Select, Popconfirm, Typography, Row, Col, Statistic, Avatar, Spin } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, UserOutlined, TeamOutlined, CheckCircleOutlined, CloseCircleOutlined, ReloadOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import { useMessage } from '@/hooks/useAntdApp';

const { Title, Text } = Typography;
const { Option } = Select;

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  auth_provider: string;
  telegramUsername?: string;
  createdAt: string;
  updatedAt: string;
  school?: {
    id: number;
    name: string;
    code: string;
  };
}

interface School {
  id: number;
  name: string;
  code: string;
}

const roleLabels: Record<string, string> = {
  ADMINISTRATOR: 'អ្នកគ្រប់គ្រងប្រព័ន្ធ',
  ZONE: 'ថ្នាក់តំបន់',
  PROVINCIAL: 'ថ្នាក់ខេត្ត',
  PROVINCIAL_DIRECTOR: 'នាយកខេត្ត',
  DEPARTMENT: 'ថ្នាក់ក្រសួង',
  DISTRICT_DIRECTOR: 'នាយកស្រុក',
  CLUSTER: 'ថ្នាក់ចង្កោម',
  DIRECTOR: 'នាយកសាលា',
  MENTOR: 'អ្នកណែនាំ',
  TEACHER: 'គ្រូបង្រៀន',
  admin: 'អ្នកគ្រប់គ្រងប្រព័ន្ធ',
  mentor: 'អ្នកណែនាំ',
  teacher: 'គ្រូបង្រៀន',
};

const roleColors: Record<string, string> = {
  ADMINISTRATOR: 'red',
  ZONE: 'orange',
  PROVINCIAL: 'gold',
  PROVINCIAL_DIRECTOR: 'green',
  DEPARTMENT: 'cyan',
  DISTRICT_DIRECTOR: 'blue',
  CLUSTER: 'geekblue',
  DIRECTOR: 'purple',
  MENTOR: 'magenta',
  TEACHER: 'volcano',
  admin: 'red',
  mentor: 'magenta',
  teacher: 'volcano',
};

export default function UsersPage() {
  const message = useMessage();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form] = Form.useForm();
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [filters, setFilters] = useState({
    search: '',
    role: '',
    isActive: '',
  });
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    byRole: {} as Record<string, number>,
  });

  // Fetch users
  const fetchUsers = async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pageSize.toString(),
      });

      if (filters.search) params.append('search', filters.search);
      if (filters.role) params.append('role', filters.role);
      if (filters.isActive) params.append('isActive', filters.isActive);

      const token = localStorage.getItem('auth-token');
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`/api/users?${params}`, {
        credentials: 'include',
        headers,
      });

      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }

      const data = await response.json();
      setUsers(data.users);
      setPagination({
        current: data.pagination.page,
        pageSize: data.pagination.limit,
        total: data.pagination.total,
      });

      // Calculate stats
      const stats = {
        total: data.pagination.total,
        active: 0,
        inactive: 0,
        byRole: {} as Record<string, number>,
      };

      data.users.forEach((user: User) => {
        if (user.isActive) stats.active++;
        else stats.inactive++;
        stats.byRole[user.role] = (stats.byRole[user.role] || 0) + 1;
      });

      setStats(stats);
    } catch (error) {
      message.error('មានបញ្ហាក្នុងការទាញយកទិន្នន័យអ្នកប្រើប្រាស់');
    } finally {
      setLoading(false);
    }
  };

  // Fetch schools
  const fetchSchools = async () => {
    try {
      const token = localStorage.getItem('auth-token');
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('/api/schools?limit=100', {
        credentials: 'include',
        headers,
      });

      if (!response.ok) {
        throw new Error('Failed to fetch schools');
      }

      const data = await response.json();
      setSchools(data.schools);
    } catch (error) {
      console.error('Failed to fetch schools:', error);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchSchools();
  }, [filters]);

  // Handle create/update user
  const handleSubmit = async (values: any) => {
    try {
      const url = editingUser ? `/api/users/${editingUser.id}` : '/api/users';
      const method = editingUser ? 'PATCH' : 'POST';

      const token = localStorage.getItem('auth-token');
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(url, {
        method,
        headers,
        credentials: 'include',
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save user');
      }

      message.success(editingUser ? 'អ្នកប្រើប្រាស់បានធ្វើបច្ចុប្បន្នភាពដោយជោគជ័យ' : 'អ្នកប្រើប្រាស់បានបង្កើតដោយជោគជ័យ');
      setIsModalOpen(false);
      form.resetFields();
      setEditingUser(null);
      fetchUsers(pagination.current, pagination.pageSize);
    } catch (error: any) {
      message.error(error.message || 'មានបញ្ហាក្នុងការរក្សាទុកអ្នកប្រើប្រាស់');
    }
  };

  // Handle delete user
  const handleDelete = async (userId: number) => {
    try {
      const token = localStorage.getItem('auth-token');
      const headers: HeadersInit = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers,
      });

      if (!response.ok) {
        throw new Error('Failed to delete user');
      }

      message.success('អ្នកប្រើប្រាស់បានលុបដោយជោគជ័យ');
      fetchUsers(pagination.current, pagination.pageSize);
    } catch (error) {
      message.error('មានបញ្ហាក្នុងការលុបអ្នកប្រើប្រាស់');
    }
  };

  // Open edit modal
  const handleEdit = (user: User) => {
    setEditingUser(user);
    form.setFieldsValue({
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      schoolId: user.school?.id,
    });
    setIsModalOpen(true);
  };

  // Table columns
  const columns = [
    {
      title: 'ឈ្មោះ',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: User) => (
        <Space>
          <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#e6f4ff', color: '#1677ff' }} />
          <div>
            <div style={{ fontWeight: 500 }}>{text}</div>
            <Text type="secondary" style={{ fontSize: '12px' }}>{record.email}</Text>
          </div>
        </Space>
      ),
    },
    {
      title: 'តួនាទី',
      dataIndex: 'role',
      key: 'role',
      render: (role: string) => (
        <Tag color={roleColors[role] || 'default'}>
          {roleLabels[role] || role}
        </Tag>
      ),
    },
    {
      title: 'សាលារៀន',
      dataIndex: 'school',
      key: 'school',
      render: (school: any) => school ? (
        <div>
          <div>{school.name}</div>
          <Text type="secondary" className="text-xs">{school.code}</Text>
        </div>
      ) : '-',
    },
    {
      title: 'ប្រភេទគណនី',
      dataIndex: 'auth_provider',
      key: 'auth_provider',
      render: (provider: string) => (
        <Tag color={provider === 'TELEGRAM' ? 'blue' : 'default'}>
          {provider}
        </Tag>
      ),
    },
    {
      title: 'ស្ថានភាព',
      dataIndex: 'isActive',
      key: 'isActive',
      render: (isActive: boolean) => (
        <Tag color={isActive ? 'green' : 'red'} icon={isActive ? <CheckCircleOutlined /> : <CloseCircleOutlined />}>
          {isActive ? 'សកម្ម' : 'អសកម្ម'}
        </Tag>
      ),
    },
    {
      title: 'បង្កើតនៅ',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: string) => new Date(date).toLocaleDateString('km-KH'),
    },
    {
      title: 'សកម្មភាព',
      key: 'actions',
      render: (_: any, record: User) => (
        <Space size="middle">
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            កែប្រែ
          </Button>
          <Popconfirm
            title="តើអ្នកប្រាកដថាចង់លុបអ្នកប្រើប្រាស់នេះមែនទេ?"
            onConfirm={() => handleDelete(record.id)}
            okText="បាទ/ចាស"
            cancelText="ទេ"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              លុប
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="min-h-screen w-full">
      <div className="w-full px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Title level={2}>គ្រប់គ្រងអ្នកប្រើប្រាស់</Title>
          <Text type="secondary">គ្រប់គ្រងគណនីអ្នកប្រើប្រាស់ក្នុងប្រព័ន្ធ</Text>
        </div>

      {/* Statistics */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={12} md={6} lg={6}>
          <Card>
            <Statistic
              title="អ្នកប្រើប្រាស់សរុប"
              value={stats.total}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6} lg={6}>
          <Card>
            <Statistic
              title="សកម្ម"
              value={stats.active}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6} lg={6}>
          <Card>
            <Statistic
              title="អសកម្ម"
              value={stats.inactive}
              prefix={<CloseCircleOutlined />}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6} lg={6}>
          <Card>
            <Statistic
              title="គ្រូបង្រៀន"
              value={stats.byRole.TEACHER || stats.byRole.teacher || 0}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters and Actions */}
      <Card className="mb-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <Space wrap style={{ width: '100%' }}>
            <Input
              placeholder="ស្វែងរកតាមឈ្មោះ ឬ អ៊ីមែល"
              prefix={<SearchOutlined />}
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              style={{ width: 280 }}
              allowClear
            />
            <Select
              placeholder="តួនាទី"
              value={filters.role}
              onChange={(value) => setFilters({ ...filters, role: value })}
              style={{ width: 200 }}
              allowClear
            >
              <Option value="admin">អ្នកគ្រប់គ្រងប្រព័ន្ធ</Option>
              <Option value="mentor">អ្នកណែនាំ</Option>
              <Option value="teacher">គ្រូបង្រៀន</Option>
            </Select>
            <Select
              placeholder="ស្ថានភាព"
              value={filters.isActive}
              onChange={(value) => setFilters({ ...filters, isActive: value })}
              style={{ width: 150 }}
              allowClear
            >
              <Option value="true">សកម្ម</Option>
              <Option value="false">អសកម្ម</Option>
            </Select>
            <Button icon={<ReloadOutlined />} onClick={() => fetchUsers()}>
              ផ្ទុកឡើងវិញ
            </Button>
          </Space>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingUser(null);
              form.resetFields();
              setIsModalOpen(true);
            }}
          >
            បន្ថែមអ្នកប្រើប្រាស់
          </Button>
        </div>
      </Card>

      {/* Users Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <Table
            columns={columns}
            dataSource={users}
            rowKey="id"
            loading={loading}
            scroll={{ x: 'max-content' }}
            pagination={{
              ...pagination,
              showSizeChanger: true,
              showTotal: (total) => `សរុប ${total} អ្នកប្រើប្រាស់`,
              onChange: (page, pageSize) => {
                fetchUsers(page, pageSize);
              },
            }}
          />
        </div>
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        title={editingUser ? 'កែប្រែអ្នកប្រើប្រាស់' : 'បន្ថែមអ្នកប្រើប្រាស់ថ្មី'}
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          form.resetFields();
          setEditingUser(null);
        }}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            label="ឈ្មោះ"
            name="name"
            rules={[{ required: true, message: 'សូមបញ្ចូលឈ្មោះ' }]}
          >
            <Input placeholder="បញ្ចូលឈ្មោះពេញ" />
          </Form.Item>

          <Form.Item
            label="អ៊ីមែល"
            name="email"
            rules={[
              { required: true, message: 'សូមបញ្ចូលអ៊ីមែល' },
              { type: 'email', message: 'អ៊ីមែលមិនត្រឹមត្រូវ' },
            ]}
          >
            <Input placeholder="example@email.com" />
          </Form.Item>

          {!editingUser && (
            <Form.Item
              label="ពាក្យសម្ងាត់"
              name="password"
              rules={[
                { required: true, message: 'សូមបញ្ចូលពាក្យសម្ងាត់' },
                { min: 6, message: 'ពាក្យសម្ងាត់ត្រូវមានយ៉ាងហោចណាស់ ៦ តួអក្សរ' },
              ]}
            >
              <Input.Password placeholder="បញ្ចូលពាក្យសម្ងាត់" />
            </Form.Item>
          )}

          <Form.Item
            label="តួនាទី"
            name="role"
            rules={[{ required: true, message: 'សូមជ្រើសរើសតួនាទី' }]}
          >
            <Select placeholder="ជ្រើសរើសតួនាទី">
              {Object.entries(roleLabels).map(([value, label]) => (
                <Option key={value} value={value}>{label}</Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            label="សាលារៀន"
            name="schoolId"
          >
            <Select placeholder="ជ្រើសរើសសាលារៀន" allowClear showSearch>
              {schools.map((school) => (
                <Option key={school.id} value={school.id}>
                  {school.name} ({school.code})
                </Option>
              ))}
            </Select>
          </Form.Item>

          {editingUser && (
            <Form.Item
              label="ស្ថានភាព"
              name="isActive"
              valuePropName="checked"
            >
              <Select>
                <Option value={true}>សកម្ម</Option>
                <Option value={false}>អសកម្ម</Option>
              </Select>
            </Form.Item>
          )}

          <Form.Item className="mb-0">
            <Space className="w-full justify-end">
              <Button onClick={() => {
                setIsModalOpen(false);
                form.resetFields();
                setEditingUser(null);
              }}>
                បោះបង់
              </Button>
              <Button type="primary" htmlType="submit">
                {editingUser ? 'រក្សាទុក' : 'បង្កើត'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
      </div>
    </div>
  );
}