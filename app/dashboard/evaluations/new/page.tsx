'use client';

import { useState } from 'react';
import {
  Form,
  Input,
  Select,
  DatePicker,
  TimePicker,
  InputNumber,
  Button,
  Card,
  Row,
  Col,
  Steps,
  Typography,
  Radio,
  Space,
  message,
  Divider,
  Table,
} from 'antd';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { TextArea } = Input;

// Define the evaluation form steps
const steps = [
  { title: 'ព័ត៌មានទូទៅ', description: 'General Information' },
  { title: 'សូចនាករវាយតម្លៃ', description: 'Evaluation Indicators' },
  { title: 'វាយតម្លៃសិស្ស', description: 'Student Assessment' },
  { title: 'សេចក្តីសន្និដ្ឋាន', description: 'Conclusion' },
];

export default function NewEvaluationPage() {
  const [form] = Form.useForm();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Fetch indicators
  const { data: indicators } = useQuery({
    queryKey: ['indicators'],
    queryFn: async () => {
      const response = await axios.get('/api/indicators');
      return response.data;
    },
  });

  // Sample data for student assessment
  const studentColumns = [
    { title: 'សិស្សទី១', dataIndex: 'student1', key: 'student1' },
    { title: 'សិស្សទី២', dataIndex: 'student2', key: 'student2' },
    { title: 'សិស្សទី៣', dataIndex: 'student3', key: 'student3' },
    { title: 'សិស្សទី៤', dataIndex: 'student4', key: 'student4' },
  ];

  const handleNext = () => {
    form
      .validateFields()
      .then(() => {
        setCurrentStep(currentStep + 1);
      })
      .catch((error) => {
        console.error('Validation failed:', error);
      });
  };

  const handlePrev = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();
      
      // Format the data for submission
      const formData = {
        ...values,
        evaluationDate: values.evaluationDate.format('YYYY-MM-DD'),
        startTime: values.startTime?.format('HH:mm:ss'),
        endTime: values.endTime?.format('HH:mm:ss'),
      };

      await axios.post('/api/evaluations', formData);
      message.success('Evaluation submitted successfully!');
      router.push('/dashboard/evaluations');
    } catch (error) {
      message.error('Failed to submit evaluation');
      console.error('Submit error:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <>
            <Title level={4}>ព័ត៌មានទូទៅ / General Information</Title>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="teacherId"
                  label="ឈ្មោះគ្រូ / Teacher Name"
                  rules={[{ required: true, message: 'Please select a teacher' }]}
                >
                  <Select placeholder="Select teacher">
                    <Select.Option value="1">សុខ សុភា</Select.Option>
                    <Select.Option value="2">លី សំអាត</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="schoolName"
                  label="សាលារៀន / School"
                  rules={[{ required: true }]}
                >
                  <Input placeholder="Enter school name" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={8}>
                <Form.Item
                  name="evaluationDate"
                  label="កាលបរិច្ឆេទ / Date"
                  rules={[{ required: true }]}
                >
                  <DatePicker style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="startTime"
                  label="ម៉ោងចាប់ផ្តើម / Start Time"
                >
                  <TimePicker format="HH:mm" style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="endTime"
                  label="ម៉ោងបញ្ចប់ / End Time"
                >
                  <TimePicker format="HH:mm" style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={8}>
                <Form.Item
                  name="classLevel"
                  label="ថ្នាក់ទី / Grade"
                  rules={[{ required: true }]}
                >
                  <Select placeholder="Select grade">
                    {[4, 5, 6].map((grade) => (
                      <Select.Option key={grade} value={grade}>
                        ថ្នាក់ទី {grade}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="chapterNumber"
                  label="ជំពូកទី / Chapter"
                >
                  <InputNumber min={1} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item
                  name="subject"
                  label="មុខវិជ្ជា / Subject"
                  rules={[{ required: true }]}
                >
                  <Input placeholder="Enter subject" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  name="lessonTitle"
                  label="ចំណងជើងមេរៀន / Lesson Title"
                  rules={[{ required: true }]}
                >
                  <Input placeholder="Enter lesson title" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="lessonTopic"
                  label="ប្រធានបទមេរៀន / Lesson Topic"
                >
                  <Input placeholder="Enter lesson topic" />
                </Form.Item>
              </Col>
            </Row>

            <Divider>សិស្សចូលរៀន / Student Attendance</Divider>

            <Row gutter={16}>
              <Col span={6}>
                <Form.Item
                  name="totalStudentsMale"
                  label="សិស្សប្រុសសរុប / Total Male"
                  initialValue={0}
                >
                  <InputNumber min={0} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item
                  name="totalStudentsFemale"
                  label="សិស្សស្រីសរុប / Total Female"
                  initialValue={0}
                >
                  <InputNumber min={0} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item
                  name="totalAbsentMale"
                  label="អវត្តមានប្រុស / Absent Male"
                  initialValue={0}
                >
                  <InputNumber min={0} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={6}>
                <Form.Item
                  name="totalAbsentFemale"
                  label="អវត្តមានស្រី / Absent Female"
                  initialValue={0}
                >
                  <InputNumber min={0} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            </Row>
          </>
        );

      case 1:
        return (
          <>
            <Title level={4}>សូចនាករវាយតម្លៃ / Evaluation Indicators</Title>
            {indicators?.map((indicator: any) => (
              <Card key={indicator.indicatorId} className="mb-4">
                <Title level={5}>
                  {indicator.indicatorCode}. {indicator.indicatorNameKm}
                </Title>
                <Text type="secondary">{indicator.indicatorNameEn}</Text>
                
                {indicator.subIndicators?.map((subInd: any) => (
                  <div key={subInd.subIndicatorId} className="mt-4">
                    <Text strong>
                      {subInd.subIndicatorCode}. {subInd.subIndicatorNameKm}
                    </Text>
                    <Form.Item
                      name={['scores', subInd.subIndicatorId]}
                      className="mt-2"
                    >
                      <Radio.Group>
                        <Space direction="vertical">
                          <Radio value={0}>មិនបានសង្កេត / Not Observed</Radio>
                          <Radio value={1}>មូលដ្ឋាន / Basic (1)</Radio>
                          <Radio value={2}>មធ្យម / Intermediate (2)</Radio>
                          <Radio value={3}>ជឿនលឿន / Advanced (3)</Radio>
                        </Space>
                      </Radio.Group>
                    </Form.Item>
                  </div>
                ))}
              </Card>
            ))}
          </>
        );

      case 2:
        return (
          <>
            <Title level={4}>វាយតម្លៃសិស្ស / Student Assessment</Title>
            <Text type="secondary">
              សូមវាយតម្លៃសិស្សគំរូចំនួន ៤នាក់ / Please assess 4 sample students
            </Text>
            
            <Form.Item
              name="studentAssessment"
              className="mt-4"
            >
              <Table
                columns={studentColumns}
                dataSource={[
                  {
                    key: 'math',
                    subject: 'គណិតវិទ្យា',
                    student1: <InputNumber min={0} max={100} />,
                    student2: <InputNumber min={0} max={100} />,
                    student3: <InputNumber min={0} max={100} />,
                    student4: <InputNumber min={0} max={100} />,
                  },
                  {
                    key: 'khmer',
                    subject: 'ភាសាខ្មែរ',
                    student1: <InputNumber min={0} max={100} />,
                    student2: <InputNumber min={0} max={100} />,
                    student3: <InputNumber min={0} max={100} />,
                    student4: <InputNumber min={0} max={100} />,
                  },
                ]}
                pagination={false}
              />
            </Form.Item>
          </>
        );

      case 3:
        return (
          <>
            <Title level={4}>សេចក្តីសន្និដ្ឋាន / Conclusion</Title>
            
            <Form.Item
              name="generalNotes"
              label="កំណត់ចំណាំទូទៅ / General Notes"
            >
              <TextArea
                rows={6}
                placeholder="Enter your observations and recommendations..."
              />
            </Form.Item>

            <Form.Item
              name="evaluatorName"
              label="ឈ្មោះអ្នកវាយតម្លៃ / Evaluator Name"
              rules={[{ required: true }]}
            >
              <Input placeholder="Enter evaluator name" />
            </Form.Item>

            <Form.Item
              name="evaluatorRole"
              label="តួនាទី / Role"
              rules={[{ required: true }]}
            >
              <Select placeholder="Select role">
                <Select.Option value="CLUSTER">Cluster Leader</Select.Option>
                <Select.Option value="DEPARTMENT">Department Officer</Select.Option>
                <Select.Option value="PROVINCIAL">Provincial Officer</Select.Option>
              </Select>
            </Form.Item>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div>
      <Title level={2}>ទម្រង់វាយតម្លៃគ្រូបង្រៀន / Teacher Evaluation Form</Title>
      
      <Steps current={currentStep} items={steps} className="mb-8" />

      <Card>
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            evaluationDate: dayjs(),
            totalStudentsMale: 0,
            totalStudentsFemale: 0,
            totalAbsentMale: 0,
            totalAbsentFemale: 0,
          }}
        >
          {renderStepContent()}
        </Form>

        <div className="mt-6 flex justify-between">
          {currentStep > 0 && (
            <Button onClick={handlePrev}>
              Previous
            </Button>
          )}
          {currentStep < steps.length - 1 && (
            <Button type="primary" onClick={handleNext} className="ml-auto">
              Next
            </Button>
          )}
          {currentStep === steps.length - 1 && (
            <Button
              type="primary"
              onClick={handleSubmit}
              loading={loading}
              className="ml-auto"
            >
              Submit Evaluation
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}