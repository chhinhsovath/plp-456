'use client';

import { ReactNode } from 'react';
import { Row, Col } from 'antd';

interface ResponsivePageLayoutProps {
  children: ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  padding?: boolean;
}

export default function ResponsivePageLayout({ 
  children, 
  maxWidth = 'full',
  padding = true 
}: ResponsivePageLayoutProps) {
  const getMaxWidth = () => {
    switch (maxWidth) {
      case 'sm': return '640px';
      case 'md': return '768px';
      case 'lg': return '1024px';
      case 'xl': return '1280px';
      case 'full': 
      default: return '100%';
    }
  };

  return (
    <div 
      style={{ 
        width: '100%',
        maxWidth: getMaxWidth(),
        margin: '0 auto',
        padding: padding ? '16px' : 0,
      }}
    >
      <Row gutter={[16, 16]}>
        <Col span={24}>
          {children}
        </Col>
      </Row>
    </div>
  );
}