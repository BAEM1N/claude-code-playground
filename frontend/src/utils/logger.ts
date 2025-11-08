/**
 * Logger utility for production-safe logging
 * Prevents sensitive data exposure in production
 */

type LogLevel = 'error' | 'warn' | 'info' | 'debug';

interface LogData {
  [key: string]: any;
}

class Logger {
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
  }

  /**
   * Sanitize data to remove sensitive information
   */
  private sanitize(data: any): any {
    if (!data) return data;

    const sensitiveKeys = ['password', 'token', 'access_token', 'refresh_token', 'apiKey', 'secret'];

    if (typeof data === 'object') {
      const sanitized: any = Array.isArray(data) ? [] : {};

      for (const key in data) {
        if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
          sanitized[key] = '***REDACTED***';
        } else if (typeof data[key] === 'object') {
          sanitized[key] = this.sanitize(data[key]);
        } else {
          sanitized[key] = data[key];
        }
      }

      return sanitized;
    }

    return data;
  }

  /**
   * Log error message
   */
  error(message: string, data?: LogData): void {
    if (this.isDevelopment) {
      console.error(`[ERROR] ${message}`, data);
    } else {
      // In production, send to error tracking service (e.g., Sentry)
      const sanitized = this.sanitize(data);
      // TODO: Integrate with error tracking service
      // Sentry.captureException(new Error(message), { extra: sanitized });

      // Still log to console but sanitized
      console.error(`[ERROR] ${message}`);
    }
  }

  /**
   * Log warning message
   */
  warn(message: string, data?: LogData): void {
    if (this.isDevelopment) {
      console.warn(`[WARN] ${message}`, data);
    } else {
      const sanitized = this.sanitize(data);
      console.warn(`[WARN] ${message}`);
    }
  }

  /**
   * Log info message
   */
  info(message: string, data?: LogData): void {
    if (this.isDevelopment) {
      console.info(`[INFO] ${message}`, data);
    }
    // In production, info logs are typically not shown
  }

  /**
   * Log debug message
   */
  debug(message: string, data?: LogData): void {
    if (this.isDevelopment) {
      console.debug(`[DEBUG] ${message}`, data);
    }
    // Debug logs only in development
  }

  /**
   * Log performance metric
   */
  performance(label: string, duration: number): void {
    if (this.isDevelopment) {
      console.log(`[PERF] ${label}: ${duration.toFixed(2)}ms`);
    } else {
      // Send to analytics service
      // Analytics.track('performance', { label, duration });
    }
  }

  /**
   * Create a timer for performance measurement
   */
  startTimer(label: string): () => void {
    const start = performance.now();

    return () => {
      const duration = performance.now() - start;
      this.performance(label, duration);
    };
  }
}

// Export singleton instance
export const logger = new Logger();

// Export default
export default logger;
