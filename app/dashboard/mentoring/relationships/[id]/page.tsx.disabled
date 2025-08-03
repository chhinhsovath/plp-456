'use client';

import { useState, useEffect } from 'react';
import { Card, Tabs, Button, Space, Tag, Spin, Timeline, Progress, Statistic, Row, Col, Empty, Modal, Form, Input, Select, Rate } from 'antd';
import { ArrowLeftOutlined, CalendarOutlined, FileTextOutlined, TrophyOutlined, WarningOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import dayjs from 'dayjs';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement } from 'chart.js';
import { Doughnut, Line } from 'react-chartjs-2';
import { ExportButton } from '@/components/ExportButton';
import { useMessage } from '@/hooks/useAntdApp';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement);

const { TabPane } = Tabs;
const { TextArea } = Input;
const { Option } = Select;

export default function MentoringRelationshipDetail() {
  const message = useMessage();
  const params = useParams();
  const router = useRouter();
  const relationshipId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [relationship, setRelationship] = useState<any>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [progressSummary, setProgressSummary] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [reportForm] = Form.useForm();

  useEffect(() => {
    fetchRelationshipData();
  }, [relationshipId]);

  const fetchRelationshipData = async () => {
    try {
      setLoading(true);
      
      // Fetch relationship details
      const relRes = await fetch(`/api/mentoring/relationships?id=${relationshipId}`);
      const relData = await relRes.json();
      
      // Fetch sessions
      const sessionsRes = await fetch(`/api/mentoring/sessions?relationshipId=${relationshipId}`);
      const sessionsData = await sessionsRes.json();
      
      // Fetch progress reports
      const reportsRes = await fetch(`/api/mentoring/progress-reports?relationshipId=${relationshipId}`);
      const reportsData = await reportsRes.json();
      
      if (relRes.ok && sessionsRes.ok && reportsRes.ok) {
        setRelationship(relData.relationships[0]);
        setSessions(sessionsData.sessions);
        setReports(reportsData.reports);
        
        // Calculate progress summary
        calculateProgressSummary(sessionsData.sessions);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      message.error('មានបញ្ហាក្នុងការទាញយកទិន្នន័យ');
    } finally {
      setLoading(false);
    }
  };

  const calculateProgressSummary = (sessions: any[]) => {
    const completedSessions = sessions.filter(s => s.status === 'COMPLETED');
    const totalObservations = completedSessions.reduce((sum, s) => sum + (s.observations?.length || 0), 0);
    const totalFeedback = completedSessions.reduce((sum, s) => sum + (s.feedbackItems?.length || 0), 0);
    
    // Group feedback by type
    const feedbackByType = completedSessions.reduce((acc, session) => {
      session.feedbackItems?.forEach((item: any) => {
        acc[item.feedbackType] = (acc[item.feedbackType] || 0) + 1;
      });
      return acc;
    }, {} as Record<string, number>);

    setProgressSummary({
      totalSessions: sessions.length,
      completedSessions: completedSessions.length,
      totalObservations,
      totalFeedback,
      feedbackByType,
      completionRate: sessions.length > 0 ? (completedSessions.length / sessions.length) * 100 : 0,
    });
  };

  const handleCreateReport = async (values: any) => {
    try {
      const reportData = {
        relationshipId,
        reportPeriod: values.reportPeriod,
        progressSummary: {
          sessionsCompleted: progressSummary?.completedSessions || 0,
          goalsAchieved: values.goalsAchieved?.split('\n').filter((g: string) => g.trim()) || [],
          areasImproved: values.areasImproved?.split('\n').filter((a: string) => a.trim()) || [],
          challengesFaced: values.challenges?.split('\n').filter((c: string) => c.trim()) || [],
          nextSteps: values.nextSteps?.split('\n').filter((n: string) => n.trim()) || [],
        },
        achievements: values.achievements?.split('\n').filter((a: string) => a.trim()) || [],
        challenges: values.challenges?.split('\n').filter((c: string) => c.trim()) || [],
        nextSteps: values.nextSteps?.split('\n').filter((n: string) => n.trim()) || [],
        overallRating: values.overallRating,
      };

      const response = await fetch('/api/mentoring/progress-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reportData),
      });

      if (response.ok) {
        message.success('បានបង្កើតរបាយការណ៍វឌ្ឍនភាព');
        setReportModalVisible(false);
        reportForm.resetFields();
        fetchRelationshipData();
      } else {
        const error = await response.json();
        message.error(error.error || 'មានបញ្ហាក្នុងការបង្កើតរបាយការណ៍');
      }
    } catch (error) {
      console.error('Error creating report:', error);
      message.error('មានបញ្ហាក្នុងការបង្កើតរបាយការណ៍');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-gray-50 flex items-center justify-center">
        <Spin size="large" />
      </div>
  );
}

  if (!relationship) {
    return (
      <div className="p-6">
        <p>រកមិនឃើញទំនាក់ទំនងនេះទេ</p>
      </div>
    );
  }

  const statusConfig = {
    ACTIVE: { color: 'green', text: 'សកម្ម' },
    PAUSED: { color: 'orange', text: 'ផ្អាក' },
    COMPLETED: { color: 'blue', text: 'បញ្ចប់' },
    CANCELLED: { color: 'red', text: 'បោះបង់' },
  };

  const feedbackChartData = {
    labels: ['ចំណុចខ្លាំង', 'ត្រូវកែលម្អ', 'សំណូមពរ'],
    datasets: [{
      data: [
        progressSummary?.feedbackByType?.strength || 0,
        progressSummary?.feedbackByType?.area_for_improvement || 0,
        progressSummary?.feedbackByType?.suggestion || 0,
      ],
      backgroundColor: ['#52c41a', '#faad14', '#1890ff'],
    }],
  };

  const sessionsTimelineData = {
    labels: sessions.slice(-10).map(s => dayjs(s.scheduledDate).format('DD/MM')),
    datasets: [{
      label: 'វគ្គបានបញ្ចប់',
      data: sessions.slice(-10).map(s => s.status === 'COMPLETED' ? 1 : 0),
      borderColor: '#1890ff',
      backgroundColor: '#1890ff',
    }],
  };

  return (
    <div className="min-h-screen p-6">
      <div className="mb-6">
        <Link href="/dashboard/mentoring">
          <Button icon={<ArrowLeftOutlined />} type="text">
            ត្រឡប់ទៅទំព័រមុន
          </Button>
        </Link>
      </div>

      <Card
        title={
          <Space>
            <span>ទំនាក់ទំនងណែនាំ</span>
            <Tag color={statusConfig[relationship.status as keyof typeof statusConfig]?.color}>
              {statusConfig[relationship.status as keyof typeof statusConfig]?.text}
            </Tag>
          </Space>
        }
        extra={
          <Space>
            <Button 
              icon={<CalendarOutlined />}
              onClick={() => router.push(`/dashboard/mentoring/sessions/new?relationshipId=${relationshipId}`)}
            >
              កំណត់ពេលជួប
            </Button>
            <Button 
              type="primary"
              icon={<FileTextOutlined />}
              onClick={() => setReportModalVisible(true)}
            >
              បង្កើតរបាយការណ៍
            </Button>
            {(sessions.length > 0 || reports.length > 0) && (
              <ExportButton
                data={reports.length > 0 ? reports : sessions}
                type={reports.length > 0 ? "progress-reports" : "sessions"}
                filename={`relationship-${relationshipId}-${new Date().toISOString().split('T')[0]}`}
                title={reports.length > 0 ? "របាយការណ៍វឌ្ឍនភាព" : "របាយការណ៍វគ្គណែនាំ"}
              />
            )}
          </Space>
        }
      >
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab="ទិដ្ឋភាពទូទៅ" key="overview">
            <Row gutter={[32, 32]}>
              <Col span={24}>
                <Card>
                  <Space direction="vertical" className="w-full">
                    <div>
                      <strong>គ្រូណែនាំ:</strong> {relationship.mentor.name} ({relationship.mentor.role})
                    </div>
                    <div>
                      <strong>គ្រូកំពុងរៀន:</strong> {relationship.mentee.name} ({relationship.mentee.role})
                    </div>
                    {relationship.coordinator && (
                      <div>
                        <strong>អ្នកសម្របសម្រួល:</strong> {relationship.coordinator.name}
                      </div>
                    )}
                    <div>
                      <strong>ចាប់ផ្តើម:</strong> {dayjs(relationship.startDate).format('DD/MM/YYYY')}
                    </div>
                    <div>
                      <strong>ផ្នែកផ្តោតសំខាន់:</strong> {relationship.focusAreas.join(', ')}
                    </div>
                  </Space>
                </Card>
              </Col>

              <Col xs={24} sm={12} md={6}>
                <Card>
                  <Statistic
                    title="វគ្គសរុប"
                    value={progressSummary?.totalSessions || 0}
                    suffix="វគ្គ"
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Card>
                  <Statistic
                    title="វគ្គបានបញ្ចប់"
                    value={progressSummary?.completedSessions || 0}
                    valueStyle={{ color: '#3f8600' }}
                    suffix="វគ្គ"
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Card>
                  <Statistic
                    title="ការសង្កេតសរុប"
                    value={progressSummary?.totalObservations || 0}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <Card>
                  <Statistic
                    title="មតិយោបល់សរុប"
                    value={progressSummary?.totalFeedback || 0}
                  />
                </Card>
              </Col>

              <Col span={24}>
                <Card title="អត្រាបញ្ចប់">
                  <Progress 
                    percent={Math.round(progressSummary?.completionRate || 0)} 
                    status="active"
                    strokeColor={{
                      '0%': '#108ee9',
                      '100%': '#87d068',
                    }}
                  />
                </Card>
              </Col>
            </Row>
          </TabPane>

          <TabPane tab="វគ្គជួប" key="sessions">
            <Timeline>
              {sessions.map((session) => {
                const sessionType = {
                  CLASSROOM_OBSERVATION: 'ការសង្កេតក្នុងថ្នាក់រៀន',
                  LESSON_PLANNING: 'ការគាំទ្រផែនការបង្រៀន',
                  REFLECTIVE_PRACTICE: 'ការអនុវត្តឆ្លុះបញ្ចាំង',
                  PEER_LEARNING: 'វង់សិក្សាមិត្តភក្តិ',
                  FOLLOW_UP: 'ការតាមដានបន្ត',
                }[session.sessionType] || session.sessionType;

                return (
                  <Timeline.Item 
                    key={session.id}
                    color={session.status === 'COMPLETED' ? 'green' : 'blue'}
                  >
                    <div className="mb-2">
                      <Space>
                        <strong>{sessionType}</strong>
                        <Tag>{session.status}</Tag>
                        <span className="text-gray-500">
                          {dayjs(session.scheduledDate).format('DD/MM/YYYY HH:mm')}
                        </span>
                      </Space>
                    </div>
                    <p className="text-gray-600">{session.location}</p>
                    {session.observations?.length > 0 && (
                      <p className="text-sm">ការសង្កេត: {session.observations.length}</p>
                    )}
                    {session.feedbackItems?.length > 0 && (
                      <p className="text-sm">មតិយោបល់: {session.feedbackItems.length}</p>
                    )}
                    <Button 
                      type="link" 
                      size="small"
                      onClick={() => router.push(`/dashboard/mentoring/sessions/${session.id}`)}
                    >
                      មើលលម្អិត →
                    </Button>
                  </Timeline.Item>
                );
              })}
            </Timeline>

            {sessions.length === 0 && (
              <Empty description="មិនមានវគ្គជួបទេ">
                <Button 
                  type="primary"
                  icon={<CalendarOutlined />}
                  onClick={() => router.push(`/dashboard/mentoring/sessions/new?relationshipId=${relationshipId}`)}
                >
                  កំណត់ពេលជួប
                </Button>
              </Empty>
            )}
          </TabPane>

          <TabPane tab="វឌ្ឍនភាព" key="progress">
            <Row gutter={[32, 32]}>
              <Col xs={24} md={12}>
                <Card title="ប្រភេទមតិយោបល់">
                  {progressSummary?.totalFeedback > 0 ? (
                    <Doughnut data={feedbackChartData} />
                  ) : (
                    <Empty description="មិនមានទិន្នន័យ" />
                  )}
                </Card>
              </Col>
              <Col xs={24} md={12}>
                <Card title="វគ្គតាមពេលវេលា">
                  {sessions.length > 0 ? (
                    <Line 
                      data={sessionsTimelineData}
                      options={{
                        scales: {
                          y: {
                            beginAtZero: true,
                            max: 1,
                          },
                        },
                      }}
                    />
                  ) : (
                    <Empty description="មិនមានទិន្នន័យ" />
                  )}
                </Card>
              </Col>
            </Row>
          </TabPane>

          <TabPane tab="របាយការណ៍" key="reports">
            {reports.length > 0 ? (
              <Timeline>
                {reports.map((report) => (
                  <Timeline.Item 
                    key={report.id}
                    dot={<TrophyOutlined style={{ fontSize: '16px' }} />}
                    color="green"
                  >
                    <Card>
                      <div className="mb-2">
                        <Space>
                          <strong>របាយការណ៍ {report.reportPeriod}</strong>
                          <span className="text-gray-500">
                            {dayjs(report.reportDate).format('DD/MM/YYYY')}
                          </span>
                          {report.overallRating && (
                            <Rate disabled value={report.overallRating} />
                          )}
                        </Space>
                      </div>
                      
                      {report.achievements?.length > 0 && (
                        <div className="mb-3">
                          <strong>សមិទ្ធិផល:</strong>
                          <ul className="mt-1">
                            {report.achievements.map((achievement: string, idx: number) => (
                              <li key={idx}>{achievement}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {report.challenges?.length > 0 && (
                        <div className="mb-3">
                          <strong>បញ្ហាប្រឈម:</strong>
                          <ul className="mt-1">
                            {report.challenges.map((challenge: string, idx: number) => (
                              <li key={idx}>{challenge}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {report.nextSteps?.length > 0 && (
                        <div>
                          <strong>ជំហានបន្ទាប់:</strong>
                          <ul className="mt-1">
                            {report.nextSteps.map((step: string, idx: number) => (
                              <li key={idx}>{step}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </Card>
                  </Timeline.Item>
                ))}
              </Timeline>
            ) : (
              <Empty description="មិនមានរបាយការណ៍ទេ">
                <Button 
                  type="primary"
                  icon={<FileTextOutlined />}
                  onClick={() => setReportModalVisible(true)}
                >
                  បង្កើតរបាយការណ៍
                </Button>
              </Empty>
            )}
          </TabPane>
        </Tabs>
      </Card>

      <Modal
        title="បង្កើតរបាយការណ៍វឌ្ឍនភាព"
        open={reportModalVisible}
        onCancel={() => setReportModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={reportForm}
          layout="vertical"
          onFinish={handleCreateReport}
        >
          <Form.Item
            name="reportPeriod"
            label="រយៈពេលរបាយការណ៍"
            rules={[{ required: true, message: 'សូមជ្រើសរើសរយៈពេល' }]}
          >
            <Select placeholder="ជ្រើសរើសរយៈពេល">
              <Option value="weekly">ប្រចាំសប្តាហ៍</Option>
              <Option value="monthly">ប្រចាំខែ</Option>
              <Option value="quarterly">ប្រចាំត្រីមាស</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="achievements"
            label="សមិទ្ធិផលសំខាន់ៗ"
            tooltip="បញ្ចូលមួយសមិទ្ធិផលក្នុងមួយបន្ទាត់"
          >
            <TextArea
              rows={3}
              placeholder="ឧទាហរណ៍:&#10;- បានកែលម្អការគ្រប់គ្រងថ្នាក់រៀន&#10;- បានប្រើវិធីសាស្ត្របង្រៀនថ្មី"
            />
          </Form.Item>

          <Form.Item
            name="goalsAchieved"
            label="គោលដៅដែលសម្រេចបាន"
            tooltip="បញ្ចូលមួយគោលដៅក្នុងមួយបន្ទាត់"
          >
            <TextArea
              rows={3}
              placeholder="គោលដៅដែលបានសម្រេច..."
            />
          </Form.Item>

          <Form.Item
            name="areasImproved"
            label="ផ្នែកដែលបានកែលម្អ"
            tooltip="បញ្ចូលមួយផ្នែកក្នុងមួយបន្ទាត់"
          >
            <TextArea
              rows={3}
              placeholder="ផ្នែកដែលមានការរីកចម្រើន..."
            />
          </Form.Item>

          <Form.Item
            name="challenges"
            label="បញ្ហាប្រឈម"
            tooltip="បញ្ចូលមួយបញ្ហាក្នុងមួយបន្ទាត់"
          >
            <TextArea
              rows={3}
              placeholder="បញ្ហាដែលបានជួបប្រទះ..."
            />
          </Form.Item>

          <Form.Item
            name="nextSteps"
            label="ជំហានបន្ទាប់"
            tooltip="បញ្ចូលមួយជំហានក្នុងមួយបន្ទាត់"
            rules={[{ required: true, message: 'សូមបញ្ចូលជំហានបន្ទាប់' }]}
          >
            <TextArea
              rows={3}
              placeholder="អ្វីដែលត្រូវធ្វើបន្ត..."
            />
          </Form.Item>

          <Form.Item
            name="overallRating"
            label="ការវាយតម្លៃរួម"
          >
            <Rate />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                បង្កើតរបាយការណ៍
              </Button>
              <Button onClick={() => setReportModalVisible(false)}>
                បោះបង់
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}