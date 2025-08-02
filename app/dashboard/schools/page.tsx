'use client';

import { useState, useEffect } from 'react';
import { Table, Card, Button, Space, Tag, Modal, Form, Input, Select, Popconfirm, Typography, Row, Col, Statistic, Descriptions, Tabs, App } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, HomeOutlined, TeamOutlined, UserOutlined, BookOutlined, ReloadOutlined, EnvironmentOutlined, PhoneOutlined } from '@ant-design/icons';
import { useMessage } from '@/hooks/useAntdApp';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

interface School {
  id: number;
  name: string;
  code: string;
  cluster?: string;
  commune?: string;
  district?: string;
  province?: string;
  zone?: string;
  status: number;
  totalStudents?: number;
  totalTeachers?: number;
  totalStudentsFemale?: number;
  totalTeachersFemale?: number;
  latitude?: number;
  longitude?: number;
  createdAt: string;
  updatedAt: string;
  _count?: {
    users: number;
    observations: number;
    sessions: number;
    evaluations: number;
  };
}

export default function SchoolsPage() {
  const message = useMessage();
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [editingSchool, setEditingSchool] = useState<School | null>(null);
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const [form] = Form.useForm();
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [filters, setFilters] = useState({
    search: '',
    province: '',
    district: '',
    status: '',
  });
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    totalStudents: 0,
    totalTeachers: 0,
  });

  // Fetch schools
  const fetchSchools = async (page = 1, pageSize = 10) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pageSize.toString(),
      });

      if (filters.search) params.append('search', filters.search);
      if (filters.province) params.append('province', filters.province);
      if (filters.district) params.append('district', filters.district);
      if (filters.status) params.append('status', filters.status);

      const response = await fetch(`/api/schools?${params}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch schools');
      }

      const data = await response.json();
      setSchools(data.schools);
      setPagination({
        current: data.pagination.page,
        pageSize: data.pagination.limit,
        total: data.pagination.total,
      });

      // Calculate stats
      const stats = {
        total: data.pagination.total,
        active: 0,
        totalStudents: 0,
        totalTeachers: 0,
      };

      data.schools.forEach((school: School) => {
        if (school.status === 1) stats.active++;
        stats.totalStudents += school.totalStudents || 0;
        stats.totalTeachers += school.totalTeachers || 0;
      });

      setStats(stats);
    } catch (error) {
      message.error('មានបញ្ហាក្នុងការទាញយកទិន្នន័យសាលារៀន');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchools();
  }, [filters]);

  // Handle create/update school
  const handleSubmit = async (values: any) => {
    try {
      const url = editingSchool ? `/api/schools/${editingSchool.id}` : '/api/schools';
      const method = editingSchool ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save school');
      }

      message.success(editingSchool ? 'សាលារៀនបានធ្វើបច្ចុប្បន្នភាពដោយជោគជ័យ' : 'សាលារៀនបានបង្កើតដោយជោគជ័យ');
      setIsModalOpen(false);
      form.resetFields();
      setEditingSchool(null);
      fetchSchools(pagination.current, pagination.pageSize);
    } catch (error: any) {
      message.error(error.message || 'មានបញ្ហាក្នុងការរក្សាទុកសាលារៀន');
    }
  };

  // Handle delete school
  const handleDelete = async (schoolId: number) => {
    try {
      const response = await fetch(`/api/schools/${schoolId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to delete school');
      }

      const data = await response.json();
      message.success(data.message);
      fetchSchools(pagination.current, pagination.pageSize);
    } catch (error) {
      message.error('មានបញ្ហាក្នុងការលុបសាលារៀន');
    }
  };

  // Open edit modal
  const handleEdit = (school: School) => {
    setEditingSchool(school);
    form.setFieldsValue({
      name: school.name,
      code: school.code,
      cluster: school.cluster,
      commune: school.commune,
      district: school.district,
      province: school.province,
      zone: school.zone,
      status: school.status,
      totalStudents: school.totalStudents,
      totalTeachers: school.totalTeachers,
      totalStudentsFemale: school.totalStudentsFemale,
      totalTeachersFemale: school.totalTeachersFemale,
      latitude: school.latitude,
      longitude: school.longitude,
    });
    setIsModalOpen(true);
  };

  // View school details
  const handleViewDetails = async (schoolId: number) => {
    try {
      const response = await fetch(`/api/schools/${schoolId}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch school details');
      }

      const data = await response.json();
      setSelectedSchool(data.school);
      setIsDetailModalOpen(true);
    } catch (error) {
      message.error('មានបញ្ហាក្នុងការទាញយកព័ត៌មានលម្អិត');
    }
  };

  // Table columns
  const columns = [
    {
      title: 'ឈ្មោះសាលា',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: School) => (
        <div>
          <div className="font-medium">{text}</div>
          <Text type="secondary" className="text-xs">កូដ: {record.code}</Text>
        </div>
      ),
    },
    {
      title: 'ទីតាំង',
      key: 'location',
      render: (record: School) => (
        <Space direction="vertical" size="small">
          {record.province && <Text>ខេត្ត {record.province}</Text>}
          {record.district && <Text type="secondary" className="text-xs">ស្រុក {record.district}</Text>}
        </Space>
      ),
    },
    {
      title: 'សិស្ស',
      key: 'students',
      render: (record: School) => (
        <div>
          <div>សរុប: {record.totalStudents || 0}</div>
          <Text type="secondary" className="text-xs">ស្រី: {record.totalStudentsFemale || 0}</Text>
        </div>
      ),
    },
    {
      title: 'គ្រូបង្រៀន',
      key: 'teachers',
      render: (record: School) => (
        <div>
          <div>សរុប: {record.totalTeachers || 0}</div>
          <Text type="secondary" className="text-xs">ស្រី: {record.totalTeachersFemale || 0}</Text>
        </div>
      ),
    },
    {
      title: 'សកម្មភាព',
      key: 'activities',
      render: (record: School) => (
        <Space direction="vertical" size="small">
          <Text>សង្កេត: {record._count?.observations || 0}</Text>
          <Text>វគ្គបណ្តុះបណ្តាល: {record._count?.sessions || 0}</Text>
        </Space>
      ),
    },
    {
      title: 'ស្ថានភាព',
      dataIndex: 'status',
      key: 'status',
      render: (status: number) => (
        <Tag color={status === 1 ? 'green' : 'red'}>
          {status === 1 ? 'សកម្ម' : 'អសកម្ម'}
        </Tag>
      ),
    },
    {
      title: 'សកម្មភាព',
      key: 'actions',
      render: (_: any, record: School) => (
        <Space size="middle">
          <Button
            type="link"
            onClick={() => handleViewDetails(record.id)}
          >
            មើលលម្អិត
          </Button>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            កែប្រែ
          </Button>
          <Popconfirm
            title="តើអ្នកប្រាកដថាចង់លុបសាលារៀននេះមែនទេ?"
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
          <Title level={2}>គ្រប់គ្រងសាលារៀន</Title>
          <Text type="secondary">គ្រប់គ្រងព័ត៌មានសាលារៀនក្នុងប្រព័ន្ធ</Text>
        </div>

      {/* Statistics */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={12} sm={12} md={6} lg={6} xl={6}>
          <Card>
            <Statistic
              title="សាលារៀនសរុប"
              value={stats.total}
              prefix={<HomeOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6} lg={6} xl={6}>
          <Card>
            <Statistic
              title="សកម្ម"
              value={stats.active}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6} lg={6} xl={6}>
          <Card>
            <Statistic
              title="សិស្សសរុប"
              value={stats.totalStudents}
              prefix={<TeamOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={12} md={6} lg={6} xl={6}>
          <Card>
            <Statistic
              title="គ្រូបង្រៀនសរុប"
              value={stats.totalTeachers}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters and Actions */}
      <Card className="mb-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <Space wrap className="w-full lg:w-auto">
            <Input
              placeholder="ស្វែងរកតាមឈ្មោះ ឬ កូដសាលា"
              prefix={<SearchOutlined />}
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              className="w-full sm:w-64 md:w-72 lg:w-80"
              allowClear
            />
            <Input
              placeholder="ខេត្ត"
              value={filters.province}
              onChange={(e) => setFilters({ ...filters, province: e.target.value })}
              className="w-full sm:w-36 md:w-40 lg:w-44"
              allowClear
            />
            <Input
              placeholder="ស្រុក"
              value={filters.district}
              onChange={(e) => setFilters({ ...filters, district: e.target.value })}
              className="w-full sm:w-36 md:w-40 lg:w-44"
              allowClear
            />
            <Select
              placeholder="ស្ថានភាព"
              value={filters.status}
              onChange={(value) => setFilters({ ...filters, status: value })}
              className="w-full sm:w-36 md:w-40 lg:w-44"
              allowClear
            >
              <Option value="1">សកម្ម</Option>
              <Option value="0">អសកម្ម</Option>
            </Select>
            <Button icon={<ReloadOutlined />} onClick={() => fetchSchools()}>
              ផ្ទុកឡើងវិញ
            </Button>
          </Space>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setEditingSchool(null);
              form.resetFields();
              setIsModalOpen(true);
            }}
          >
            បន្ថែមសាលារៀន
          </Button>
        </div>
      </Card>

      {/* Schools Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <Table
            columns={columns}
            dataSource={schools}
            rowKey="id"
            loading={loading}
            scroll={{ x: 'max-content' }}
            pagination={{
              ...pagination,
              showSizeChanger: true,
              showTotal: (total) => `សរុប ${total} សាលារៀន`,
              onChange: (page, pageSize) => {
                fetchSchools(page, pageSize);
              },
            }}
          />
        </div>
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        title={editingSchool ? 'កែប្រែសាលារៀន' : 'បន្ថែមសាលារៀនថ្មី'}
        open={isModalOpen}
        onCancel={() => {
          setIsModalOpen(false);
          form.resetFields();
          setEditingSchool(null);
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
            <Col span={12}>
              <Form.Item
                label="ឈ្មោះសាលា"
                name="name"
                rules={[{ required: true, message: 'សូមបញ្ចូលឈ្មោះសាលា' }]}
              >
                <Input placeholder="បញ្ចូលឈ្មោះសាលា" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                label="កូដសាលា"
                name="code"
                rules={[{ required: true, message: 'សូមបញ្ចូលកូដសាលា' }]}
              >
                <Input placeholder="បញ្ចូលកូដសាលា" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="ខេត្ត" name="province">
                <Input placeholder="បញ្ចូលខេត្ត" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="ស្រុក" name="district">
                <Input placeholder="បញ្ចូលស្រុក" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="ឃុំ" name="commune">
                <Input placeholder="បញ្ចូលឃុំ" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="ចង្កោម" name="cluster">
                <Input placeholder="បញ្ចូលចង្កោម" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={6}>
              <Form.Item label="សិស្សសរុប" name="totalStudents">
                <Input type="number" placeholder="0" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="សិស្សស្រី" name="totalStudentsFemale">
                <Input type="number" placeholder="0" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="គ្រូសរុប" name="totalTeachers">
                <Input type="number" placeholder="0" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="គ្រូស្រី" name="totalTeachersFemale">
                <Input type="number" placeholder="0" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="តំបន់" name="zone">
                <Input placeholder="បញ្ចូលតំបន់" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="រយៈទទឹង" name="latitude">
                <Input type="number" step="0.000001" placeholder="11.562108" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="រយៈបណ្តោយ" name="longitude">
                <Input type="number" step="0.000001" placeholder="104.888535" />
              </Form.Item>
            </Col>
          </Row>

          {editingSchool && (
            <Form.Item
              label="ស្ថានភាព"
              name="status"
              initialValue={1}
            >
              <Select>
                <Option value={1}>សកម្ម</Option>
                <Option value={0}>អសកម្ម</Option>
              </Select>
            </Form.Item>
          )}

          <Form.Item className="mb-0">
            <Space className="w-full justify-end">
              <Button onClick={() => {
                setIsModalOpen(false);
                form.resetFields();
                setEditingSchool(null);
              }}>
                បោះបង់
              </Button>
              <Button type="primary" htmlType="submit">
                {editingSchool ? 'រក្សាទុក' : 'បង្កើត'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* School Details Modal */}
      <Modal
        title="ព័ត៌មានលម្អិតសាលារៀន"
        open={isDetailModalOpen}
        onCancel={() => {
          setIsDetailModalOpen(false);
          setSelectedSchool(null);
        }}
        footer={null}
        width={800}
      >
        {selectedSchool && (
          <Tabs defaultActiveKey="1">
            <Tabs.TabPane tab="ព័ត៌មានទូទៅ" key="1">
              <Descriptions bordered column={2}>
                <Descriptions.Item label="ឈ្មោះសាលា" span={2}>
                  {selectedSchool.name}
                </Descriptions.Item>
                <Descriptions.Item label="កូដសាលា">
                  {selectedSchool.code}
                </Descriptions.Item>
                <Descriptions.Item label="ស្ថានភាព">
                  <Tag color={selectedSchool.status === 1 ? 'green' : 'red'}>
                    {selectedSchool.status === 1 ? 'សកម្ម' : 'អសកម្ម'}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="ខេត្ត">
                  {selectedSchool.province || '-'}
                </Descriptions.Item>
                <Descriptions.Item label="ស្រុក">
                  {selectedSchool.district || '-'}
                </Descriptions.Item>
                <Descriptions.Item label="ឃុំ">
                  {selectedSchool.commune || '-'}
                </Descriptions.Item>
                <Descriptions.Item label="ចង្កោម">
                  {selectedSchool.cluster || '-'}
                </Descriptions.Item>
                <Descriptions.Item label="តំបន់">
                  {selectedSchool.zone || '-'}
                </Descriptions.Item>
                <Descriptions.Item label="ទីតាំងភូមិសាស្ត្រ">
                  {selectedSchool.latitude && selectedSchool.longitude ? (
                    <Space>
                      <EnvironmentOutlined />
                      {selectedSchool.latitude}, {selectedSchool.longitude}
                    </Space>
                  ) : '-'}
                </Descriptions.Item>
              </Descriptions>
            </Tabs.TabPane>
            <Tabs.TabPane tab="ស្ថិតិ" key="2">
              <Row gutter={16}>
                <Col span={12}>
                  <Card>
                    <Statistic
                      title="សិស្សសរុប"
                      value={selectedSchool.totalStudents || 0}
                      suffix={`(ស្រី: ${selectedSchool.totalStudentsFemale || 0})`}
                    />
                  </Card>
                </Col>
                <Col span={12}>
                  <Card>
                    <Statistic
                      title="គ្រូបង្រៀនសរុប"
                      value={selectedSchool.totalTeachers || 0}
                      suffix={`(ស្រី: ${selectedSchool.totalTeachersFemale || 0})`}
                    />
                  </Card>
                </Col>
              </Row>
              <Row gutter={16} className="mt-4">
                <Col span={8}>
                  <Card>
                    <Statistic
                      title="អ្នកប្រើប្រាស់"
                      value={selectedSchool._count?.users || 0}
                      prefix={<UserOutlined />}
                    />
                  </Card>
                </Col>
                <Col span={8}>
                  <Card>
                    <Statistic
                      title="ការសង្កេត"
                      value={selectedSchool._count?.observations || 0}
                      prefix={<BookOutlined />}
                    />
                  </Card>
                </Col>
                <Col span={8}>
                  <Card>
                    <Statistic
                      title="វគ្គបណ្តុះបណ្តាល"
                      value={selectedSchool._count?.sessions || 0}
                    />
                  </Card>
                </Col>
              </Row>
            </Tabs.TabPane>
            {selectedSchool.users && selectedSchool.users.length > 0 && (
              <Tabs.TabPane tab="បុគ្គលិក" key="3">
                <Table
                  dataSource={selectedSchool.users}
                  rowKey="id"
                  pagination={false}
                  columns={[
                    {
                      title: 'ឈ្មោះ',
                      dataIndex: 'name',
                      key: 'name',
                    },
                    {
                      title: 'អ៊ីមែល',
                      dataIndex: 'email',
                      key: 'email',
                    },
                    {
                      title: 'តួនាទី',
                      dataIndex: 'role',
                      key: 'role',
                    },
                    {
                      title: 'ស្ថានភាព',
                      dataIndex: 'isActive',
                      key: 'isActive',
                      render: (isActive: boolean) => (
                        <Tag color={isActive ? 'green' : 'red'}>
                          {isActive ? 'សកម្ម' : 'អសកម្ម'}
                        </Tag>
                      ),
                    },
                  ]}
                />
              </Tabs.TabPane>
            )}
          </Tabs>
        )}
      </Modal>
      </div>
    </div>
  );
}