'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/hooks/useSession';
import { useTranslation } from '@/lib/translations';
import styles from './profile.module.css';
import { motion } from 'framer-motion';

interface UserProfile {
  id: number;
  email: string;
  name: string;
  role: string;
  phone?: string;
  organization?: string;
  position?: string;
  bio?: string;
  createdAt?: string;
  lastLogin?: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const { data: user, status } = useSession();
  const { t, language } = useTranslation();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    organization: '',
    position: '',
    bio: ''
  });

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/user/profile', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setProfile(data);
        setFormData({
          name: data.name || '',
          email: data.email || '',
          phone: data.phone || '',
          organization: data.organization || '',
          position: data.position || '',
          bio: data.bio || ''
        });
      } else {
        // If profile fetch fails, use session data as fallback
        console.error('Profile fetch failed:', response.status);
        const errorData = await response.json().catch(() => ({}));
        console.error('Error details:', errorData);
        
        // Use session user data as fallback
        if (user) {
          const fallbackProfile: UserProfile = {
            id: parseInt(user.id) || 0,
            email: user.email || '',
            name: user.name || '',
            role: user.role || 'USER',
            phone: '',
            organization: '',
            position: '',
            bio: '',
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString()
          };
          setProfile(fallbackProfile);
          setFormData({
            name: fallbackProfile.name || '',
            email: fallbackProfile.email || '',
            phone: '',
            organization: '',
            position: '',
            bio: ''
          });
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      // Use session data as fallback on error
      if (user) {
        const fallbackProfile: UserProfile = {
          id: parseInt(user.id) || 0,
          email: user.email || '',
          name: user.name || '',
          role: user.role || 'USER',
          phone: '',
          organization: '',
          position: '',
          bio: '',
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString()
        };
        setProfile(fallbackProfile);
        setFormData({
          name: fallbackProfile.name || '',
          email: fallbackProfile.email || '',
          phone: '',
          organization: '',
          position: '',
          bio: ''
        });
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
        credentials: 'include'
      });

      if (response.ok) {
        const updatedProfile = await response.json();
        setProfile(updatedProfile);
        setIsEditing(false);
        setMessage(language === 'km' ? 'ប្រវត្តិរូបបានធ្វើបច្ចុប្បន្នភាព' : 'Profile updated successfully');
        
        // Refresh session data
        window.location.reload();
      } else {
        setMessage(language === 'km' ? 'មានបញ្ហាក្នុងការធ្វើបច្ចុប្បន្នភាព' : 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage(language === 'km' ? 'កំហុសក្នុងការធ្វើបច្ចុប្បន្នភាព' : 'Error updating profile');
    } finally {
      setLoading(false);
    }
  };

  const getUserInitials = () => {
    if (!profile) return 'U';
    if (profile.name) {
      const names = profile.name.split(' ');
      if (names.length >= 2) {
        return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
      }
      return profile.name[0].toUpperCase();
    }
    return profile.email ? profile.email[0].toUpperCase() : 'U';
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role?.toUpperCase()) {
      case 'ADMINISTRATOR':
      case 'ADMIN':
        return '#dc3545';
      case 'TEACHER':
        return '#28a745';
      case 'OBSERVER':
        return '#17a2b8';
      default:
        return '#6c757d';
    }
  };

  if (status === 'loading') {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>{language === 'km' ? 'កំពុងផ្ទុក...' : 'Loading...'}</p>
      </div>
    );
  }

  // If no profile but user exists, show a message
  if (!profile && user) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>{language === 'km' ? 'ប្រវត្តិរូប' : 'Profile'}</h1>
        </div>
        <div style={{
          maxWidth: '500px',
          margin: '100px auto',
          padding: '40px',
          textAlign: 'center',
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{
            width: '80px',
            height: '80px',
            margin: '0 auto 24px',
            background: '#fee2e2',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '12px', color: '#1f2937' }}>
            {language === 'km' ? 'មិនអាចផ្ទុកប្រវត្តិរូប' : 'Unable to Load Profile'}
          </h2>
          <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '24px' }}>
            {language === 'km' 
              ? 'មានបញ្ហាក្នុងការទាញយកព័ត៌មានប្រវត្តិរូបរបស់អ្នក។ សូមព្យាយាមម្តងទៀត។'
              : 'There was a problem loading your profile information. Please try again.'}
          </p>
          <button 
            onClick={() => {
              setProfile(null);
              fetchProfile();
            }} 
            style={{
              padding: '12px 24px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'transform 0.2s, box-shadow 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(102, 126, 234, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            {language === 'km' ? '🔄 ព្យាយាមម្តងទៀត' : '🔄 Try Again'}
          </button>
        </div>
      </div>
    );
  }

  if (!profile) {
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
        <h1>{language === 'km' ? 'ប្រវត្តិរូប' : 'Profile'}</h1>
        <button
          className={styles.editButton}
          onClick={() => setIsEditing(!isEditing)}
          disabled={loading}
        >
          {isEditing 
            ? (language === 'km' ? 'បោះបង់' : 'Cancel')
            : (language === 'km' ? 'កែសម្រួល' : 'Edit')
          }
        </button>
      </motion.div>

      {message && (
        <motion.div 
          className={`${styles.message} ${message.includes('successfully') ? styles.success : styles.error}`}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
        >
          {message}
        </motion.div>
      )}

      <div className={styles.profileContent}>
        {/* Profile Header Card */}
        <motion.div 
          className={styles.profileCard}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className={styles.profileHeader}>
            <div className={styles.avatar}>
              {getUserInitials()}
            </div>
            <div className={styles.profileInfo}>
              <h2>{profile.name || 'User'}</h2>
              <p className={styles.email}>{profile.email}</p>
              <div 
                className={styles.roleBadge}
                style={{ backgroundColor: getRoleBadgeColor(profile.role) }}
              >
                {profile.role}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Profile Form */}
        <motion.div 
          className={styles.formCard}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <form onSubmit={handleSubmit}>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label>{language === 'km' ? 'ឈ្មោះពេញ' : 'Full Name'}</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  disabled={!isEditing}
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>{language === 'km' ? 'អ៊ីមែល' : 'Email'}</label>
                <input
                  type="email"
                  value={formData.email}
                  disabled
                  className={styles.disabled}
                />
              </div>

              <div className={styles.formGroup}>
                <label>{language === 'km' ? 'លេខទូរស័ព្ទ' : 'Phone Number'}</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  disabled={!isEditing}
                  placeholder={language === 'km' ? 'បញ្ចូលលេខទូរស័ព្ទ' : 'Enter phone number'}
                />
              </div>

              <div className={styles.formGroup}>
                <label>{language === 'km' ? 'ស្ថាប័ន' : 'Organization'}</label>
                <input
                  type="text"
                  value={formData.organization}
                  onChange={(e) => setFormData({...formData, organization: e.target.value})}
                  disabled={!isEditing}
                  placeholder={language === 'km' ? 'បញ្ចូលស្ថាប័ន' : 'Enter organization'}
                />
              </div>

              <div className={styles.formGroup}>
                <label>{language === 'km' ? 'តួនាទី' : 'Position'}</label>
                <input
                  type="text"
                  value={formData.position}
                  onChange={(e) => setFormData({...formData, position: e.target.value})}
                  disabled={!isEditing}
                  placeholder={language === 'km' ? 'បញ្ចូលតួនាទី' : 'Enter position'}
                />
              </div>

              <div className={`${styles.formGroup} ${styles.fullWidth}`}>
                <label>{language === 'km' ? 'ប្រវត្តិរូបសង្ខេប' : 'Bio'}</label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({...formData, bio: e.target.value})}
                  disabled={!isEditing}
                  rows={4}
                  placeholder={language === 'km' ? 'សរសេរអំពីខ្លួនអ្នក...' : 'Write about yourself...'}
                />
              </div>
            </div>

            {isEditing && (
              <div className={styles.formActions}>
                <button 
                  type="submit" 
                  className={styles.saveButton}
                  disabled={loading}
                >
                  {loading 
                    ? (language === 'km' ? 'កំពុងរក្សាទុក...' : 'Saving...')
                    : (language === 'km' ? 'រក្សាទុក' : 'Save Changes')
                  }
                </button>
                <button 
                  type="button" 
                  className={styles.cancelButton}
                  onClick={() => {
                    setIsEditing(false);
                    setFormData({
                      name: profile.name || '',
                      email: profile.email || '',
                      phone: profile.phone || '',
                      organization: profile.organization || '',
                      position: profile.position || '',
                      bio: profile.bio || ''
                    });
                  }}
                  disabled={loading}
                >
                  {language === 'km' ? 'បោះបង់' : 'Cancel'}
                </button>
              </div>
            )}
          </form>
        </motion.div>

        {/* Account Information */}
        <motion.div 
          className={styles.infoCard}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <h3>{language === 'km' ? 'ព័ត៌មានគណនី' : 'Account Information'}</h3>
          <div className={styles.infoGrid}>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>
                {language === 'km' ? 'លេខសម្គាល់' : 'User ID'}
              </span>
              <span className={styles.infoValue}>{profile.id}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>
                {language === 'km' ? 'តួនាទីក្នុងប្រព័ន្ធ' : 'System Role'}
              </span>
              <span className={styles.infoValue}>{profile.role}</span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>
                {language === 'km' ? 'កាលបរិច្ឆេទបង្កើត' : 'Created Date'}
              </span>
              <span className={styles.infoValue}>
                {profile.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'N/A'}
              </span>
            </div>
            <div className={styles.infoItem}>
              <span className={styles.infoLabel}>
                {language === 'km' ? 'ចូលចុងក្រោយ' : 'Last Login'}
              </span>
              <span className={styles.infoValue}>
                {profile.lastLogin ? new Date(profile.lastLogin).toLocaleString() : 'N/A'}
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}