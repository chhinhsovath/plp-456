'use client';

import { useState, useEffect } from 'react';
import { Form, Select, Input, Button, Card, Space, DatePicker, TimePicker, Row, Col, Divider } from 'antd';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeftOutlined, BulbOutlined } from '@ant-design/icons';
import Link from 'next/link';
import dayjs from '@/lib/dayjs-config';
import { formatDateForDisplay, formatDateTimeForDisplay, DATE_FORMATS, formatDateForAPI } from '@/lib/date-utils';
import { AISuggestions } from '@/components/AISuggestions';
import { useMessage } from '@/hooks/useAntdApp';

const { Option } = Select;
const { TextArea } = Input;

const sessionTypeOptions = [
  { value: 'CLASSROOM_OBSERVATION', label: 'ការសង្កេតក្នុងថ្នាក់រៀន' },
  { value: 'LESSON_PLANNING', label: 'ការគាំទ្រផែនការបង្រៀន' },
  { value: 'REFLECTIVE_PRACTICE', label: 'ការអនុវត្តឆ្លុះបញ្ចាំង' },
  { value: 'PEER_LEARNING', label: 'វង់សិក្សាមិត្តភក្តិ' },
  { value: 'FOLLOW_UP', label: 'ការតាមដានបន្ត' },
];

