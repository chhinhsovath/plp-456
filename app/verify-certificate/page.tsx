'use client';

import { useState, useEffect } from 'react';
import { Card, Form, Input, Button, Result, Spin, Typography, Descriptions, Tag } from 'antd';
import { SafetyCertificateOutlined, CheckCircleOutlined, CloseCircleOutlined, SearchOutlined } from '@ant-design/icons';
import { useSearchParams } from 'next/navigation';

const { Title, Text } = Typography;

interface VerificationResult {
  certificate: {
    id: string;
    certificateNo: string;
    issuedDate: string;
    expiryDate?: string;
    isRevoked: boolean;
    revokedReason?: string;
    user: {
      name: string;
      email: string;
    };
    template: {
      name: string;
      nameKh: string;
      type: string;
    };
  };
  isValid: boolean;
}

export default function VerifyCertificatePage() {
  const searchParams = useSearchParams();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get('code');
    if (code) {
      form.setFieldsValue({ verificationCode: code });
      handleVerify({ verificationCode: code });
    }
  }, [searchParams]);

  const handleVerify = async (values: { verificationCode: string }) => {
    try {
      setLoading(true);
      setError(null);
      setResult(null);

      const response = await fetch(`/api/mentoring/certificates?verify=${values.verificationCode}`);
      
      if (response.ok) {
        const data = await response.json();
        setResult(data);
      } else if (response.status === 404) {
        setError('វិញ្ញាបនបត្រមិនត្រូវបានរកឃើញទេ');
      } else {
        setError('មានបញ្ហាក្នុងការផ្ទៀងផ្ទាត់');
      }
    } catch (error) {
      console.error('Verification error:', error);
      setError('មានបញ្ហាក្នុងការផ្ទៀងផ្ទាត់');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <Card className="mb-8">
          <div className="text-center mb-6">
            <SafetyCertificateOutlined style={{ fontSize: 48, color: '#1890ff' }} />
            <Title level={2} className="mt-4">ផ្ទៀងផ្ទាត់វិញ្ញាបនបត្រ</Title>
            <Text type="secondary">
              បញ្ចូលលេខកូដផ្ទៀងផ្ទាត់ដើម្បីពិនិត្យភាពត្រឹមត្រូវនៃវិញ្ញាបនបត្រ
            </Text>
          </div>

          <Form
            form={form}
            layout="vertical"
            onFinish={handleVerify}
          >
            <Form.Item
              name="verificationCode"
              label="លេខកូដផ្ទៀងផ្ទាត់"
              rules={[{ required: true, message: 'សូមបញ្ចូលលេខកូដផ្ទៀងផ្ទាត់' }]}
            >
              <Input
                size="large"
                placeholder="ឧទាហរណ៍: A1B2C3D4E5F6G7H8"
                prefix={<SearchOutlined />}
              />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                size="large"
                block
                icon={<SearchOutlined />}
              >
                ផ្ទៀងផ្ទាត់
              </Button>
            </Form.Item>
          </Form>
        </Card>

        {loading && (
          <Card>
            <div className="text-center py-8">
              <Spin size="large" />
              <p className="mt-4">កំពុងផ្ទៀងផ្ទាត់...</p>
            </div>
          </Card>
        )}

        {error && (
          <Result
            status="error"
            title="ការផ្ទៀងផ្ទាត់បរាជ័យ"
            subTitle={error}
            icon={<CloseCircleOutlined style={{ color: '#ff4d4f' }} />}
          />
        )}

        {result && (
          <Card>
            <Result
              status={result.isValid ? 'success' : 'warning'}
              title={result.isValid ? 'វិញ្ញាបនបត្រត្រឹមត្រូវ' : 'វិញ្ញាបនបត្រមិនមានសុពលភាព'}
              icon={
                result.isValid ? 
                  <CheckCircleOutlined style={{ color: '#52c41a' }} /> :
                  <CloseCircleOutlined style={{ color: '#faad14' }} />
              }
            />
            
            <Descriptions
              title="ព័ត៌មានវិញ្ញាបនបត្រ"
              bordered
              column={1}
              className="mt-6"
            >
              <Descriptions.Item label="ប្រភេទវិញ្ញាបនបត្រ">
                <strong>{result.certificate.template.nameKh}</strong>
                <br />
                <Text type="secondary">{result.certificate.template.name}</Text>
              </Descriptions.Item>
              <Descriptions.Item label="លេខវិញ្ញាបនបត្រ">
                {result.certificate.certificateNo}
              </Descriptions.Item>
              <Descriptions.Item label="បានផ្តល់ជូន">
                {result.certificate.user.name}
              </Descriptions.Item>
              <Descriptions.Item label="កាលបរិច្ឆេទចេញ">
                {new Date(result.certificate.issuedDate).toLocaleDateString('km-KH')}
              </Descriptions.Item>
              {result.certificate.expiryDate && (
                <Descriptions.Item label="កាលបរិច្ឆេទផុតកំណត់">
                  {new Date(result.certificate.expiryDate).toLocaleDateString('km-KH')}
                </Descriptions.Item>
              )}
              <Descriptions.Item label="ស្ថានភាព">
                {result.certificate.isRevoked ? (
                  <Tag color="error">បានដកហូត</Tag>
                ) : result.isValid ? (
                  <Tag color="success">មានសុពលភាព</Tag>
                ) : (
                  <Tag color="warning">ផុតកំណត់</Tag>
                )}
              </Descriptions.Item>
              {result.certificate.isRevoked && result.certificate.revokedReason && (
                <Descriptions.Item label="មូលហេតុដកហូត">
                  {result.certificate.revokedReason}
                </Descriptions.Item>
              )}
            </Descriptions>

            <div className="mt-6 text-center">
              <Text type="secondary">
                វិញ្ញាបនបត្រនេះត្រូវបានចេញដោយប្រព័ន្ធណែនាំគ្រូបង្រៀន PLP
              </Text>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}