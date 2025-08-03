'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Table, 
  Card, 
  Button, 
  Space, 
  Tag, 
  Typography, 
  Input, 
  DatePicker,
  Select,
  Row,
  Col,
  Dropdown,
  Modal,
} from 'antd';
import { 
  PlusOutlined, 
  SearchOutlined, 
  FileTextOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  DownloadOutlined,
  FilterOutlined,
  MoreOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useMessage } from '@/hooks/useAntdApp';

const { Title } = Typography;
const { RangePicker } = DatePicker;

interface EvaluationRecord {
  key: string;
  id: string;
  teacher: string;
  evaluator: string;
  date: string;
  subject: string;
  grade: string;
  score: number;
  status: 'completed' | 'pending' | 'in-progress';
}

export default function EvaluationsPage() {
  const message = useMessage();
  const router = useRouter();
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [searchText, setSearchText] = useState('');

  const data: EvaluationRecord[] = [
    {
      key: '1',
      id: 'EVL-001',
      teacher: 'John Doe',
      evaluator: 'Sarah Johnson',
      date: '2024-01-15',
      subject: 'Mathematics',
      grade: 'Grade 5',
      score: 85,
      status: 'completed',
    },
    {
      key: '2',
      id: 'EVL-002',
      teacher: 'Jane Smith',
      evaluator: 'Mike Wilson',
      date: '2024-01-14',
      subject: 'Science',
      grade: 'Grade 4',
      score: 92,
      status: 'completed',
    },
    {
      key: '3',
      id: 'EVL-003',
      teacher: 'Bob Johnson',
      evaluator: 'Sarah Johnson',
      date: '2024-01-16',
      subject: 'English',
      grade: 'Grade 6',
      score: 0,
      status: 'pending',
    },
    {
      key: '4',
      id: 'EVL-004',
      teacher: 'Alice Brown',
      evaluator: 'Tom Davis',
      date: '2024-01-16',
      subject: 'History',
      grade: 'Grade 5',
      score: 78,
      status: 'in-progress',
    },
  ];

  const handleDelete = (record: EvaluationRecord) => {
    Modal.confirm({
      title: 'Delete Evaluation',
      content: `Are you sure you want to delete evaluation ${record.id}?`,
      okText: 'Delete',
      okType: 'danger',
      onOk: () => {
        message.success('Evaluation deleted successfully');
      },
    });
  };

  const columns: ColumnsType<EvaluationRecord> = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 100,
    },
    {
      title: 'Teacher',
      dataIndex: 'teacher',
      key: 'teacher',
      sorter: (a, b) => a.teacher.localeCompare(b.teacher),
    },
    {
      title: 'Evaluator',
      dataIndex: 'evaluator',
      key: 'evaluator',
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      sorter: (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    },
    {
      title: 'Subject',
      dataIndex: 'subject',
      key: 'subject',
      filters: [
        { text: 'Mathematics', value: 'Mathematics' },
        { text: 'Science', value: 'Science' },
        { text: 'English', value: 'English' },
        { text: 'History', value: 'History' },
      ],
      onFilter: (value, record) => record.subject === value,
    },
    {
      title: 'Grade',
      dataIndex: 'grade',
      key: 'grade',
    },
    {
      title: 'Score',
      dataIndex: 'score',
      key: 'score',
      render: (score, record) => {
        if (record.status === 'pending') return '-';
        const color = score >= 90 ? 'green' : score >= 70 ? 'orange' : 'red';
        return <Tag color={color}>{score}%</Tag>;
      },
      sorter: (a, b) => a.score - b.score,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const config: Record<string, { color: string; text: string }> = {
          completed: { color: 'green', text: 'Completed' },
          pending: { color: 'gold', text: 'Pending' },
          'in-progress': { color: 'blue', text: 'In Progress' },
        };
        return <Tag color={config[status]?.color || 'default'}>{config[status]?.text || status}</Tag>;
      },
      filters: [
        { text: 'Completed', value: 'completed' },
        { text: 'Pending', value: 'pending' },
        { text: 'In Progress', value: 'in-progress' },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <Dropdown
          menu={{
            items: [
              {
                key: 'view',
                icon: <EyeOutlined />,
                label: 'View',
                onClick: () => router.push(`/dashboard/evaluations/${record.id}`),
              },
              {
                key: 'edit',
                icon: <EditOutlined />,
                label: 'Edit',
                onClick: () => router.push(`/dashboard/evaluations/${record.id}/edit`),
              },
              {
                key: 'download',
                icon: <DownloadOutlined />,
                label: 'Download',
              },
              {
                type: 'divider',
              },
              {
                key: 'delete',
                icon: <DeleteOutlined />,
                label: 'Delete',
                danger: true,
                onClick: () => handleDelete(record),
              },
            ],
          }}
        >
          <Button type="text" icon={<MoreOutlined />} />
        </Dropdown>
      ),
    },
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: (newSelectedRowKeys: React.Key[]) => {
      setSelectedRowKeys(newSelectedRowKeys);
    },
  };

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
        <Col>
          <Title level={2}>Evaluations</Title>
        </Col>
        <Col>
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={() => router.push('/dashboard/evaluations/new')}
          >
            New Evaluation
          </Button>
        </Col>
      </Row>

      <Card>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Row gutter={16}>
            <Col flex="auto">
              <Input
                placeholder="Search evaluations..."
                prefix={<SearchOutlined />}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                style={{ width: 300 }}
              />
            </Col>
            <Col>
              <Space>
                <RangePicker />
                <Select
                  placeholder="Filter by status"
                  style={{ width: 150 }}
                  allowClear
                  options={[
                    { value: 'completed', label: 'Completed' },
                    { value: 'pending', label: 'Pending' },
                    { value: 'in-progress', label: 'In Progress' },
                  ]}
                />
                <Button icon={<FilterOutlined />}>More Filters</Button>
              </Space>
            </Col>
          </Row>

          <Table
            rowSelection={rowSelection}
            columns={columns}
            dataSource={data.filter(item => 
              item.teacher.toLowerCase().includes(searchText.toLowerCase()) ||
              item.evaluator.toLowerCase().includes(searchText.toLowerCase()) ||
              item.subject.toLowerCase().includes(searchText.toLowerCase())
            )}
            pagination={{ 
              total: data.length,
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => `Total ${total} evaluations`,
            }}
          />

          {selectedRowKeys.length > 0 && (
            <Space>
              <Button danger>Delete Selected ({selectedRowKeys.length})</Button>
              <Button>Export Selected</Button>
            </Space>
          )}
        </Space>
      </Card>
    </div>
  );
}