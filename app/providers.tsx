'use client';

// Configure dayjs for Ant Design
import '@/lib/dayjs-config';

// Warning suppression is handled in suppress-warnings.ts

import { AntdRegistry } from '@ant-design/nextjs-registry';
import { ConfigProvider, App } from 'antd';
import { theme } from '@/lib/antd-theme';
import dayjs from '@/lib/dayjs-config';
import { OfflineIndicator } from '@/components/OfflineIndicator';
import locale from 'antd/locale/en_US';
import { DATE_FORMATS } from '@/lib/date-utils';

// Customize locale for Khmer date format
const customLocale = {
  ...locale,
  DatePicker: {
    ...locale.DatePicker,
    lang: {
      ...locale.DatePicker?.lang,
      locale: 'km_KH',
      placeholder: 'ជ្រើសរើសកាលបរិច្ឆេទ',
      yearPlaceholder: 'ជ្រើសរើសឆ្នាំ',
      quarterPlaceholder: 'ជ្រើសរើសត្រីមាស',
      monthPlaceholder: 'ជ្រើសរើសខែ',
      weekPlaceholder: 'ជ្រើសរើសសប្តាហ៍',
      rangePlaceholder: ['កាលបរិច្ឆេទចាប់ផ្តើម', 'កាលបរិច្ឆេទបញ្ចប់'],
      rangeYearPlaceholder: ['ឆ្នាំចាប់ផ្តើម', 'ឆ្នាំបញ្ចប់'],
      rangeQuarterPlaceholder: ['ត្រីមាសចាប់ផ្តើម', 'ត្រីមាសបញ្ចប់'],
      rangeMonthPlaceholder: ['ខែចាប់ផ្តើម', 'ខែបញ្ចប់'],
      rangeWeekPlaceholder: ['សប្តាហ៍ចាប់ផ្តើម', 'សប្តាហ៍បញ្ចប់'],
    },
  },
};

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AntdRegistry>
      <ConfigProvider 
        theme={theme}
        locale={customLocale}
        // Suppress React 19 compatibility warning
        warning={{ strict: false }}
      >
        <App>
          {children}
          <OfflineIndicator />
        </App>
      </ConfigProvider>
    </AntdRegistry>
  );
}