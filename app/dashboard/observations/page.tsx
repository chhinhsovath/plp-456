'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Table, Button, Space, Tag, message, Input, DatePicker, Select, Switch, Tooltip } from 'antd';
import { PlusOutlined, EyeOutlined, EditOutlined, DeleteOutlined, SearchOutlined, GlobalOutlined } from '@ant-design/icons';
import { useSession } from '@/hooks/useSession';
import dayjs from '@/lib/dayjs-config';
import { formatDateForDisplay, DATE_FORMATS, formatDateForAPI } from '@/lib/date-utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { observationTranslations } from '@/lib/translations/observations';

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
  const { language, toggleLanguage } = useLanguage();
  const t = observationTranslations[language];
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
    
    // In development, allow access even if unauthenticated
    if (status === 'unauthenticated' && process.env.NODE_ENV === 'production') {
      router.push('/login');
      return;
    }

    // Always fetch observations in development, or when authenticated in production
    if (status === 'authenticated' || process.env.NODE_ENV === 'development') {
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
      message.error(t.loadFailed);
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

      message.success(t.deleteSuccess);
      fetchObservations();
    } catch (error) {
      console.error('Error deleting observation:', error);
      message.error(t.deleteFailed);
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

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return t.completed;
      case 'in_progress':
        return t.inProgress;
      case 'scheduled':
        return t.scheduled;
      case 'cancelled':
        return t.cancelled;
      default:
        return status.replace('_', ' ').toUpperCase();
    }
  };

  const columns = [
    {
      title: <span className="observations-khmer-text">{t.date}</span>,
      dataIndex: 'inspectionDate',
      key: 'inspectionDate',
      render: (date: string) => formatDateForDisplay(date),
      sorter: true
    },
    {
      title: <span className="observations-khmer-text">{t.school}</span>,
      dataIndex: 'school',
      key: 'school',
      ellipsis: true
    },
    {
      title: <span className="observations-khmer-text">{t.teacher}</span>,
      dataIndex: 'nameOfTeacher',
      key: 'nameOfTeacher',
      ellipsis: true
    },
    {
      title: <span className="observations-khmer-text">{t.subject}</span>,
      dataIndex: 'subject',
      key: 'subject'
    },
    {
      title: <span className="observations-khmer-text">{t.grade}</span>,
      dataIndex: 'grade',
      key: 'grade',
      width: 80,
      align: 'center' as const
    },
    {
      title: <span className="observations-khmer-text">{t.level}</span>,
      dataIndex: 'level',
      key: 'level',
      width: 80,
      align: 'center' as const,
      render: (level: number) => (
        <Tag color={getLevelColor(level)}>
          <span className="observations-khmer-text">{t.levelDisplay} {level}</span>
        </Tag>
      )
    },
    {
      title: <span className="observations-khmer-text">{t.status}</span>,
      dataIndex: 'inspectionStatus',
      key: 'inspectionStatus',
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>
          <span className="observations-khmer-text">{getStatusText(status)}</span>
        </Tag>
      )
    },
    {
      title: <span className="observations-khmer-text">{t.location}</span>,
      key: 'location',
      render: (_: any, record: Observation) => (
        <span>{record.district}, {record.province}</span>
      )
    },
    {
      title: <span className="observations-khmer-text">{t.createdBy}</span>,
      key: 'createdBy',
      render: (_: any, record: Observation) => (
        <span>{record.user?.name || record.createdBy}</span>
      )
    },
    {
      title: <span className="observations-khmer-text">{t.actions}</span>,
      key: 'actions',
      fixed: 'right' as const,
      width: 150,
      render: (_: any, record: Observation) => {
        // All users can view, edit, and delete observations
        return (
          <Space size="small">
            <Tooltip title={t.view}>
              <Button
                icon={<EyeOutlined />}
                size="small"
                onClick={() => router.push(`/dashboard/observations/${record.id}`)}
              />
            </Tooltip>
            <Tooltip title={t.edit}>
              <Button
                icon={<EditOutlined />}
                size="small"
                onClick={() => router.push(`/dashboard/observations/${record.id}/edit`)}
              />
            </Tooltip>
            <Tooltip title={t.delete}>
              <Button
                danger
                icon={<DeleteOutlined />}
                size="small"
                onClick={() => {
                  if (window.confirm(t.confirmDelete)) {
                    handleDelete(record.id);
                  }
                }}
              />
            </Tooltip>
          </Space>
        );
      }
    }
  ];

  if (status === 'loading') {
    return <div className="observations-khmer-text">{t.loading}</div>;
  }

  return (
    <div className="p-6">
      <Card
        title={<span className="observations-khmer-text">{t.title}</span>}
        extra={
          <Space>
            <Switch
              checkedChildren="EN"
              unCheckedChildren="KM"
              checked={language === 'en'}
              onChange={() => toggleLanguage()}
              style={{ backgroundColor: language === 'km' ? '#1890ff' : undefined }}
            />
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => router.push('/dashboard/observations/new')}
            >
              <span className="observations-khmer-text">{t.newObservation}</span>
            </Button>
          </Space>
        }
      >
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Space wrap>
            <Input
              placeholder={t.searchPlaceholder}
              prefix={<SearchOutlined />}
              style={{ width: 300 }}
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="observations-khmer-text"
            />
            <RangePicker
              format={DATE_FORMATS.DISPLAY_DATE}
              onChange={(dates) => setFilters(prev => ({ ...prev, dateRange: dates }))}
            />
            <Select
              placeholder={t.statusPlaceholder}
              style={{ width: 150 }}
              allowClear
              value={filters.status || undefined}
              onChange={(value) => setFilters(prev => ({ ...prev, status: value || '' }))}
              className="observations-khmer-text"
            >
              <Option value="completed">{t.completed}</Option>
              <Option value="in_progress">{t.inProgress}</Option>
              <Option value="scheduled">{t.scheduled}</Option>
              <Option value="cancelled">{t.cancelled}</Option>
            </Select>
            <Select
              placeholder={t.levelPlaceholder}
              style={{ width: 120 }}
              allowClear
              value={filters.level}
              onChange={(value) => setFilters(prev => ({ ...prev, level: value }))}
              className="observations-khmer-text"
            >
              <Option value={1}>{t.levelDisplay} 1</Option>
              <Option value={2}>{t.levelDisplay} 2</Option>
              <Option value={3}>{t.levelDisplay} 3</Option>
            </Select>
            <Button type="primary" onClick={fetchObservations}>
              <span className="observations-khmer-text">{t.searchButton}</span>
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
              showTotal: (total) => <span className="observations-khmer-text">{t.totalObservations} {total}</span>,
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