/**
 * Utility functions for formatting data
 */

/**
 * Format date string to Korean locale
 *
 * @param {string|Date} dateString - ISO date string or Date object
 * @param {Object} [options] - Intl.DateTimeFormat options
 * @returns {string} Formatted date
 *
 * @example
 * formatDate('2025-11-05T10:30:00Z')
 * // => '2025년 11월 5일 오전 10:30'
 */
export const formatDate = (dateString, options = {}) => {
  if (!dateString) return '-';

  const date = new Date(dateString);

  if (isNaN(date.getTime())) {
    return '-';
  }

  const defaultOptions = {
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
 * @param {string|Date} dateString - ISO date string or Date object
 * @returns {string} Formatted date
 *
 * @example
 * formatDateShort('2025-11-05T10:30:00Z')
 * // => '2025년 11월 5일'
 */
export const formatDateShort = (dateString) => {
  return formatDate(dateString, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

/**
 * Format date to relative time (e.g., "2시간 전")
 *
 * @param {string|Date} dateString - ISO date string or Date object
 * @returns {string} Relative time string
 *
 * @example
 * formatRelativeTime('2025-11-05T10:30:00Z')
 * // => '2시간 전' (if current time is 12:30)
 */
export const formatRelativeTime = (dateString) => {
  if (!dateString) return '-';

  const date = new Date(dateString);
  const now = new Date();

  if (isNaN(date.getTime())) {
    return '-';
  }

  const diffMs = now - date;
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
 * @param {number} bytes - File size in bytes
 * @param {number} [decimals=2] - Number of decimal places
 * @returns {string} Formatted file size
 *
 * @example
 * formatFileSize(1024)
 * // => '1 KB'
 *
 * @example
 * formatFileSize(1536000)
 * // => '1.46 MB'
 */
export const formatFileSize = (bytes, decimals = 2) => {
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
 * @param {string} text - Text to truncate
 * @param {number} [maxLength=100] - Maximum length
 * @returns {string} Truncated text
 *
 * @example
 * truncateText('This is a very long text...', 10)
 * // => 'This is a...'
 */
export const truncateText = (text, maxLength = 100) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

/**
 * Format number with thousand separators
 *
 * @param {number} number - Number to format
 * @returns {string} Formatted number
 *
 * @example
 * formatNumber(1234567)
 * // => '1,234,567'
 */
export const formatNumber = (number) => {
  if (number === null || number === undefined) return '-';
  return number.toLocaleString('ko-KR');
};

/**
 * Format percentage
 *
 * @param {number} value - Value (0-100 or 0-1)
 * @param {Object} options - Format options
 * @param {number} [options.decimals=1] - Number of decimal places
 * @param {boolean} [options.multiply=false] - Multiply by 100 if value is 0-1
 * @returns {string} Formatted percentage
 *
 * @example
 * formatPercentage(85.5)
 * // => '85.5%'
 *
 * @example
 * formatPercentage(0.855, { multiply: true })
 * // => '85.5%'
 */
export const formatPercentage = (value, options = {}) => {
  const { decimals = 1, multiply = false } = options;

  if (value === null || value === undefined) return '-';

  const percentage = multiply ? value * 100 : value;
  return `${percentage.toFixed(decimals)}%`;
};

/**
 * Format currency (KRW)
 *
 * @param {number} amount - Amount in KRW
 * @returns {string} Formatted currency
 *
 * @example
 * formatCurrency(1234567)
 * // => '₩1,234,567'
 */
export const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return '-';
  return `₩${formatNumber(amount)}`;
};

/**
 * Format time duration
 *
 * @param {number} seconds - Duration in seconds
 * @returns {string} Formatted duration
 *
 * @example
 * formatDuration(3665)
 * // => '1시간 1분 5초'
 *
 * @example
 * formatDuration(125)
 * // => '2분 5초'
 */
export const formatDuration = (seconds) => {
  if (!seconds || seconds === 0) return '0초';

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const parts = [];

  if (hours > 0) parts.push(`${hours}시간`);
  if (minutes > 0) parts.push(`${minutes}분`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs}초`);

  return parts.join(' ');
};

/**
 * Parse date string to Date object
 *
 * @param {string|Date} dateString - Date string or Date object
 * @returns {Date|null} Date object or null if invalid
 *
 * @example
 * parseDate('2025-11-05')
 * // => Date object
 */
export const parseDate = (dateString) => {
  if (!dateString) return null;
  if (dateString instanceof Date) return dateString;

  const date = new Date(dateString);
  return isNaN(date.getTime()) ? null : date;
};

/**
 * Check if date is past
 *
 * @param {string|Date} dateString - Date to check
 * @returns {boolean} True if date is in the past
 *
 * @example
 * isPastDate('2020-01-01')
 * // => true
 */
export const isPastDate = (dateString) => {
  const date = parseDate(dateString);
  if (!date) return false;
  return date < new Date();
};

/**
 * Check if date is future
 *
 * @param {string|Date} dateString - Date to check
 * @returns {boolean} True if date is in the future
 *
 * @example
 * isFutureDate('2030-01-01')
 * // => true
 */
export const isFutureDate = (dateString) => {
  const date = parseDate(dateString);
  if (!date) return false;
  return date > new Date();
};

/**
 * Get file extension from filename
 *
 * @param {string} filename - Filename
 * @returns {string} File extension (lowercase, without dot)
 *
 * @example
 * getFileExtension('document.PDF')
 * // => 'pdf'
 */
export const getFileExtension = (filename) => {
  if (!filename) return '';
  const parts = filename.split('.');
  if (parts.length === 1) return '';
  return parts[parts.length - 1].toLowerCase();
};

/**
 * Get file type category from mime type or extension
 *
 * @param {string} mimeTypeOrFilename - MIME type or filename
 * @returns {string} File type category (image, video, audio, document, etc.)
 *
 * @example
 * getFileTypeCategory('image/png')
 * // => 'image'
 *
 * @example
 * getFileTypeCategory('document.pdf')
 * // => 'pdf'
 */
export const getFileTypeCategory = (mimeTypeOrFilename) => {
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
 * @param {string|Date} dateString - ISO date string or Date object
 * @returns {string} Formatted date with time
 */
export const formatDateTime = (dateString) => {
  return formatDate(dateString);
};

/**
 * Format date for HTML input[type="datetime-local"]
 * @param {string|Date} dateString - ISO date string or Date object  
 * @returns {string} Formatted date for input (YYYY-MM-DDTHH:mm)
 */
export const formatDateForInput = (dateString) => {
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
