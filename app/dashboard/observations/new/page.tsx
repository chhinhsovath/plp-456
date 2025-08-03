'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, Steps, Button, Form, Space, Typography, App, Badge, message as antMessage, Spin, Alert, Switch } from 'antd';
import { ArrowLeftOutlined, ArrowRightOutlined, SaveOutlined, CloudOutlined, CloudSyncOutlined, WifiOutlined, DisconnectOutlined, SyncOutlined, LoadingOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import BasicSessionInfo from '@/components/observations/BasicSessionInfo';
import TeachingEvaluation from '@/components/observations/TeachingEvaluation';
import StudentAssessment from '@/components/observations/StudentAssessment';
import { useSession } from '@/hooks/useSession';
import type { FormInstance } from 'antd/es/form';
import { hybridStorage } from '@/lib/hybrid-storage';
import { formatDateForAPI, formatDateForDisplay } from '@/lib/date-utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { observationFormTranslations } from '@/lib/translations/observation-form';

const { Title } = Typography;

export default function NewObservationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const { message } = App.useApp();
  const { language, toggleLanguage } = useLanguage();
  const t = observationFormTranslations[language];
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    sessionInfo: {},
    evaluationData: {},
    studentAssessment: {}
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationInProgress, setValidationInProgress] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [sessionKey, setSessionKey] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [formReady, setFormReady] = useState(false);
  const [initialDataLoaded, setInitialDataLoaded] = useState(false);
  const [draftLoaded, setDraftLoaded] = useState(false);
  
  // Create form instance properly at the top level
  const [form] = Form.useForm();
  const formRef = useRef<FormInstance>(form);
  
  // Add ref for form change tracking
  const formChangedRef = useRef(false);

  useEffect(() => {
    setMounted(true);
    
    // Check online status
    setIsOnline(navigator.onLine);
    
    // Set up online/offline listeners
    const handleOnline = () => {
      setIsOnline(true);
      message.success(t.status.connectionRestored);
      // Try to sync any unsaved changes
      hybridStorage.syncToServer();
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      message.warning(t.status.workingOffline);
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Check for session key and step in URL
    const urlSessionKey = searchParams.get('sessionKey');
    const urlStep = searchParams.get('step');
    
    if (urlSessionKey) {
      setSessionKey(urlSessionKey);
      // Set current step from URL or default to 1
      const stepNumber = urlStep ? parseInt(urlStep) - 1 : 0;
      setCurrentStep(Math.max(0, Math.min(stepNumber, 2))); // Ensure step is 0-2
      loadDraft(urlSessionKey);
    } else {
      // No session key in URL - this is a new observation
      // Check if there's a draft in localStorage that we should redirect to
      const localData = hybridStorage.loadLocal();
      if (localData && localData.sessionKey) {
        // Redirect to the URL with the existing sessionKey and step
        const step = localData.step || 1;
        router.push(`/dashboard/observations/new?sessionKey=${localData.sessionKey}&step=${step}`);
      } else {
        // Fresh start - no existing draft
        setIsLoading(false);
      }
    }
    
    // Set up periodic save check
    const saveInterval = setInterval(() => {
      if (formChangedRef.current && !isSaving && !isLoading && !isSubmitting) {
        formChangedRef.current = false;
        saveDraft();
      }
    }, 30000); // Save every 30 seconds if there are changes
    
    return () => {
      setMounted(false);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(saveInterval);
    };
  }, [searchParams, isSaving, isLoading, isSubmitting]); // eslint-disable-line react-hooks/exhaustive-deps
  
  // Watch for URL changes to update step
  useEffect(() => {
    const urlStep = searchParams.get('step');
    if (urlStep && mounted) {
      const stepNumber = parseInt(urlStep) - 1;
      const validStep = Math.max(0, Math.min(stepNumber, 2));
      if (validStep !== currentStep) {
        setCurrentStep(validStep);
        setInitialDataLoaded(false); // Reset to load data for new step
      }
    }
  }, [searchParams, mounted]); // eslint-disable-line react-hooks/exhaustive-deps
  
  // Set form ready after mount
  useEffect(() => {
    if (mounted && form) {
      setFormReady(true);
    }
  }, [mounted, form]);

  // Load form data when form is ready and we have data
  useEffect(() => {
    const currentForm = form;
    if (!formReady || isLoading || !currentForm || initialDataLoaded) return;
    
    console.log('Loading form data for step:', currentStep);
    console.log('Form data state:', { 
      sessionInfo: Object.keys(formData.sessionInfo || {}).length,
      evaluationData: Object.keys(formData.evaluationData || {}).length,
      studentAssessment: Object.keys(formData.studentAssessment || {}).length
    });
    
    // Load the appropriate step data into the form
    if (currentStep === 0 && formData.sessionInfo && Object.keys(formData.sessionInfo).length > 0) {
      console.log('Loading session info into form:', formData.sessionInfo);
      // Clear and set values for step 0
      currentForm.setFieldsValue(formData.sessionInfo);
      setInitialDataLoaded(true);
    } else if (currentStep === 1 && formData.evaluationData) {
      console.log('Loading evaluation data into form:', formData.evaluationData);
      console.log('Evaluation data keys:', Object.keys(formData.evaluationData));
      console.log('Number of indicators:', Object.keys(formData.evaluationData).filter(key => key.startsWith('indicator_')).length);
      console.log('evaluationLevels value:', (formData.evaluationData as any).evaluationLevels);
      // Set all evaluation data including evaluationLevels
      currentForm.setFieldsValue(formData.evaluationData);
      setInitialDataLoaded(true);
    } else if (currentStep === 2 && formData.studentAssessment && Object.keys(formData.studentAssessment).length > 0) {
      console.log('Loading student assessment into form:', formData.studentAssessment);
      currentForm.setFieldsValue(formData.studentAssessment);
      setInitialDataLoaded(true);
    } else if (!isLoading) {
      // No data to load, mark as loaded for new forms
      setInitialDataLoaded(true);
    }
  }, [formReady, currentStep, formData, isLoading, form, initialDataLoaded]);

  useEffect(() => {
    if (status === 'loading') return;
    
    // In development, allow access even if unauthenticated
    if (status === 'unauthenticated' && process.env.NODE_ENV === 'production') {
      router.push('/login');
      return;
    }

    // All users can create observations - no role restrictions
  }, [session, status, router]);

  const steps = [
    {
      title: t.steps.basicInfo,
      description: t.steps.basicInfoDesc
    },
    {
      title: t.steps.teachingEvaluation,
      description: t.steps.teachingEvaluationDesc
    },
    {
      title: t.steps.studentAssessment,
      description: t.steps.studentAssessmentDesc
    }
  ];

  const handleNext = async () => {
    if (validationInProgress) return; // Prevent multiple validation attempts
    
    const currentForm = form;
    
    setValidationInProgress(true);
    try {
      // Get all form values first - including invalid ones
      const allValues = currentForm.getFieldsValue();
      console.log('Current form values:', allValues);
      
      // Save current form data even before validation
      let updatedFormData = { ...formData };
      if (currentStep === 0) {
        updatedFormData.sessionInfo = { ...updatedFormData.sessionInfo, ...allValues };
      } else if (currentStep === 1) {
        console.log('Saving evaluation data:', allValues);
        console.log('Current evaluationLevels:', allValues.evaluationLevels);
        updatedFormData.evaluationData = { ...updatedFormData.evaluationData, ...allValues };
      } else if (currentStep === 2) {
        updatedFormData.studentAssessment = { ...updatedFormData.studentAssessment, ...allValues };
      }
      
      // Save to draft immediately to prevent data loss
      await saveDraftWithData(updatedFormData);
      
      // Now validate
      const values = await currentForm.validateFields();
      console.log('Validated values:', values);
      
      // Update form data state after successful validation
      setFormData(updatedFormData);

      if (currentStep < steps.length - 1) {
        // Navigate to next step using URL
        const nextStep = currentStep + 2; // Convert to 1-based step number
        router.push(`/dashboard/observations/new?sessionKey=${sessionKey}&step=${nextStep}`);
      }
    } catch (error: any) {
      // Handle validation errors more specifically
      console.log('Full validation error:', error);
      if (error.errorFields && error.errorFields.length > 0) {
        const missingFields = error.errorFields.map((field: any) => field.name.join(' > ')).join(', ');
        message.error(`${t.validation.completeMissingFields} ${missingFields}`);
      } else {
        message.error(t.validation.fillRequiredFields);
      }
    } finally {
      setValidationInProgress(false);
    }
  };

  const handlePrevious = async () => {
    if (currentStep > 0) {
      try {
        const currentForm = form;
        
        // Save all current form data before moving back
        const currentValues = currentForm.getFieldsValue();
        console.log('Current form values before going back:', currentValues);
        
        let updatedFormData = { ...formData };
        
        if (currentStep === 0) {
          updatedFormData.sessionInfo = { ...updatedFormData.sessionInfo, ...currentValues };
        } else if (currentStep === 1) {
          // Merge evaluation data to preserve all indicators
          updatedFormData.evaluationData = { ...updatedFormData.evaluationData, ...currentValues };
        } else if (currentStep === 2) {
          updatedFormData.studentAssessment = { ...updatedFormData.studentAssessment, ...currentValues };
        }
        
        setFormData(updatedFormData);
        
        // Save complete draft data to storage
        await saveDraftWithData(updatedFormData);
        
        // Navigate to previous step using URL
        const prevStep = currentStep; // Convert to 1-based step number (currentStep is 0-based)
        router.push(`/dashboard/observations/new?sessionKey=${sessionKey}&step=${prevStep}`);
      } catch (error) {
        console.error('Error in handlePrevious:', error);
        message.error('Failed to save data. Please try again.');
      }
    }
  };

  const handleSubmit = async () => {
    const currentForm = form;
    
    try {
      const values = await currentForm.validateFields();
      
      // Clean up formData by separating sessionInfo from evaluation data
      const cleanedSessionInfo: any = { ...formData.sessionInfo };
      
      // Remove indicator data and evaluationLevels from sessionInfo
      Object.keys(cleanedSessionInfo).forEach(key => {
        if (key.startsWith('indicator_') || key === 'evaluationLevels') {
          delete cleanedSessionInfo[key];
        }
      });
      
      // Ensure evaluationData has all the indicator data
      const cleanedEvaluationData: any = { ...formData.evaluationData };
      
      // Add any indicator data from sessionInfo to evaluationData (for backward compatibility)
      Object.keys(formData.sessionInfo).forEach(key => {
        if (key.startsWith('indicator_') || key === 'evaluationLevels') {
          cleanedEvaluationData[key] = (formData.sessionInfo as any)[key];
        }
      });
      
      // Combine all form data with cleaned sections
      const finalData = {
        sessionInfo: cleanedSessionInfo,
        evaluationData: cleanedEvaluationData,
        studentAssessment: values,
        createdBy: session?.email,
        userRole: session?.role
      };

      // Convert inspection date from DD-MM-YYYY to YYYY-MM-DD for API
      if (finalData.sessionInfo.inspectionDate) {
        finalData.sessionInfo.inspectionDate = formatDateForAPI(finalData.sessionInfo.inspectionDate);
      }

      console.log('Submitting cleaned data:', finalData);

      setIsSubmitting(true);

      const response = await fetch('/api/observations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(finalData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Submission error response:', errorData);
        throw new Error(errorData.details || errorData.error || 'Failed to create observation');
      }

      const result = await response.json();
      
      // Delete draft after successful submission
      if (sessionKey) {
        await fetch('/api/observations/draft', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionKey })
        });
      }
      
      // Clear local storage
      hybridStorage.clearLocal();
      
      message.success(t.status.observationCreated);
      router.push(`/dashboard/observations/${result.id}`);
    } catch (error) {
      console.error('Submit error:', error);
      message.error(t.validation.failedToSave);
    } finally {
      setIsSubmitting(false);
    }
  };

  const loadDraft = async (key: string) => {
    if (draftLoaded) return; // Prevent multiple loads
    
    try {
      console.log('Loading draft with key:', key);
      const data = await hybridStorage.loadFromServer(key);
      if (data) {
        console.log('Draft data loaded:', {
          sessionKey: data.sessionKey,
          step: data.step,
          sessionInfoFields: Object.keys(data.sessionInfo).length,
          evaluationDataFields: Object.keys(data.evaluationData).length,
          evaluationLevels: data.evaluationData?.evaluationLevels
        });
        console.log('Full evaluation data:', data.evaluationData);
        
        // Convert date from API format to display format
        const sessionInfo = { ...data.sessionInfo };
        if (sessionInfo.inspectionDate) {
          sessionInfo.inspectionDate = formatDateForDisplay(sessionInfo.inspectionDate);
        }
        
        setFormData({
          sessionInfo,
          evaluationData: data.evaluationData,
          studentAssessment: data.studentAssessment
        });
        // Don't override step from URL - it's already set
        setLastSaved(new Date(data.lastSaved));
        setHasUnsavedChanges(data.isDirty);
        
        // Reset the flag to allow useEffect to populate form
        setInitialDataLoaded(false);
        
        message.info(t.status.draftLoaded);
        setDraftLoaded(true); // Mark as loaded after showing message
      } else {
        console.warn('No draft data returned for key:', key);
        // Clear the invalid sessionKey and remove from URL
        setSessionKey(null);
        hybridStorage.clearLocal();
        // Remove sessionKey from URL but keep the current step
        const currentStep = searchParams.get('step') || '1';
        router.replace(`/dashboard/observations/new?step=${currentStep}`);
        message.warning(t.status.draftNotFound || 'Draft not found. Starting a new observation.');
      }
    } catch (error: any) {
      console.error('Failed to load draft:', error.message, error);
      message.error(`${t.validation.failedToLoadDraft} ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  // New function to save complete draft data
  const saveDraftWithData = async (completeFormData: any) => {
    if (!mounted || isSubmitting || isLoading) return;
    
    setIsSaving(true);
    try {
      // Convert date to API format before saving
      const sessionInfo = { ...completeFormData.sessionInfo };
      if (sessionInfo.inspectionDate) {
        sessionInfo.inspectionDate = formatDateForAPI(sessionInfo.inspectionDate);
      }
      
      // Generate session key if needed
      const currentSessionKey = sessionKey || `obs-${Date.now()}-${Math.random().toString(36).substr(2, 10)}`;
      
      const storageData = {
        sessionKey: currentSessionKey,
        step: currentStep + 1,
        sessionInfo,
        evaluationData: completeFormData.evaluationData,
        studentAssessment: completeFormData.studentAssessment,
        lastSaved: new Date().toISOString(),
        isDirty: !isOnline
      };
      
      // Try to save to server with timeout
      const savePromise = hybridStorage.saveToServer(
        storageData,
        () => {
          // Success callback
          if (!sessionKey && storageData.sessionKey) {
            // New session key generated, update URL
            const currentStepParam = currentStep + 1;
            router.push(`/dashboard/observations/new?sessionKey=${storageData.sessionKey}&step=${currentStepParam}`);
          } else {
            setHasUnsavedChanges(false);
          }
          
          // Update sessionKey state if it was generated
          if (!sessionKey && storageData.sessionKey) {
            setSessionKey(storageData.sessionKey);
          }
        },
        (error) => {
          // Error callback
          console.error('Server save failed, saved locally:', error);
          setHasUnsavedChanges(true);
          // Don't show error message for offline saves - they're expected
          if (navigator.onLine) {
            message.warning(t.status.draftSavedLocally);
          }
        }
      );
      
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Save timeout')), 10000)
      );
      
      const success = await Promise.race([savePromise, timeoutPromise]).catch(err => {
        console.error('Save operation timed out or failed:', err);
        return false;
      });
      
      setLastSaved(new Date());
    } catch (error: any) {
      console.error('Save failed:', error);
      message.error(`${t.validation.failedToSaveDraft} ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Manual save draft function for Save Now button
  const saveDraft = async () => {
    if (!mounted || validationInProgress || isSubmitting || isSaving || isLoading || !formReady) return;
    
    const currentForm = form;
    
    setIsSaving(true);
    try {
      const currentValues = currentForm.getFieldsValue();
      let updatedData = { ...formData };
      
      // Only update if we have actual form values
      if (currentStep === 0) {
        // For session info, ensure we don't overwrite with empty values
        const hasFormValues = Object.keys(currentValues).some(key => currentValues[key] !== undefined && currentValues[key] !== '');
        if (hasFormValues || Object.keys(updatedData.sessionInfo).length === 0) {
          updatedData.sessionInfo = { ...updatedData.sessionInfo, ...currentValues };
        }
      } else if (currentStep === 1) {
        // Merge evaluation data carefully to preserve all indicators
        console.log('Manual save - evaluation data:', currentValues);
        console.log('Manual save - evaluationLevels:', currentValues.evaluationLevels);
        updatedData.evaluationData = { ...updatedData.evaluationData, ...currentValues };
      } else if (currentStep === 2) {
        updatedData.studentAssessment = { ...updatedData.studentAssessment, ...currentValues };
      }
      
      setFormData(updatedData);
      await saveDraftWithData(updatedData);
    } catch (error: any) {
      console.error('Save failed:', error);
      message.error(`${t.validation.failedToSaveDraft} ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Removed auto-save - saving only happens on step navigation

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return <BasicSessionInfo form={form} userRole={session?.role} />;
      case 1:
        return <TeachingEvaluation form={form} sessionData={formData.sessionInfo} evaluationData={formData.evaluationData} />;
      case 2:
        return <StudentAssessment form={form} sessionData={formData.sessionInfo} assessmentData={formData.studentAssessment} />;
      default:
        return null;
    }
  };

  if (status === 'loading' || !mounted || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
      </div>
    );
  }

  return (
    <div className="p-6">
      {!isOnline && (
        <Alert
          message={t.status.offlineMessage}
          description={t.status.offlineDescription}
          type="warning"
          showIcon
          icon={<DisconnectOutlined />}
          closable
          className="mb-4"
        />
      )}
      
      {hasUnsavedChanges && isOnline && (
        <Alert
          message={t.status.unsavedChangesMessage}
          description={t.status.unsavedChangesDescription}
          type="info"
          showIcon
          icon={<ExclamationCircleOutlined />}
          action={
            <Button size="small" onClick={() => hybridStorage.syncToServer()}>
              {t.status.syncNow}
            </Button>
          }
          closable
          className="mb-4"
        />
      )}
      
      <Card className="mb-4">
        <div className="flex justify-between items-center mb-4">
          <Title level={3} className="mb-0">{t.newObservation}</Title>
          <Space>
            <Switch
              checkedChildren="EN"
              unCheckedChildren="KM"
              checked={language === 'en'}
              onChange={() => toggleLanguage()}
              style={{ backgroundColor: language === 'km' ? '#1890ff' : undefined }}
            />
            {sessionKey && (
              <span className="text-gray-500 text-sm">
                {t.status.session}: {sessionKey}
              </span>
            )}
            {lastSaved && (
              <span className="text-gray-500 text-sm">
                {t.status.lastSaved}: {lastSaved.toLocaleTimeString()}
              </span>
            )}
            <Badge 
              status={isOnline ? 'success' : 'warning'} 
              text={isOnline ? t.status.online : t.status.offline}
            />
            {isSaving && (
              <Badge 
                status="processing" 
                text={t.status.saving}
              />
            )}
          </Space>
        </div>
        <Steps 
          current={currentStep} 
          items={steps} 
          onChange={(step) => {
            // Allow clicking on steps to navigate if sessionKey exists
            if (sessionKey) {
              router.push(`/dashboard/observations/new?sessionKey=${sessionKey}&step=${step + 1}`);
            }
          }}
          style={{ cursor: sessionKey ? 'pointer' : 'default' }}
        />
      </Card>

      <Form
        form={form}
        layout="vertical"
        onFinish={currentStep === steps.length - 1 ? handleSubmit : handleNext}
        preserve={false}
        onValuesChange={() => {
          formChangedRef.current = true;
          setHasUnsavedChanges(true);
        }}
      >
        {renderStepContent()}

        <Card className="mt-4">
          <Space className="w-full justify-between">
            <Space>
              {currentStep > 0 && (
                <Button
                  icon={<ArrowLeftOutlined />}
                  onClick={handlePrevious}
                  disabled={isSaving}
                  loading={isSaving && formChangedRef.current}
                >
                  {t.navigation.previous}
                </Button>
              )}
              <Button
                icon={<SaveOutlined />}
                onClick={saveDraft}
                loading={isSaving}
              >
                {t.navigation.saveNow}
              </Button>
            </Space>
            
            <Space>
              {currentStep < steps.length - 1 ? (
                <Button
                  type="primary"
                  icon={<ArrowRightOutlined />}
                  htmlType="submit"
                  loading={validationInProgress}
                  disabled={validationInProgress}
                >
                  {t.navigation.next}
                </Button>
              ) : (
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={isSubmitting}
                  disabled={isSubmitting}
                >
                  {t.navigation.submit}
                </Button>
              )}
            </Space>
          </Space>
        </Card>
      </Form>
    </div>
  );
}