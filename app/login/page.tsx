'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/translations';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import styles from './login.module.css';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const { t } = useTranslation();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Use window.location for a hard redirect to ensure cookie is set
        window.location.href = '/dashboard';
        // Don't set loading to false on success since we're redirecting
        return;
      } else {
        setError(data.error || t('login.loginFailed'));
        setLoading(false);
      }
    } catch (error) {
      setError(t('login.loginFailed'));
      setLoading(false);
    }
  };

  const demoAccounts = [
    { role: t('users.roles.admin'), email: 'admin@openplp.com', password: 'admin123' },
    { role: t('users.roles.teacher'), email: 'teacher@openplp.com', password: 'teacher123' },
    { role: t('users.roles.observer'), email: 'mentor@openplp.com', password: 'mentor123' },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2>{t('login.title')}</h2>
              <p>{t('login.subtitle')}</p>
            </div>
            <LanguageSwitcher />
          </div>
        </div>

        <form onSubmit={handleLogin} className={styles.form}>
          {error && <div className={styles.error}>{error}</div>}
          
          <div className={styles.formGroup}>
            <label htmlFor="email">{t('login.email')}</label>
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="email@example.com"
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="password">{t('login.password')}</label>
            <input
              type="password"
              id="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder={t('login.password')}
              required
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className={styles.submitButton}
          >
            {loading ? t('common.loading') : t('login.signIn')}
          </button>
        </form>

        <div className={styles.demoSection}>
          <p><strong>{t('login.demoAccounts')}:</strong></p>
          <div className={styles.demoAccounts}>
            {demoAccounts.map((account) => (
              <button
                key={account.email}
                type="button"
                onClick={() => {
                  setFormData({ 
                    email: account.email, 
                    password: account.password 
                  });
                }}
                className={styles.demoButton}
              >
                <div>{account.role}</div>
                <small>{account.email} / {account.password}</small>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}