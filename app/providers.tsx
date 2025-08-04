'use client';

import { AutoKhmerText } from '@/components/khmer-text';
import { useKhmerFont } from '@/hooks/use-khmer-font';

export default function Providers({ children }: { children: React.ReactNode }) {
  useKhmerFont();
  
  return (
    <AutoKhmerText>
      {children}
    </AutoKhmerText>
  );
}