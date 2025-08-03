'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Descriptions, Tag, Button, Space, message, Tabs, Table, Typography, Spin } from 'antd';
import { ArrowLeftOutlined, EditOutlined, PrinterOutlined, DownloadOutlined } from '@ant-design/icons';
import { useSession } from '@/hooks/useSession';
import dayjs from '@/lib/dayjs-config';
import { formatDateForDisplay, formatDateTimeForDisplay } from '@/lib/date-utils';

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
    notes?: string;
    aiContextComment?: string;
    field: {
      fieldId: number;
      indicatorSequence: number;
      indicatorMain: string;
      indicatorMainEn: string;
      indicatorSub: string;
      indicatorSubEn: string;
      evaluationLevel: number;
      aiContext?: string;
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

interface ObservationDetailClientProps {
  initialData?: ObservationDetail;
}

export default function ObservationDetailClient({ initialData }: ObservationDetailClientProps) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [observation, setObservation] = useState<ObservationDetail | null>(initialData || null);
  const [loading, setLoading] = useState(!initialData);

  useEffect(() => {
    // If we have initial data, we're done
    if (initialData) {
      setObservation(initialData);
      setLoading(false);
    }
  }, [initialData]);

  // Remove fetchObservation as we're using server-side data

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
                },
                {
                  title: 'AI Context & Comments',
                  dataIndex: 'notes',
                  key: 'notes',
                  render: (notes: string, record: any) => {
                    // Use notes field, fallback to aiContextComment for backward compatibility
                    const comment = notes || record.aiContextComment;
                    return (
                      <div>
                        {comment && (
                          <div>
                            <Text strong style={{ fontSize: '12px' }}>Comment:</Text>
                            <br />
                            <Text style={{ fontSize: '12px' }}>{comment}</Text>
                          </div>
                        )}
                        {record.field.aiContext && (
                          <div style={{ marginTop: comment ? 8 : 0 }}>
                            <Text type="secondary" style={{ fontSize: '11px' }}>
                              Original context: {record.field.aiContext}
                            </Text>
                          </div>
                        )}
                      </div>
                    );
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
      assessment.scores.map(s => [`${s.studentId}_${s.subjectId}`, Number(s.score)])
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
          return score !== undefined ? `${score}` : '-';
        }
      })),
      {
        title: 'Average',
        key: 'average',
        fixed: 'right' as const,
        align: 'center' as const,
        render: (_: any, record: any) => {
          const scores: number[] = [];
          assessment.subjects.forEach(subject => {
            const score = scoreMap.get(`${record.studentId}_${subject.subjectId}`);
            if (score !== undefined && score !== null) {
              scores.push(Number(score));
            }
          });
          
          if (scores.length === 0) return '-';
          
          // Calculate average
          const sum = scores.reduce((acc, score) => acc + score, 0);
          const avg = sum / scores.length;
          
          // Scores are already out of 100, so avg is the percentage
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
          onClick={() => router.push(`/dashboard/observations/${observation.id}/edit`)}
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
              {/* Row 1 - Basic Info */}
              <Descriptions.Item label="Inspection Date" span={1}>
                {formatDateForDisplay(observation.inspectionDate)}
              </Descriptions.Item>
              <Descriptions.Item label="Status" span={1}>
                <Tag>{observation.inspectionStatus}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Level" span={1}>
                <Tag color={observation.level === 1 ? 'green' : observation.level === 2 ? 'blue' : 'orange'}>
                  Level {observation.level}
                </Tag>
              </Descriptions.Item>
              
              {/* Row 2 - Location */}
              <Descriptions.Item label="Province" span={1}>{observation.province}</Descriptions.Item>
              <Descriptions.Item label="District" span={1}>{observation.district}</Descriptions.Item>
              <Descriptions.Item label="Commune" span={1}>{observation.commune}</Descriptions.Item>
              
              {/* Row 3 - Optional Location */}
              <Descriptions.Item label="Village" span={1}>{observation.village || '-'}</Descriptions.Item>
              <Descriptions.Item label="Cluster" span={1}>{observation.cluster || '-'}</Descriptions.Item>
              <Descriptions.Item label="School" span={1}>{observation.school}</Descriptions.Item>
              
              {/* Row 4 - Teacher Info */}
              <Descriptions.Item label="Teacher Name" span={1}>{observation.nameOfTeacher}</Descriptions.Item>
              <Descriptions.Item label="Gender" span={1}>{observation.sex === 'M' ? 'Male' : 'Female'}</Descriptions.Item>
              <Descriptions.Item label="Employment Type" span={1}>
                {observation.employmentType === 'official' ? 'Official' : 'Contract'}
              </Descriptions.Item>
              
              {/* Row 5 - Session Info */}
              <Descriptions.Item label="Subject" span={1}>{observation.subject}</Descriptions.Item>
              <Descriptions.Item label="Grade" span={1}>Grade {observation.grade}</Descriptions.Item>
              <Descriptions.Item label="Session Time" span={1}>{observation.sessionTime}</Descriptions.Item>
              
              {/* Row 6 - Optional Session Details */}
              <Descriptions.Item label="Chapter" span={1}>{observation.chapter || '-'}</Descriptions.Item>
              <Descriptions.Item label="Lesson" span={1}>{observation.lesson || '-'}</Descriptions.Item>
              <Descriptions.Item label="Title" span={1}>{observation.title || '-'}</Descriptions.Item>
              
              {/* Row 7 - Attendance */}
              <Descriptions.Item label="Total Students" span={1}>{totalStudents}</Descriptions.Item>
              <Descriptions.Item label="Present" span={1}>{totalPresent}</Descriptions.Item>
              <Descriptions.Item label="Attendance Rate" span={1}>
                <Text className={parseFloat(attendanceRate) >= 80 ? 'text-green-600' : 'text-red-600'}>
                  {attendanceRate}%
                </Text>
              </Descriptions.Item>
              
              {/* Row 8 - Gender Breakdown */}
              <Descriptions.Item label="Male Students" span={1}>{observation.totalMale}</Descriptions.Item>
              <Descriptions.Item label="Female Students" span={1}>{observation.totalFemale}</Descriptions.Item>
              <Descriptions.Item label="Total Absent" span={1}>
                {observation.totalAbsent} ({observation.totalAbsentFemale} Female)
              </Descriptions.Item>
              
              {/* Row 9 - Inspector Info */}
              <Descriptions.Item label="Inspector" span={1}>{observation.inspectorName || '-'}</Descriptions.Item>
              <Descriptions.Item label="Position" span={1}>{observation.inspectorPosition || '-'}</Descriptions.Item>
              <Descriptions.Item label="Organization" span={1}>{observation.inspectorOrganization || '-'}</Descriptions.Item>
              
              {/* Row 10 - Metadata */}
              <Descriptions.Item label="Created By" span={1}>{observation.user?.name || observation.createdBy}</Descriptions.Item>
              <Descriptions.Item label="Created At" span={2}>
                {formatDateTimeForDisplay(observation.createdAt)}
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