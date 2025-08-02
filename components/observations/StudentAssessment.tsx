'use client';

import { useState } from 'react';
import { Form, Card, Button, Input, Table, InputNumber, Space, Typography, message, Modal, Select } from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { FormInstance } from 'antd/lib/form';

const { Text } = Typography;
const { Option } = Select;

interface StudentAssessmentProps {
  form: FormInstance;
  sessionData?: any;
}

interface Subject {
  id: string;
  name_km: string;
  name_en: string;
  order: number;
  max_score: number;
}

interface Student {
  id: string;
  identifier: string;
  name?: string;
  gender?: string;
  order: number;
}

interface Score {
  studentId: string;
  subjectId: string;
  score: number | null;
}

export default function StudentAssessment({ form, sessionData }: StudentAssessmentProps) {
  const [subjects, setSubjects] = useState<Subject[]>([
    { id: '1', name_km: 'អំណាន', name_en: 'Reading', order: 1, max_score: 100 },
    { id: '2', name_km: 'សរសេរ', name_en: 'Writing', order: 2, max_score: 100 },
    { id: '3', name_km: 'គណិតវិទ្យា', name_en: 'Mathematics', order: 3, max_score: 100 }
  ]);

  const [students, setStudents] = useState<Student[]>([
    { id: '1', identifier: 'សិស្សទី១', name: '', gender: 'M', order: 1 },
    { id: '2', identifier: 'សិស្សទី២', name: '', gender: 'F', order: 2 },
    { id: '3', identifier: 'សិស្សទី៣', name: '', gender: 'M', order: 3 },
    { id: '4', identifier: 'សិស្សទី៤', name: '', gender: 'F', order: 4 },
    { id: '5', identifier: 'សិស្សទី៥', name: '', gender: 'M', order: 5 }
  ]);

  const [scores, setScores] = useState<{ [key: string]: number | null }>({});
  const [isSubjectModalVisible, setIsSubjectModalVisible] = useState(false);
  const [isStudentModalVisible, setIsStudentModalVisible] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  const handleScoreChange = (studentId: string, subjectId: string, value: number | null) => {
    const key = `${studentId}_${subjectId}`;
    setScores(prev => ({ ...prev, [key]: value }));
    
    // Update form values
    const formScores = { ...scores, [key]: value };
    const scoresMatrix: any = {};
    
    subjects.forEach(subject => {
      scoresMatrix[`subject_${subject.order}`] = {};
      students.forEach(student => {
        const scoreKey = `${student.id}_${subject.id}`;
        scoresMatrix[`subject_${subject.order}`][`student_${student.order}`] = formScores[scoreKey] || 0;
      });
    });
    
    form.setFieldValue('scores', scoresMatrix);
    form.setFieldValue('subjects', subjects);
    form.setFieldValue('students', students);
  };

  const addSubject = () => {
    setEditingSubject(null);
    setIsSubjectModalVisible(true);
  };

  const editSubject = (subject: Subject) => {
    setEditingSubject(subject);
    setIsSubjectModalVisible(true);
  };

  const deleteSubject = (subjectId: string) => {
    Modal.confirm({
      title: 'Delete Subject',
      content: 'Are you sure you want to delete this subject and all associated scores?',
      onOk: () => {
        setSubjects(prev => prev.filter(s => s.id !== subjectId));
        // Remove associated scores
        const newScores = { ...scores };
        Object.keys(newScores).forEach(key => {
          if (key.includes(`_${subjectId}`)) {
            delete newScores[key];
          }
        });
        setScores(newScores);
      }
    });
  };

  const addStudent = () => {
    setEditingStudent(null);
    setIsStudentModalVisible(true);
  };

  const editStudent = (student: Student) => {
    setEditingStudent(student);
    setIsStudentModalVisible(true);
  };

  const deleteStudent = (studentId: string) => {
    Modal.confirm({
      title: 'Delete Student',
      content: 'Are you sure you want to delete this student and all associated scores?',
      onOk: () => {
        setStudents(prev => prev.filter(s => s.id !== studentId));
        // Remove associated scores
        const newScores = { ...scores };
        Object.keys(newScores).forEach(key => {
          if (key.startsWith(`${studentId}_`)) {
            delete newScores[key];
          }
        });
        setScores(newScores);
      }
    });
  };

  const handleSubjectSubmit = (values: any) => {
    if (editingSubject) {
      setSubjects(prev => prev.map(s => 
        s.id === editingSubject.id 
          ? { ...s, ...values }
          : s
      ));
    } else {
      const newSubject: Subject = {
        id: Date.now().toString(),
        order: subjects.length + 1,
        ...values
      };
      setSubjects(prev => [...prev, newSubject]);
    }
    setIsSubjectModalVisible(false);
  };

  const handleStudentSubmit = (values: any) => {
    if (editingStudent) {
      setStudents(prev => prev.map(s => 
        s.id === editingStudent.id 
          ? { ...s, ...values }
          : s
      ));
    } else {
      const newStudent: Student = {
        id: Date.now().toString(),
        order: students.length + 1,
        ...values
      };
      setStudents(prev => [...prev, newStudent]);
    }
    setIsStudentModalVisible(false);
  };

  const calculateAverage = (studentId: string): number => {
    const studentScores = subjects.map(subject => {
      const key = `${studentId}_${subject.id}`;
      return scores[key] || 0;
    }).filter(score => score > 0);
    
    if (studentScores.length === 0) return 0;
    return Math.round(studentScores.reduce((a, b) => a + b, 0) / studentScores.length);
  };

  const calculateSubjectAverage = (subjectId: string): number => {
    const subjectScores = students.map(student => {
      const key = `${student.id}_${subjectId}`;
      return scores[key] || 0;
    }).filter(score => score > 0);
    
    if (subjectScores.length === 0) return 0;
    return Math.round(subjectScores.reduce((a, b) => a + b, 0) / subjectScores.length);
  };

  const columns = [
    {
      title: 'Student',
      dataIndex: 'identifier',
      key: 'identifier',
      fixed: 'left' as const,
      width: 150,
      render: (text: string, record: Student) => (
        <Space>
          <Text>{text}</Text>
          {record.name && <Text type="secondary">({record.name})</Text>}
          <Button 
            icon={<EditOutlined />} 
            size="small" 
            onClick={() => editStudent(record)}
          />
        </Space>
      )
    },
    ...subjects.map(subject => ({
      title: (
        <Space direction="vertical" align="center" size={0}>
          <Text>{subject.name_km}</Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>{subject.name_en}</Text>
          <Button 
            icon={<EditOutlined />} 
            size="small" 
            onClick={() => editSubject(subject)}
          />
        </Space>
      ),
      dataIndex: subject.id,
      key: subject.id,
      width: 120,
      render: (_: any, record: Student) => (
        <InputNumber
          min={0}
          max={subject.max_score}
          value={scores[`${record.id}_${subject.id}`] || null}
          onChange={(value) => handleScoreChange(record.id, subject.id, value)}
          style={{ width: '100%' }}
          placeholder="0"
        />
      )
    })),
    {
      title: 'Average',
      key: 'average',
      fixed: 'right' as const,
      width: 100,
      render: (_: any, record: Student) => {
        const avg = calculateAverage(record.id);
        return (
          <Text strong className={avg >= 50 ? 'text-green-600' : 'text-red-600'}>
            {avg}%
          </Text>
        );
      }
    },
    {
      title: 'Action',
      key: 'action',
      fixed: 'right' as const,
      width: 80,
      render: (_: any, record: Student) => (
        <Button 
          danger 
          icon={<DeleteOutlined />} 
          size="small"
          onClick={() => deleteStudent(record.id)}
        />
      )
    }
  ];

  const footerData = {
    id: 'footer',
    identifier: 'Class Average',
    ...subjects.reduce((acc, subject) => ({
      ...acc,
      [subject.id]: `${calculateSubjectAverage(subject.id)}%`
    }), {})
  };

  return (
    <Card title="Step 3: Student Assessment" className="mb-4">
      <div className="mb-4">
        <Space>
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={addSubject}
          >
            Add Subject
          </Button>
          <Button 
            icon={<PlusOutlined />} 
            onClick={addStudent}
          >
            Add Student
          </Button>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={students}
        rowKey="id"
        pagination={false}
        scroll={{ x: 800 }}
        summary={() => (
          <Table.Summary fixed>
            <Table.Summary.Row>
              <Table.Summary.Cell index={0}>
                <Text strong>Class Average</Text>
              </Table.Summary.Cell>
              {subjects.map(subject => (
                <Table.Summary.Cell key={subject.id} index={1}>
                  <Text strong className="text-blue-600">
                    {calculateSubjectAverage(subject.id)}%
                  </Text>
                </Table.Summary.Cell>
              ))}
              <Table.Summary.Cell index={2}>-</Table.Summary.Cell>
              <Table.Summary.Cell index={3}>-</Table.Summary.Cell>
            </Table.Summary.Row>
          </Table.Summary>
        )}
      />

      <div className="mt-4 p-4 bg-gray-50 rounded">
        <Text>
          <strong>Instructions:</strong> Enter scores for each student in each subject. 
          Scores are out of the maximum score set for each subject (default: 100). 
          The system will automatically calculate individual and class averages.
        </Text>
      </div>

      {/* Subject Modal */}
      <Modal
        title={editingSubject ? 'Edit Subject' : 'Add Subject'}
        open={isSubjectModalVisible}
        onCancel={() => setIsSubjectModalVisible(false)}
        footer={null}
      >
        <Form
          layout="vertical"
          onFinish={handleSubjectSubmit}
          initialValues={editingSubject || { max_score: 100 }}
        >
          <Form.Item
            name="name_km"
            label="Subject Name (Khmer)"
            rules={[{ required: true, message: 'Please enter subject name in Khmer' }]}
          >
            <Input placeholder="e.g., អំណាន" />
          </Form.Item>
          <Form.Item
            name="name_en"
            label="Subject Name (English)"
            rules={[{ required: true, message: 'Please enter subject name in English' }]}
          >
            <Input placeholder="e.g., Reading" />
          </Form.Item>
          <Form.Item
            name="max_score"
            label="Maximum Score"
            rules={[{ required: true, message: 'Please enter maximum score' }]}
          >
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {editingSubject ? 'Update' : 'Add'}
              </Button>
              <Button onClick={() => setIsSubjectModalVisible(false)}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Student Modal */}
      <Modal
        title={editingStudent ? 'Edit Student' : 'Add Student'}
        open={isStudentModalVisible}
        onCancel={() => setIsStudentModalVisible(false)}
        footer={null}
      >
        <Form
          layout="vertical"
          onFinish={handleStudentSubmit}
          initialValues={editingStudent || { gender: 'M' }}
        >
          <Form.Item
            name="identifier"
            label="Student Identifier"
            rules={[{ required: true, message: 'Please enter student identifier' }]}
          >
            <Input placeholder="e.g., សិស្សទី១" />
          </Form.Item>
          <Form.Item
            name="name"
            label="Student Name (Optional)"
          >
            <Input placeholder="e.g., John Doe" />
          </Form.Item>
          <Form.Item
            name="gender"
            label="Gender"
            rules={[{ required: true, message: 'Please select gender' }]}
          >
            <Select>
              <Option value="M">Male</Option>
              <Option value="F">Female</Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {editingStudent ? 'Update' : 'Add'}
              </Button>
              <Button onClick={() => setIsStudentModalVisible(false)}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Hidden form fields to store the data */}
      <Form.Item name="subjects" hidden>
        <input type="hidden" />
      </Form.Item>
      <Form.Item name="students" hidden>
        <input type="hidden" />
      </Form.Item>
      <Form.Item name="scores" hidden>
        <input type="hidden" />
      </Form.Item>
    </Card>
  );
}