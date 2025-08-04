'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import styles from './LanguageSwitcher.module.css';

export default function LanguageSwitcher() {
  const { language, toggleLanguage } = useLanguage();

  return (
    <button
      onClick={toggleLanguage}
      className={styles.switcher}
      title={language === 'km' ? 'Switch to English' : 'ប្តូរទៅភាសាខ្មែរ'}
    >
      <span className={styles.flag}>
        {language === 'km' ? '🇰🇭' : '🇬🇧'}
      </span>
      <span className={styles.label}>
        {language === 'km' ? 'ខ្មែរ' : 'EN'}
      </span>
    </button>
  );
}