'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useSession } from '@/hooks/useSession';
import { useTranslation } from '@/lib/translations';
import AnimatedSidebar from '@/components/ui/animated-sidebar';
import AnimatedNavbar from '@/components/ui/animated-navbar';
import FadeIn from '@/components/ui/fade-in';
import { motion } from 'framer-motion';
import styles from './dashboard.module.css';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: user, status } = useSession();
  const { t } = useTranslation();
  
  // Initialize state based on screen size
  const [isMobile, setIsMobile] = useState(false);
  const [collapsed, setCollapsed] = useState(false); // Default to open on desktop

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      // On mobile, default to collapsed; on desktop, default to open
      if (mobile) {
        setCollapsed(true);
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Auto-close sidebar on route change on mobile only
  useEffect(() => {
    if (isMobile) {
      setCollapsed(true);
    }
  }, [pathname, isMobile]);

  // Show loading state while checking authentication
  if (status === 'loading') {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Loading...</p>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (status === 'unauthenticated' || !user) {
    router.push('/login');
    return null;
  }

  const menuItems = [
    { path: '/dashboard', label: t('navigation.dashboard'), icon: '📊' },
    { path: '/dashboard/observations', label: t('navigation.observations'), icon: '📝' },
    { path: '/dashboard/teachers', label: t('navigation.teachers'), icon: '👥' },
    { path: '/dashboard/evaluations', label: t('navigation.evaluations'), icon: '📋' },
    { path: '/dashboard/users', label: t('navigation.users'), icon: '👤' },
    { path: '/dashboard/settings', label: t('navigation.settings'), icon: '⚙️' },
  ];

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Animated Sidebar */}
      <AnimatedSidebar />
      
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Animated Navbar */}
        <AnimatedNavbar />
        
        {/* Content */}
        <motion.main 
          className="flex-1 overflow-y-auto p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <FadeIn>
            {children}
          </FadeIn>
        </motion.main>
      </div>
    </div>
  );
}