'use client';

import { useState } from 'react';
import { Form, Input, Button, Select, Card, message, Alert } from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import { useOffline } from '@/hooks/useOffline';
import { offlineStorage } from '@/lib/offline/offline-storage';

const { TextArea } = Input;
const { Option } = Select;

interface OfflineObservation {
  id: string;
  sessionId: string;
  observationType: string;
  observationKm: string;
  evidence?: string;
  timestamp: number;
  synced: boolean;
}

export function OfflineSessionForm({ sessionId }: { sessionId: string }) {
  const { isOnline, OfflineAPI } = useOffline();
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);

  const handleSave = async (values: any) => {
    try {
      setSaving(true);
      
      const observation: OfflineObservation = {
        id: `obs_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        sessionId,
        ...values,
        timestamp: Date.now(),
        synced: false,
      };

      if (isOnline) {
        // Try to save online
        const response = await OfflineAPI.fetch('/api/mentoring/observations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(observation),
        });

        if (response.ok || response.status === 202) {
          message.success('បានរក្សាទុកការសង្កេត');
          form.resetFields();
        }
      } else {
        // Save offline
        await offlineStorage.save('observations', observation);
        await offlineStorage.queueAction({
          url: '/api/mentoring/observations',
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: observation,
        });
        
        message.info('បានរក្សាទុកក្នុងមុខងារក្រៅបណ្តាញ - នឹងធ្វើសមកាលកម្មពេលមានអ៊ីនធឺណិត');
        form.resetFields();
      }
    } catch (error) {
      console.error('Error saving observation:', error);
      message.error('មានបញ្ហាក្នុងការរក្សាទុក');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card title="បន្ថែមការសង្កេត (មុខងារក្រៅបណ្តាញ)">
      {!isOnline && (
        <Alert
          message="របៀបក្រៅបណ្តាញ"
          description="ការសង្កេតរបស់អ្នកនឹងត្រូវបានរក្សាទុក និងធ្វើសមកាលកម្មនៅពេលមានអ៊ីនធឺណិត"
          type="info"
          showIcon
          className="mb-4"
        />
      )}
      
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSave}
      >
        <Form.Item
          name="observationType"
          label="ប្រភេទការសង្កេត"
          rules={[{ required: true, message: 'សូមជ្រើសរើសប្រភេទ' }]}
        >
          <Select placeholder="ជ្រើសរើសប្រភេទការសង្កេត">
            <Option value="teaching_method">វិធីសាស្ត្របង្រៀន</Option>
            <Option value="student_engagement">ការចូលរួមរបស់សិស្ស</Option>
            <Option value="classroom_management">ការគ្រប់គ្រងថ្នាក់រៀន</Option>
            <Option value="time_management">ការគ្រប់គ្រងពេលវេលា</Option>
          </Select>
        </Form.Item>

        <Form.Item
          name="observationKm"
          label="ការសង្កេត"
          rules={[{ required: true, message: 'សូមបញ្ចូលការសង្កេត' }]}
        >
          <TextArea 
            rows={3} 
            placeholder="បរិយាយអ្វីដែលអ្នកសង្កេតឃើញ..." 
          />
        </Form.Item>

        <Form.Item
          name="evidence"
          label="ភស្តុតាង"
        >
          <TextArea 
            rows={2} 
            placeholder="ឧទាហរណ៍ជាក់ស្តែង..." 
          />
        </Form.Item>

        <Form.Item>
          <Button 
            type="primary" 
            htmlType="submit" 
            icon={<SaveOutlined />}
            loading={saving}
          >
            រក្សាទុកការសង្កេត {!isOnline && '(ក្រៅបណ្តាញ)'}
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
}