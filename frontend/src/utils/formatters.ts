/**
 * Utility functions for formatting data
 */

export type DateInput = string | Date | null | undefined;

export interface FormatPercentageOptions {
  decimals?: number;
  multiply?: boolean;
}

/**
 * Format date string to Korean locale
 *
 * @param dateString - ISO date string or Date object
 * @param options - Intl.DateTimeFormat options
 * @returns Formatted date
 *
 * @example
 * formatDate('2025-11-05T10:30:00Z')
 * // => '2025년 11월 5일 오전 10:30'
 */
export const formatDate = (dateString: DateInput, options: Intl.DateTimeFormatOptions = {}): string => {
  if (!dateString) return '-';

  const date = new Date(dateString);

  if (isNaN(date.getTime())) {
    return '-';
  }

  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    ...options
  };

  return date.toLocaleDateString('ko-KR', defaultOptions);
};

/**
 * Format date to short format (without time)
 *
 * @param dateString - ISO date string or Date object
 * @returns Formatted date
 *
 * @example
 * formatDateShort('2025-11-05T10:30:00Z')
 * // => '2025년 11월 5일'
 */
export const formatDateShort = (dateString: DateInput): string => {
  return formatDate(dateString, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

/**
 * Format date to relative time (e.g., "2시간 전")
 *
 * @param dateString - ISO date string or Date object
 * @returns Relative time string
 *
 * @example
 * formatRelativeTime('2025-11-05T10:30:00Z')
 * // => '2시간 전' (if current time is 12:30)
 */
export const formatRelativeTime = (dateString: DateInput): string => {
  if (!dateString) return '-';

  const date = new Date(dateString);
  const now = new Date();

  if (isNaN(date.getTime())) {
    return '-';
  }

  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  if (diffSecs < 60) return '방금 전';
  if (diffMins < 60) return `${diffMins}분 전`;
  if (diffHours < 24) return `${diffHours}시간 전`;
  if (diffDays < 7) return `${diffDays}일 전`;
  if (diffWeeks < 4) return `${diffWeeks}주 전`;
  if (diffMonths < 12) return `${diffMonths}개월 전`;
  return `${diffYears}년 전`;
};

/**
 * Format file size in human readable format
 *
 * @param bytes - File size in bytes
 * @param decimals - Number of decimal places
 * @returns Formatted file size
 *
 * @example
 * formatFileSize(1024)
 * // => '1 KB'
 *
 * @example
 * formatFileSize(1536000)
 * // => '1.46 MB'
 */
export const formatFileSize = (bytes: number | null | undefined, decimals: number = 2): string => {
  if (!bytes || bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

/**
 * Truncate text with ellipsis
 *
 * @param text - Text to truncate
 * @param maxLength - Maximum length
 * @returns Truncated text
 *
 * @example
 * truncateText('This is a very long text...', 10)
 * // => 'This is a...'
 */
export const truncateText = (text: string | null | undefined, maxLength: number = 100): string => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

/**
 * Format number with thousand separators
 *
 * @param number - Number to format
 * @returns Formatted number
 *
 * @example
 * formatNumber(1234567)
 * // => '1,234,567'
 */
export const formatNumber = (number: number | null | undefined): string => {
  if (number === null || number === undefined) return '-';
  return number.toLocaleString('ko-KR');
};

/**
 * Format percentage
 *
 * @param value - Value (0-100 or 0-1)
 * @param options - Format options
 * @returns Formatted percentage
 *
 * @example
 * formatPercentage(85.5)
 * // => '85.5%'
 *
 * @example
 * formatPercentage(0.855, { multiply: true })
 * // => '85.5%'
 */
export const formatPercentage = (value: number | null | undefined, options: FormatPercentageOptions = {}): string => {
  const { decimals = 1, multiply = false } = options;

  if (value === null || value === undefined) return '-';

  const percentage = multiply ? value * 100 : value;
  return `${percentage.toFixed(decimals)}%`;
};

/**
 * Format currency (KRW)
 *
 * @param amount - Amount in KRW
 * @returns Formatted currency
 *
 * @example
 * formatCurrency(1234567)
 * // => '₩1,234,567'
 */
export const formatCurrency = (amount: number | null | undefined): string => {
  if (amount === null || amount === undefined) return '-';
  return `₩${formatNumber(amount)}`;
};

/**
 * Format time duration
 *
 * @param seconds - Duration in seconds
 * @returns Formatted duration
 *
 * @example
 * formatDuration(3665)
 * // => '1시간 1분 5초'
 *
 * @example
 * formatDuration(125)
 * // => '2분 5초'
 */
export const formatDuration = (seconds: number | null | undefined): string => {
  if (!seconds || seconds === 0) return '0초';

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const parts: string[] = [];

  if (hours > 0) parts.push(`${hours}시간`);
  if (minutes > 0) parts.push(`${minutes}분`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs}초`);

  return parts.join(' ');
};

/**
 * Parse date string to Date object
 *
 * @param dateString - Date string or Date object
 * @returns Date object or null if invalid
 *
 * @example
 * parseDate('2025-11-05')
 * // => Date object
 */
export const parseDate = (dateString: DateInput): Date | null => {
  if (!dateString) return null;
  if (dateString instanceof Date) return dateString;

  const date = new Date(dateString);
  return isNaN(date.getTime()) ? null : date;
};

/**
 * Check if date is past
 *
 * @param dateString - Date to check
 * @returns True if date is in the past
 *
 * @example
 * isPastDate('2020-01-01')
 * // => true
 */
export const isPastDate = (dateString: DateInput): boolean => {
  const date = parseDate(dateString);
  if (!date) return false;
  return date < new Date();
};

/**
 * Check if date is future
 *
 * @param dateString - Date to check
 * @returns True if date is in the future
 *
 * @example
 * isFutureDate('2030-01-01')
 * // => true
 */
export const isFutureDate = (dateString: DateInput): boolean => {
  const date = parseDate(dateString);
  if (!date) return false;
  return date > new Date();
};

/**
 * Get file extension from filename
 *
 * @param filename - Filename
 * @returns File extension (lowercase, without dot)
 *
 * @example
 * getFileExtension('document.PDF')
 * // => 'pdf'
 */
export const getFileExtension = (filename: string | null | undefined): string => {
  if (!filename) return '';
  const parts = filename.split('.');
  if (parts.length === 1) return '';
  return parts[parts.length - 1].toLowerCase();
};

/**
 * Get file type category from mime type or extension
 *
 * @param mimeTypeOrFilename - MIME type or filename
 * @returns File type category (image, video, audio, document, etc.)
 *
 * @example
 * getFileTypeCategory('image/png')
 * // => 'image'
 *
 * @example
 * getFileTypeCategory('document.pdf')
 * // => 'pdf'
 */
export const getFileTypeCategory = (mimeTypeOrFilename: string | null | undefined): string => {
  if (!mimeTypeOrFilename) return 'unknown';

  const str = mimeTypeOrFilename.toLowerCase();

  if (str.startsWith('image/') || /\.(jpg|jpeg|png|gif|bmp|svg|webp)$/.test(str)) {
    return 'image';
  }
  if (str.startsWith('video/') || /\.(mp4|avi|mov|wmv|flv|webm)$/.test(str)) {
    return 'video';
  }
  if (str.startsWith('audio/') || /\.(mp3|wav|ogg|m4a|flac)$/.test(str)) {
    return 'audio';
  }
  if (str.includes('pdf') || str.endsWith('.pdf')) {
    return 'pdf';
  }
  if (str.includes('zip') || str.includes('tar') || str.includes('rar') || /\.(zip|tar|gz|rar|7z)$/.test(str)) {
    return 'archive';
  }
  if (str.includes('word') || str.endsWith('.doc') || str.endsWith('.docx')) {
    return 'word';
  }
  if (str.includes('excel') || str.includes('spreadsheet') || /\.(xls|xlsx)$/.test(str)) {
    return 'excel';
  }
  if (str.includes('powerpoint') || str.includes('presentation') || /\.(ppt|pptx)$/.test(str)) {
    return 'powerpoint';
  }
  if (/\.(txt|md|csv)$/.test(str)) {
    return 'text';
  }

  return 'document';
};

/**
 * Format date with time (alias for formatDate)
 * @param dateString - ISO date string or Date object
 * @returns Formatted date with time
 */
export const formatDateTime = (dateString: DateInput): string => {
  return formatDate(dateString);
};

/**
 * Format date for HTML input[type="datetime-local"]
 * @param dateString - ISO date string or Date object
 * @returns Formatted date for input (YYYY-MM-DDTHH:mm)
 */
export const formatDateForInput = (dateString: DateInput): string => {
  if (!dateString) return '';

  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return '';
  }

  // Format as YYYY-MM-DDTHH:mm for datetime-local input
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');

  return `${year}-${month}-${day}T${hours}:${minutes}`;
};
