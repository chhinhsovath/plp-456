'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/hooks/useSession';
import { useTranslation } from '@/lib/translations';
import styles from './settings.module.css';
import { motion } from 'framer-motion';

interface Settings {
  notifications: {
    email: boolean;
    push: boolean;
    observations: boolean;
    evaluations: boolean;
    reminders: boolean;
  };
  display: {
    theme: 'light' | 'dark' | 'auto';
    language: 'km' | 'en';
    dateFormat: string;
    timeFormat: '12' | '24';
  };
  privacy: {
    profileVisibility: 'public' | 'private' | 'team';
    showEmail: boolean;
    showPhone: boolean;
  };
}

export default function SettingsPage() {
  const router = useRouter();
  const { data: user, status } = useSession();
  const { t, language, setLanguage } = useTranslation();
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  
  const [settings, setSettings] = useState<Settings>({
    notifications: {
      email: true,
      push: false,
      observations: true,
      evaluations: true,
      reminders: true
    },
    display: {
      theme: 'light',
      language: language,
      dateFormat: 'DD/MM/YYYY',
      timeFormat: '24'
    },
    privacy: {
      profileVisibility: 'team',
      showEmail: false,
      showPhone: false
    }
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/user/settings', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setSettings(prevSettings => ({
          ...prevSettings,
          ...data
        }));
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const handleSaveSettings = async () => {
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/user/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
        credentials: 'include'
      });

      if (response.ok) {
        setMessage(language === 'km' ? 'ការកំណត់បានរក្សាទុក' : 'Settings saved successfully');
        
        // Apply language change immediately
        if (settings.display.language !== language) {
          setLanguage(settings.display.language);
        }
      } else {
        setMessage(language === 'km' ? 'មានបញ្ហាក្នុងការរក្សាទុក' : 'Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage(language === 'km' ? 'កំហុសក្នុងការរក្សាទុក' : 'Error saving settings');
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMessage(language === 'km' ? 'ពាក្យសម្ងាត់មិនដូចគ្នា' : 'Passwords do not match');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setMessage(language === 'km' ? 'ពាក្យសម្ងាត់ត្រូវមានយ៉ាងតិច 6 តួអក្សរ' : 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        }),
        credentials: 'include'
      });

      if (response.ok) {
        setMessage(language === 'km' ? 'ពាក្យសម្ងាត់បានផ្លាស់ប្តូរ' : 'Password changed successfully');
        setShowPasswordModal(false);
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } else {
        const error = await response.json();
        setMessage(error.message || (language === 'km' ? 'មានបញ្ហាក្នុងការផ្លាស់ប្តូរពាក្យសម្ងាត់' : 'Failed to change password'));
      }
    } catch (error) {
      console.error('Error changing password:', error);
      setMessage(language === 'km' ? 'កំហុសក្នុងការផ្លាស់ប្តូរពាក្យសម្ងាត់' : 'Error changing password');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'general', label: language === 'km' ? 'ទូទៅ' : 'General', icon: '⚙️' },
    { id: 'notifications', label: language === 'km' ? 'ការជូនដំណឹង' : 'Notifications', icon: '🔔' },
    { id: 'display', label: language === 'km' ? 'ការបង្ហាញ' : 'Display', icon: '🎨' },
    { id: 'privacy', label: language === 'km' ? 'ឯកជនភាព' : 'Privacy', icon: '🔒' },
    { id: 'security', label: language === 'km' ? 'សុវត្ថិភាព' : 'Security', icon: '🛡️' }
  ];

  if (status === 'loading') {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>{language === 'km' ? 'កំពុងផ្ទុក...' : 'Loading...'}</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <motion.div 
        className={styles.header}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1>{language === 'km' ? 'ការកំណត់' : 'Settings'}</h1>
      </motion.div>

      {message && (
        <motion.div 
          className={`${styles.message} ${message.includes('successfully') || message.includes('រក្សាទុក') ? styles.success : styles.error}`}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
        >
          {message}
        </motion.div>
      )}

      <div className={styles.settingsContent}>
        {/* Tabs */}
        <motion.div 
          className={styles.tabs}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`${styles.tab} ${activeTab === tab.id ? styles.active : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className={styles.tabIcon}>{tab.icon}</span>
              <span className={styles.tabLabel}>{tab.label}</span>
            </button>
          ))}
        </motion.div>

        {/* Content */}
        <motion.div 
          className={styles.content}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {/* General Tab */}
          {activeTab === 'general' && (
            <div className={styles.tabContent}>
              <h2>{language === 'km' ? 'ការកំណត់ទូទៅ' : 'General Settings'}</h2>
              <div className={styles.section}>
                <div className={styles.infoItem}>
                  <label>{language === 'km' ? 'អ៊ីមែល' : 'Email'}</label>
                  <input type="email" value={user?.email || ''} disabled />
                </div>
                <div className={styles.infoItem}>
                  <label>{language === 'km' ? 'ឈ្មោះ' : 'Name'}</label>
                  <input type="text" value={user?.name || ''} disabled />
                </div>
                <div className={styles.infoItem}>
                  <label>{language === 'km' ? 'តួនាទី' : 'Role'}</label>
                  <input type="text" value={user?.role || ''} disabled />
                </div>
                <p className={styles.hint}>
                  {language === 'km' 
                    ? 'ដើម្បីកែប្រែព័ត៌មានទាំងនេះ សូមចូលទៅកាន់ទំព័រប្រវត្តិរូប'
                    : 'To edit this information, please go to your Profile page'}
                </p>
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className={styles.tabContent}>
              <h2>{language === 'km' ? 'ការកំណត់ការជូនដំណឹង' : 'Notification Settings'}</h2>
              <div className={styles.section}>
                <div className={styles.switchItem}>
                  <div>
                    <label>{language === 'km' ? 'ការជូនដំណឹងតាមអ៊ីមែល' : 'Email Notifications'}</label>
                    <p className={styles.description}>
                      {language === 'km' ? 'ទទួលការជូនដំណឹងតាមអ៊ីមែល' : 'Receive notifications via email'}
                    </p>
                  </div>
                  <label className={styles.switch}>
                    <input
                      type="checkbox"
                      checked={settings.notifications.email}
                      onChange={(e) => setSettings({
                        ...settings,
                        notifications: { ...settings.notifications, email: e.target.checked }
                      })}
                    />
                    <span className={styles.slider}></span>
                  </label>
                </div>

                <div className={styles.switchItem}>
                  <div>
                    <label>{language === 'km' ? 'ការជូនដំណឹងការសង្កេត' : 'Observation Notifications'}</label>
                    <p className={styles.description}>
                      {language === 'km' ? 'ជូនដំណឹងពេលមានការសង្កេតថ្មី' : 'Notify when new observations are created'}
                    </p>
                  </div>
                  <label className={styles.switch}>
                    <input
                      type="checkbox"
                      checked={settings.notifications.observations}
                      onChange={(e) => setSettings({
                        ...settings,
                        notifications: { ...settings.notifications, observations: e.target.checked }
                      })}
                    />
                    <span className={styles.slider}></span>
                  </label>
                </div>

                <div className={styles.switchItem}>
                  <div>
                    <label>{language === 'km' ? 'ការជូនដំណឹងការវាយតម្លៃ' : 'Evaluation Notifications'}</label>
                    <p className={styles.description}>
                      {language === 'km' ? 'ជូនដំណឹងពេលមានការវាយតម្លៃ' : 'Notify about evaluations'}
                    </p>
                  </div>
                  <label className={styles.switch}>
                    <input
                      type="checkbox"
                      checked={settings.notifications.evaluations}
                      onChange={(e) => setSettings({
                        ...settings,
                        notifications: { ...settings.notifications, evaluations: e.target.checked }
                      })}
                    />
                    <span className={styles.slider}></span>
                  </label>
                </div>

                <div className={styles.switchItem}>
                  <div>
                    <label>{language === 'km' ? 'ការរំលឹក' : 'Reminders'}</label>
                    <p className={styles.description}>
                      {language === 'km' ? 'ទទួលការរំលឹកអំពីកិច្ចការ' : 'Receive task reminders'}
                    </p>
                  </div>
                  <label className={styles.switch}>
                    <input
                      type="checkbox"
                      checked={settings.notifications.reminders}
                      onChange={(e) => setSettings({
                        ...settings,
                        notifications: { ...settings.notifications, reminders: e.target.checked }
                      })}
                    />
                    <span className={styles.slider}></span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Display Tab */}
          {activeTab === 'display' && (
            <div className={styles.tabContent}>
              <h2>{language === 'km' ? 'ការកំណត់ការបង្ហាញ' : 'Display Settings'}</h2>
              <div className={styles.section}>
                <div className={styles.selectItem}>
                  <label>{language === 'km' ? 'ភាសា' : 'Language'}</label>
                  <select
                    value={settings.display.language}
                    onChange={(e) => setSettings({
                      ...settings,
                      display: { ...settings.display, language: e.target.value as 'km' | 'en' }
                    })}
                  >
                    <option value="km">ខ្មែរ (Khmer)</option>
                    <option value="en">English</option>
                  </select>
                </div>

                <div className={styles.selectItem}>
                  <label>{language === 'km' ? 'ទម្រង់កាលបរិច្ឆេទ' : 'Date Format'}</label>
                  <select
                    value={settings.display.dateFormat}
                    onChange={(e) => setSettings({
                      ...settings,
                      display: { ...settings.display, dateFormat: e.target.value }
                    })}
                  >
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                  </select>
                </div>

                <div className={styles.selectItem}>
                  <label>{language === 'km' ? 'ទម្រង់ម៉ោង' : 'Time Format'}</label>
                  <select
                    value={settings.display.timeFormat}
                    onChange={(e) => setSettings({
                      ...settings,
                      display: { ...settings.display, timeFormat: e.target.value as '12' | '24' }
                    })}
                  >
                    <option value="12">12 {language === 'km' ? 'ម៉ោង' : 'hour'}</option>
                    <option value="24">24 {language === 'km' ? 'ម៉ោង' : 'hour'}</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Privacy Tab */}
          {activeTab === 'privacy' && (
            <div className={styles.tabContent}>
              <h2>{language === 'km' ? 'ការកំណត់ឯកជនភាព' : 'Privacy Settings'}</h2>
              <div className={styles.section}>
                <div className={styles.selectItem}>
                  <label>{language === 'km' ? 'ភាពមើលឃើញប្រវត្តិរូប' : 'Profile Visibility'}</label>
                  <select
                    value={settings.privacy.profileVisibility}
                    onChange={(e) => setSettings({
                      ...settings,
                      privacy: { ...settings.privacy, profileVisibility: e.target.value as any }
                    })}
                  >
                    <option value="public">{language === 'km' ? 'សាធារណៈ' : 'Public'}</option>
                    <option value="team">{language === 'km' ? 'ក្រុមការងារ' : 'Team Only'}</option>
                    <option value="private">{language === 'km' ? 'ឯកជន' : 'Private'}</option>
                  </select>
                </div>

                <div className={styles.switchItem}>
                  <div>
                    <label>{language === 'km' ? 'បង្ហាញអ៊ីមែល' : 'Show Email'}</label>
                    <p className={styles.description}>
                      {language === 'km' ? 'អនុញ្ញាតអ្នកផ្សេងមើលអ៊ីមែលរបស់អ្នក' : 'Allow others to see your email'}
                    </p>
                  </div>
                  <label className={styles.switch}>
                    <input
                      type="checkbox"
                      checked={settings.privacy.showEmail}
                      onChange={(e) => setSettings({
                        ...settings,
                        privacy: { ...settings.privacy, showEmail: e.target.checked }
                      })}
                    />
                    <span className={styles.slider}></span>
                  </label>
                </div>

                <div className={styles.switchItem}>
                  <div>
                    <label>{language === 'km' ? 'បង្ហាញលេខទូរស័ព្ទ' : 'Show Phone'}</label>
                    <p className={styles.description}>
                      {language === 'km' ? 'អនុញ្ញាតអ្នកផ្សេងមើលលេខទូរស័ព្ទរបស់អ្នក' : 'Allow others to see your phone number'}
                    </p>
                  </div>
                  <label className={styles.switch}>
                    <input
                      type="checkbox"
                      checked={settings.privacy.showPhone}
                      onChange={(e) => setSettings({
                        ...settings,
                        privacy: { ...settings.privacy, showPhone: e.target.checked }
                      })}
                    />
                    <span className={styles.slider}></span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className={styles.tabContent}>
              <h2>{language === 'km' ? 'ការកំណត់សុវត្ថិភាព' : 'Security Settings'}</h2>
              <div className={styles.section}>
                <button
                  className={styles.passwordButton}
                  onClick={() => setShowPasswordModal(true)}
                >
                  🔑 {language === 'km' ? 'ផ្លាស់ប្តូរពាក្យសម្ងាត់' : 'Change Password'}
                </button>

                <div className={styles.securityInfo}>
                  <h3>{language === 'km' ? 'ព័ត៌មានសុវត្ថិភាព' : 'Security Information'}</h3>
                  <div className={styles.infoGrid}>
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>
                        {language === 'km' ? 'ចូលចុងក្រោយ' : 'Last Login'}
                      </span>
                      <span className={styles.infoValue}>
                        {new Date().toLocaleString()}
                      </span>
                    </div>
                    <div className={styles.infoItem}>
                      <span className={styles.infoLabel}>
                        {language === 'km' ? 'ការផ្ទៀងផ្ទាត់ពីរជំហាន' : 'Two-Factor Authentication'}
                      </span>
                      <span className={styles.infoValue}>
                        {language === 'km' ? 'មិនសកម្ម' : 'Disabled'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Save Button */}
          {activeTab !== 'security' && (
            <div className={styles.actions}>
              <button
                className={styles.saveButton}
                onClick={handleSaveSettings}
                disabled={loading}
              >
                {loading 
                  ? (language === 'km' ? 'កំពុងរក្សាទុក...' : 'Saving...')
                  : (language === 'km' ? 'រក្សាទុកការផ្លាស់ប្តូរ' : 'Save Changes')
                }
              </button>
            </div>
          )}
        </motion.div>
      </div>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div className={styles.modal}>
          <motion.div 
            className={styles.modalContent}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <h2>{language === 'km' ? 'ផ្លាស់ប្តូរពាក្យសម្ងាត់' : 'Change Password'}</h2>
            <form onSubmit={handlePasswordChange}>
              <div className={styles.formGroup}>
                <label>{language === 'km' ? 'ពាក្យសម្ងាត់បច្ចុប្បន្ន' : 'Current Password'}</label>
                <input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>{language === 'km' ? 'ពាក្យសម្ងាត់ថ្មី' : 'New Password'}</label>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                  required
                  minLength={6}
                />
              </div>
              <div className={styles.formGroup}>
                <label>{language === 'km' ? 'បញ្ជាក់ពាក្យសម្ងាត់ថ្មី' : 'Confirm New Password'}</label>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                  required
                  minLength={6}
                />
              </div>
              <div className={styles.modalActions}>
                <button type="submit" className={styles.saveButton} disabled={loading}>
                  {loading 
                    ? (language === 'km' ? 'កំពុងផ្លាស់ប្តូរ...' : 'Changing...')
                    : (language === 'km' ? 'ផ្លាស់ប្តូរពាក្យសម្ងាត់' : 'Change Password')
                  }
                </button>
                <button 
                  type="button" 
                  className={styles.cancelButton}
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPasswordForm({
                      currentPassword: '',
                      newPassword: '',
                      confirmPassword: ''
                    });
                  }}
                >
                  {language === 'km' ? 'បោះបង់' : 'Cancel'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}