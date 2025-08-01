'use client';

import { useState, useEffect } from 'react';
import { Card, Tabs, Button, Space, Tag, Table, Modal, Form, Input, Select, DatePicker, message, Badge, Empty, Spin } from 'antd';
import { PlusOutlined, EyeOutlined, CheckOutlined, CloseOutlined, CalendarOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useRouter } from 'next/navigation';

const { TabPane } = Tabs;
const { TextArea } = Input;
const { Option } = Select;

interface PeerObservation {
  id: string;
  requester: { id: string; name: string; role: string };
  observer: { id: string; name: string; role: string };
  status: string;
  requestMessage?: string;
  responseMessage?: string;
  scheduledDate?: string;
  location?: string;
  subject?: string;
  gradeLevel?: string;
  lessonTopic?: string;
  focusAreas: string[];
  createdAt: string;
  completedAt?: string;
}

const statusConfig = {
  PENDING: { color: 'gold', text: 'រង់ចាំការឆ្លើយតប' },
  ACCEPTED: { color: 'green', text: 'បានទទួលយក' },
  DECLINED: { color: 'red', text: 'បានបដិសេធ' },
  SCHEDULED: { color: 'blue', text: 'បានកំណត់ពេល' },
  COMPLETED: { color: 'default', text: 'បានបញ្ចប់' },
  CANCELLED: { color: 'red', text: 'បានលុបចោល' },
};

const focusAreaOptions = [
  'ការគ្រប់គ្រងថ្នាក់រៀន',
  'វិធីសាស្ត្របង្រៀន',
  'ការប្រើប្រាស់សម្ភារៈបង្រៀន',
  'ការចូលរួមរបស់សិស្ស',
  'ការវាយតម្លៃ',
  'ការប្រើប្រាស់បច្ចេកវិទ្យា',
];

