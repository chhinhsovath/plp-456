import type { Metadata } from 'next';
import './globals.css';
import '@/lib/suppress-warnings';
import Providers from './providers';
import { inter, hanuman } from './fonts';

export const metadata: Metadata = {
  title: 'Teacher Observation System',
  description: 'Professional Learning Partnership - Teacher Observation Platform',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.png',
    apple: '/favicon.png',
  },
};

export const viewport = {
  themeColor: '#1890ff',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${hanuman.variable}`}>
      <body className={inter.className}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}