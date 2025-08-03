'use client';

import { useState, useEffect } from 'react';
import { Form, Select, Input, Button, Card, Space, DatePicker } from 'antd';
import { useRouter } from 'next/navigation';
import { ArrowLeftOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { useMessage } from '@/hooks/useAntdApp';

const { Option } = Select;
const { TextArea } = Input;

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

const focusAreaOptions = [
  'ការគ្រប់គ្រងថ្នាក់រៀន',
  'វិធីសាស្ត្របង្រៀន',
  'ការប្រើប្រាស់បច្ចេកវិទ្យា',
  'ការវាយតម្លៃសិស្ស',
  'ការរៀបចំផែនការបង្រៀន',
  'ការចូលរួមរបស់សិស្ស',
  'ការគ្រប់គ្រងពេលវេលា',
  'ការទំនាក់ទំនងជាមួយសិស្ស',
];

export default function NewMentoringRelationship() {
  const message = useMessage();
  const router = useRouter();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users');
      const data = await response.json();
      if (response.ok) {
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const onFinish = async (values: any) => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/mentoring/relationships', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...values,
          goals: {
            shortTerm: values.shortTermGoals?.split('\n').filter((g: string) => g.trim()),
            longTerm: values.longTermGoals?.split('\n').filter((g: string) => g.trim()),
          },
        }),
      });

      if (response.ok) {
        message.success('បានបង្កើតទំនាក់ទំនងណែនាំដោយជោគជ័យ');
        router.push('/dashboard/mentoring');
      } else {
        const error = await response.json();
        message.error(error.error || 'មានបញ្ហាក្នុងការបង្កើតទំនាក់ទំនង');
      }
    } catch (error) {
      console.error('Error:', error);
      message.error('មានបញ្ហាក្នុងការបង្កើតទំនាក់ទំនង');
    } finally {
      setLoading(false);
    }
  };

  const mentorOptions = users.filter(u => 
    ['ADMINISTRATOR', 'ZONE', 'PROVINCIAL', 'DEPARTMENT', 'CLUSTER', 'DIRECTOR'].includes(u.role)
  );

  const menteeOptions = users.filter(u => 
    ['TEACHER', 'DIRECTOR'].includes(u.role)
  );

  const coordinatorOptions = users.filter(u => 
    ['ADMINISTRATOR', 'ZONE', 'PROVINCIAL', 'DEPARTMENT', 'CLUSTER'].includes(u.role)
  );

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

      <Card title="បង្កើតទំនាក់ទំនងណែនាំថ្មី" className="max-w-3xl mx-auto">
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{
            focusAreas: [],
          }}
        >
          <Form.Item
            name="mentorId"
            label="គ្រូណែនាំ"
            rules={[{ required: true, message: 'សូមជ្រើសរើសគ្រូណែនាំ' }]}
          >
            <Select
              showSearch
              placeholder="ជ្រើសរើសគ្រូណែនាំ"
              optionFilterProp="children"
              filterOption={(input, option) =>
                option?.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
              }
            >
              {mentorOptions.map((user) => (
                <Option key={user.id} value={user.id}>
                  {user.name} ({user.role})
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="menteeId"
            label="គ្រូកំពុងរៀន"
            rules={[{ required: true, message: 'សូមជ្រើសរើសគ្រូកំពុងរៀន' }]}
          >
            <Select
              showSearch
              placeholder="ជ្រើសរើសគ្រូកំពុងរៀន"
              optionFilterProp="children"
              filterOption={(input, option) =>
                option?.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
              }
            >
              {menteeOptions.map((user) => (
                <Option key={user.id} value={user.id}>
                  {user.name} ({user.role})
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="coordinatorId"
            label="អ្នកសម្របសម្រួល (ស្រេចចិត្ត)"
          >
            <Select
              showSearch
              allowClear
              placeholder="ជ្រើសរើសអ្នកសម្របសម្រួល"
              optionFilterProp="children"
              filterOption={(input, option) =>
                option?.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
              }
            >
              {coordinatorOptions.map((user) => (
                <Option key={user.id} value={user.id}>
                  {user.name} ({user.role})
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="focusAreas"
            label="ផ្នែកផ្តោតសំខាន់"
            rules={[{ required: true, message: 'សូមជ្រើសរើសយ៉ាងហោចណាស់មួយផ្នែក' }]}
          >
            <Select
              mode="multiple"
              placeholder="ជ្រើសរើសផ្នែកដែលត្រូវផ្តោតលើ"
            >
              {focusAreaOptions.map((area) => (
                <Option key={area} value={area}>
                  {area}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="shortTermGoals"
            label="គោលដៅរយៈពេលខ្លី (១ ទៅ ៣ ខែ)"
            tooltip="បញ្ចូលមួយគោលដៅក្នុងមួយបន្ទាត់"
          >
            <TextArea
              rows={3}
              placeholder="ឧទាហរណ៍: កែលម្អការគ្រប់គ្រងថ្នាក់រៀន"
            />
          </Form.Item>

          <Form.Item
            name="longTermGoals"
            label="គោលដៅរយៈពេលវែង (៦ ទៅ ១២ ខែ)"
            tooltip="បញ្ចូលមួយគោលដៅក្នុងមួយបន្ទាត់"
          >
            <TextArea
              rows={3}
              placeholder="ឧទាហរណ៍: ក្លាយជាគ្រូគំរូក្នុងការប្រើបច្ចេកវិទ្យា"
            />
          </Form.Item>

          <Form.Item
            name="notes"
            label="កំណត់ចំណាំបន្ថែម"
          >
            <TextArea
              rows={4}
              placeholder="កំណត់ចំណាំអំពីទំនាក់ទំនងនេះ..."
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                បង្កើតទំនាក់ទំនង
              </Button>
              <Link href="/dashboard/mentoring">
                <Button>បោះបង់</Button>
              </Link>
            </Space>
          </Form.Item>
        </Form>
      </Card>
      </div>

    </div>
  );
}