export default function PeerObservations() {
  const router = useRouter();
  const [observations, setObservations] = useState<PeerObservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('received');
  const [requestModalVisible, setRequestModalVisible] = useState(false);
  const [responseModalVisible, setResponseModalVisible] = useState(false);
  const [selectedObservation, setSelectedObservation] = useState<PeerObservation | null>(null);
  const [peers, setPeers] = useState<any[]>([]);
  const [requestForm] = Form.useForm();
  const [responseForm] = Form.useForm();

  useEffect(() => {
    fetchObservations();
    fetchPeers();
  }, [activeTab]);

  const fetchObservations = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/mentoring/peer-observations?type=${activeTab}`);
      const data = await response.json();
      
      if (response.ok) {
        setObservations(data.observations);
      }
    } catch (error) {
      console.error('Error fetching observations:', error);
      message.error('មានបញ្ហាក្នុងការទាញយកទិន្នន័យ');
    } finally {
      setLoading(false);
    }
  };

  const fetchPeers = async () => {
    try {
      const response = await fetch('/api/users?role=TEACHER,DIRECTOR');
      const data = await response.json();
      if (response.ok) {
        setPeers(data.users || []);
      }
    } catch (error) {
      console.error('Error fetching peers:', error);
    }
  };

  const handleCreateRequest = async (values: any) => {
    try {
      const response = await fetch('/api/mentoring/peer-observations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...values,
          suggestedDate: values.suggestedDate?.toISOString(),
        }),
      });

      if (response.ok) {
        message.success('បានផ្ញើសំណើដោយជោគជ័យ');
        setRequestModalVisible(false);
        requestForm.resetFields();
        fetchObservations();
      } else {
        message.error('មានបញ្ហាក្នុងការផ្ញើសំណើ');
      }
    } catch (error) {
      console.error('Error creating request:', error);
      message.error('មានបញ្ហាក្នុងការផ្ញើសំណើ');
    }
  };

  const handleResponse = async (values: any) => {
    if (!selectedObservation) return;

    try {
      const response = await fetch(`/api/mentoring/peer-observations?id=${selectedObservation.id}&action=respond`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...values,
          scheduledDate: values.scheduledDate?.toISOString(),
        }),
      });

      if (response.ok) {
        message.success('បានឆ្លើយតបដោយជោគជ័យ');
        setResponseModalVisible(false);
        responseForm.resetFields();
        setSelectedObservation(null);
        fetchObservations();
      } else {
        message.error('មានបញ្ហាក្នុងការឆ្លើយតប');
      }
    } catch (error) {
      console.error('Error responding:', error);
      message.error('មានបញ្ហាក្នុងការឆ្លើយតប');
    }
  };

  const handleComplete = async (observationId: string) => {
    try {
      const response = await fetch(`/api/mentoring/peer-observations?id=${observationId}&action=complete`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });

      if (response.ok) {
        message.success('បានកត់ត្រាថាបានបញ្ចប់');
        fetchObservations();
      }
    } catch (error) {
      console.error('Error completing observation:', error);
      message.error('មានបញ្ហាក្នុងការបញ្ចប់');
    }
  };

  const columns = [
    {
      title: 'ថ្ងៃស្នើសុំ',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (date: string) => dayjs(date).format('DD/MM/YYYY'),
    },
    {
      title: activeTab === 'sent' ? 'អ្នកសង្កេត' : 'អ្នកស្នើសុំ',
      key: 'person',
      render: (_: any, record: PeerObservation) => {
        const person = activeTab === 'sent' ? record.observer : record.requester;
        return (
          <div>
            <div>{person.name}</div>
            <div className="text-xs text-gray-500">{person.role}</div>
          </div>
        );
      },
    },
    {
      title: 'មុខវិជ្ជា / ថ្នាក់',
      key: 'lesson',
      render: (_: any, record: PeerObservation) => (
        <div>
          {record.subject && <div>{record.subject}</div>}
          {record.gradeLevel && <div className="text-xs text-gray-500">ថ្នាក់ទី {record.gradeLevel}</div>}
        </div>
      ),
    },
    {
      title: 'ស្ថានភាព',
      dataIndex: 'status',
      key: 'status',
      width: 150,
      render: (status: string) => (
        <Tag color={statusConfig[status as keyof typeof statusConfig]?.color}>
          {statusConfig[status as keyof typeof statusConfig]?.text}
        </Tag>
      ),
    },
    {
      title: 'កាលបរិច្ឆេទ',
      dataIndex: 'scheduledDate',
      key: 'scheduledDate',
      width: 120,
      render: (date: string) => date ? dayjs(date).format('DD/MM/YYYY') : '-',
    },
    {
      title: 'សកម្មភាព',
      key: 'actions',
      width: 200,
      render: (_: any, record: PeerObservation) => {
        const isRequester = activeTab === 'sent';
        const actions = [];

        if (!isRequester && record.status === 'PENDING') {
          actions.push(
            <Button
              key="respond"
              type="primary"
              size="small"
              onClick={() => {
                setSelectedObservation(record);
                setResponseModalVisible(true);
              }}
            >
              ឆ្លើយតប
            </Button>
          );
        }

        if (record.status === 'SCHEDULED') {
          actions.push(
            <Button
              key="complete"
              size="small"
              onClick={() => handleComplete(record.id)}
            >
              បញ្ចប់
            </Button>
          );
        }

        if (record.status === 'COMPLETED' && record.feedback) {
          actions.push(
            <Button
              key="view"
              type="link"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => router.push(`/dashboard/mentoring/peer-observations/${record.id}`)}
            >
              មើលមតិ
            </Button>
          );
        }

        return <Space>{actions}</Space>;
      },
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold">ការសង្កេតពីមិត្តរួមការងារ</h1>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setRequestModalVisible(true)}
        >
          ស្នើសុំការសង្កេត
        </Button>
      </div>

      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane 
          tab={
            <span>
              សំណើទទួលបាន
              <Badge 
                count={observations.filter(o => o.status === 'PENDING').length} 
                className="ml-2"
              />
            </span>
          } 
          key="received" 
        />
        <TabPane tab="សំណើបានផ្ញើ" key="sent" />
        <TabPane tab="ទាំងអស់" key="all" />
      </Tabs>

      {loading ? (
        <div className="text-center py-12">
          <Spin size="large" />
        </div>
      ) : observations.length === 0 ? (
        <Empty description="មិនមានសំណើសង្កេតទេ" />
      ) : (
        <Table
          columns={columns}
          dataSource={observations}
          rowKey="id"
          pagination={{ pageSize: 10 }}
        />
      )}

      {/* Request Modal */}
      <Modal
        title="ស្នើសុំការសង្កេតពីមិត្តរួមការងារ"
        open={requestModalVisible}
        onCancel={() => setRequestModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={requestForm}
          layout="vertical"
          onFinish={handleCreateRequest}
        >
          <Form.Item
            name="observerId"
            label="ជ្រើសរើសអ្នកសង្កេត"
            rules={[{ required: true, message: 'សូមជ្រើសរើសអ្នកសង្កេត' }]}
          >
            <Select
              showSearch
              placeholder="ជ្រើសរើសគ្រូ"
              optionFilterProp="children"
            >
              {peers.map(peer => (
                <Option key={peer.id} value={peer.id}>
                  {peer.name} - {peer.role}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="subject"
            label="មុខវិជ្ជា"
            rules={[{ required: true, message: 'សូមបញ្ចូលមុខវិជ្ជា' }]}
          >
            <Input placeholder="ឧទាហរណ៍: គណិតវិទ្យា" />
          </Form.Item>

          <Form.Item
            name="gradeLevel"
            label="ថ្នាក់"
          >
            <Select placeholder="ជ្រើសរើសថ្នាក់">
              {[1, 2, 3, 4, 5, 6].map(grade => (
                <Option key={grade} value={grade.toString()}>
                  ថ្នាក់ទី {grade}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="lessonTopic"
            label="ប្រធានបទមេរៀន"
          >
            <Input placeholder="ឧទាហរណ៍: ការបូកលេខ" />
          </Form.Item>

          <Form.Item
            name="focusAreas"
            label="ផ្នែកដែលចង់ឱ្យសង្កេត"
            rules={[{ required: true, message: 'សូមជ្រើសរើសយ៉ាងហោចណាស់មួយ' }]}
          >
            <Select
              mode="multiple"
              placeholder="ជ្រើសរើសផ្នែក"
            >
              {focusAreaOptions.map(area => (
                <Option key={area} value={area}>
                  {area}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="suggestedDate"
            label="កាលបរិច្ឆេទដែលស្នើ"
          >
            <DatePicker
              style={{ width: '100%' }}
              disabledDate={(current) => current && current < dayjs().startOf('day')}
            />
          </Form.Item>

          <Form.Item
            name="location"
            label="ទីតាំង"
          >
            <Input placeholder="ឧទាហរណ៍: បន្ទប់រៀនលេខ 101" />
          </Form.Item>

          <Form.Item
            name="requestMessage"
            label="សារស្នើសុំ"
          >
            <TextArea
              rows={3}
              placeholder="សរសេរសារទៅកាន់អ្នកសង្កេត..."
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                ផ្ញើសំណើ
              </Button>
              <Button onClick={() => setRequestModalVisible(false)}>
                បោះបង់
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Response Modal */}
      <Modal
        title="ឆ្លើយតបសំណើសង្កេត"
        open={responseModalVisible}
        onCancel={() => {
          setResponseModalVisible(false);
          setSelectedObservation(null);
        }}
        footer={null}
        width={600}
      >
        {selectedObservation && (
          <>
            <Card className="mb-4">
              <p><strong>អ្នកស្នើសុំ:</strong> {selectedObservation.requester.name}</p>
              <p><strong>មុខវិជ្ជា:</strong> {selectedObservation.subject}</p>
              {selectedObservation.gradeLevel && (
                <p><strong>ថ្នាក់:</strong> ទី{selectedObservation.gradeLevel}</p>
              )}
              {selectedObservation.lessonTopic && (
                <p><strong>ប្រធានបទ:</strong> {selectedObservation.lessonTopic}</p>
              )}
              {selectedObservation.requestMessage && (
                <p><strong>សារ:</strong> {selectedObservation.requestMessage}</p>
              )}
            </Card>

            <Form
              form={responseForm}
              layout="vertical"
              onFinish={handleResponse}
            >
              <Form.Item
                name="status"
                label="ការឆ្លើយតប"
                rules={[{ required: true, message: 'សូមជ្រើសរើសការឆ្លើយតប' }]}
              >
                <Select placeholder="ជ្រើសរើសការឆ្លើយតប">
                  <Option value="ACCEPTED">
                    <Space>
                      <CheckOutlined className="text-green-500" />
                      ទទួលយក
                    </Space>
                  </Option>
                  <Option value="DECLINED">
                    <Space>
                      <CloseOutlined className="text-red-500" />
                      បដិសេធ
                    </Space>
                  </Option>
                </Select>
              </Form.Item>

              <Form.Item
                noStyle
                shouldUpdate={(prevValues, currentValues) => 
                  prevValues.status !== currentValues.status
                }
              >
                {({ getFieldValue }) =>
                  getFieldValue('status') === 'ACCEPTED' && (
                    <>
                      <Form.Item
                        name="scheduledDate"
                        label="កាលបរិច្ឆេទសង្កេត"
                        rules={[{ required: true, message: 'សូមជ្រើសរើសកាលបរិច្ឆេទ' }]}
                      >
                        <DatePicker
                          style={{ width: '100%' }}
                          showTime
                          format="DD/MM/YYYY HH:mm"
                          disabledDate={(current) => current && current < dayjs().startOf('day')}
                        />
                      </Form.Item>

                      <Form.Item
                        name="location"
                        label="ទីតាំង"
                      >
                        <Input 
                          placeholder="ទីតាំងសង្កេត" 
                          defaultValue={selectedObservation.location}
                        />
                      </Form.Item>
                    </>
                  )
                }
              </Form.Item>

              <Form.Item
                name="responseMessage"
                label="សារឆ្លើយតប"
              >
                <TextArea
                  rows={3}
                  placeholder="សរសេរសារឆ្លើយតប..."
                />
              </Form.Item>

              <Form.Item>
                <Space>
                  <Button type="primary" htmlType="submit">
                    ផ្ញើការឆ្លើយតប
                  </Button>
                  <Button onClick={() => {
                    setResponseModalVisible(false);
                    setSelectedObservation(null);
                  }}>
                    បោះបង់
                  </Button>
                </Space>
              </Form.Item>
            </Form>
          </>
        )}
      </Modal>
    </div>
  );
}