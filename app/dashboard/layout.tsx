'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useSession } from '@/hooks/useSession';
import { useTranslation } from '@/lib/translations';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import styles from './dashboard.module.css';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(true); // Default to collapsed on mobile
  const [isMobile, setIsMobile] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { data: user, status } = useSession();
  const { t } = useTranslation();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Auto-close sidebar on route change on mobile
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
    <div className={styles.layout}>
      {/* Mobile overlay - only show on mobile when sidebar is open */}
      {isMobile && (
        <div 
          className={`${styles.mobileOverlay} ${!collapsed ? styles.visible : ''}`}
          onClick={() => setCollapsed(true)}
        />
      )}
      
      <aside className={`${styles.sidebar} ${collapsed ? styles.collapsed : ''}`}>
        <div className={styles.logo}>
          <h2>{collapsed ? 'TOS' : 'Teacher Observation'}</h2>
        </div>
        
        <nav className={styles.nav}>
          {menuItems.map((item) => (
            <button
              key={item.path}
              className={`${styles.navItem} ${pathname === item.path ? styles.active : ''}`}
              onClick={() => {
                router.push(item.path);
                // Close sidebar on mobile after navigation
                if (window.innerWidth <= 768) {
                  setCollapsed(true);
                }
              }}
            >
              <span className={styles.icon}>{item.icon}</span>
              {!collapsed && <span>{item.label}</span>}
            </button>
          ))}
        </nav>
      </aside>

      <div className={styles.main}>
        <header className={styles.header}>
          <button
            className={styles.menuToggle}
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? '☰' : '✕'}
          </button>
          
          <div className={styles.userMenu}>
            <LanguageSwitcher />
            <span className={styles.userName}>{user?.name || 'User'}</span>
            <button className={styles.logoutButton} onClick={handleLogout}>
              {t('navigation.logout')}
            </button>
          </div>
        </header>

        <main className={styles.content}>
          {children}
        </main>
      </div>
    </div>
  );
}