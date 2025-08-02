'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Descriptions, Tag, Button, Space, message, Tabs, Table, Typography, Spin } from 'antd';
import { ArrowLeftOutlined, EditOutlined, PrinterOutlined, DownloadOutlined } from '@ant-design/icons';
import { useSession } from '@/hooks/useSession';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

interface ObservationDetail {
  id: string;
  province: string;
  district: string;
  commune: string;
  village?: string;
  cluster?: string;
  school: string;
  nameOfTeacher: string;
  sex: string;
  employmentType: string;
  sessionTime: string;
  subject: string;
  chapter?: string;
  lesson?: string;
  title?: string;
  subTitle?: string;
  inspectionDate: string;
  startTime?: string;
  endTime?: string;
  grade: number;
  totalMale: number;
  totalFemale: number;
  totalAbsent: number;
  totalAbsentFemale: number;
  level: number;
  inspectorName?: string;
  inspectorPosition?: string;
  inspectorOrganization?: string;
  academicYear?: string;
  semester?: number;
  lessonDurationMinutes?: number;
  inspectionStatus: string;
  generalNotes?: string;
  createdAt: string;
  createdBy: string;
  user?: {
    name: string;
    email: string;
    role: string;
  };
  evaluationRecords: Array<{
    id: string;
    scoreValue: string;
    field: {
      fieldId: number;
      indicatorSequence: number;
      indicatorMain: string;
      indicatorMainEn: string;
      indicatorSub: string;
      indicatorSubEn: string;
      evaluationLevel: number;
    };
  }>;
  studentAssessmentSessions: Array<{
    assessmentId: string;
    subjects: Array<{
      subjectId: string;
      subjectNameKm: string;
      subjectNameEn: string;
      subjectOrder: number;
    }>;
    students: Array<{
      studentId: string;
      studentIdentifier: string;
      studentName?: string;
      studentGender?: string;
      studentOrder: number;
    }>;
    scores: Array<{
      scoreId: string;
      subjectId: string;
      studentId: string;
      score: number;
    }>;
  }>;
}

