'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Result, Button, Typography, Card, Space, Alert } from 'antd';
import { ReloadOutlined, HomeOutlined, BugOutlined } from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  showDetails?: boolean;
  level?: 'page' | 'component' | 'section';
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error);
      console.error('Error info:', errorInfo);
    }

    // Send error to logging service
    this.logError(error, errorInfo);

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  private async logError(error: Error, errorInfo: ErrorInfo) {
    try {
      const errorLog = {
        timestamp: new Date().toISOString(),
        errorId: this.state.errorId,
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
        errorInfo: {
          componentStack: errorInfo.componentStack,
        },
        userAgent: navigator.userAgent,
        url: window.location.href,
        userId: this.getUserId(),
        level: this.props.level || 'component',
      };

      // In production, send to your error tracking service
      if (process.env.NODE_ENV === 'production') {
        await fetch('/api/errors', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(errorLog),
        }).catch(console.error);
      }
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }
  }

  private getUserId(): string | undefined {
    // Extract user ID from localStorage, cookies, or auth context
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        return user.id;
      }
    } catch {
      // Ignore errors when accessing localStorage
    }
    return undefined;
  }

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    });
  };

  private handleGoHome = () => {
    window.location.href = '/dashboard';
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleReportBug = () => {
    const subject = encodeURIComponent(`Bug Report - Error ID: ${this.state.errorId}`);
    const body = encodeURIComponent(`
Error ID: ${this.state.errorId}
URL: ${window.location.href}
Timestamp: ${new Date().toISOString()}
Error: ${this.state.error?.message}

Please describe what you were doing when this error occurred:
[Your description here]
    `);
    
    window.open(`mailto:support@plp-456.com?subject=${subject}&body=${body}`);
  };

  render() {
    if (this.state.hasError) {
      // If custom fallback is provided, use it
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { level = 'component' } = this.props;

      // Page-level error (more serious)
      if (level === 'page') {
        return (
          <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 p-4">
            <Card className="max-w-2xl w-full">
              <Result
                status="500"
                title="មានបញ្ហាបណ្តាលមកពីប្រព័ន្ធ"
                subTitle="សូមទោស! មានបញ្ហាបណ្តាលមកពីប្រព័ន្ធ។ សូមព្យាយាមម្តងទៀត ឬទាក់ទងក្រុមជំនួយបច្ចេកទេស។"
                extra={
                  <Space direction="vertical" size="middle">
                    <Space wrap>
                      <Button type="primary" icon={<ReloadOutlined />} onClick={this.handleRetry}>
                        ព្យាយាមម្តងទៀត
                      </Button>
                      <Button icon={<HomeOutlined />} onClick={this.handleGoHome}>
                        ទៅទំព័រដើម
                      </Button>
                      <Button icon={<ReloadOutlined />} onClick={this.handleReload}>
                        ផ្ទុកទំព័រឡើងវិញ
                      </Button>
                    </Space>
                    <Button 
                      type="link" 
                      icon={<BugOutlined />} 
                      onClick={this.handleReportBug}
                      size="small"
                    >
                      រាយការណ៍បញ្ហា
                    </Button>
                  </Space>
                }
              />
              
              {this.props.showDetails && this.state.error && (
                <Alert
                  message="ព័ត៌មានបច្ចេកទេស"
                  description={
                    <div>
                      <Text code>{this.state.errorId}</Text>
                      <br />
                      <Text type="secondary">{this.state.error.message}</Text>
                    </div>
                  }
                  type="warning"
                  showIcon
                  style={{ marginTop: 16 }}
                />
              )}
            </Card>
          </div>
        );
      }

      // Component-level error (less serious)
      return (
        <div className="p-4 border border-red-200 rounded-lg bg-red-50">
          <Result
            status="warning"
            title="មានបញ្ហាក្នុងការបង្ហាញ"
            subTitle="ផ្នែកនេះមិនអាចបង្ហាញបានបន្ទាប់ពីមានបញ្ហាបណ្តាលមកពីប្រព័ន្ធ។"
            extra={
              <Space wrap>
                <Button size="small" icon={<ReloadOutlined />} onClick={this.handleRetry}>
                  ព្យាយាមម្តងទៀត
                </Button>
                <Button 
                  size="small" 
                  type="link" 
                  icon={<BugOutlined />} 
                  onClick={this.handleReportBug}
                >
                  រាយការណ៍បញ្ហា
                </Button>
              </Space>
            }
          />
          
          {this.props.showDetails && this.state.error && (
            <div className="mt-4 p-3 bg-white rounded border">
              <Text strong>Error ID: </Text>
              <Text code>{this.state.errorId}</Text>
              <br />
              <Text type="secondary">{this.state.error.message}</Text>
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

// Wrapper component for functional components
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
}

// Higher-order component for class components
export function errorBoundary(
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  return function <P extends object>(Component: React.ComponentType<P>) {
    return withErrorBoundary(Component, errorBoundaryProps);
  };
}

// Specialized error boundaries for different contexts
export const PageErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
  <ErrorBoundary level="page" showDetails={process.env.NODE_ENV === 'development'}>
    {children}
  </ErrorBoundary>
);

export const ComponentErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
  <ErrorBoundary level="component" showDetails={process.env.NODE_ENV === 'development'}>
    {children}
  </ErrorBoundary>
);

export const SectionErrorBoundary: React.FC<{ children: ReactNode }> = ({ children }) => (
  <ErrorBoundary level="section">
    {children}
  </ErrorBoundary>
);

// Hook to manually trigger error boundary
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null);

  const throwError = React.useCallback((error: Error) => {
    setError(error);
  }, []);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  return throwError;
}