'use client';

import { useState } from 'react';
import { Button, Dropdown, Menu, message } from 'antd';
import { DownloadOutlined, FileExcelOutlined, FilePdfOutlined, FileTextOutlined } from '@ant-design/icons';
import { ExportService } from '@/lib/export/export-service';

interface ExportButtonProps {
  data: any[];
  type: 'sessions' | 'progress-reports' | 'observations' | 'feedback';
  filename?: string;
  title?: string;
  className?: string;
}

export function ExportButton({ 
  data, 
  type, 
  filename = `export-${Date.now()}`,
  title,
  className 
}: ExportButtonProps) {
  const [exporting, setExporting] = useState(false);

  const handleExport = async (format: 'excel' | 'pdf' | 'csv') => {
    try {
      setExporting(true);
      
      const exportOptions = {
        format,
        filename: `${filename}.${format === 'excel' ? 'xlsx' : format}`,
        title: title || getDefaultTitle(type),
      };

      switch (type) {
        case 'sessions':
          await ExportService.exportSessions(data, exportOptions);
          break;
        case 'progress-reports':
          await ExportService.exportProgressReports(data, exportOptions);
          break;
        // Add more cases as needed
        default:
          throw new Error(`Unsupported export type: ${type}`);
      }

      message.success(`បានទាញយកជា ${format.toUpperCase()} ដោយជោគជ័យ`);
    } catch (error) {
      console.error('Export error:', error);
      message.error('មានបញ្ហាក្នុងការទាញយក');
    } finally {
      setExporting(false);
    }
  };

  const getDefaultTitle = (type: string): string => {
    const titles: Record<string, string> = {
      'sessions': 'របាយការណ៍វគ្គណែនាំ',
      'progress-reports': 'របាយការណ៍វឌ្ឍនភាព',
      'observations': 'របាយការណ៍ការសង្កេត',
      'feedback': 'របាយការណ៍មតិយោបល់',
    };
    return titles[type] || 'របាយការណ៍';
  };

  const menu = (
    <Menu onClick={({ key }) => handleExport(key as any)}>
      <Menu.Item key="excel" icon={<FileExcelOutlined />}>
        Excel (.xlsx)
      </Menu.Item>
      <Menu.Item key="pdf" icon={<FilePdfOutlined />}>
        PDF
      </Menu.Item>
      {type === 'sessions' && (
        <Menu.Item key="csv" icon={<FileTextOutlined />}>
          CSV
        </Menu.Item>
      )}
    </Menu>
  );

  return (
    <Dropdown overlay={menu} trigger={['click']}>
      <Button 
        icon={<DownloadOutlined />}
        loading={exporting}
        className={className}
      >
        ទាញយក
      </Button>
    </Dropdown>
  );
}