export default function ObservationDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [observation, setObservation] = useState<ObservationDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'loading') return;
    
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    fetchObservation();
  }, [session, status, params.id]);

  const fetchObservation = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/observations/${params.id}`, { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch observation');

      const data = await response.json();
      setObservation(data);
    } catch (error) {
      console.error('Error fetching observation:', error);
      message.error('Failed to load observation details');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleExport = async () => {
    // TODO: Implement export functionality
    message.info('Export functionality coming soon');
  };

  if (status === 'loading' || loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spin size="large" />
      </div>
    );
  }

  if (!observation) {
    return <div>Observation not found</div>;
  }

  const totalStudents = observation.totalMale + observation.totalFemale;
  const totalPresent = totalStudents - observation.totalAbsent;
  const attendanceRate = totalStudents > 0 ? ((totalPresent / totalStudents) * 100).toFixed(2) : '0';

  const renderEvaluationResults = () => {
    const groupedEvaluations: { [key: string]: typeof observation.evaluationRecords } = {};
    
    observation.evaluationRecords.forEach(record => {
      const key = record.field.indicatorMain;
      if (!groupedEvaluations[key]) {
        groupedEvaluations[key] = [];
      }
      groupedEvaluations[key].push(record);
    });

    return (
      <div>
        {Object.entries(groupedEvaluations).map(([category, records]) => (
          <Card key={category} className="mb-4" size="small">
            <Title level={5}>{category}</Title>
            <Table
              dataSource={records}
              rowKey="id"
              pagination={false}
              columns={[
                {
                  title: 'Indicator',
                  dataIndex: ['field', 'indicatorSub'],
                  key: 'indicator',
                  render: (text: string, record: any) => (
                    <div>
                      <Text>{record.field.indicatorSequence}. {text}</Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        {record.field.indicatorSubEn}
                      </Text>
                    </div>
                  )
                },
                {
                  title: 'Level',
                  dataIndex: ['field', 'evaluationLevel'],
                  key: 'level',
                  width: 80,
                  align: 'center',
                  render: (level: number) => (
                    <Tag color={level === 1 ? 'green' : level === 2 ? 'blue' : 'orange'}>
                      Level {level}
                    </Tag>
                  )
                },
                {
                  title: 'Score',
                  dataIndex: 'scoreValue',
                  key: 'score',
                  width: 150,
                  render: (score: string) => {
                    const color = score === 'yes' ? 'green' : score === 'no' ? 'red' : 'orange';
                    const text = score === 'yes' ? 'Yes / បាទ/ចាស' : 
                                score === 'no' ? 'No / ទេ' : 
                                'Some Practice / អនុវត្តខ្លះ';
                    return <Tag color={color}>{text}</Tag>;
                  }
                }
              ]}
            />
          </Card>
        ))}
      </div>
    );
  };

  const renderStudentAssessment = () => {
    if (!observation.studentAssessmentSessions.length) {
      return <div>No student assessment data available</div>;
    }

    const assessment = observation.studentAssessmentSessions[0];
    const scoreMap = new Map(
      assessment.scores.map(s => [`${s.studentId}_${s.subjectId}`, s.score])
    );

    const columns = [
      {
        title: 'Student',
        dataIndex: 'studentIdentifier',
        key: 'studentIdentifier',
        fixed: 'left' as const,
        render: (text: string, record: any) => (
          <div>
            <Text>{text}</Text>
            {record.studentName && <Text type="secondary"> ({record.studentName})</Text>}
          </div>
        )
      },
      ...assessment.subjects.map(subject => ({
        title: (
          <div style={{ textAlign: 'center' }}>
            <div>{subject.subjectNameKm}</div>
            <div style={{ fontSize: '12px', color: '#888' }}>{subject.subjectNameEn}</div>
          </div>
        ),
        dataIndex: subject.subjectId,
        key: subject.subjectId,
        align: 'center' as const,
        render: (_: any, record: any) => {
          const score = scoreMap.get(`${record.studentId}_${subject.subjectId}`);
          return score !== undefined ? score : '-';
        }
      })),
      {
        title: 'Average',
        key: 'average',
        fixed: 'right' as const,
        align: 'center' as const,
        render: (_: any, record: any) => {
          const scores = assessment.subjects
            .map(subject => scoreMap.get(`${record.studentId}_${subject.subjectId}`))
            .filter(score => score !== undefined) as number[];
          
          if (scores.length === 0) return '-';
          const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
          return (
            <Text strong className={avg >= 50 ? 'text-green-600' : 'text-red-600'}>
              {avg.toFixed(1)}%
            </Text>
          );
        }
      }
    ];

    return (
      <Table
        dataSource={assessment.students}
        columns={columns}
        rowKey="studentId"
        pagination={false}
        scroll={{ x: 800 }}
      />
    );
  };

  return (
    <div className="p-6">
      <Space className="mb-4">
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => router.push('/dashboard/observations')}
        >
          Back to List
        </Button>
        <Button
          icon={<EditOutlined />}
          onClick={() => router.push(`/dashboard/observations/${params.id}/edit`)}
        >
          Edit
        </Button>
        <Button icon={<PrinterOutlined />} onClick={handlePrint}>
          Print
        </Button>
        <Button icon={<DownloadOutlined />} onClick={handleExport}>
          Export
        </Button>
      </Space>

      <Card title="Observation Details">
        <Tabs defaultActiveKey="1">
          <TabPane tab="Basic Information" key="1">
            <Descriptions bordered column={{ xs: 1, sm: 2, md: 3 }}>
              <Descriptions.Item label="Inspection Date">
                {dayjs(observation.inspectionDate).format('YYYY-MM-DD')}
              </Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag>{observation.inspectionStatus}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Level">
                <Tag color={observation.level === 1 ? 'green' : observation.level === 2 ? 'blue' : 'orange'}>
                  Level {observation.level}
                </Tag>
              </Descriptions.Item>
              
              <Descriptions.Item label="Province">{observation.province}</Descriptions.Item>
              <Descriptions.Item label="District">{observation.district}</Descriptions.Item>
              <Descriptions.Item label="Commune">{observation.commune}</Descriptions.Item>
              {observation.village && <Descriptions.Item label="Village">{observation.village}</Descriptions.Item>}
              {observation.cluster && <Descriptions.Item label="Cluster">{observation.cluster}</Descriptions.Item>}
              <Descriptions.Item label="School" span={3}>{observation.school}</Descriptions.Item>
              
              <Descriptions.Item label="Teacher Name">{observation.nameOfTeacher}</Descriptions.Item>
              <Descriptions.Item label="Gender">{observation.sex === 'M' ? 'Male' : 'Female'}</Descriptions.Item>
              <Descriptions.Item label="Employment Type">
                {observation.employmentType === 'official' ? 'Official' : 'Contract'}
              </Descriptions.Item>
              
              <Descriptions.Item label="Subject">{observation.subject}</Descriptions.Item>
              <Descriptions.Item label="Grade">Grade {observation.grade}</Descriptions.Item>
              <Descriptions.Item label="Session Time">{observation.sessionTime}</Descriptions.Item>
              
              {observation.chapter && <Descriptions.Item label="Chapter">{observation.chapter}</Descriptions.Item>}
              {observation.lesson && <Descriptions.Item label="Lesson">{observation.lesson}</Descriptions.Item>}
              {observation.title && <Descriptions.Item label="Title" span={3}>{observation.title}</Descriptions.Item>}
              
              <Descriptions.Item label="Total Students">{totalStudents}</Descriptions.Item>
              <Descriptions.Item label="Present">{totalPresent}</Descriptions.Item>
              <Descriptions.Item label="Attendance Rate">
                <Text className={parseFloat(attendanceRate) >= 80 ? 'text-green-600' : 'text-red-600'}>
                  {attendanceRate}%
                </Text>
              </Descriptions.Item>
              
              <Descriptions.Item label="Male Students">{observation.totalMale}</Descriptions.Item>
              <Descriptions.Item label="Female Students">{observation.totalFemale}</Descriptions.Item>
              <Descriptions.Item label="Total Absent">
                {observation.totalAbsent} ({observation.totalAbsentFemale} Female)
              </Descriptions.Item>
              
              {observation.inspectorName && (
                <>
                  <Descriptions.Item label="Inspector">{observation.inspectorName}</Descriptions.Item>
                  <Descriptions.Item label="Position">{observation.inspectorPosition}</Descriptions.Item>
                  <Descriptions.Item label="Organization">{observation.inspectorOrganization}</Descriptions.Item>
                </>
              )}
              
              <Descriptions.Item label="Created By">{observation.user?.name || observation.createdBy}</Descriptions.Item>
              <Descriptions.Item label="Created At">
                {dayjs(observation.createdAt).format('YYYY-MM-DD HH:mm')}
              </Descriptions.Item>
            </Descriptions>
            
            {observation.generalNotes && (
              <div className="mt-4">
                <Title level={5}>General Notes</Title>
                <Card size="small">
                  <Text>{observation.generalNotes}</Text>
                </Card>
              </div>
            )}
          </TabPane>
          
          <TabPane tab="Teaching Evaluation" key="2">
            {renderEvaluationResults()}
          </TabPane>
          
          <TabPane tab="Student Assessment" key="3">
            {renderStudentAssessment()}
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
}