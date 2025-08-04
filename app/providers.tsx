'use client';

import { AutoKhmerText } from '@/components/khmer-text';
import { useKhmerFont } from '@/hooks/use-khmer-font';
import { LanguageProvider } from '@/contexts/LanguageContext';

export default function Providers({ children }: { children: React.ReactNode }) {
  useKhmerFont();
  
  return (
    <LanguageProvider>
      <AutoKhmerText>
        {children}
      </AutoKhmerText>
    </LanguageProvider>
  );
}