'use client';

import { Card, Typography, Alert } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

export default function OverviewDashboard() {
  return (
    <div className="min-h-screen w-full bg-gray-50">
      <div className="w-full p-6 lg:p-8">
      <div className="mb-8">
        <Title level={2}>ទិដ្ឋភាពទូទៅ</Title>
        <Text type="secondary">ស្វាគមន៍មកកាន់ប្រព័ន្ធគ្រប់គ្រងការអប់រំ</Text>
      </div>

      <Alert
        message="ព័ត៌មានសំខាន់"
        description="សូមទាក់ទងអ្នកគ្រប់គ្រងប្រព័ន្ធ ប្រសិនបើអ្នកមិនអាចមើលឃើញផ្ទាំងគ្រប់គ្រងរបស់អ្នក"
        type="info"
        showIcon
        icon={<InfoCircleOutlined />}
        className="mb-6"
      />

      <Card className="shadow-sm">
        <div className="text-center py-8">
          <Title level={3}>កំពុងផ្ទុកព័ត៌មានរបស់អ្នក...</Title>
          <Text type="secondary">
            ផ្ទាំងគ្រប់គ្រងនឹងបង្ហាញនៅទីនេះ បន្ទាប់ពីប្រព័ន្ធកំណត់តួនាទីរបស់អ្នក
          </Text>
        </div>
      </Card>
      </div>

    </div>
  );
}