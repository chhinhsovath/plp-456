'use client';

import { useState, useEffect } from 'react';
import { Card, Tabs, Button, Space, Tag, Spin, Form, Input, Select, Rate, Timeline, Modal } from 'antd';
import { ArrowLeftOutlined, ClockCircleOutlined, EnvironmentOutlined, SaveOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import dayjs from '@/lib/dayjs-config';
import { formatDateForDisplay, formatDateTimeForDisplay, DATE_FORMATS, formatDateForAPI } from '@/lib/date-utils';
import { useMessage } from '@/hooks/useAntdApp';

const { TabPane } = Tabs;
const { TextArea } = Input;
const { Option } = Select;

const observationTypes = [
  { value: 'teaching_method', label: 'វិធីសាស្ត្របង្រៀន' },
  { value: 'student_engagement', label: 'ការចូលរួមរបស់សិស្ស' },
  { value: 'classroom_management', label: 'ការគ្រប់គ្រងថ្នាក់រៀន' },
  { value: 'time_management', label: 'ការគ្រប់គ្រងពេលវេលា' },
  { value: 'assessment_practice', label: 'ការអនុវត្តវាយតម្លៃ' },
  { value: 'technology_use', label: 'ការប្រើប្រាស់បច្ចេកវិទ្យា' },
];

const feedbackTypes = [
  { value: 'strength', label: 'ចំណុចខ្លាំង', color: 'green' },
  { value: 'area_for_improvement', label: 'ផ្នែកត្រូវកែលម្អ', color: 'orange' },
  { value: 'suggestion', label: 'សំណូមពរ', color: 'blue' },
];

export default function MentoringSessionDetail() {
  const message = useMessage();
  const params = useParams();
  const sessionId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);
  const [observations, setObservations] = useState<any[]>([]);
  const [feedback, setFeedback] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [observationForm] = Form.useForm();
  const [feedbackForm] = Form.useForm();

  useEffect(() => {
    fetchSessionData();
  }, [sessionId]);

  const fetchSessionData = async () => {
    try {
      setLoading(true);
      
      // Fetch session details
      const sessionRes = await fetch(`/api/mentoring/sessions?id=${sessionId}`);
      const sessionData = await sessionRes.json();
      
      // Fetch observations
      const obsRes = await fetch(`/api/mentoring/observations?sessionId=${sessionId}`);
      const obsData = await obsRes.json();
      
      // Fetch feedback
      const feedbackRes = await fetch(`/api/mentoring/feedback?sessionId=${sessionId}`);
      const feedbackData = await feedbackRes.json();
      
      if (sessionRes.ok && obsRes.ok && feedbackRes.ok) {
        setSession(sessionData.sessions[0]);
        setObservations(obsData.observations);
        setFeedback(feedbackData.feedback);
      }
    } catch (error) {
      console.error('Error fetching session data:', error);
      message.error('មានបញ្ហាក្នុងការទាញយកទិន្នន័យ');
    } finally {
      setLoading(false);
    }
  };

  const handleStartSession = async () => {
    try {
      const response = await fetch(`/api/mentoring/sessions?id=${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'IN_PROGRESS',
          actualDate: formatDateForAPI(new Date()),
        }),
      });

      if (response.ok) {
        message.success('បានចាប់ផ្តើមវគ្គ');
        fetchSessionData();
      }
    } catch (error) {
      console.error('Error starting session:', error);
      message.error('មានបញ្ហាក្នុងការចាប់ផ្តើមវគ្គ');
    }
  };

  const handleCompleteSession = async () => {
    Modal.confirm({
      title: 'បញ្ចប់វគ្គណែនាំ?',
      content: 'តើអ្នកប្រាកដថាចង់បញ្ចប់វគ្គនេះមែនទេ?',
      okText: 'បាទ/ចាស បញ្ចប់',
      cancelText: 'បោះបង់',
      onOk: async () => {
        try {
          const duration = session.actualDate 
            ? Math.floor((new Date().getTime() - new Date(session.actualDate).getTime()) / 60000)
            : 60;

          const response = await fetch(`/api/mentoring/sessions?id=${sessionId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              status: 'COMPLETED',
              duration,
            }),
          });

          if (response.ok) {
            message.success('បានបញ្ចប់វគ្គ');
            fetchSessionData();
          }
        } catch (error) {
          console.error('Error completing session:', error);
          message.error('មានបញ្ហាក្នុងការបញ្ចប់វគ្គ');
        }
      },
    });
  };

  const handleAddObservation = async (values: any) => {
    try {
      const response = await fetch('/api/mentoring/observations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          ...values,
        }),
      });

      if (response.ok) {
        message.success('បានបន្ថែមការសង្កេត');
        observationForm.resetFields();
        fetchSessionData();
      }
    } catch (error) {
      console.error('Error adding observation:', error);
      message.error('មានបញ្ហាក្នុងការបន្ថែមការសង្កេត');
    }
  };

  const handleAddFeedback = async (values: any) => {
    try {
      const response = await fetch('/api/mentoring/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          ...values,
        }),
      });

      if (response.ok) {
        message.success('បានបន្ថែមមតិយោបល់');
        feedbackForm.resetFields();
        fetchSessionData();
      }
    } catch (error) {
      console.error('Error adding feedback:', error);
      message.error('មានបញ្ហាក្នុងការបន្ថែមមតិយោបល់');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-gray-50 flex items-center justify-center">
        <Spin size="large" />
      </div>
  );
}

  if (!session) {
    return (
      <div className="p-6">
        <p>រកមិនឃើញវគ្គនេះទេ</p>
      </div>
    );
  }

  const sessionTypeLabel = {
    CLASSROOM_OBSERVATION: 'ការសង្កេតក្នុងថ្នាក់រៀន',
    LESSON_PLANNING: 'ការគាំទ្រផែនការបង្រៀន',
    REFLECTIVE_PRACTICE: 'ការអនុវត្តឆ្លុះបញ្ចាំង',
    PEER_LEARNING: 'វង់សិក្សាមិត្តភក្តិ',
    FOLLOW_UP: 'ការតាមដានបន្ត',
  }[session.sessionType] || session.sessionType;

  const statusConfig = {
    SCHEDULED: { color: 'blue', text: 'បានកំណត់ពេល' },
    IN_PROGRESS: { color: 'green', text: 'កំពុងដំណើរការ' },
    COMPLETED: { color: 'default', text: 'បានបញ្ចប់' },
    CANCELLED: { color: 'red', text: 'បានលុបចោល' },
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
            <span>{sessionTypeLabel}</span>
            <Tag color={statusConfig[session.status as keyof typeof statusConfig]?.color}>
              {statusConfig[session.status as keyof typeof statusConfig]?.text}
            </Tag>
          </Space>
        }
        extra={
          <Space>
            {session.status === 'SCHEDULED' && (
              <Button type="primary" onClick={handleStartSession}>
                ចាប់ផ្តើមវគ្គ
              </Button>
            )}
            {session.status === 'IN_PROGRESS' && (
              <Button type="primary" danger onClick={handleCompleteSession}>
                បញ្ចប់វគ្គ
              </Button>
            )}
          </Space>
        }
      >
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab="ទិដ្ឋភាពទូទៅ" key="overview">
            <div className="space-y-4">
              <div>
                <strong>គ្រូណែនាំ:</strong> {session.relationship.mentor.name}
              </div>
              <div>
                <strong>គ្រូកំពុងរៀន:</strong> {session.relationship.mentee.name}
              </div>
              <div>
                <Space>
                  <ClockCircleOutlined />
                  <strong>ពេលវេលា:</strong>
                  {formatDateTimeForDisplay(session.scheduledDate)}
                </Space>
              </div>
              <div>
                <Space>
                  <EnvironmentOutlined />
                  <strong>ទីតាំង:</strong>
                  {session.location}
                </Space>
              </div>
              
              {session.preSessionNotes && (
                <Card title="កំណត់ត្រាមុនវគ្គ" size="small">
                  {session.preSessionNotes.objectives?.length > 0 && (
                    <div className="mb-3">
                      <strong>គោលបំណង:</strong>
                      <ul className="mt-1">
                        {session.preSessionNotes.objectives.map((obj: string, idx: number) => (
                          <li key={idx}>{obj}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {session.preSessionNotes.focusAreas?.length > 0 && (
                    <div>
                      <strong>ផ្នែកផ្តោតសំខាន់:</strong>
                      <ul className="mt-1">
                        {session.preSessionNotes.focusAreas.map((area: string, idx: number) => (
                          <li key={idx}>{area}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </Card>
              )}
            </div>
          </TabPane>

          <TabPane tab="ការសង្កេត" key="observations">
            {session.status === 'IN_PROGRESS' && (
              <Card title="បន្ថែមការសង្កេតថ្មី" className="mb-4">
                <Form
                  form={observationForm}
                  layout="vertical"
                  onFinish={handleAddObservation}
                >
                  <Form.Item
                    name="observationType"
                    label="ប្រភេទការសង្កេត"
                    rules={[{ required: true, message: 'សូមជ្រើសរើសប្រភេទ' }]}
                  >
                    <Select placeholder="ជ្រើសរើសប្រភេទការសង្កេត">
                      {observationTypes.map((type) => (
                        <Option key={type.value} value={type.value}>
                          {type.label}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>

                  <Form.Item
                    name="observationKm"
                    label="ការសង្កេត"
                    rules={[{ required: true, message: 'សូមបញ្ចូលការសង្កេត' }]}
                  >
                    <TextArea rows={3} placeholder="បរិយាយអ្វីដែលអ្នកសង្កេតឃើញ..." />
                  </Form.Item>

                  <Form.Item
                    name="evidence"
                    label="ភស្តុតាង"
                  >
                    <TextArea rows={2} placeholder="ឧទាហរណ៍ជាក់ស្តែង..." />
                  </Form.Item>

                  <Form.Item>
                    <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>
                      រក្សាទុកការសង្កេត
                    </Button>
                  </Form.Item>
                </Form>
              </Card>
            )}

            <Timeline>
              {observations.map((obs) => (
                <Timeline.Item key={obs.id} color="blue">
                  <div className="mb-2">
                    <Tag>{observationTypes.find(t => t.value === obs.observationType)?.label}</Tag>
                    <span className="text-gray-500 text-sm ml-2">
                      {formatDateTimeForDisplay(obs.timestamp).split(' ')[1]}
                    </span>
                  </div>
                  <p>{obs.observationKm}</p>
                  {obs.evidence && (
                    <p className="text-gray-600 text-sm mt-1">
                      <strong>ភស្តុតាង:</strong> {obs.evidence}
                    </p>
                  )}
                </Timeline.Item>
              ))}
            </Timeline>
          </TabPane>

          <TabPane tab="មតិយោបល់" key="feedback">
            {(session.status === 'IN_PROGRESS' || session.status === 'COMPLETED') && (
              <Card title="បន្ថែមមតិយោបល់ថ្មី" className="mb-4">
                <Form
                  form={feedbackForm}
                  layout="vertical"
                  onFinish={handleAddFeedback}
                >
                  <Form.Item
                    name="feedbackType"
                    label="ប្រភេទមតិយោបល់"
                    rules={[{ required: true, message: 'សូមជ្រើសរើសប្រភេទ' }]}
                  >
                    <Select placeholder="ជ្រើសរើសប្រភេទមតិយោបល់">
                      {feedbackTypes.map((type) => (
                        <Option key={type.value} value={type.value}>
                          {type.label}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>

                  <Form.Item
                    name="feedbackKm"
                    label="មតិយោបល់"
                    rules={[{ required: true, message: 'សូមបញ្ចូលមតិយោបល់' }]}
                  >
                    <TextArea rows={3} placeholder="បញ្ចូលមតិយោបល់របស់អ្នក..." />
                  </Form.Item>

                  <Form.Item
                    name="priority"
                    label="អាទិភាព"
                  >
                    <Rate count={5} tooltips={['ទាបបំផុត', 'ទាប', 'មធ្យម', 'ខ្ពស់', 'ខ្ពស់បំផុត']} />
                  </Form.Item>

                  <Form.Item>
                    <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>
                      រក្សាទុកមតិយោបល់
                    </Button>
                  </Form.Item>
                </Form>
              </Card>
            )}

            <div className="space-y-4">
              {feedback.map((item) => {
                const type = feedbackTypes.find(t => t.value === item.feedbackType);
                return (
                  <Card
                    key={item.id}
                    size="small"
                    title={
                      <Space>
                        <Tag color={type?.color}>{type?.label}</Tag>
                        <Rate disabled value={item.priority} count={5} />
                      </Space>
                    }
                    extra={
                      item.isAddressed && <Tag color="green">បានដោះស្រាយ</Tag>
                    }
                  >
                    <p>{item.feedbackKm}</p>
                  </Card>
                );
              })}
            </div>
          </TabPane>

          {session.sessionNotes && (
            <TabPane tab="កំណត់ត្រាវគ្គ" key="notes">
              <Card>
                <pre className="whitespace-pre-wrap">
                  {JSON.stringify(session.sessionNotes, null, 2)}
                </pre>
              </Card>
            </TabPane>
          )}

          {session.actionItems && (
            <TabPane tab="សកម្មភាពបន្ត" key="actions">
              <Card>
                <pre className="whitespace-pre-wrap">
                  {JSON.stringify(session.actionItems, null, 2)}
                </pre>
              </Card>
            </TabPane>
          )}
        </Tabs>
      </Card>
    </div>
  );
}