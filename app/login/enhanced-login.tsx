'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '@/lib/translations';
import { AnimatedInput } from '@/components/ui/animated-input';
import AnimatedButton from '@/components/ui/animated-button';
import FadeIn from '@/components/ui/fade-in';

export default function EnhancedLoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const { t, language, setLanguage } = useTranslation();

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
        window.location.href = '/dashboard';
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
    { role: t('users.roles.admin'), email: 'admin@openplp.com', password: 'admin123', color: 'from-blue-500 to-purple-600', icon: '👑' },
    { role: t('users.roles.teacher'), email: 'teacher@openplp.com', password: 'teacher123', color: 'from-green-500 to-teal-600', icon: '👨‍🏫' },
    { role: t('users.roles.observer'), email: 'mentor@openplp.com', password: 'mentor123', color: 'from-orange-500 to-red-600', icon: '👁️' },
  ];

  const backgroundVariants = {
    animate: {
      backgroundPosition: ['0% 0%', '100% 100%'],
      transition: {
        duration: 20,
        ease: 'linear' as const,
        repeat: Infinity,
        repeatType: 'reverse' as const,
      },
    },
  };

  return (
    <motion.div 
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-400 via-purple-500 to-pink-500 p-4"
      variants={backgroundVariants}
      animate="animate"
      style={{ backgroundSize: '400% 400%' }}
    >
      {/* Animated background shapes */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl"
          animate={{
            x: [0, 100, 0],
            y: [0, -100, 0],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-white/10 rounded-full blur-3xl"
          animate={{
            x: [0, -100, 0],
            y: [0, 100, 0],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      <FadeIn>
        <motion.div 
          className="relative bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <motion.div 
            className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white"
            initial={{ y: -50 }}
            animate={{ y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex justify-between items-center">
              <div>
                <motion.h2 
                  className="text-2xl font-bold mb-1"
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  {t('login.title')}
                </motion.h2>
                <motion.p 
                  className="text-white/80 text-sm"
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  {t('login.subtitle')}
                </motion.p>
              </div>
              
              {/* Language Switcher */}
              <motion.button
                className="px-3 py-2 bg-white/20 backdrop-blur rounded-lg hover:bg-white/30 transition-colors"
                onClick={() => setLanguage(language === 'km' ? 'en' : 'km')}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {language === 'km' ? '🇰🇭 KM' : '🇬🇧 EN'}
              </motion.button>
            </div>
          </motion.div>

          {/* Form */}
          <form onSubmit={handleLogin} className="p-6 space-y-6">
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.9 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.9 }}
                  className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2"
                >
                  <span className="text-red-500">⚠️</span>
                  <p className="text-red-700 text-sm">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatedInput
              type="email"
              label={t('login.email')}
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="email@example.com"
              required
              icon={<span>📧</span>}
            />

            <AnimatedInput
              type="password"
              label={t('login.password')}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder={t('login.password')}
              required
              icon={<span>🔒</span>}
            />

            <AnimatedButton
              type="submit"
              variant="primary"
              size="lg"
              loading={loading}
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              {loading ? t('common.loading') : t('login.signIn')}
            </AnimatedButton>
          </form>

          {/* Demo Accounts */}
          <div className="p-6 bg-gray-50 border-t border-gray-200">
            <motion.p 
              className="text-sm text-gray-600 font-semibold mb-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              {t('login.demoAccounts')}:
            </motion.p>
            
            <div className="space-y-2">
              {demoAccounts.map((account, index) => (
                <motion.button
                  key={account.email}
                  type="button"
                  onClick={() => {
                    setFormData({ 
                      email: account.email, 
                      password: account.password 
                    });
                  }}
                  className="w-full p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-all border border-gray-200"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + index * 0.1 }}
                  whileHover={{ scale: 1.02, x: 5 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <motion.div
                        className={`w-10 h-10 rounded-full bg-gradient-to-r ${account.color} flex items-center justify-center text-white shadow-md`}
                        whileHover={{ rotate: 360 }}
                        transition={{ duration: 0.5 }}
                      >
                        <span className="text-lg">{account.icon}</span>
                      </motion.div>
                      <div className="text-left">
                        <p className="font-semibold text-gray-800">{account.role}</p>
                        <p className="text-xs text-gray-500">{account.email}</p>
                      </div>
                    </div>
                    <motion.svg
                      className="w-5 h-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      whileHover={{ x: 5 }}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </motion.svg>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Footer */}
          <motion.div 
            className="p-4 text-center text-xs text-gray-500 bg-gray-100"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            MENTOR © 2025 - {language === 'km' ? 'ប្រព័ន្ធគ្រប់គ្រងគ្រូបង្រៀន' : 'Teacher Management System'}
          </motion.div>
        </motion.div>
      </FadeIn>
    </motion.div>
  );
}