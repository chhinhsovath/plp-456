import dayjs from '@/lib/dayjs-config';

// Standard date formats for Khmer region
export const DATE_FORMATS = {
  // Display formats (DD-MM-YYYY)
  DISPLAY_DATE: 'DD-MM-YYYY',
  DISPLAY_DATE_TIME: 'DD-MM-YYYY HH:mm',
  DISPLAY_DATE_TIME_FULL: 'DD-MM-YYYY HH:mm:ss',
  DISPLAY_MONTH_YEAR: 'MM-YYYY',
  DISPLAY_YEAR: 'YYYY',
  
  // API/Database formats (keep as ISO)
  API_DATE: 'YYYY-MM-DD',
  API_DATE_TIME: 'YYYY-MM-DD HH:mm:ss',
  ISO_DATE_TIME: 'YYYY-MM-DDTHH:mm:ss.SSSZ',
  
  // Khmer locale specific
  KHMER_LONG_DATE: 'DD MMMM YYYY',
  KHMER_SHORT_DATE: 'DD MMM YYYY',
} as const;

// Convert API date (YYYY-MM-DD) to display format (DD-MM-YYYY)
export function formatDateForDisplay(date: string | Date | null | undefined): string {
  if (!date) return '';
  return dayjs(date).format(DATE_FORMATS.DISPLAY_DATE);
}

// Convert API datetime to display format
export function formatDateTimeForDisplay(date: string | Date | null | undefined): string {
  if (!date) return '';
  return dayjs(date).format(DATE_FORMATS.DISPLAY_DATE_TIME);
}

// Convert display date (DD-MM-YYYY) to API format (YYYY-MM-DD)
export function formatDateForAPI(date: string | Date | dayjs.Dayjs | null | undefined): string {
  if (!date) return '';
  
  // Handle DD-MM-YYYY string input
  if (typeof date === 'string' && date.match(/^\d{2}-\d{2}-\d{4}$/)) {
    const [day, month, year] = date.split('-');
    return `${year}-${month}-${day}`;
  }
  
  return dayjs(date).format(DATE_FORMATS.API_DATE);
}

// Parse date string in DD-MM-YYYY format
export function parseDateFromDisplay(dateStr: string): dayjs.Dayjs | null {
  if (!dateStr) return null;
  
  // Handle DD-MM-YYYY format
  if (dateStr.match(/^\d{2}-\d{2}-\d{4}$/)) {
    return dayjs(dateStr, DATE_FORMATS.DISPLAY_DATE);
  }
  
  // Try to parse as is
  const parsed = dayjs(dateStr);
  return parsed.isValid() ? parsed : null;
}

// Format date for Khmer locale
export function formatDateKhmer(date: string | Date | null | undefined, long: boolean = false): string {
  if (!date) return '';
  const format = long ? DATE_FORMATS.KHMER_LONG_DATE : DATE_FORMATS.KHMER_SHORT_DATE;
  return dayjs(date).locale('km').format(format);
}

// Get current date in display format
export function getCurrentDateDisplay(): string {
  return dayjs().format(DATE_FORMATS.DISPLAY_DATE);
}

// Get current date in API format
export function getCurrentDateAPI(): string {
  return dayjs().format(DATE_FORMATS.API_DATE);
}

// Validate date string in DD-MM-YYYY format
export function isValidDisplayDate(dateStr: string): boolean {
  if (!dateStr || !dateStr.match(/^\d{2}-\d{2}-\d{4}$/)) {
    return false;
  }
  
  const parsed = dayjs(dateStr, DATE_FORMATS.DISPLAY_DATE, true);
  return parsed.isValid();
}

// Convert between date formats
export function convertDateFormat(
  dateStr: string,
  fromFormat: string,
  toFormat: string
): string {
  const parsed = dayjs(dateStr, fromFormat, true);
  return parsed.isValid() ? parsed.format(toFormat) : '';
}

// Get date picker format for Ant Design
export function getDatePickerFormat(): string {
  return DATE_FORMATS.DISPLAY_DATE;
}

// Get date time picker format for Ant Design
export function getDateTimePickerFormat(): string {
  return DATE_FORMATS.DISPLAY_DATE_TIME;
}