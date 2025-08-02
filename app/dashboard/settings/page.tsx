'use client';

import { useState } from 'react';
import { 
  Card, 
  Tabs, 
  Form, 
  Input, 
  Button, 
  Switch, 
  Select, 
  Upload, 
  Avatar, 
  Typography, 
  Row, 
  Col, 
  Divider,
  Space,
  TimePicker,
  Radio,
} from 'antd';
import { 
  UserOutlined, 
  BellOutlined, 
  SecurityScanOutlined, 
  GlobalOutlined,
  UploadOutlined,
  SaveOutlined,
  MailOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
  BgColorsOutlined,
} from '@ant-design/icons';
import type { UploadProps } from 'antd';
import dayjs from 'dayjs';
import { useRouter } from 'next/navigation';
import { useContext } from 'react';
import { ThemeContext } from '@/contexts/ThemeContext';
import { useMessage } from '@/hooks/useAntdApp';

const { Title, Text } = Typography;
const { TextArea } = Input;

export default function SettingsPage() {
  const message = useMessage();
  const [form] = Form.useForm();
  const [notificationForm] = Form.useForm();
  const [securityForm] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const router = useRouter();
  const themeContext = useContext(ThemeContext);
  const [themeSwitcherOpen, setThemeSwitcherOpen] = useState(false);

  // Profile form submit
  const handleProfileSubmit = async (values: any) => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      message.success('បានរក្សាទុកព័ត៌មានផ្ទាល់ខ្លួនដោយជោគជ័យ');
    } catch (error) {
      message.error('មានបញ្ហាក្នុងការរក្សាទុក');
    } finally {
      setLoading(false);
    }
  };

  // Notification settings submit
  const handleNotificationSubmit = async (values: any) => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      message.success('បានរក្សាទុកការកំណត់ការជូនដំណឹងដោយជោគជ័យ');
    } catch (error) {
      message.error('មានបញ្ហាក្នុងការរក្សាទុក');
    } finally {
      setLoading(false);
    }
  };

  // Security settings submit
  const handleSecuritySubmit = async (values: any) => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      message.success('បានរក្សាទុកការកំណត់សុវត្ថិភាពដោយជោគជ័យ');
    } catch (error) {
      message.error('មានបញ្ហាក្នុងការរក្សាទុក');
    } finally {
      setLoading(false);
    }
  };

  const uploadProps: UploadProps = {
    name: 'avatar',
    action: '/api/upload/avatar',
    showUploadList: false,
    beforeUpload: (file) => {
      const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
      if (!isJpgOrPng) {
        message.error('អ្នកអាចបញ្ចូលតែឯកសារ JPG/PNG ប៉ុណ្ណោះ!');
      }
      const isLt2M = file.size / 1024 / 1024 < 2;
      if (!isLt2M) {
        message.error('រូបភាពត្រូវតែតូចជាង 2MB!');
      }
      return isJpgOrPng && isLt2M;
    },
    onChange: (info) => {
      if (info.file.status === 'done') {
        message.success('បានបញ្ចូលរូបភាពដោយជោគជ័យ');
      }
    },
  };

  const tabItems = [
    {
      key: 'profile',
      label: (
        <Space>
          <UserOutlined />
          ព័ត៌មានផ្ទាល់ខ្លួន
        </Space>
      ),
      children: (
        <Card variant="borderless">
          <Form
            form={form}
            layout="vertical"
            onFinish={handleProfileSubmit}
            initialValues={{
              name: 'Admin User',
              email: 'admin@example.com',
              phone: '012 345 678',
              role: 'administrator',
              location: 'ភ្នំពេញ',
              bio: '',
              language: 'km',
            }}
          >
            <Row gutter={24}>
              <Col span={24} className="text-center mb-6">
                <Upload {...uploadProps}>
                  <Avatar size={100} icon={<UserOutlined />} className="cursor-pointer mb-2" />
                  <div>
                    <Button icon={<UploadOutlined />}>ប្តូររូបភាព</Button>
                  </div>
                </Upload>
              </Col>
              
              <Col xs={24} md={12}>
                <Form.Item
                  label="ឈ្មោះពេញ"
                  name="name"
                  rules={[{ required: true, message: 'សូមបញ្ចូលឈ្មោះ' }]}
                >
                  <Input prefix={<UserOutlined />} size="large" />
                </Form.Item>
              </Col>
              
              <Col xs={24} md={12}>
                <Form.Item
                  label="អុីមែល"
                  name="email"
                  rules={[
                    { required: true, message: 'សូមបញ្ចូលអុីមែល' },
                    { type: 'email', message: 'អុីមែលមិនត្រឹមត្រូវ' }
                  ]}
                >
                  <Input prefix={<MailOutlined />} size="large" />
                </Form.Item>
              </Col>
              
              <Col xs={24} md={12}>
                <Form.Item
                  label="លេខទូរស័ព្ទ"
                  name="phone"
                  rules={[{ required: true, message: 'សូមបញ្ចូលលេខទូរស័ព្ទ' }]}
                >
                  <Input prefix={<PhoneOutlined />} size="large" />
                </Form.Item>
              </Col>
              
              <Col xs={24} md={12}>
                <Form.Item label="តួនាទី" name="role">
                  <Select size="large" disabled>
                    <Select.Option value="administrator">អ្នកគ្រប់គ្រង</Select.Option>
                    <Select.Option value="mentor">អ្នកណែនាំ</Select.Option>
                    <Select.Option value="teacher">គ្រូបង្រៀន</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
              
              <Col xs={24} md={12}>
                <Form.Item label="ទីតាំង" name="location">
                  <Input prefix={<EnvironmentOutlined />} size="large" />
                </Form.Item>
              </Col>
              
              <Col xs={24} md={12}>
                <Form.Item label="ភាសា" name="language">
                  <Select size="large">
                    <Select.Option value="km">ភាសាខ្មែរ</Select.Option>
                    <Select.Option value="en">English</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
              
              <Col span={24}>
                <Form.Item label="ប្រវត្តិរូបសង្ខេប" name="bio">
                  <TextArea rows={4} placeholder="សរសេរអំពីខ្លួនអ្នក..." />
                </Form.Item>
              </Col>
              
              <Col span={24}>
                <Form.Item>
                  <Button 
                    type="primary" 
                    htmlType="submit" 
                    loading={loading}
                    icon={<SaveOutlined />}
                    size="large"
                  >
                    រក្សាទុកការផ្លាស់ប្តូរ
                  </Button>
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </Card>
      ),
    },
    {
      key: 'notifications',
      label: (
        <Space>
          <BellOutlined />
          ការជូនដំណឹង
        </Space>
      ),
      children: (
        <Card variant="borderless">
          <Form
            form={notificationForm}
            layout="vertical"
            onFinish={handleNotificationSubmit}
            initialValues={{
              emailNotifications: true,
              pushNotifications: true,
              smsNotifications: false,
              notificationTime: dayjs('09:00', 'HH:mm'),
              frequency: 'daily',
            }}
          >
            <Title level={5} className="mb-4">ប្រភេទការជូនដំណឹង</Title>
            
            <Row gutter={[24, 24]}>
              <Col span={24}>
                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                  <div>
                    <Text strong>ការជូនដំណឹងតាមអុីមែល</Text>
                    <div>
                      <Text type="secondary">ទទួលបានការជូនដំណឹងតាមអុីមែល</Text>
                    </div>
                  </div>
                  <Form.Item name="emailNotifications" valuePropName="checked" className="mb-0">
                    <Switch />
                  </Form.Item>
                </div>
              </Col>
              
              <Col span={24}>
                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                  <div>
                    <Text strong>ការជូនដំណឹងរុញ</Text>
                    <div>
                      <Text type="secondary">ទទួលបានការជូនដំណឹងរុញនៅលើឧបករណ៍របស់អ្នក</Text>
                    </div>
                  </div>
                  <Form.Item name="pushNotifications" valuePropName="checked" className="mb-0">
                    <Switch />
                  </Form.Item>
                </div>
              </Col>
              
              <Col span={24}>
                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                  <div>
                    <Text strong>ការជូនដំណឹងតាម SMS</Text>
                    <div>
                      <Text type="secondary">ទទួលបានការជូនដំណឹងសំខាន់តាម SMS</Text>
                    </div>
                  </div>
                  <Form.Item name="smsNotifications" valuePropName="checked" className="mb-0">
                    <Switch />
                  </Form.Item>
                </div>
              </Col>
            </Row>
            
            <Divider />
            
            <Title level={5} className="mb-4">កាលវិភាគការជូនដំណឹង</Title>
            
            <Row gutter={24}>
              <Col xs={24} md={12}>
                <Form.Item label="ពេលវេលាជូនដំណឹងប្រចាំថ្ងៃ" name="notificationTime">
                  <TimePicker size="large" format="HH:mm" className="w-full" />
                </Form.Item>
              </Col>
              
              <Col xs={24} md={12}>
                <Form.Item label="ភាពញឹកញាប់" name="frequency">
                  <Select size="large">
                    <Select.Option value="realtime">ភ្លាមៗ</Select.Option>
                    <Select.Option value="daily">ប្រចាំថ្ងៃ</Select.Option>
                    <Select.Option value="weekly">ប្រចាំសប្តាហ៍</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
              
              <Col span={24}>
                <Form.Item>
                  <Button 
                    type="primary" 
                    htmlType="submit" 
                    loading={loading}
                    icon={<SaveOutlined />}
                    size="large"
                  >
                    រក្សាទុកការកំណត់
                  </Button>
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </Card>
      ),
    },
    {
      key: 'security',
      label: (
        <Space>
          <SecurityScanOutlined />
          សុវត្ថិភាព
        </Space>
      ),
      children: (
        <Card variant="borderless">
          <Form
            form={securityForm}
            layout="vertical"
            onFinish={handleSecuritySubmit}
            initialValues={{
              twoFactor: false,
              sessionTimeout: 30,
            }}
          >
            <Title level={5} className="mb-4">ប្តូរពាក្យសម្ងាត់</Title>
            
            <Row gutter={24}>
              <Col xs={24} md={8}>
                <Form.Item
                  label="ពាក្យសម្ងាត់បច្ចុប្បន្ន"
                  name="currentPassword"
                  rules={[{ required: true, message: 'សូមបញ្ចូលពាក្យសម្ងាត់បច្ចុប្បន្ន' }]}
                >
                  <Input.Password size="large" />
                </Form.Item>
              </Col>
              
              <Col xs={24} md={8}>
                <Form.Item
                  label="ពាក្យសម្ងាត់ថ្មី"
                  name="newPassword"
                  rules={[
                    { required: true, message: 'សូមបញ្ចូលពាក្យសម្ងាត់ថ្មី' },
                    { min: 8, message: 'ពាក្យសម្ងាត់ត្រូវមានយ៉ាងហោចណាស់ 8 តួអក្សរ' }
                  ]}
                >
                  <Input.Password size="large" />
                </Form.Item>
              </Col>
              
              <Col xs={24} md={8}>
                <Form.Item
                  label="បញ្ជាក់ពាក្យសម្ងាត់ថ្មី"
                  name="confirmPassword"
                  dependencies={['newPassword']}
                  rules={[
                    { required: true, message: 'សូមបញ្ជាក់ពាក្យសម្ងាត់ថ្មី' },
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        if (!value || getFieldValue('newPassword') === value) {
                          return Promise.resolve();
                        }
                        return Promise.reject(new Error('ពាក្យសម្ងាត់មិនដូចគ្នា'));
                      },
                    }),
                  ]}
                >
                  <Input.Password size="large" />
                </Form.Item>
              </Col>
            </Row>
            
            <Divider />
            
            <Title level={5} className="mb-4">ការកំណត់សុវត្ថិភាព</Title>
            
            <Row gutter={[24, 24]}>
              <Col span={24}>
                <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                  <div>
                    <Text strong>ការផ្ទៀងផ្ទាត់ពីរជំហាន</Text>
                    <div>
                      <Text type="secondary">បន្ថែមស្រទាប់សុវត្ថិភាពបន្ថែមទៅគណនីរបស់អ្នក</Text>
                    </div>
                  </div>
                  <Form.Item name="twoFactor" valuePropName="checked" className="mb-0">
                    <Switch />
                  </Form.Item>
                </div>
              </Col>
              
              <Col xs={24} md={12}>
                <Form.Item label="រយៈពេលផុតកំណត់សម័យ (នាទី)" name="sessionTimeout">
                  <Select size="large">
                    <Select.Option value={15}>15 នាទី</Select.Option>
                    <Select.Option value={30}>30 នាទី</Select.Option>
                    <Select.Option value={60}>1 ម៉ោង</Select.Option>
                    <Select.Option value={120}>2 ម៉ោង</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
              
              <Col span={24}>
                <Form.Item>
                  <Button 
                    type="primary" 
                    htmlType="submit" 
                    loading={loading}
                    icon={<SaveOutlined />}
                    size="large"
                  >
                    រក្សាទុកការកំណត់សុវត្ថិភាព
                  </Button>
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </Card>
      ),
    },
    {
      key: 'appearance',
      label: (
        <Space>
          <BgColorsOutlined />
          រូបរាង
        </Space>
      ),
      children: (
        <Card variant="borderless">
          <Title level={5} className="mb-4">ទម្រង់បង្ហាញ</Title>
          <Row gutter={24}>
            <Col span={24}>
              <div className="p-6 bg-gray-50 rounded-lg text-center">
                <Text className="block mb-4">ប្តូរទម្រង់បង្ហាញនិងពណ៌របស់ប្រព័ន្ធ</Text>
                <Button
                  type="primary"
                  size="large"
                  icon={<BgColorsOutlined />}
                  onClick={() => {
                    // Find and click the theme switcher button in the header
                    const themeSwitcherBtn = document.querySelector('[aria-label="ប្តូរទម្រង់បង្ហាញ"]') as HTMLElement;
                    if (themeSwitcherBtn) {
                      themeSwitcherBtn.click();
                    }
                  }}
                >
                  បើកការកំណត់ទម្រង់បង្ហាញ
                </Button>
              </div>
            </Col>
          </Row>
          
          <Divider />
          
          <Title level={5} className="mb-4">ទម្រង់បង្ហាញបច្ចុប្បន្ន</Title>
          <Row gutter={24}>
            <Col span={24}>
              <div className="p-4 bg-gray-50 rounded-lg">
                <Space direction="vertical" className="w-full">
                  <div className="flex justify-between">
                    <Text>ទម្រង់:</Text>
                    <Text strong>{themeContext?.currentTheme?.name || 'Default'}</Text>
                  </div>
                  <div className="flex justify-between">
                    <Text>ពណ៌ចម្បង:</Text>
                    <Space>
                      <div 
                        style={{ 
                          width: 20, 
                          height: 20, 
                          backgroundColor: themeContext?.customPrimaryColor || '#1677FF',
                          borderRadius: 4,
                          border: '1px solid #d9d9d9'
                        }} 
                      />
                      <Text strong>{themeContext?.customPrimaryColor || '#1677FF'}</Text>
                    </Space>
                  </div>
                  <div className="flex justify-between">
                    <Text>កាច់ជ្រុង:</Text>
                    <Text strong>{themeContext?.borderRadius || 6}px</Text>
                  </div>
                  <div className="flex justify-between">
                    <Text>ទំហំ:</Text>
                    <Text strong>{themeContext?.isCompact ? 'តូច' : 'ធម្មតា'}</Text>
                  </div>
                </Space>
              </div>
            </Col>
          </Row>
        </Card>
      ),
    },
  ];

  return (
    <div className="min-h-screen w-full bg-gray-50">
      <div className="w-full p-6 lg:p-8">
      <div className="mb-6">
        <Title level={2}>ការកំណត់</Title>
        <Text type="secondary">គ្រប់គ្រងការកំណត់គណនី និងចំណូលចិត្តរបស់អ្នក</Text>
      </div>
      
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
        className="settings-tabs"
      />
      </div>

    </div>
  );
}