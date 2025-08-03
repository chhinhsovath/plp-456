'use client';

import { useState, useEffect } from 'react';
import { Card, Tabs, Select, Button, Space, Typography, Form, Input, DatePicker, Spin, Row, Col } from 'antd';
import { RobotOutlined, CalendarOutlined, BulbOutlined, CommentOutlined, BarChartOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import { AISuggestions } from '@/components/AISuggestions';
import { useRouter } from 'next/navigation';
import dayjs from 'dayjs';
import { useMessage } from '@/hooks/useAntdApp';

const { TabPane } = Tabs;
const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;

export default function AIAssistantPage() {
  const message = useMessage();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('session_planning');
  const [relationships, setRelationships] = useState<any[]>([]);
  const [selectedRelationship, setSelectedRelationship] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [suggestionContext, setSuggestionContext] = useState<any>(null);

  useEffect(() => {
    fetchRelationships();
  }, []);

  const fetchRelationships = async () => {
    try {
      const response = await fetch('/api/mentoring/relationships');
      const data = await response.json();
      if (response.ok) {
        setRelationships(data.relationships || []);
      }
    } catch (error) {
      console.error('Error fetching relationships:', error);
    }
  };

  const handleSessionPlanningSubmit = async (values: any) => {
    if (!selectedRelationship) {
      message.warning('សូមជ្រើសរើសទំនាក់ទំនងណែនាំ');
      return;
    }

    setLoading(true);
    try {
      // Fetch previous sessions
      const sessionsRes = await fetch(`/api/mentoring/sessions?relationshipId=${selectedRelationship}`);
      const sessionsData = await sessionsRes.json();

      const relationship = relationships.find(r => r.id === selectedRelationship);

      setSuggestionContext({
        type: 'session_planning',
        data: {
          relationshipId: selectedRelationship,
          previousSessions: sessionsData.sessions || [],
          focusAreas: relationship?.focusAreas || [],
          plannedDate: values.plannedDate,
          objectives: values.objectives,
        },
      });
    } catch (error) {
      console.error('Error:', error);
      message.error('មានបញ្ហាក្នុងការទទួលបានទិន្នន័យ');
    } finally {
      setLoading(false);
    }
  };

  const handleFeedbackAnalysis = async (values: any) => {
    setLoading(true);
    try {
      setSuggestionContext({
        type: 'feedback_improvement',
        data: {
          feedback: values.feedback ? [{ feedbackKm: values.feedback }] : [],
          sessionType: values.sessionType,
          observations: [],
        },
      });
    } finally {
      setLoading(false);
    }
  };

  const handleProgressAnalysis = async () => {
    if (!selectedRelationship) {
      message.warning('សូមជ្រើសរើសទំនាក់ទំនងណែនាំ');
      return;
    }

    setLoading(true);
    try {
      // Fetch progress data
      const reportsRes = await fetch(`/api/mentoring/progress-reports?relationshipId=${selectedRelationship}`);
      const reportsData = await reportsRes.json();

      const sessionsRes = await fetch(`/api/mentoring/sessions?relationshipId=${selectedRelationship}`);
      const sessionsData = await sessionsRes.json();

      const relationship = relationships.find(r => r.id === selectedRelationship);

      setSuggestionContext({
        type: 'progress_analysis',
        data: {
          progressReports: reportsData.reports || [],
          sessions: sessionsData.sessions || [],
          relationship,
        },
      });
    } catch (error) {
      console.error('Error:', error);
      message.error('មានបញ្ហាក្នុងការទទួលបានទិន្នន័យ');
    } finally {
      setLoading(false);
    }
  };

  const handleChallengeResolution = async (values: any) => {
    setSuggestionContext({
      type: 'challenge_resolution',
      data: {
        challenges: values.challenges || [],
        context: {
          gradeLevel: values.gradeLevel,
          subject: values.subject,
        },
      },
    });
  };

  return (
    <div className="min-h-screen w-full bg-gray-50">
      <div className="w-full p-6 lg:p-8">
      <div className="mb-6">
        <Title level={2}>
          <RobotOutlined className="mr-2" />
          ជំនួយការ AI សម្រាប់ការណែនាំ
        </Title>
        <Paragraph>
          ទទួលបានការណែនាំដែលដំណើរការដោយ AI សម្រាប់កម្មវិធីណែនាំរបស់អ្នក
        </Paragraph>
      </div>

      <Row gutter={[32, 32]}>
        <Col xs={24} lg={12}>
          <Card>
            <Tabs activeKey={activeTab} onChange={setActiveTab}>
              <TabPane
                tab={
                  <span>
                    <CalendarOutlined />
                    ផែនការវគ្គ
                  </span>
                }
                key="session_planning"
              >
                <Form layout="vertical" onFinish={handleSessionPlanningSubmit}>
                  <Form.Item label="ទំនាក់ទំនងណែនាំ" required>
                    <Select
                      placeholder="ជ្រើសរើសទំនាក់ទំនង"
                      value={selectedRelationship}
                      onChange={setSelectedRelationship}
                    >
                      {relationships.map(rel => (
                        <Option key={rel.id} value={rel.id}>
                          {rel.mentor.name} → {rel.mentee.name}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>

                  <Form.Item
                    name="plannedDate"
                    label="កាលបរិច្ឆេទគ្រោង"
                    rules={[{ required: true, message: 'សូមជ្រើសរើសកាលបរិច្ឆេទ' }]}
                  >
                    <DatePicker style={{ width: '100%' }} />
                  </Form.Item>

                  <Form.Item
                    name="objectives"
                    label="គោលបំណងវគ្គ"
                  >
                    <TextArea rows={3} placeholder="បរិយាយគោលបំណងសម្រាប់វគ្គបន្ទាប់..." />
                  </Form.Item>

                  <Form.Item>
                    <Button type="primary" htmlType="submit" loading={loading} block>
                      ទទួលបានការណែនាំ
                    </Button>
                  </Form.Item>
                </Form>
              </TabPane>

              <TabPane
                tab={
                  <span>
                    <CommentOutlined />
                    មតិយោបល់
                  </span>
                }
                key="feedback"
              >
                <Form layout="vertical" onFinish={handleFeedbackAnalysis}>
                  <Form.Item
                    name="sessionType"
                    label="ប្រភេទវគ្គ"
                    rules={[{ required: true }]}
                  >
                    <Select placeholder="ជ្រើសរើសប្រភេទវគ្គ">
                      <Option value="CLASSROOM_OBSERVATION">ការសង្កេតក្នុងថ្នាក់រៀន</Option>
                      <Option value="LESSON_PLANNING">ការគាំទ្រផែនការបង្រៀន</Option>
                      <Option value="REFLECTIVE_PRACTICE">ការអនុវត្តឆ្លុះបញ្ចាំង</Option>
                    </Select>
                  </Form.Item>

                  <Form.Item
                    name="feedback"
                    label="មតិយោបល់បច្ចុប្បន្ន"
                  >
                    <TextArea 
                      rows={4} 
                      placeholder="បញ្ចូលមតិយោបល់ដែលអ្នកកំពុងរៀបចំ..." 
                    />
                  </Form.Item>

                  <Form.Item>
                    <Button type="primary" htmlType="submit" loading={loading} block>
                      វិភាគមតិយោបល់
                    </Button>
                  </Form.Item>
                </Form>
              </TabPane>

              <TabPane
                tab={
                  <span>
                    <BarChartOutlined />
                    វឌ្ឍនភាព
                  </span>
                }
                key="progress"
              >
                <div className="text-center">
                  <Paragraph>
                    វិភាគវឌ្ឍនភាពនៃទំនាក់ទំនងណែនាំ និងទទួលបានការណែនាំសម្រាប់ការកែលម្អ
                  </Paragraph>
                  
                  <Form.Item label="ទំនាក់ទំនងណែនាំ" className="mb-4">
                    <Select
                      placeholder="ជ្រើសរើសទំនាក់ទំនង"
                      value={selectedRelationship}
                      onChange={setSelectedRelationship}
                      style={{ width: '100%' }}
                    >
                      {relationships.map(rel => (
                        <Option key={rel.id} value={rel.id}>
                          {rel.mentor.name} → {rel.mentee.name}
                        </Option>
                      ))}
                    </Select>
                  </Form.Item>

                  <Button 
                    type="primary" 
                    onClick={handleProgressAnalysis}
                    loading={loading}
                    disabled={!selectedRelationship}
                  >
                    វិភាគវឌ្ឍនភាព
                  </Button>
                </div>
              </TabPane>

              <TabPane
                tab={
                  <span>
                    <QuestionCircleOutlined />
                    បញ្ហាប្រឈម
                  </span>
                }
                key="challenges"
              >
                <Form layout="vertical" onFinish={handleChallengeResolution}>
                  <Form.Item
                    name="challenges"
                    label="បញ្ហាប្រឈម"
                    rules={[{ required: true }]}
                  >
                    <Select
                      mode="multiple"
                      placeholder="ជ្រើសរើសបញ្ហាប្រឈម"
                    >
                      <Option value="time_management">ការគ្រប់គ្រងពេលវេលា</Option>
                      <Option value="student_engagement">ការចូលរួមរបស់សិស្ស</Option>
                      <Option value="classroom_management">ការគ្រប់គ្រងថ្នាក់រៀន</Option>
                      <Option value="lesson_planning">ការរៀបចំផែនការបង្រៀន</Option>
                      <Option value="assessment">ការវាយតម្លៃ</Option>
                    </Select>
                  </Form.Item>

                  <Form.Item
                    name="gradeLevel"
                    label="កម្រិតថ្នាក់"
                  >
                    <Select placeholder="ជ្រើសរើសកម្រិតថ្នាក់">
                      <Option value="1-3">ថ្នាក់ទី ១-៣</Option>
                      <Option value="4-6">ថ្នាក់ទី ៤-៦</Option>
                    </Select>
                  </Form.Item>

                  <Form.Item>
                    <Button type="primary" htmlType="submit" loading={loading} block>
                      ស្វែងរកដំណោះស្រាយ
                    </Button>
                  </Form.Item>
                </Form>
              </TabPane>
            </Tabs>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          {loading && (
            <Card>
              <div className="text-center py-8">
                <Spin size="large" />
                <p className="mt-4">កំពុងវិភាគទិន្នន័យ...</p>
              </div>
            </Card>
          )}

          {suggestionContext && !loading && (
            <AISuggestions
              context={suggestionContext}
              onApplySuggestion={(suggestion) => {
                console.log('Applied suggestion:', suggestion);
              }}
            />
          )}

          {!suggestionContext && !loading && (
            <Card>
              <Empty
                image={<BulbOutlined style={{ fontSize: 48, color: '#bfbfbf' }} />}
                description="ជ្រើសរើសប្រភេទជំនួយ និងបំពេញព័ត៌មានដើម្បីទទួលបានការណែនាំ"
              />
            </Card>
          )}
        </Col>
      </Row>
      </div>

    </div>
  );
}