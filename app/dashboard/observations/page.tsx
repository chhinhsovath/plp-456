'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Table, Button, Space, Tag, message, Input, DatePicker, Select } from 'antd';
import { PlusOutlined, EyeOutlined, EditOutlined, DeleteOutlined, SearchOutlined } from '@ant-design/icons';
import { useSession } from '@/hooks/useSession';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;
const { Option } = Select;

interface Observation {
  id: string;
  province: string;
  district: string;
  school: string;
  nameOfTeacher: string;
  subject: string;
  grade: number;
  level: number;
  inspectionDate: string;
  inspectionStatus: string;
  createdBy: string;
  user?: {
    name: string;
    email: string;
    role: string;
  };
}

export default function ObservationsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [observations, setObservations] = useState<Observation[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  const [filters, setFilters] = useState({
    search: '',
    dateRange: null as any,
    status: '',
    level: null as number | null
  });

  useEffect(() => {
    if (status === 'loading') return;
    
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    if (status === 'authenticated') {
      fetchObservations();
    }
  }, [status, pagination.current, pagination.pageSize]);

  const fetchObservations = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: pagination.current.toString(),
        limit: pagination.pageSize.toString()
      });

      const response = await fetch(`/api/observations?${queryParams}`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch observations');

      const data = await response.json();
      setObservations(data.observations);
      setPagination(prev => ({
        ...prev,
        total: data.pagination.total
      }));
    } catch (error) {
      console.error('Error fetching observations:', error);
      message.error('Failed to load observations');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/observations/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) throw new Error('Failed to delete observation');

      message.success('Observation deleted successfully');
      fetchObservations();
    } catch (error) {
      console.error('Error deleting observation:', error);
      message.error('Failed to delete observation');
    }
  };

  const getLevelColor = (level: number) => {
    switch (level) {
      case 1:
        return 'green';
      case 2:
        return 'blue';
      case 3:
        return 'orange';
      default:
        return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'green';
      case 'in_progress':
        return 'blue';
      case 'scheduled':
        return 'orange';
      case 'cancelled':
        return 'red';
      default:
        return 'default';
    }
  };

  const columns = [
    {
      title: 'Date',
      dataIndex: 'inspectionDate',
      key: 'inspectionDate',
      render: (date: string) => dayjs(date).format('YYYY-MM-DD'),
      sorter: true
    },
    {
      title: 'School',
      dataIndex: 'school',
      key: 'school',
      ellipsis: true
    },
    {
      title: 'Teacher',
      dataIndex: 'nameOfTeacher',
      key: 'nameOfTeacher',
      ellipsis: true
    },
    {
      title: 'Subject',
      dataIndex: 'subject',
      key: 'subject'
    },
    {
      title: 'Grade',
      dataIndex: 'grade',
      key: 'grade',
      width: 80,
      align: 'center' as const
    },
    {
      title: 'Level',
      dataIndex: 'level',
      key: 'level',
      width: 80,
      align: 'center' as const,
      render: (level: number) => (
        <Tag color={getLevelColor(level)}>
          Level {level}
        </Tag>
      )
    },
    {
      title: 'Status',
      dataIndex: 'inspectionStatus',
      key: 'inspectionStatus',
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>
          {status.replace('_', ' ').toUpperCase()}
        </Tag>
      )
    },
    {
      title: 'Location',
      key: 'location',
      render: (_: any, record: Observation) => (
        <span>{record.district}, {record.province}</span>
      )
    },
    {
      title: 'Created By',
      key: 'createdBy',
      render: (_: any, record: Observation) => (
        <span>{record.user?.name || record.createdBy}</span>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      fixed: 'right' as const,
      width: 150,
      render: (_: any, record: Observation) => {
        // All users can view, edit, and delete observations
        return (
          <Space size="small">
            <Button
              icon={<EyeOutlined />}
              size="small"
              onClick={() => router.push(`/dashboard/observations/${record.id}`)}
            />
            <Button
              icon={<EditOutlined />}
              size="small"
              onClick={() => router.push(`/dashboard/observations/${record.id}/edit`)}
            />
            <Button
              danger
              icon={<DeleteOutlined />}
              size="small"
              onClick={() => {
                if (window.confirm('Are you sure you want to delete this observation?')) {
                  handleDelete(record.id);
                }
              }}
            />
          </Space>
        );
      }
    }
  ];

  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-6">
      <Card
        title="Classroom Observations"
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => router.push('/dashboard/observations/new')}
          >
            New Observation
          </Button>
        }
      >
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Space wrap>
            <Input
              placeholder="Search by school, teacher, or subject"
              prefix={<SearchOutlined />}
              style={{ width: 300 }}
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            />
            <RangePicker
              onChange={(dates) => setFilters(prev => ({ ...prev, dateRange: dates }))}
            />
            <Select
              placeholder="Status"
              style={{ width: 150 }}
              allowClear
              value={filters.status || undefined}
              onChange={(value) => setFilters(prev => ({ ...prev, status: value || '' }))}
            >
              <Option value="completed">Completed</Option>
              <Option value="in_progress">In Progress</Option>
              <Option value="scheduled">Scheduled</Option>
              <Option value="cancelled">Cancelled</Option>
            </Select>
            <Select
              placeholder="Level"
              style={{ width: 120 }}
              allowClear
              value={filters.level}
              onChange={(value) => setFilters(prev => ({ ...prev, level: value }))}
            >
              <Option value={1}>Level 1</Option>
              <Option value={2}>Level 2</Option>
              <Option value={3}>Level 3</Option>
            </Select>
            <Button type="primary" onClick={fetchObservations}>
              Search
            </Button>
          </Space>

          <Table
            columns={columns}
            dataSource={observations}
            rowKey="id"
            loading={loading}
            pagination={{
              current: pagination.current,
              pageSize: pagination.pageSize,
              total: pagination.total,
              showSizeChanger: true,
              showTotal: (total) => `Total ${total} observations`,
              onChange: (page, pageSize) => {
                setPagination(prev => ({
                  ...prev,
                  current: page,
                  pageSize: pageSize || 10
                }));
              }
            }}
            scroll={{ x: 1200 }}
          />
        </Space>
      </Card>
    </div>
  );
}