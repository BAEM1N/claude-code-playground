/**
 * Reusable loading spinner component
 */
import React from 'react';

/**
 * Loading spinner with customizable size and optional message
 *
 * @param {Object} props
 * @param {'small'|'medium'|'large'} props.size - Spinner size (default: 'large')
 * @param {string} props.message - Optional loading message
 * @returns {JSX.Element}
 *
 * @example
 * // Basic usage
 * <LoadingSpinner />
 *
 * @example
 * // With message
 * <LoadingSpinner message="데이터를 불러오는 중..." />
 *
 * @example
 * // Small size
 * <LoadingSpinner size="small" />
 */
export const LoadingSpinner = ({ size = 'large', message = '' }) => {
  const sizeClasses = {
    small: 'h-6 w-6',
    medium: 'h-8 w-8',
    large: 'h-12 w-12'
  };

  return (
    <div className="flex flex-col justify-center items-center py-12">
      <div
        className={`animate-spin rounded-full ${sizeClasses[size]} border-b-2 border-blue-600`}
        role="status"
        aria-label="로딩 중"
      >
        <span className="sr-only">로딩 중...</span>
      </div>
      {message && (
        <p className="mt-4 text-sm text-gray-600">
          {message}
        </p>
      )}
    </div>
  );
};

export default LoadingSpinner;
