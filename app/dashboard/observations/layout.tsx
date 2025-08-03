'use client';

import { Hanuman } from 'next/font/google';
import { LanguageProvider } from '@/contexts/LanguageContext';
import './observations.css';

const hanuman = Hanuman({ 
  weight: ['400', '700'],
  subsets: ['khmer'],
  display: 'swap',
  variable: '--font-hanuman'
});

export default function ObservationsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={hanuman.variable}>
      <LanguageProvider>
        {children}
      </LanguageProvider>
    </div>
  );
}