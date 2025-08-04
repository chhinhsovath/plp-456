'use client';

import { useEffect } from 'react';

export const useKhmerFont = () => {
  useEffect(() => {
    // Force font loading
    if (typeof window !== 'undefined' && 'fonts' in document) {
      document.fonts.load('400 1em Hanuman').then(() => {
        console.log('Hanuman font loaded');
      }).catch((err) => {
        console.error('Failed to load Hanuman font:', err);
      });
      
      // Load all font weights
      const weights = ['100', '300', '400', '700', '900'];
      weights.forEach(weight => {
        document.fonts.load(`${weight} 1em Hanuman`).catch(() => {});
      });
    }
  }, []);
};