export default function NewMentoringSession() {
  const message = useMessage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const relationshipId = searchParams.get('relationshipId');
  
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [relationships, setRelationships] = useState<any[]>([]);
  const [showAISuggestions, setShowAISuggestions] = useState(false);
  const [suggestionContext, setSuggestionContext] = useState<any>(null);

  useEffect(() => {
    fetchRelationships();
  }, []);

  useEffect(() => {
    if (relationshipId) {
      form.setFieldsValue({ relationshipId });
    }
  }, [relationshipId, form]);

  const fetchRelationships = async () => {
    try {
      const response = await fetch('/api/mentoring/relationships?status=ACTIVE');
      const data = await response.json();
      if (response.ok) {
        setRelationships(data.relationships || []);
      }
    } catch (error) {
      console.error('Error fetching relationships:', error);
    }
  };

  const onFinish = async (values: any) => {
    try {
      setLoading(true);
      
      // Combine date and time
      const scheduledDate = formatDateForAPI(
        dayjs(values.date)
          .hour(values.time.hour())
          .minute(values.time.minute())
      );

      const preSessionNotes = {
        objectives: values.objectives?.split('\n').filter((o: string) => o.trim()) || [],
        focusAreas: values.focusAreas?.split('\n').filter((f: string) => f.trim()) || [],
        preparation: values.preparation,
      };

      const response = await fetch('/api/mentoring/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          relationshipId: values.relationshipId,
          sessionType: values.sessionType,
          scheduledDate,
          location: values.location,
          preSessionNotes,
        }),
      });

      if (response.ok) {
        message.success('បានកំណត់ពេលជួបដោយជោគជ័យ');
        router.push('/dashboard/mentoring');
      } else {
        const error = await response.json();
        message.error(error.error || 'មានបញ្ហាក្នុងការកំណត់ពេលជួប');
      }
    } catch (error) {
      console.error('Error:', error);
      message.error('មានបញ្ហាក្នុងការកំណត់ពេលជួប');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gray-50">
      <div className="w-full p-6 lg:p-8">
      <div className="mb-6">
        <Link href="/dashboard/mentoring">
          <Button icon={<ArrowLeftOutlined />} type="text">
            ត្រឡប់ទៅទំព័រមុន
          </Button>
        </Link>
      </div>

      <Row gutter={[32, 32]}>
        <Col xs={24} lg={showAISuggestions ? 14 : 24}>
          <Card 
            title="កំណត់ពេលវគ្គណែនាំថ្មី" 
            extra={
              <Button
                icon={<BulbOutlined />}
                onClick={async () => {
                  const relId = form.getFieldValue('relationshipId');
                  if (relId) {
                    const sessionsRes = await fetch(`/api/mentoring/sessions?relationshipId=${relId}`);
                    const sessionsData = await sessionsRes.json();
                    const relationship = relationships.find(r => r.id === relId);
                    
                    setSuggestionContext({
                      type: 'session_planning',
                      data: {
                        relationshipId: relId,
                        previousSessions: sessionsData.sessions || [],
                        focusAreas: relationship?.focusAreas || [],
                      },
                    });
                    setShowAISuggestions(true);
                  } else {
                    message.warning('សូមជ្រើសរើសទំនាក់ទំនងណែនាំជាមុនសិន');
                  }
                }}
              >
                ទទួលបានការណែនាំពី AI
              </Button>
            }
          >
            <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{
            date: dayjs(),
            time: dayjs().add(1, 'hour').startOf('hour'),
          }}
        >
          <Form.Item
            name="relationshipId"
            label="ទំនាក់ទំនងណែនាំ"
            rules={[{ required: true, message: 'សូមជ្រើសរើសទំនាក់ទំនងណែនាំ' }]}
          >
            <Select placeholder="ជ្រើសរើសទំនាក់ទំនងណែនាំ">
              {relationships.map((rel) => (
                <Option key={rel.id} value={rel.id}>
                  {rel.mentor.name} → {rel.mentee.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="sessionType"
            label="ប្រភេទវគ្គ"
            rules={[{ required: true, message: 'សូមជ្រើសរើសប្រភេទវគ្គ' }]}
          >
            <Select placeholder="ជ្រើសរើសប្រភេទវគ្គ">
              {sessionTypeOptions.map((type) => (
                <Option key={type.value} value={type.value}>
                  {type.label}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Space className="w-full" size="large">
            <Form.Item
              name="date"
              label="កាលបរិច្ឆេទ"
              rules={[{ required: true, message: 'សូមជ្រើសរើសកាលបរិច្ឆេទ' }]}
              className="flex-1"
            >
              <DatePicker
                className="w-full"
                format={DATE_FORMATS.DISPLAY_DATE}
                disabledDate={(current) => current && current < dayjs().startOf('day')}
              />
            </Form.Item>

            <Form.Item
              name="time"
              label="ពេលវេលា"
              rules={[{ required: true, message: 'សូមជ្រើសរើសពេលវេលា' }]}
              className="flex-1"
            >
              <TimePicker
                className="w-full"
                format="HH:mm"
                minuteStep={15}
              />
            </Form.Item>
          </Space>

          <Form.Item
            name="location"
            label="ទីតាំង"
            rules={[{ required: true, message: 'សូមបញ្ចូលទីតាំង' }]}
          >
            <Input placeholder="ឧទាហរណ៍: បន្ទប់រៀនលេខ ១០១, សាលាបឋមសិក្សា..." />
          </Form.Item>

          <Form.Item
            name="objectives"
            label="គោលបំណងនៃវគ្គ"
            tooltip="បញ្ចូលមួយគោលបំណងក្នុងមួយបន្ទាត់"
            rules={[{ required: true, message: 'សូមបញ្ចូលគោលបំណងនៃវគ្គ' }]}
          >
            <TextArea
              rows={3}
              placeholder="ឧទាហរណ៍:&#10;- សង្កេតការប្រើប្រាស់វិធីសាស្ត្របង្រៀនថ្មី&#10;- ផ្តល់មតិយោបល់លើការគ្រប់គ្រងថ្នាក់រៀន"
            />
          </Form.Item>

          <Form.Item
            name="focusAreas"
            label="ផ្នែកផ្តោតសំខាន់"
            tooltip="បញ្ចូលមួយផ្នែកក្នុងមួយបន្ទាត់"
          >
            <TextArea
              rows={3}
              placeholder="ឧទាហរណ៍:&#10;- ការប្រើសំណួរបើកចំហ&#10;- ការចូលរួមរបស់សិស្ស"
            />
          </Form.Item>

          <Form.Item
            name="preparation"
            label="ការរៀបចំមុនពេលជួប"
          >
            <TextArea
              rows={3}
              placeholder="កំណត់ចំណាំអំពីអ្វីដែលត្រូវរៀបចំមុនពេលជួប..."
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                កំណត់ពេលជួប
              </Button>
              <Link href="/dashboard/mentoring">
                <Button>បោះបង់</Button>
              </Link>
            </Space>
          </Form.Item>
            </Form>
          </Card>
        </Col>

        {showAISuggestions && suggestionContext && (
          <Col xs={24} lg={10}>
            <AISuggestions
              context={suggestionContext}
              onApplySuggestion={(suggestion) => {
                // Apply suggestion to form
                if (suggestion.id === 'vary_session_types') {
                  // Pre-fill session type based on AI suggestion
                  message.info('បានអនុវត្តការណែនាំសម្រាប់ប្រភេទវគ្គ');
                }
              }}
            />
          </Col>
        )}
      </Row>
      </div>

    </div>
  );
}