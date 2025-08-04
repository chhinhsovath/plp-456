'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Spin, ConfigProvider } from 'antd';
import khKH from 'antd/locale/km_KH';

export default function AuthRedirect() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    // Get the redirect path from localStorage
    const redirectPath = localStorage.getItem('auth-redirect-path') || '/dashboard';
    
    // We don't need to check token here because:
    // 1. We just came from a successful login
    // 2. The cookie is httpOnly and can't be read by JavaScript
    // 3. The middleware will handle auth check on the next page
    
    // Wait a bit to ensure cookies are set
    setTimeout(() => {
      // Clear the redirect path
      localStorage.removeItem('auth-redirect-path');
      // Navigate to the dashboard
      window.location.href = redirectPath;
    }, 500);
  }, [router, mounted]);

  if (!mounted) {
    return null;
  }

  return (
    <ConfigProvider locale={khKH}>
      <div style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        backgroundColor: '#f0f2f5'
      }}>
        <Spin size="large" />
        <div style={{ marginTop: '20px', fontSize: '16px', color: '#666' }}>កំពុងចូលប្រើប្រាស់...</div>
      </div>
    </ConfigProvider>
  );
}