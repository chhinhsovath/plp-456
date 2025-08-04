'use client';

import { useState, useEffect } from 'react';
import { Card, Form, Switch, Button, Space, Divider, Alert } from 'antd';
import { BellOutlined, MessageOutlined, MailOutlined, SaveOutlined } from '@ant-design/icons';
import { useMessage } from '@/hooks/useAntdApp';

interface NotificationSettings {
  sessionReminders: boolean;
  sessionReminder24h: boolean;
  sessionReminder1h: boolean;
  newSessionScheduled: boolean;
  feedbackReceived: boolean;
  progressReportDue: boolean;
  weeklyDigest: boolean;
  telegramEnabled: boolean;
  emailEnabled: boolean;
}

export default function NotificationSettings() {
  const message = useMessage();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [telegramConnected, setTelegramConnected] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      // Load user notification settings
      // For now, we'll use default values
      const defaultSettings: NotificationSettings = {
        sessionReminders: true,
        sessionReminder24h: true,
        sessionReminder1h: true,
        newSessionScheduled: true,
        feedbackReceived: true,
        progressReportDue: true,
        weeklyDigest: false,
        telegramEnabled: true,
        emailEnabled: false,
      };
      
      form.setFieldsValue(defaultSettings);
      
      // Check if Telegram is connected
      // This would check if the user has a telegram_id
      setTelegramConnected(false); // Placeholder
    } catch (error) {
      console.error('Error loading settings:', error);
      message.error('មានបញ្ហាក្នុងការទាញយកការកំណត់');
    } finally {
      setLoading(false);
    }
  };

  const onFinish = async (values: NotificationSettings) => {
    try {
      setSaving(true);
      
      // Save notification settings
      // This would call an API endpoint to save the settings
      console.log('Saving notification settings:', values);
      
      message.success('បានរក្សាទុកការកំណត់');
    } catch (error) {
      console.error('Error saving settings:', error);
      message.error('មានបញ្ហាក្នុងការរក្សាទុកការកំណត់');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gray-50">
      <div className="w-full p-6 lg:p-8">
      <h1 className="text-2xl font-bold mb-6">
        <BellOutlined className="mr-2" />
        ការកំណត់ការជូនដំណឹង
      </h1>

      {!telegramConnected && (
        <Alert
          message="ភ្ជាប់ Telegram"
          description="ភ្ជាប់គណនី Telegram របស់អ្នកដើម្បីទទួលការជូនដំណឹង"
          type="info"
          showIcon
          action={
            <Button size="small" type="primary" icon={<MessageOutlined />}>
              ភ្ជាប់ Telegram
            </Button>
          }
          className="mb-6"
        />
      )}

      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{
          sessionReminders: true,
          sessionReminder24h: true,
          sessionReminder1h: true,
          newSessionScheduled: true,
          feedbackReceived: true,
          progressReportDue: true,
          weeklyDigest: false,
          telegramEnabled: true,
          emailEnabled: false,
        }}
      >
        <Card title="ប្រភេទការជូនដំណឹង" loading={loading}>
          <Form.Item name="sessionReminders" valuePropName="checked">
            <Space>
              <Switch />
              <span>ការរំលឹកវគ្គណែនាំ</span>
            </Space>
          </Form.Item>

          <div className="ml-10 mb-4">
            <Form.Item 
              name="sessionReminder24h" 
              valuePropName="checked"
              dependencies={['sessionReminders']}
            >
              <Space>
                <Switch disabled={!form.getFieldValue('sessionReminders')} />
                <span className="text-gray-600">24 ម៉ោងមុនពេល</span>
              </Space>
            </Form.Item>

            <Form.Item 
              name="sessionReminder1h" 
              valuePropName="checked"
              dependencies={['sessionReminders']}
            >
              <Space>
                <Switch disabled={!form.getFieldValue('sessionReminders')} />
                <span className="text-gray-600">1 ម៉ោងមុនពេល</span>
              </Space>
            </Form.Item>
          </div>

          <Form.Item name="newSessionScheduled" valuePropName="checked">
            <Space>
              <Switch />
              <span>វគ្គថ្មីត្រូវបានកំណត់</span>
            </Space>
          </Form.Item>

          <Form.Item name="feedbackReceived" valuePropName="checked">
            <Space>
              <Switch />
              <span>មតិយោបល់ថ្មីពីគ្រូណែនាំ</span>
            </Space>
          </Form.Item>

          <Form.Item name="progressReportDue" valuePropName="checked">
            <Space>
              <Switch />
              <span>របាយការណ៍វឌ្ឍនភាពត្រូវបានគេរំពឹងទុក</span>
            </Space>
          </Form.Item>

          <Form.Item name="weeklyDigest" valuePropName="checked">
            <Space>
              <Switch />
              <span>សង្ខេបប្រចាំសប្តាហ៍</span>
            </Space>
          </Form.Item>
        </Card>

        <Card title="វិធីទទួលការជូនដំណឹង" className="mt-6">
          <Form.Item name="telegramEnabled" valuePropName="checked">
            <Space>
              <Switch disabled={!telegramConnected} />
              <MessageOutlined />
              <span>Telegram</span>
              {!telegramConnected && (
                <span className="text-gray-500">(មិនបានភ្ជាប់)</span>
              )}
            </Space>
          </Form.Item>

          <Form.Item name="emailEnabled" valuePropName="checked">
            <Space>
              <Switch />
              <MailOutlined />
              <span>អ៊ីមែល</span>
            </Space>
          </Form.Item>
        </Card>

        <Form.Item className="mt-6">
          <Button 
            type="primary" 
            htmlType="submit" 
            loading={saving}
            icon={<SaveOutlined />}
          >
            រក្សាទុកការកំណត់
          </Button>
        </Form.Item>
      </Form>
      </div>

    </div>
  );
}