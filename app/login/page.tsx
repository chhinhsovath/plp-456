'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './login.module.css';

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const [formData, setFormData] = useState({ email: '', password: '' });

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
        setError(data.error || 'Login failed');
        setLoading(false);
      }
    } catch (error) {
      setError('Login failed. Please try again.');
      setLoading(false);
    }
  };

  const demoAccounts = [
    { role: 'Administrator', email: 'admin@openplp.com', password: 'admin123' },
    { role: 'Teacher', email: 'teacher@openplp.com', password: 'teacher123' },
    { role: 'Mentor', email: 'mentor@openplp.com', password: 'mentor123' },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.header}>
          <h2>Teacher Observation System</h2>
          <p>Sign in to your account</p>
        </div>

        <form onSubmit={handleLogin} className={styles.form}>
          {error && <div className={styles.error}>{error}</div>}
          
          <div className={styles.formGroup}>
            <label htmlFor="email">Email</label>
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
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Enter your password"
              required
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className={styles.submitButton}
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div className={styles.demoSection}>
          <p><strong>Demo Accounts:</strong></p>
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