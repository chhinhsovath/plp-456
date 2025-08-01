'use client';

import { Card, Row, Col, Statistic, Progress, Typography, Table, Tag } from 'antd';
import {
  UserOutlined,
  FormOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

export default function DashboardPage() {
  // Mock data for now - will be replaced with real API calls
  const stats = {
    totalTeachers: 156,
    totalEvaluations: 432,
    pendingEvaluations: 12,
    completedThisMonth: 45,
  };

  const recentEvaluations = [
    {
      key: '1',
      teacherName: 'សុខ សុភា',
      school: 'សាលាបឋមសិក្សា ភូមិថ្មី',
      date: '2024-01-20',
      evaluator: 'ចាន់ សុខា',
      status: 'completed',
    },
    {
      key: '2',
      teacherName: 'លី សំអាត',
      school: 'សាលាបឋមសិក្សា អូរអំបិល',
      date: '2024-01-19',
      evaluator: 'ហេង ប៊ុនថា',
      status: 'pending',
    },
  ];

  const columns = [
    {
      title: 'Teacher',
      dataIndex: 'teacherName',
      key: 'teacherName',
    },
    {
      title: 'School',
      dataIndex: 'school',
      key: 'school',
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (date: string) => dayjs(date).format('DD/MM/YYYY'),
    },
    {
      title: 'Evaluator',
      dataIndex: 'evaluator',
      key: 'evaluator',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'completed' ? 'green' : 'orange'}>
          {status === 'completed' ? 'Completed' : 'Pending'}
        </Tag>
      ),
    },
  ];

  return (
    <div>
      <Title level={2}>Dashboard</Title>
      <Text type="secondary">Welcome to Teacher Observation Tool</Text>

      <Row gutter={[16, 16]} className="mt-6">
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Teachers"
              value={stats.totalTeachers}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Evaluations"
              value={stats.totalEvaluations}
              prefix={<FormOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Pending Evaluations"
              value={stats.pendingEvaluations}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Completed This Month"
              value={stats.completedThisMonth}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} className="mt-6">
        <Col xs={24} lg={16}>
          <Card title="Recent Evaluations">
            <Table
              columns={columns}
              dataSource={recentEvaluations}
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="Evaluation Progress">
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-1">
                  <Text>Battambang</Text>
                  <Text>75%</Text>
                </div>
                <Progress percent={75} showInfo={false} />
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <Text>Siem Reap</Text>
                  <Text>60%</Text>
                </div>
                <Progress percent={60} showInfo={false} />
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <Text>Kampong Cham</Text>
                  <Text>85%</Text>
                </div>
                <Progress percent={85} showInfo={false} />
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <Text>Phnom Penh</Text>
                  <Text>90%</Text>
                </div>
                <Progress percent={90} showInfo={false} />
              </div>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
}