'use client';

import { useState, useEffect } from 'react';
import { List, FloatButton, Empty, Spin, message, Modal, Form, Input, Select, DatePicker } from 'antd';
import { PlusOutlined, FilterOutlined } from '@ant-design/icons';
import { MobileSessionCard } from '@/components/mobile/MobileSessionCard';
import { PullToRefresh } from '@/components/PullToRefresh';
import { useRouter } from 'next/navigation';
import dayjs from 'dayjs';

const { Search } = Input;
const { Option } = Select;

interface Session {
  id: string;
  scheduledDate: string;
  sessionType: string;
  status: string;
  location: string;
  duration?: number;
  relationship: {
    id: string;
    mentor: { id: string; name: string };
    mentee: { id: string; name: string };
  };
}

export default function MobileSessionsPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [filteredSessions, setFilteredSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  useEffect(() => {
    fetchSessions();
  }, []);

  useEffect(() => {
    filterSessions();
  }, [sessions, searchText, filterStatus]);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/mentoring/sessions');
      const data = await response.json();
      
      if (response.ok) {
        setSessions(data.sessions || []);
      } else {
        message.error('មានបញ្ហាក្នុងការទាញយកទិន្នន័យ');
      }
    } catch (error) {
      console.error('Error:', error);
      message.error('មានបញ្ហាក្នុងការទាញយកទិន្នន័យ');
    } finally {
      setLoading(false);
    }
  };

  const filterSessions = () => {
    let filtered = [...sessions];

    // Search filter
    if (searchText) {
      filtered = filtered.filter(session => 
        session.relationship.mentor.name.toLowerCase().includes(searchText.toLowerCase()) ||
        session.relationship.mentee.name.toLowerCase().includes(searchText.toLowerCase()) ||
        session.location.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    // Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(session => session.status === filterStatus);
    }

    // Sort by date
    filtered.sort((a, b) => 
      new Date(b.scheduledDate).getTime() - new Date(a.scheduledDate).getTime()
    );

    setFilteredSessions(filtered);
  };

  const handleRefresh = async () => {
    await fetchSessions();
    message.success('បានផ្ទុកឡើងវិញ');
  };

  const handleEdit = (id: string) => {
    router.push(`/dashboard/mentoring/sessions/${id}/edit`);
  };

  const handleDelete = async (id: string) => {
    Modal.confirm({
      title: 'លុបវគ្គ',
      content: 'តើអ្នកពិតជាចង់លុបវគ្គនេះមែនទេ?',
      okText: 'លុប',
      cancelText: 'បោះបង់',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          const response = await fetch(`/api/mentoring/sessions/${id}`, {
            method: 'DELETE',
          });
          
          if (response.ok) {
            message.success('បានលុបវគ្គដោយជោគជ័យ');
            fetchSessions();
          } else {
            message.error('មានបញ្ហាក្នុងការលុប');
          }
        } catch (error) {
          console.error('Error:', error);
          message.error('មានបញ្ហាក្នុងការលុប');
        }
      },
    });
  };

  const handleComplete = async (id: string) => {
    try {
      const response = await fetch(`/api/mentoring/sessions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'COMPLETED' }),
      });
      
      if (response.ok) {
        message.success('បានបញ្ចប់វគ្គដោយជោគជ័យ');
        fetchSessions();
      } else {
        message.error('មានបញ្ហាក្នុងការបញ្ចប់វគ្គ');
      }
    } catch (error) {
      console.error('Error:', error);
      message.error('មានបញ្ហាក្នុងការបញ្ចប់វគ្គ');
    }
  };

  // Group sessions by date
  const groupedSessions = filteredSessions.reduce((groups, session) => {
    const date = dayjs(session.scheduledDate).format('YYYY-MM-DD');
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(session);
    return groups;
  }, {} as Record<string, Session[]>);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden">
      {/* Search and Filter Bar */}
      <div className="p-4 bg-white shadow-sm sticky top-0 z-10">
        <div className="flex gap-2">
          <Search
            placeholder="ស្វែងរក..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="flex-1"
          />
          <Button
            icon={<FilterOutlined />}
            onClick={() => setFilterModalVisible(true)}
          >
            ច្រោះ
          </Button>
        </div>
      </div>

      {/* Sessions List */}
      <PullToRefresh onRefresh={handleRefresh}>
        <div className="p-4 pb-20">
          {filteredSessions.length === 0 ? (
            <Empty
              description="មិនមានវគ្គណែនាំទេ"
              className="mt-20"
            />
          ) : (
            Object.entries(groupedSessions).map(([date, sessions]) => (
              <div key={date} className="mb-6">
                <h3 className="text-sm font-semibold text-gray-600 mb-2">
                  {dayjs(date).format('DD MMMM YYYY')}
                </h3>
                {sessions.map(session => (
                  <MobileSessionCard
                    key={session.id}
                    session={session}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onComplete={handleComplete}
                  />
                ))}
              </div>
            ))
          )}
        </div>
      </PullToRefresh>

      {/* Floating Action Button */}
      <FloatButton
        icon={<PlusOutlined />}
        type="primary"
        onClick={() => router.push('/dashboard/mentoring/sessions/new')}
        style={{ bottom: 80 }}
      />

      {/* Filter Modal */}
      <Modal
        title="ច្រោះទិន្នន័យ"
        open={filterModalVisible}
        onCancel={() => setFilterModalVisible(false)}
        footer={null}
      >
        <Form layout="vertical">
          <Form.Item label="ស្ថានភាព">
            <Select
              value={filterStatus}
              onChange={setFilterStatus}
              style={{ width: '100%' }}
            >
              <Option value="all">ទាំងអស់</Option>
              <Option value="SCHEDULED">បានកំណត់ពេល</Option>
              <Option value="IN_PROGRESS">កំពុងដំណើរការ</Option>
              <Option value="COMPLETED">បានបញ្ចប់</Option>
              <Option value="CANCELLED">បានលុបចោល</Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}