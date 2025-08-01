'use client';

import { useState, useEffect } from 'react';
import { Card, Button, Space, Tag, Collapse, Spin, Empty, message, Typography, List, Tooltip } from 'antd';
import { BulbOutlined, RobotOutlined, SyncOutlined, InfoCircleOutlined, CheckOutlined } from '@ant-design/icons';

const { Panel } = Collapse;
const { Text, Title, Paragraph } = Typography;

interface Suggestion {
  id: string;
  priority: 'high' | 'medium' | 'low';
  titleKh: string;
  titleEn: string;
  descriptionKh?: string;
  descriptionEn?: string;
  actionItems?: string[];
  recommendations?: string[];
  examples?: string[];
  resources?: string[];
  checkpoints?: string[];
  solutions?: string[];
}

interface AISuggestionsProps {
  context: {
    type: 'session_planning' | 'feedback_improvement' | 'progress_analysis' | 'challenge_resolution';
    data: any;
  };
  onApplySuggestion?: (suggestion: Suggestion) => void;
}

export function AISuggestions({ context, onApplySuggestion }: AISuggestionsProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [appliedSuggestions, setAppliedSuggestions] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (context.data) {
      fetchSuggestions();
    }
  }, [context]);

  const fetchSuggestions = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/ai/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(context),
      });

      if (response.ok) {
        const data = await response.json();
        setSuggestions(data.suggestions || []);
      } else {
        message.error('មានបញ្ហាក្នុងការទទួលបានការណែនាំ');
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      message.error('មានបញ្ហាក្នុងការទទួលបានការណែនាំ');
    } finally {
      setLoading(false);
    }
  };

  const handleApplySuggestion = (suggestion: Suggestion) => {
    setAppliedSuggestions(prev => new Set(prev).add(suggestion.id));
    onApplySuggestion?.(suggestion);
    message.success('បានអនុវត្តការណែនាំ');
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      high: 'red',
      medium: 'orange',
      low: 'blue',
    };
    return colors[priority as keyof typeof colors] || 'default';
  };

  const getPriorityText = (priority: string) => {
    const texts = {
      high: 'អាទិភាពខ្ពស់',
      medium: 'អាទិភាពមធ្យម',
      low: 'អាទិភាពទាប',
    };
    return texts[priority as keyof typeof texts] || priority;
  };

  const getContextTitle = () => {
    const titles = {
      session_planning: 'ការណែនាំសម្រាប់ផែនការវគ្គ',
      feedback_improvement: 'ការកែលម្អមតិយោបល់',
      progress_analysis: 'ការវិភាគវឌ្ឍនភាព',
      challenge_resolution: 'ដំណោះស្រាយបញ្ហាប្រឈម',
    };
    return titles[context.type] || 'ការណែនាំពី AI';
  };

  if (loading) {
    return (
      <Card>
        <div className="text-center py-8">
          <Spin size="large" />
          <p className="mt-4">កំពុងវិភាគ និងបង្កើតការណែនាំ...</p>
        </div>
      </Card>
    );
  }

  if (suggestions.length === 0) {
    return (
      <Card>
        <Empty
          image={<RobotOutlined style={{ fontSize: 48, color: '#bfbfbf' }} />}
          description="មិនមានការណែនាំនៅពេលនេះទេ"
        >
          <Button icon={<SyncOutlined />} onClick={fetchSuggestions}>
            ព្យាយាមម្តងទៀត
          </Button>
        </Empty>
      </Card>
    );
  }

  return (
    <Card
      title={
        <Space>
          <BulbOutlined style={{ color: '#faad14' }} />
          <span>{getContextTitle()}</span>
        </Space>
      }
      extra={
        <Button
          size="small"
          icon={<SyncOutlined />}
          onClick={fetchSuggestions}
          loading={loading}
        >
          ផ្ទុកឡើងវិញ
        </Button>
      }
    >
      <Collapse accordion>
        {suggestions.map((suggestion) => (
          <Panel
            key={suggestion.id}
            header={
              <div className="flex items-center justify-between">
                <Space>
                  <Tag color={getPriorityColor(suggestion.priority)}>
                    {getPriorityText(suggestion.priority)}
                  </Tag>
                  <Text strong>{suggestion.titleKh}</Text>
                  {appliedSuggestions.has(suggestion.id) && (
                    <CheckOutlined style={{ color: '#52c41a' }} />
                  )}
                </Space>
              </div>
            }
          >
            <Space direction="vertical" size="middle" className="w-full">
              {suggestion.descriptionKh && (
                <Paragraph>{suggestion.descriptionKh}</Paragraph>
              )}

              {suggestion.actionItems && suggestion.actionItems.length > 0 && (
                <div>
                  <Text strong>សកម្មភាពដែលត្រូវធ្វើ:</Text>
                  <List
                    size="small"
                    dataSource={suggestion.actionItems}
                    renderItem={(item) => (
                      <List.Item>
                        <Space>
                          <CheckOutlined />
                          <Text>{item}</Text>
                        </Space>
                      </List.Item>
                    )}
                  />
                </div>
              )}

              {suggestion.recommendations && suggestion.recommendations.length > 0 && (
                <div>
                  <Text strong>អនុសាសន៍:</Text>
                  <List
                    size="small"
                    dataSource={suggestion.recommendations}
                    renderItem={(item) => <List.Item>{item}</List.Item>}
                  />
                </div>
              )}

              {suggestion.examples && suggestion.examples.length > 0 && (
                <div>
                  <Text strong>ឧទាហរណ៍:</Text>
                  <List
                    size="small"
                    dataSource={suggestion.examples}
                    renderItem={(item) => <List.Item>{item}</List.Item>}
                  />
                </div>
              )}

              {suggestion.solutions && suggestion.solutions.length > 0 && (
                <div>
                  <Text strong>ដំណោះស្រាយ:</Text>
                  <List
                    size="small"
                    dataSource={suggestion.solutions}
                    renderItem={(item) => <List.Item>{item}</List.Item>}
                  />
                </div>
              )}

              {suggestion.resources && suggestion.resources.length > 0 && (
                <div>
                  <Text strong>ធនធាន:</Text>
                  <Space wrap>
                    {suggestion.resources.map((resource, index) => (
                      <Tag key={index} icon={<InfoCircleOutlined />}>
                        {resource}
                      </Tag>
                    ))}
                  </Space>
                </div>
              )}

              {suggestion.checkpoints && suggestion.checkpoints.length > 0 && (
                <div>
                  <Text strong>ចំណុចត្រួតពិនិត្យ:</Text>
                  <List
                    size="small"
                    dataSource={suggestion.checkpoints}
                    renderItem={(item) => <List.Item>{item}</List.Item>}
                  />
                </div>
              )}

              <div className="mt-4">
                <Button
                  type="primary"
                  size="small"
                  onClick={() => handleApplySuggestion(suggestion)}
                  disabled={appliedSuggestions.has(suggestion.id)}
                >
                  {appliedSuggestions.has(suggestion.id) ? 'បានអនុវត្ត' : 'អនុវត្តការណែនាំ'}
                </Button>
              </div>
            </Space>
          </Panel>
        ))}
      </Collapse>

      <div className="mt-4 text-center">
        <Text type="secondary" className="text-xs">
          <InfoCircleOutlined /> ការណែនាំទាំងនេះត្រូវបានបង្កើតដោយ AI ដោយផ្អែកលើទិន្នន័យនិងបរិបទរបស់អ្នក
        </Text>
      </div>
    </Card>
  );
}