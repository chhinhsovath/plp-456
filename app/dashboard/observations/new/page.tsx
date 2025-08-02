'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, Steps, Button, message, Form, Space, Typography } from 'antd';
import { ArrowLeftOutlined, ArrowRightOutlined, SaveOutlined } from '@ant-design/icons';
import BasicSessionInfo from '@/components/observations/BasicSessionInfo';
import TeachingEvaluation from '@/components/observations/TeachingEvaluation';
import StudentAssessment from '@/components/observations/StudentAssessment';
import { useSession } from '@/hooks/useSession';

const { Title } = Typography;

export default function NewObservationPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [currentStep, setCurrentStep] = useState(0);
  const [form] = Form.useForm();
  const [formData, setFormData] = useState({
    sessionInfo: {},
    evaluationData: {},
    studentAssessment: {}
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;
    
    if (status === 'unauthenticated') {
      router.push('/login');
      return;
    }

    // All authenticated users can create observations
    // MENTOR, TEACHER, and OFFICER are primary implementers but all roles have access
  }, [session, status, router]);

  const steps = [
    {
      title: 'Session Information',
      description: 'Basic inspection details'
    },
    {
      title: 'Teaching Evaluation',
      description: 'Evaluate teaching indicators'
    },
    {
      title: 'Student Assessment',
      description: 'Assess student performance'
    }
  ];

  const handleNext = async () => {
    try {
      const values = await form.validateFields();
      
      // Save current step data
      if (currentStep === 0) {
        setFormData(prev => ({ ...prev, sessionInfo: values }));
      } else if (currentStep === 1) {
        setFormData(prev => ({ ...prev, evaluationData: values }));
      } else if (currentStep === 2) {
        setFormData(prev => ({ ...prev, studentAssessment: values }));
      }

      if (currentStep < steps.length - 1) {
        setCurrentStep(currentStep + 1);
        form.resetFields();
      }
    } catch (error) {
      message.error('Please fill in all required fields');
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      
      // Restore previous step data
      if (currentStep === 1) {
        form.setFieldsValue(formData.sessionInfo);
      } else if (currentStep === 2) {
        form.setFieldsValue(formData.evaluationData);
      }
    }
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      // Combine all form data
      const finalData = {
        ...formData,
        studentAssessment: values,
        createdBy: session?.email,
        userRole: session?.role
      };

      setIsSubmitting(true);

      const response = await fetch('/api/observations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(finalData),
      });

      if (!response.ok) {
        throw new Error('Failed to create observation');
      }

      const result = await response.json();
      message.success('Observation created successfully!');
      router.push(`/dashboard/observations/${result.id}`);
    } catch (error) {
      console.error('Submit error:', error);
      message.error('Failed to create observation. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDraft = async () => {
    try {
      const values = form.getFieldsValue();
      
      // Update form data with current values
      let updatedData = { ...formData };
      if (currentStep === 0) {
        updatedData.sessionInfo = { ...updatedData.sessionInfo, ...values };
      } else if (currentStep === 1) {
        updatedData.evaluationData = { ...updatedData.evaluationData, ...values };
      } else if (currentStep === 2) {
        updatedData.studentAssessment = { ...updatedData.studentAssessment, ...values };
      }

      // Save to localStorage as draft
      localStorage.setItem('observationDraft', JSON.stringify({
        ...updatedData,
        currentStep,
        savedAt: new Date().toISOString()
      }));

      message.success('Draft saved successfully!');
    } catch (error) {
      console.error('Save draft error:', error);
      message.error('Failed to save draft');
    }
  };

  const loadDraft = () => {
    const draft = localStorage.getItem('observationDraft');
    if (draft) {
      try {
        const parsedDraft = JSON.parse(draft);
        setFormData({
          sessionInfo: parsedDraft.sessionInfo || {},
          evaluationData: parsedDraft.evaluationData || {},
          studentAssessment: parsedDraft.studentAssessment || {}
        });
        setCurrentStep(parsedDraft.currentStep || 0);
        
        // Load current step data into form
        if (parsedDraft.currentStep === 0 && parsedDraft.sessionInfo) {
          form.setFieldsValue(parsedDraft.sessionInfo);
        } else if (parsedDraft.currentStep === 1 && parsedDraft.evaluationData) {
          form.setFieldsValue(parsedDraft.evaluationData);
        } else if (parsedDraft.currentStep === 2 && parsedDraft.studentAssessment) {
          form.setFieldsValue(parsedDraft.studentAssessment);
        }
        
        message.info(`Draft loaded from ${new Date(parsedDraft.savedAt).toLocaleString()}`);
      } catch (error) {
        console.error('Load draft error:', error);
        message.error('Failed to load draft');
      }
    }
  };

  useEffect(() => {
    // Check for draft on component mount
    const draft = localStorage.getItem('observationDraft');
    if (draft) {
      message.info('You have a saved draft. Loading it now...');
      loadDraft();
    }
  }, []);

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return <BasicSessionInfo form={form} userRole={session?.role} />;
      case 1:
        return <TeachingEvaluation form={form} sessionData={formData.sessionInfo} />;
      case 2:
        return <StudentAssessment form={form} sessionData={formData.sessionInfo} />;
      default:
        return null;
    }
  };

  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-6">
      <Card className="mb-4">
        <Title level={3}>New Classroom Observation</Title>
        <Steps current={currentStep} items={steps} className="mb-8" />
      </Card>

      <Form
        form={form}
        layout="vertical"
        onFinish={currentStep === steps.length - 1 ? handleSubmit : handleNext}
      >
        {renderStepContent()}

        <Card className="mt-4">
          <Space className="w-full justify-between">
            <Space>
              <Button
                icon={<ArrowLeftOutlined />}
                onClick={handlePrevious}
                disabled={currentStep === 0}
              >
                Previous
              </Button>
              <Button
                icon={<SaveOutlined />}
                onClick={handleSaveDraft}
              >
                Save Draft
              </Button>
            </Space>
            
            <Space>
              {currentStep < steps.length - 1 ? (
                <Button
                  type="primary"
                  icon={<ArrowRightOutlined />}
                  onClick={handleNext}
                >
                  Next
                </Button>
              ) : (
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={isSubmitting}
                  disabled={isSubmitting}
                >
                  Submit Observation
                </Button>
              )}
            </Space>
          </Space>
        </Card>
      </Form>
    </div>
  );
}