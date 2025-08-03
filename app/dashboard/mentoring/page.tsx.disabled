'use client';

import { useEffect, useState } from 'react';
import { Card, Tabs, Button, Space, Badge, Spin, Empty, ConfigProvider } from 'antd';
import { PlusOutlined, CalendarOutlined, TeamOutlined, BarChartOutlined, BookOutlined, EyeOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ExportButton } from '@/components/ExportButton';
import khKH from 'antd/locale/km_KH';
import PageLoading from '@/components/PageLoading';
import { useMessage } from '@/hooks/useAntdApp';

const { TabPane } = Tabs;

interface MentoringRelationship {
  id: string;
  mentor: { id: string; name: string; email: string };
  mentee: { id: string; name: string; email: string };
  coordinator?: { id: string; name: string; email: string };
  status: string;
  focusAreas: string[];
  startDate: string;
  sessions: any[];
  progressReports: any[];
}

export default function MentoringDashboard() {
  const message = useMessage();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [relationships, setRelationships] = useState<MentoringRelationship[]>([]);
  const [activeTab, setActiveTab] = useState('all');
  const [allSessions, setAllSessions] = useState<any[]>([]);

  useEffect(() => {
    fetchRelationships();
  }, [activeTab]);

  const fetchRelationships = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (activeTab !== 'all') {
        params.append('role', activeTab);
      }
      
      const response = await fetch(`/api/mentoring/relationships?${params}`);
      const data = await response.json();
      
      if (response.ok) {
        setRelationships(data.relationships);
        // Collect all sessions for export
        const sessions = data.relationships.flatMap((rel: MentoringRelationship) => 
          rel.sessions.map((session: any) => ({
            ...session,
            relationship: rel
          }))
        );
        setAllSessions(sessions);
      } else {
        message.error('Failed to fetch mentoring relationships');
      }
    } catch (error) {
      console.error('Error:', error);
      message.error('An error occurred while fetching data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      ACTIVE: { color: 'green', text: 'សកម្ម' },
      PAUSED: { color: 'orange', text: 'ផ្អាក' },
      COMPLETED: { color: 'blue', text: 'បញ្ចប់' },
      CANCELLED: { color: 'red', text: 'បោះបង់' },
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || { color: 'default', text: status };
    return <Badge color={config.color} text={config.text} />;
  };

  const RelationshipCard = ({ relationship }: { relationship: MentoringRelationship }) => (
    <Card
      className="mb-4"
      title={
        <Space>
          <TeamOutlined />
          <span>គ្រូណែនាំ: {relationship.mentor.name}</span>
          <span>→</span>
          <span>គ្រូកំពុងរៀន: {relationship.mentee.name}</span>
        </Space>
      }
      extra={getStatusBadge(relationship.status)}
      actions={[
        <Button 
          key="view" 
          type="link"
          onClick={() => router.push(`/dashboard/mentoring/relationships/${relationship.id}`)}
        >
          មើលលម្អិត
        </Button>,
        <Button 
          key="schedule" 
          type="link" 
          icon={<CalendarOutlined />}
          onClick={() => router.push(`/dashboard/mentoring/sessions/new?relationshipId=${relationship.id}`)}
        >
          កំណត់ពេលជួប
        </Button>,
      ]}
    >
      <div className="space-y-2">
        <p><strong>ផ្នែកផ្តោតសំខាន់:</strong> {relationship.focusAreas.join(', ')}</p>
        <p><strong>ចាប់ផ្តើម:</strong> {new Date(relationship.startDate).toLocaleDateString('km-KH')}</p>
        <p><strong>វគ្គជួបចុងក្រោយ:</strong> {relationship.sessions.length} វគ្គ</p>
        {relationship.coordinator && (
          <p><strong>អ្នកសម្របសម្រួល:</strong> {relationship.coordinator.name}</p>
        )}
      </div>
    </Card>
  );

  return (
    <div className="min-h-screen w-full bg-gray-50">
      <div className="w-full p-6 lg:p-8">
      <div className="mb-6 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <h1 className="text-xl md:text-2xl font-bold">ប្រព័ន្ធណែនាំគ្រូបង្រៀន</h1>
        <Space wrap className="w-full md:w-auto" size={[8, 8]}>
          <Link href="/dashboard/mentoring/relationships/new">
            <Button type="primary" icon={<PlusOutlined />}>
              បង្កើតទំនាក់ទំនងថ្មី
            </Button>
          </Link>
          <Link href="/dashboard/mentoring/sessions">
            <Button icon={<CalendarOutlined />}>
              មើលវគ្គទាំងអស់
            </Button>
          </Link>
          <Link href="/dashboard/mentoring/analytics">
            <Button icon={<BarChartOutlined />}>
              វិភាគទិន្នន័យ
            </Button>
          </Link>
          <Link href="/dashboard/mentoring/resources">
            <Button icon={<BookOutlined />}>
              បណ្ណាល័យធនធាន
            </Button>
          </Link>
          <Link href="/dashboard/mentoring/peer-observations">
            <Button icon={<EyeOutlined />}>
              ការសង្កេតមិត្តភក្តិ
            </Button>
          </Link>
          {allSessions.length > 0 && (
            <ExportButton 
              data={allSessions}
              type="sessions"
              filename={`mentoring-sessions-${new Date().toISOString().split('T')[0]}`}
              title="របាយការណ៍វគ្គណែនាំ"
            />
          )}
        </Space>
      </div>

      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane tab="ទាំងអស់" key="all" />
        <TabPane tab="ជាគ្រូណែនាំ" key="mentor" />
        <TabPane tab="ជាគ្រូកំពុងរៀន" key="mentee" />
        <TabPane tab="ជាអ្នកសម្របសម្រួល" key="coordinator" />
      </Tabs>

      {loading ? (
        <div className="text-center py-12">
          <Spin size="large" />
        </div>
      ) : relationships.length === 0 ? (
        <Empty
          description="មិនមានទំនាក់ទំនងណែនាំទេ"
          className="py-12"
        >
          <Link href="/dashboard/mentoring/relationships/new">
            <Button type="primary" icon={<PlusOutlined />}>
              បង្កើតទំនាក់ទំនងថ្មី
            </Button>
          </Link>
        </Empty>
      ) : (
        <div className="mt-6">
          {relationships.map((relationship) => (
            <RelationshipCard key={relationship.id} relationship={relationship} />
          ))}
        </div>
      )}
      </div>

    </div>
  );
}