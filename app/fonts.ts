import { Inter, Hanuman } from 'next/font/google';

export const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const hanuman = Hanuman({
  weight: ['100', '300', '400', '700', '900'],
  subsets: ['khmer'],
  variable: '--font-hanuman',
  display: 'swap',
  preload: true,
  fallback: ['serif'],
});