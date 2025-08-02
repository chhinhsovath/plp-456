'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Table, Button, Card, Space, Typography, message, Tag, Tooltip, Input } from 'antd';
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';

const { Title } = Typography;
const { Search } = Input;

interface MentoringRelationship {
  id: string;
  mentorId: string;
  mentorName: string;
  mentorEmail: string;
  teacherId: string;
  teacherName: string;
  teacherEmail: string;
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING';
  startDate: string;
  endDate?: string;
  schoolName?: string;
  sessionCount: number;
}

export default function MentoringRelationshipsPage() {
  const router = useRouter();
  const [relationships, setRelationships] = useState<MentoringRelationship[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    fetchRelationships();
  }, []);

  const fetchRelationships = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/mentoring/relationships');
      
      if (!response.ok) {
        throw new Error('Failed to fetch relationships');
      }

      const data = await response.json();
      setRelationships(data.relationships || []);
    } catch (error) {
      console.error('Error fetching relationships:', error);
      message.error('Failed to load mentoring relationships');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/mentoring/relationships/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete relationship');
      }

      message.success('Relationship deleted successfully');
      fetchRelationships();
    } catch (error) {
      console.error('Error deleting relationship:', error);
      message.error('Failed to delete relationship');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'success';
      case 'PENDING':
        return 'warning';
      case 'INACTIVE':
        return 'default';
      default:
        return 'default';
    }
  };

  const columns: ColumnsType<MentoringRelationship> = [
    {
      title: 'Mentor',
      key: 'mentor',
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 500 }}>{record.mentorName}</div>
          <div style={{ fontSize: '12px', color: '#888' }}>{record.mentorEmail}</div>
        </div>
      ),
      filterable: true,
    },
    {
      title: 'Teacher',
      key: 'teacher',
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 500 }}>{record.teacherName}</div>
          <div style={{ fontSize: '12px', color: '#888' }}>{record.teacherEmail}</div>
        </div>
      ),
      filterable: true,
    },
    {
      title: 'School',
      dataIndex: 'schoolName',
      key: 'schoolName',
      render: (text) => text || 'N/A',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={getStatusColor(status)}>
          {status}
        </Tag>
      ),
      filters: [
        { text: 'Active', value: 'ACTIVE' },
        { text: 'Pending', value: 'PENDING' },
        { text: 'Inactive', value: 'INACTIVE' },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: 'Sessions',
      dataIndex: 'sessionCount',
      key: 'sessionCount',
      render: (count) => (
        <Tag color="blue">{count} sessions</Tag>
      ),
      sorter: (a, b) => a.sessionCount - b.sessionCount,
    },
    {
      title: 'Start Date',
      dataIndex: 'startDate',
      key: 'startDate',
      render: (date) => new Date(date).toLocaleDateString(),
      sorter: (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="View Details">
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() => router.push(`/dashboard/mentoring/relationships/${record.id}`)}
            />
          </Tooltip>
          <Tooltip title="Delete">
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record.id)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  const filteredRelationships = relationships.filter(relationship => {
    const searchLower = searchText.toLowerCase();
    return (
      relationship.mentorName.toLowerCase().includes(searchLower) ||
      relationship.mentorEmail.toLowerCase().includes(searchLower) ||
      relationship.teacherName.toLowerCase().includes(searchLower) ||
      relationship.teacherEmail.toLowerCase().includes(searchLower) ||
      (relationship.schoolName && relationship.schoolName.toLowerCase().includes(searchLower))
    );
  });

  return (
    <div>
      <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={2}>Mentoring Relationships</Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => router.push('/dashboard/mentoring/relationships/new')}
        >
          New Relationship
        </Button>
      </div>

      <Card>
        <div style={{ marginBottom: 16 }}>
          <Search
            placeholder="Search by mentor, teacher, or school..."
            allowClear
            enterButton={<SearchOutlined />}
            size="large"
            onSearch={setSearchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </div>

        <Table
          columns={columns}
          dataSource={filteredRelationships}
          rowKey="id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `Total ${total} relationships`,
          }}
        />
      </Card>
    </div>
  );
}