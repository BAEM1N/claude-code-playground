/**
// @ts-nocheck
 * Reusable loading spinner component
// @ts-nocheck
 */
// @ts-nocheck
import React from 'react';

export type SpinnerSize = 'sm' | 'md' | 'lg';

export interface LoadingSpinnerProps {
  /**
   * Size of the spinner
   * @default 'lg'
   */
  size?: SpinnerSize;

  /**
   * Optional loading message to display below spinner
   */
  message?: string;

  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Loading spinner with customizable size and optional message
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
 * <LoadingSpinner size="sm" />
 */
export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'lg',
  message,
  className = ''
}) => {
  const sizeClasses: Record<SpinnerSize, string> = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  return (
    <div className={`flex flex-col justify-center items-center py-12 ${className}`}>
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
