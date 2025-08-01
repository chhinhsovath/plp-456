'use client';

import { useState, useEffect } from 'react';
import { Card, Button, Space, Typography } from 'antd';
import { DownloadOutlined, CloseOutlined, MobileOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return;
    }

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Check if should show iOS prompt
    if (isIOSDevice && !window.navigator.standalone) {
      // Show iOS install instructions after a delay
      setTimeout(() => setShowPrompt(true), 3000);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    }
    
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    // Store dismissal in localStorage to not show again for some time
    localStorage.setItem('pwa-prompt-dismissed', Date.now().toString());
  };

  if (!showPrompt) return null;

  // iOS Install Instructions
  if (isIOS) {
    return (
      <Card className="pwa-install-prompt" bodyStyle={{ padding: 16 }}>
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <MobileOutlined style={{ fontSize: 20, color: '#1890ff' }} />
              <Text strong>ដំឡើងកម្មវិធី</Text>
            </div>
            <Text type="secondary" className="text-sm">
              ចុច <span className="inline-block mx-1">⬆️</span> រួចជ្រើសរើស "Add to Home Screen"
            </Text>
          </div>
          <Button
            type="text"
            icon={<CloseOutlined />}
            onClick={handleDismiss}
            size="small"
          />
        </div>
      </Card>
    );
  }

  // Android/Desktop Install Prompt
  return (
    <Card className="pwa-install-prompt" bodyStyle={{ padding: 16 }}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <MobileOutlined style={{ fontSize: 20, color: '#1890ff' }} />
            <Text strong>ដំឡើងកម្មវិធីណែនាំ</Text>
          </div>
          <Text type="secondary" className="text-sm">
            ដំឡើងសម្រាប់ការចូលប្រើលឿន និងមុខងារក្រៅបណ្តាញ
          </Text>
        </div>
        <Space>
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            onClick={handleInstall}
            size="small"
          >
            ដំឡើង
          </Button>
          <Button
            type="text"
            icon={<CloseOutlined />}
            onClick={handleDismiss}
            size="small"
          />
        </Space>
      </div>
    </Card>
  );
}