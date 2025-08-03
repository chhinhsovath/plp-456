'use client';

import { useEffect, useState } from 'react';
import { Form, Card, Radio, Space, Typography, Collapse, Tag, Spin, App, Checkbox, Input } from 'antd';
import { FormInstance } from 'antd/lib/form';
import dayjs from '@/lib/dayjs-config';

const { Text } = Typography;
const { TextArea } = Input;

interface TeachingEvaluationProps {
  form: FormInstance;
  sessionData?: any;
  evaluationData?: any;
}

interface Indicator {
  fieldId: number;
  indicatorSequence: number;
  indicatorMain: string;
  indicatorMainEn: string;
  indicatorSub: string;
  indicatorSubEn: string;
  evaluationLevel: number;
  aiContext: string;
}

interface GroupedIndicators {
  [key: string]: {
    main_km: string;
    main_en: string;
    indicators: Indicator[];
  };
}

export default function TeachingEvaluation({ form, sessionData, evaluationData }: TeachingEvaluationProps) {
  const { message } = App.useApp();
  const [indicators, setIndicators] = useState<Indicator[]>([]);
  const [groupedIndicators, setGroupedIndicators] = useState<GroupedIndicators>({});
  const [loading, setLoading] = useState(true);
  const [selectedLevels, setSelectedLevels] = useState<number[]>([]); // No default selection
  
  // Get selected levels from form or use local state
  const watchedLevels = Form.useWatch('evaluationLevels', form);
  const evaluationLevels = Array.isArray(watchedLevels) ? watchedLevels : (Array.isArray(selectedLevels) ? selectedLevels : []);

  useEffect(() => {
    fetchIndicators();
  }, []);
  
  // Initialize evaluation levels from form on mount
  useEffect(() => {
    // Add a small delay to ensure form is ready
    const timer = setTimeout(() => {
      if (form) {
        const initialLevels = form.getFieldValue('evaluationLevels');
        console.log('TeachingEvaluation mount - initial levels from form:', initialLevels);
        if (initialLevels && Array.isArray(initialLevels) && initialLevels.length > 0) {
          setSelectedLevels(initialLevels);
        }
      }
    }, 100);
    
    return () => clearTimeout(timer);
  }, []); // Only run once on mount
  
  // Sync form evaluation levels with local state when watched value changes
  useEffect(() => {
    console.log('TeachingEvaluation - watchedLevels changed:', watchedLevels);
    if (form && watchedLevels !== undefined && watchedLevels !== null) {
      console.log('Syncing evaluation levels from form:', watchedLevels);
      setSelectedLevels(Array.isArray(watchedLevels) ? watchedLevels : []);
    }
  }, [watchedLevels, form]);

  const fetchIndicators = async () => {
    try {
      const response = await fetch('/api/observations/indicators');
      if (!response.ok) throw new Error('Failed to fetch indicators');
      
      const data = await response.json();
      setIndicators(data);
      
      // Group indicators by main category
      const grouped: GroupedIndicators = {};
      data.forEach((indicator: Indicator) => {
        const key = indicator.indicatorMain;
        if (!grouped[key]) {
          grouped[key] = {
            main_km: indicator.indicatorMain,
            main_en: indicator.indicatorMainEn,
            indicators: []
          };
        }
        grouped[key].indicators.push(indicator);
      });
      
      setGroupedIndicators(grouped);
      
      // After indicators are loaded, set form values from evaluationData if available
      setTimeout(() => {
        if (form && evaluationData) {
          console.log('Setting form values from evaluationData:', evaluationData);
          
          // Set all evaluation data including indicator values and comments
          const evaluationFields: any = {};
          Object.keys(evaluationData).forEach(key => {
            if (key.startsWith('indicator_') || key === 'evaluationLevels') {
              evaluationFields[key] = evaluationData[key];
            }
          });
          
          console.log('Setting evaluation fields:', evaluationFields);
          form.setFieldsValue(evaluationFields);
          
          // Also update evaluation levels state if not already set
          if (evaluationData.evaluationLevels && Array.isArray(evaluationData.evaluationLevels)) {
            setSelectedLevels(evaluationData.evaluationLevels);
          }
        }
      }, 200);
    } catch (error) {
      console.error('Error fetching indicators:', error);
      message.error('Failed to load evaluation indicators');
    } finally {
      setLoading(false);
    }
  };

  const handleLevelChange = (checkedLevels: number[]) => {
    const levels = checkedLevels || [];
    setSelectedLevels(levels);
    // Update form field if form is available
    if (form) {
      try {
        form.setFieldsValue({ evaluationLevels: levels });
      } catch (e) {
        console.warn('Could not update form field:', e);
      }
    }
  };

  const getLevelColor = (level: number) => {
    switch (level) {
      case 1:
        return 'green';
      case 2:
        return 'blue';
      case 3:
        return 'orange';
      default:
        return 'default';
    }
  };

  const getLevelText = (level: number) => {
    switch (level) {
      case 1:
        return 'Basic';
      case 2:
        return 'Intermediate';
      case 3:
        return 'Advanced';
      default:
        return 'Unknown';
    }
  };

  if (loading) {
    return (
      <Card title="Step 2: Teaching Evaluation" className="mb-4">
        <div className="flex justify-center items-center h-64">
          <Spin size="large" />
        </div>
      </Card>
    );
  }

  return (
    <Card title="Step 2: Teaching Evaluation" className="mb-4">
      <div className="mb-6">
        <Text strong>Select Evaluation Level: </Text>
        <Checkbox.Group 
          value={evaluationLevels || []} 
          onChange={handleLevelChange}
          className="ml-4"
        >
          <Checkbox value={1}>
            <Tag color="green">Level 1 - Basic</Tag>
          </Checkbox>
          <Checkbox value={2}>
            <Tag color="blue">Level 2 - Intermediate</Tag>
          </Checkbox>
          <Checkbox value={3}>
            <Tag color="orange">Level 3 - Advanced</Tag>
          </Checkbox>
        </Checkbox.Group>
      </div>

      <Form.Item name="evaluationLevels" hidden>
        <Input type="hidden" />
      </Form.Item>

      <Collapse 
        defaultActiveKey={Object.keys(groupedIndicators)}
        items={Object.entries(groupedIndicators).map(([key, group]) => {
          const categoryIndicators = group.indicators.filter(
            ind => evaluationLevels.includes(ind.evaluationLevel)
          );
          
          if (categoryIndicators.length === 0) return null;

          return {
            key: key,
            label: (
              <div>
                <Text strong>{group.main_km}</Text>
                <Text type="secondary" className="ml-2">({group.main_en})</Text>
                <Tag className="ml-4" color="blue">
                  {categoryIndicators.length} indicator{categoryIndicators.length !== 1 ? 's' : ''}
                </Tag>
              </div>
            ),
            children: (
              <Space direction="vertical" className="w-full" size="large">
                {categoryIndicators.map((indicator) => (
                  <div key={indicator.fieldId} className="border rounded-lg p-4 bg-gray-50">
                    <div className="mb-3">
                      <Tag color={getLevelColor(indicator.evaluationLevel)}>
                        Level {indicator.evaluationLevel} - {getLevelText(indicator.evaluationLevel)}
                      </Tag>
                      <Text strong className="ml-2">
                        {indicator.indicatorSequence}. {indicator.indicatorSub}
                      </Text>
                    </div>
                    
                    <Text type="secondary" className="block mb-2">
                      {indicator.indicatorSubEn}
                    </Text>

                    <Form.Item
                      name={`indicator_${indicator.fieldId}`}
                      label={null}
                      rules={[{ required: true, message: 'Please select an option' }]}
                    >
                      <Radio.Group>
                        <Space>
                          <Radio value="yes">
                            <span className="text-green-600">Yes / បាទ/ចាស</span>
                          </Radio>
                          <Radio value="some_practice">
                            <span className="text-yellow-600">Some Practice / អនុវត្តខ្លះ</span>
                          </Radio>
                          <Radio value="no">
                            <span className="text-red-600">No / ទេ</span>
                          </Radio>
                        </Space>
                      </Radio.Group>
                    </Form.Item>

                    {/* AI Context Field with User Comments */}
                    <Form.Item
                      name={`indicator_${indicator.fieldId}_comment`}
                      label={
                        <Space>
                          <Text strong>AI Context & Comments</Text>
                          <Text type="secondary" className="text-xs">
                            (Original context shown as placeholder)
                          </Text>
                        </Space>
                      }
                      className="mt-3"
                    >
                      <TextArea
                        placeholder={indicator.aiContext}
                        rows={2}
                        className="bg-gray-50"
                        style={{ resize: 'vertical' }}
                      />
                    </Form.Item>

                    {/* Original AI Context Helper (visible in development) */}
                    {process.env.NODE_ENV === 'development' && (
                      <div className="mt-2 p-2 bg-blue-50 rounded text-xs">
                        <Text type="secondary">
                          <strong>Original AI Context:</strong> {indicator.aiContext}
                        </Text>
                      </div>
                    )}
                  </div>
                ))}
              </Space>
            )
          };
        }).filter(Boolean) as any}
      />

      <div className="mt-6 p-4 bg-blue-50 rounded">
        <Text>
          <strong>Note:</strong> You are evaluating at Level(s): {evaluationLevels.map(level => `${level} (${getLevelText(level)})`).join(', ')}. 
          Only indicators for the selected level(s) are displayed.
        </Text>
      </div>
    </Card>
  );
}