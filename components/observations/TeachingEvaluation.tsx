'use client';

import { useEffect, useState } from 'react';
import { Form, Card, Radio, Space, Typography, Collapse, Tag, Spin, message } from 'antd';
import { FormInstance } from 'antd/lib/form';

const { Text } = Typography;
const { Panel } = Collapse;

interface TeachingEvaluationProps {
  form: FormInstance;
  sessionData?: any;
}

interface Indicator {
  field_id: number;
  indicator_sequence: number;
  indicator_main: string;
  indicator_main_en: string;
  indicator_sub: string;
  indicator_sub_en: string;
  evaluation_level: number;
  ai_context: string;
}

interface GroupedIndicators {
  [key: string]: {
    main_km: string;
    main_en: string;
    indicators: Indicator[];
  };
}

export default function TeachingEvaluation({ form, sessionData }: TeachingEvaluationProps) {
  const [indicators, setIndicators] = useState<Indicator[]>([]);
  const [groupedIndicators, setGroupedIndicators] = useState<GroupedIndicators>({});
  const [loading, setLoading] = useState(true);
  const [evaluationLevel, setEvaluationLevel] = useState<number>(1);

  useEffect(() => {
    fetchIndicators();
  }, []);

  const fetchIndicators = async () => {
    try {
      const response = await fetch('/api/observations/indicators');
      if (!response.ok) throw new Error('Failed to fetch indicators');
      
      const data = await response.json();
      setIndicators(data);
      
      // Group indicators by main category
      const grouped: GroupedIndicators = {};
      data.forEach((indicator: Indicator) => {
        const key = indicator.indicator_main;
        if (!grouped[key]) {
          grouped[key] = {
            main_km: indicator.indicator_main,
            main_en: indicator.indicator_main_en,
            indicators: []
          };
        }
        grouped[key].indicators.push(indicator);
      });
      
      setGroupedIndicators(grouped);
    } catch (error) {
      console.error('Error fetching indicators:', error);
      message.error('Failed to load evaluation indicators');
    } finally {
      setLoading(false);
    }
  };

  const handleLevelChange = (value: number) => {
    setEvaluationLevel(value);
    form.setFieldValue('evaluationLevel', value);
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
        <Radio.Group 
          value={evaluationLevel} 
          onChange={(e) => handleLevelChange(e.target.value)}
          className="ml-4"
        >
          <Radio value={1}>
            <Tag color="green">Level 1 - Basic</Tag>
          </Radio>
          <Radio value={2}>
            <Tag color="blue">Level 2 - Intermediate</Tag>
          </Radio>
          <Radio value={3}>
            <Tag color="orange">Level 3 - Advanced</Tag>
          </Radio>
        </Radio.Group>
      </div>

      <Form.Item name="evaluationLevel" hidden initialValue={1}>
        <input type="hidden" />
      </Form.Item>

      <Collapse defaultActiveKey={Object.keys(groupedIndicators)}>
        {Object.entries(groupedIndicators).map(([key, group]) => {
          const categoryIndicators = group.indicators.filter(
            ind => ind.evaluation_level <= evaluationLevel
          );
          
          if (categoryIndicators.length === 0) return null;

          return (
            <Panel 
              header={
                <div>
                  <Text strong>{group.main_km}</Text>
                  <Text type="secondary" className="ml-2">({group.main_en})</Text>
                  <Tag className="ml-4" color="blue">
                    {categoryIndicators.length} indicators
                  </Tag>
                </div>
              } 
              key={key}
            >
              <Space direction="vertical" className="w-full" size="large">
                {categoryIndicators.map((indicator) => (
                  <div key={indicator.field_id} className="border rounded-lg p-4 bg-gray-50">
                    <div className="mb-3">
                      <Tag color={getLevelColor(indicator.evaluation_level)}>
                        Level {indicator.evaluation_level} - {getLevelText(indicator.evaluation_level)}
                      </Tag>
                      <Text strong className="ml-2">
                        {indicator.indicator_sequence}. {indicator.indicator_sub}
                      </Text>
                    </div>
                    
                    <Text type="secondary" className="block mb-2">
                      {indicator.indicator_sub_en}
                    </Text>

                    <Form.Item
                      name={`indicator_${indicator.field_id}`}
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

                    {/* AI Context Helper (visible in development) */}
                    {process.env.NODE_ENV === 'development' && (
                      <div className="mt-2 p-2 bg-blue-50 rounded text-xs">
                        <Text type="secondary">
                          <strong>AI Context:</strong> {indicator.ai_context}
                        </Text>
                      </div>
                    )}
                  </div>
                ))}
              </Space>
            </Panel>
          );
        })}
      </Collapse>

      <div className="mt-6 p-4 bg-blue-50 rounded">
        <Text>
          <strong>Note:</strong> You are evaluating at Level {evaluationLevel} ({getLevelText(evaluationLevel)}). 
          This includes all indicators from level 1 to level {evaluationLevel}.
        </Text>
      </div>
    </Card>
  );
}