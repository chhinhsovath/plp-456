'use client';

import { useState, useEffect } from 'react';
import { Card, Form, Select, DatePicker, Button, Space, Table, Tag, message, Checkbox, Radio, Spin } from 'antd';
import { DownloadOutlined, FileExcelOutlined, FilePdfOutlined, FileTextOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { ExportService } from '@/lib/export/export-service';

const { RangePicker } = DatePicker;
const { Option } = Select;

export default function ExportCenter() {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);
  const [exportData, setExportData] = useState<any>(null);
  const [selectedDataType, setSelectedDataType] = useState<string>('sessions');

  const dataTypes = [
    { value: 'sessions', label: 'វគ្គណែនាំ', description: 'ទិន្នន័យវគ្គណែនាំទាំងអស់' },
    { value: 'progress-reports', label: 'របាយការណ៍វឌ្ឍនភាព', description: 'របាយការណ៍វឌ្ឍនភាពគ្រូ' },
    { value: 'observations', label: 'ការសង្កេត', description: 'ទិន្នន័យការសង្កេតថ្នាក់រៀន' },
    { value: 'feedback', label: 'មតិយោបល់', description: 'មតិយោបល់និងសំណូមពរ' },
    { value: 'analytics', label: 'វិភាគទិន្នន័យ', description: 'របាយការណ៍វិភាគប្រព័ន្ធ' },
  ];

  const handleDataTypeChange = async (value: string) => {
    setSelectedDataType(value);
    await loadData(value, form.getFieldsValue());
  };

  const loadData = async (dataType: string, filters: any) => {
    try {
      setDataLoading(true);
      
      const params = new URLSearchParams();
      if (filters.dateRange) {
        params.append('startDate', filters.dateRange[0].toISOString());
        params.append('endDate', filters.dateRange[1].toISOString());
      }
      if (filters.status) params.append('status', filters.status);
      if (filters.relationshipId) params.append('relationshipId', filters.relationshipId);

      let endpoint = '';
      switch (dataType) {
        case 'sessions':
          endpoint = '/api/mentoring/sessions';
          break;
        case 'progress-reports':
          endpoint = '/api/mentoring/progress-reports';
          break;
        case 'observations':
          endpoint = '/api/mentoring/observations';
          break;
        case 'feedback':
          endpoint = '/api/mentoring/feedback';
          break;
        case 'analytics':
          endpoint = '/api/mentoring/analytics';
          break;
      }

      const response = await fetch(`${endpoint}?${params}`);
      const data = await response.json();
      
      if (response.ok) {
        setExportData(data);
      } else {
        message.error('មានបញ្ហាក្នុងការទាញយកទិន្នន័យ');
      }
    } catch (error) {
      console.error('Error loading data:', error);
      message.error('មានបញ្ហាក្នុងការទាញយកទិន្នន័យ');
    } finally {
      setDataLoading(false);
    }
  };

  const handleExport = async (values: any) => {
    if (!exportData) {
      message.warning('សូមជ្រើសរើសប្រភេទទិន្នន័យជាមុនសិន');
      return;
    }

    try {
      setLoading(true);
      
      const exportOptions = {
        format: values.format,
        filename: `${selectedDataType}-export-${dayjs().format('YYYY-MM-DD')}`,
        title: `របាយការណ៍ ${dataTypes.find(d => d.value === selectedDataType)?.label}`,
        metadata: {
          exportDate: new Date().toISOString(),
          filters: values,
        },
      };

      // Prepare data based on type
      let dataToExport = [];
      if (selectedDataType === 'sessions' && exportData.sessions) {
        dataToExport = exportData.sessions;
      } else if (selectedDataType === 'progress-reports' && exportData.reports) {
        dataToExport = exportData.reports;
      } else if (Array.isArray(exportData)) {
        dataToExport = exportData;
      } else if (exportData.data) {
        dataToExport = exportData.data;
      }

      switch (selectedDataType) {
        case 'sessions':
          await ExportService.exportSessions(dataToExport, exportOptions);
          break;
        case 'progress-reports':
          await ExportService.exportProgressReports(dataToExport, exportOptions);
          break;
        default:
          // For other types, use sessions export as generic
          await ExportService.exportSessions(dataToExport, exportOptions);
      }

      message.success('បានទាញយកដោយជោគជ័យ!');
    } catch (error) {
      console.error('Export error:', error);
      message.error('មានបញ្ហាក្នុងការទាញយក');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">មជ្ឈមណ្ឌលទាញយកទិន្នន័យ</h1>

      <Card title="កំណត់រចនាសម្ព័ន្ធការទាញយក" className="mb-6">
        <Form
          form={form}
          layout="vertical"
          onFinish={handleExport}
          initialValues={{
            format: 'excel',
            dateRange: [dayjs().subtract(1, 'month'), dayjs()],
          }}
        >
          <Form.Item
            name="dataType"
            label="ប្រភេទទិន្នន័យ"
            rules={[{ required: true, message: 'សូមជ្រើសរើសប្រភេទទិន្នន័យ' }]}
          >
            <Select 
              placeholder="ជ្រើសរើសប្រភេទទិន្នន័យ"
              onChange={handleDataTypeChange}
            >
              {dataTypes.map(type => (
                <Option key={type.value} value={type.value}>
                  <div>
                    <div>{type.label}</div>
                    <div className="text-sm text-gray-500">{type.description}</div>
                  </div>
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="dateRange"
            label="ចន្លោះពេល"
            rules={[{ required: true, message: 'សូមជ្រើសរើសចន្លោះពេល' }]}
          >
            <RangePicker 
              style={{ width: '100%' }}
              format="DD/MM/YYYY"
            />
          </Form.Item>

          <Form.Item
            name="format"
            label="ទម្រង់ឯកសារ"
          >
            <Radio.Group>
              <Radio.Button value="excel">
                <FileExcelOutlined /> Excel
              </Radio.Button>
              <Radio.Button value="pdf">
                <FilePdfOutlined /> PDF
              </Radio.Button>
              {selectedDataType === 'sessions' && (
                <Radio.Button value="csv">
                  <FileTextOutlined /> CSV
                </Radio.Button>
              )}
            </Radio.Group>
          </Form.Item>

          <Form.Item
            name="includeDetails"
            valuePropName="checked"
          >
            <Checkbox>រួមបញ្ចូលព័ត៌មានលម្អិត</Checkbox>
          </Form.Item>

          <Form.Item>
            <Space>
              <Button
                type="primary"
                htmlType="submit"
                icon={<DownloadOutlined />}
                loading={loading}
                disabled={!exportData || dataLoading}
              >
                ទាញយក
              </Button>
              <Button onClick={() => form.resetFields()}>
                កំណត់ឡើងវិញ
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      {dataLoading && (
        <Card>
          <div className="text-center py-8">
            <Spin size="large" />
            <p className="mt-4">កំពុងទាញយកទិន្នន័យ...</p>
          </div>
        </Card>
      )}

      {exportData && !dataLoading && (
        <Card title="ការមើលជាមុន">
          <p className="mb-4">
            ទិន្នន័យត្រៀមរួចរាល់សម្រាប់ការទាញយក: {
              Array.isArray(exportData) ? exportData.length :
              exportData.sessions ? exportData.sessions.length :
              exportData.reports ? exportData.reports.length :
              exportData.data ? exportData.data.length : 0
            } កំណត់ត្រា
          </p>
          {selectedDataType === 'sessions' && exportData.sessions && (
            <Table
              dataSource={exportData.sessions.slice(0, 5)}
              columns={[
                {
                  title: 'កាលបរិច្ឆេទ',
                  dataIndex: 'scheduledDate',
                  render: (date: string) => dayjs(date).format('DD/MM/YYYY'),
                },
                {
                  title: 'ប្រភេទ',
                  dataIndex: 'sessionType',
                },
                {
                  title: 'ស្ថានភាព',
                  dataIndex: 'status',
                  render: (status: string) => <Tag>{status}</Tag>,
                },
              ]}
              pagination={false}
              size="small"
            />
          )}
          {exportData.sessions?.length > 5 && (
            <p className="text-center mt-2 text-gray-500">
              និងច្រើនទៀត...
            </p>
          )}
        </Card>
      )}
    </div>
  );
}