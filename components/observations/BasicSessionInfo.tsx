'use client';

import { Form, Input, Select, DatePicker, TimePicker, Row, Col, Card, InputNumber } from 'antd';
import { FormInstance } from 'antd/lib/form';
import dayjs from 'dayjs';

const { Option } = Select;
const { TextArea } = Input;

interface BasicSessionInfoProps {
  form: FormInstance;
  userRole?: string;
}

export default function BasicSessionInfo({ form, userRole }: BasicSessionInfoProps) {
  return (
    <Card title="Step 1: Basic Session Information" className="mb-4">
      <Row gutter={[16, 16]}>
        {/* Location Information */}
        <Col span={24}>
          <h4 className="font-semibold mb-3">Location Information</h4>
        </Col>
        
        <Col xs={24} md={8}>
          <Form.Item
            name="province"
            label="Province"
            rules={[{ required: true, message: 'Please select province' }]}
          >
            <Select placeholder="Select province">
              <Option value="Phnom Penh">Phnom Penh</Option>
              <Option value="Kandal">Kandal</Option>
              <Option value="Kampong Cham">Kampong Cham</Option>
              <Option value="Kampong Speu">Kampong Speu</Option>
              <Option value="Siem Reap">Siem Reap</Option>
              <Option value="Battambang">Battambang</Option>
              <Option value="Prey Veng">Prey Veng</Option>
              <Option value="Takeo">Takeo</Option>
            </Select>
          </Form.Item>
        </Col>

        <Col xs={24} md={8}>
          <Form.Item
            name="district"
            label="District"
            rules={[{ required: true, message: 'Please enter district' }]}
          >
            <Input placeholder="Enter district" />
          </Form.Item>
        </Col>

        <Col xs={24} md={8}>
          <Form.Item
            name="commune"
            label="Commune"
            rules={[{ required: true, message: 'Please enter commune' }]}
          >
            <Input placeholder="Enter commune" />
          </Form.Item>
        </Col>

        <Col xs={24} md={8}>
          <Form.Item
            name="village"
            label="Village (Optional)"
          >
            <Input placeholder="Enter village" />
          </Form.Item>
        </Col>

        <Col xs={24} md={8}>
          <Form.Item
            name="cluster"
            label="Cluster (Optional)"
          >
            <Input placeholder="Enter cluster" />
          </Form.Item>
        </Col>

        <Col xs={24} md={8}>
          <Form.Item
            name="school"
            label="School"
            rules={[{ required: true, message: 'Please enter school name' }]}
          >
            <Input placeholder="Enter school name" />
          </Form.Item>
        </Col>

        {/* Teacher Information */}
        <Col span={24}>
          <h4 className="font-semibold mb-3 mt-4">Teacher Information</h4>
        </Col>

        <Col xs={24} md={8}>
          <Form.Item
            name="nameOfTeacher"
            label="Teacher Name"
            rules={[{ required: true, message: 'Please enter teacher name' }]}
          >
            <Input placeholder="Enter teacher name" />
          </Form.Item>
        </Col>

        <Col xs={24} md={8}>
          <Form.Item
            name="sex"
            label="Gender"
            rules={[{ required: true, message: 'Please select gender' }]}
          >
            <Select placeholder="Select gender">
              <Option value="M">Male</Option>
              <Option value="F">Female</Option>
            </Select>
          </Form.Item>
        </Col>

        <Col xs={24} md={8}>
          <Form.Item
            name="employmentType"
            label="Employment Type"
            rules={[{ required: true, message: 'Please select employment type' }]}
          >
            <Select placeholder="Select employment type">
              <Option value="official">Official</Option>
              <Option value="contract">Contract</Option>
            </Select>
          </Form.Item>
        </Col>

        {/* Schedule Information */}
        <Col span={24}>
          <h4 className="font-semibold mb-3 mt-4">Schedule Information</h4>
        </Col>

        <Col xs={24} md={8}>
          <Form.Item
            name="inspectionDate"
            label="Inspection Date"
            rules={[{ required: true, message: 'Please select inspection date' }]}
          >
            <DatePicker 
              style={{ width: '100%' }} 
              format="YYYY-MM-DD"
              disabledDate={(current) => current && current > dayjs().endOf('day')}
            />
          </Form.Item>
        </Col>

        <Col xs={24} md={8}>
          <Form.Item
            name="sessionTime"
            label="Session Time"
            rules={[{ required: true, message: 'Please select session time' }]}
          >
            <Select placeholder="Select session time">
              <Option value="morning">Morning</Option>
              <Option value="afternoon">Afternoon</Option>
              <Option value="both">Both</Option>
            </Select>
          </Form.Item>
        </Col>

        <Col xs={24} md={8}>
          <Form.Item
            name="startTime"
            label="Start Time"
          >
            <TimePicker style={{ width: '100%' }} format="HH:mm" />
          </Form.Item>
        </Col>

        <Col xs={24} md={8}>
          <Form.Item
            name="endTime"
            label="End Time"
          >
            <TimePicker style={{ width: '100%' }} format="HH:mm" />
          </Form.Item>
        </Col>

        {/* Lesson Information */}
        <Col span={24}>
          <h4 className="font-semibold mb-3 mt-4">Lesson Information</h4>
        </Col>

        <Col xs={24} md={8}>
          <Form.Item
            name="subject"
            label="Subject"
            rules={[{ required: true, message: 'Please enter subject' }]}
          >
            <Input placeholder="Enter subject" />
          </Form.Item>
        </Col>

        <Col xs={24} md={8}>
          <Form.Item
            name="grade"
            label="Grade"
            rules={[{ required: true, message: 'Please enter grade' }]}
          >
            <InputNumber 
              min={1} 
              max={12} 
              style={{ width: '100%' }}
              placeholder="Enter grade (1-12)"
            />
          </Form.Item>
        </Col>

        <Col xs={24} md={8}>
          <Form.Item
            name="chapter"
            label="Chapter"
          >
            <Input placeholder="Enter chapter" />
          </Form.Item>
        </Col>

        <Col xs={24} md={8}>
          <Form.Item
            name="lesson"
            label="Lesson"
          >
            <Input placeholder="Enter lesson" />
          </Form.Item>
        </Col>

        <Col xs={24} md={16}>
          <Form.Item
            name="title"
            label="Lesson Title"
          >
            <Input placeholder="Enter lesson title" />
          </Form.Item>
        </Col>

        <Col xs={24}>
          <Form.Item
            name="subTitle"
            label="Lesson Sub-title"
          >
            <Input placeholder="Enter lesson sub-title" />
          </Form.Item>
        </Col>

        {/* Student Statistics */}
        <Col span={24}>
          <h4 className="font-semibold mb-3 mt-4">Student Statistics</h4>
        </Col>

        <Col xs={24} md={6}>
          <Form.Item
            name="totalMale"
            label="Total Male Students"
            rules={[{ required: true, message: 'Please enter number' }]}
            initialValue={0}
          >
            <InputNumber 
              min={0} 
              style={{ width: '100%' }}
              placeholder="0"
            />
          </Form.Item>
        </Col>

        <Col xs={24} md={6}>
          <Form.Item
            name="totalFemale"
            label="Total Female Students"
            rules={[{ required: true, message: 'Please enter number' }]}
            initialValue={0}
          >
            <InputNumber 
              min={0} 
              style={{ width: '100%' }}
              placeholder="0"
            />
          </Form.Item>
        </Col>

        <Col xs={24} md={6}>
          <Form.Item
            name="totalAbsent"
            label="Total Absent"
            rules={[{ required: true, message: 'Please enter number' }]}
            initialValue={0}
          >
            <InputNumber 
              min={0} 
              style={{ width: '100%' }}
              placeholder="0"
            />
          </Form.Item>
        </Col>

        <Col xs={24} md={6}>
          <Form.Item
            name="totalAbsentFemale"
            label="Absent Female"
            rules={[{ required: true, message: 'Please enter number' }]}
            initialValue={0}
          >
            <InputNumber 
              min={0} 
              style={{ width: '100%' }}
              placeholder="0"
            />
          </Form.Item>
        </Col>

        {/* Inspector Information - Only for certain roles */}
        {['ADMIN', 'DIRECTOR', 'MENTOR', 'OFFICER'].includes(userRole || '') && (
          <>
            <Col span={24}>
              <h4 className="font-semibold mb-3 mt-4">Inspector Information</h4>
            </Col>

            <Col xs={24} md={8}>
              <Form.Item
                name="inspectorName"
                label="Inspector Name"
              >
                <Input placeholder="Enter inspector name" />
              </Form.Item>
            </Col>

            <Col xs={24} md={8}>
              <Form.Item
                name="inspectorPosition"
                label="Inspector Position"
              >
                <Input placeholder="Enter inspector position" />
              </Form.Item>
            </Col>

            <Col xs={24} md={8}>
              <Form.Item
                name="inspectorOrganization"
                label="Inspector Organization"
              >
                <Input placeholder="Enter inspector organization" />
              </Form.Item>
            </Col>
          </>
        )}

        {/* Additional Information */}
        <Col span={24}>
          <h4 className="font-semibold mb-3 mt-4">Additional Information</h4>
        </Col>

        <Col xs={24} md={8}>
          <Form.Item
            name="academicYear"
            label="Academic Year"
          >
            <Input placeholder="e.g., 2024-2025" />
          </Form.Item>
        </Col>

        <Col xs={24} md={8}>
          <Form.Item
            name="semester"
            label="Semester"
          >
            <Select placeholder="Select semester">
              <Option value={1}>Semester 1</Option>
              <Option value={2}>Semester 2</Option>
            </Select>
          </Form.Item>
        </Col>

        <Col xs={24} md={8}>
          <Form.Item
            name="lessonDurationMinutes"
            label="Lesson Duration (minutes)"
          >
            <InputNumber 
              min={0} 
              style={{ width: '100%' }}
              placeholder="e.g., 90"
            />
          </Form.Item>
        </Col>

        <Col xs={24}>
          <Form.Item
            name="generalNotes"
            label="General Notes"
          >
            <TextArea 
              rows={4} 
              placeholder="Enter any general notes or observations"
            />
          </Form.Item>
        </Col>
      </Row>
    </Card>
  );
}