/**
 * Reusable error alert component
 */
import React from 'react';

export interface ErrorAlertProps {
  /**
   * Error message to display
   */
  message: string;

  /**
   * Optional error title
   * @default '오류'
   */
  title?: string;

  /**
   * Optional retry callback
   */
  onRetry?: () => void;

  /**
   * Optional close callback
   */
  onClose?: () => void;

  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Error alert with optional retry and close buttons
 *
 * @example
 * // Basic usage
 * <ErrorAlert message="데이터를 불러오는데 실패했습니다." />
 *
 * @example
 * // With retry button
 * <ErrorAlert
 *   message="네트워크 오류가 발생했습니다."
 *   onRetry={handleRetry}
 * />
 *
 * @example
 * // With custom title and close button
 * <ErrorAlert
 *   title="저장 실패"
 *   message="파일을 저장할 수 없습니다."
 *   onClose={handleClose}
 * />
 */
export const ErrorAlert: React.FC<ErrorAlertProps> = ({
  message,
  title = '오류',
  onRetry,
  onClose,
  className = ''
}) => {
  return (
    <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-start">
        {/* Error Icon */}
        <div className="flex-shrink-0">
          <svg
            className="h-5 w-5 text-red-400"
            fill="currentColor"
            viewBox="0 0 20 20"
            aria-hidden="true"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
        </div>

        {/* Error Content */}
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-red-800">
            {title}
          </h3>
          <div className="mt-1 text-sm text-red-700">
            <p>{message}</p>
          </div>

          {/* Retry Button */}
          {onRetry && (
            <div className="mt-3">
              <button
                type="button"
                onClick={onRetry}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
              >
                <svg
                  className="-ml-0.5 mr-1.5 h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                다시 시도
              </button>
            </div>
          )}
        </div>

        {/* Close Button */}
        {onClose && (
          <div className="ml-auto pl-3">
            <div className="-mx-1.5 -my-1.5">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex rounded-md p-1.5 text-red-500 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-red-50 focus:ring-red-600"
                aria-label="닫기"
              >
                <span className="sr-only">닫기</span>
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ErrorAlert;
