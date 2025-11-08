/**
 * Application configuration for frontend.
 *
 * All configuration values should be loaded from environment variables
 * to avoid hardcoding and support different environments (dev, staging, prod).
 *
 * Environment variables for React apps must be prefixed with REACT_APP_
 */

// ============================================
// API Configuration
// ============================================

/**
 * Backend API base URL
 * @type {string}
 */
export const API_BASE_URL =
  process.env.REACT_APP_API_URL || 'http://localhost:8000';

/**
 * API version prefix
 * @type {string}
 */
export const API_VERSION = process.env.REACT_APP_API_VERSION || 'v1';

/**
 * Full API URL with version
 * @type {string}
 */
export const API_URL = `${API_BASE_URL}/api/${API_VERSION}`;

// ============================================
// WebSocket Configuration
// ============================================

/**
 * WebSocket server URL
 * @type {string}
 */
export const WS_BASE_URL =
  process.env.REACT_APP_WS_URL ||
  (API_BASE_URL.replace('http://', 'ws://').replace('https://', 'wss://'));

/**
 * WebSocket endpoint path
 * @type {string}
 */
export const WS_PATH = process.env.REACT_APP_WS_PATH || '/ws';

/**
 * Full WebSocket URL
 * @type {string}
 */
export const WS_URL = `${WS_BASE_URL}${WS_PATH}`;

/**
 * WebSocket reconnection settings
 */
export const WS_RECONNECT_CONFIG = {
  maxAttempts: parseInt(process.env.REACT_APP_WS_MAX_RECONNECT || '5', 10),
  delay: parseInt(process.env.REACT_APP_WS_RECONNECT_DELAY || '1000', 10),
  maxDelay: parseInt(process.env.REACT_APP_WS_MAX_RECONNECT_DELAY || '30000', 10),
};

// ============================================
// Authentication Configuration
// ============================================

/**
 * Token storage key in localStorage
 * @type {string}
 */
export const AUTH_TOKEN_KEY =
  process.env.REACT_APP_AUTH_TOKEN_KEY || 'auth_token';

/**
 * Refresh token storage key in localStorage
 * @type {string}
 */
export const REFRESH_TOKEN_KEY =
  process.env.REACT_APP_REFRESH_TOKEN_KEY || 'refresh_token';

/**
 * Session timeout in milliseconds (default: 30 minutes)
 * @type {number}
 */
export const SESSION_TIMEOUT = parseInt(
  process.env.REACT_APP_SESSION_TIMEOUT || '1800000',
  10
);

// ============================================
// Application Settings
// ============================================

/**
 * Application name
 * @type {string}
 */
export const APP_NAME =
  process.env.REACT_APP_NAME || 'Course Management Platform';

/**
 * Application version
 * @type {string}
 */
export const APP_VERSION = process.env.REACT_APP_VERSION || '1.0.0';

/**
 * Environment (development, staging, production)
 * @type {string}
 */
export const ENVIRONMENT = process.env.NODE_ENV || 'development';

/**
 * Debug mode
 * @type {boolean}
 */
export const DEBUG = process.env.REACT_APP_DEBUG === 'true';

// ============================================
// Feature Flags
// ============================================

export const FEATURES = {
  /**
   * Enable WebSocket real-time features
   */
  enableWebSocket:
    process.env.REACT_APP_FEATURE_WEBSOCKET !== 'false',

  /**
   * Enable notifications
   */
  enableNotifications:
    process.env.REACT_APP_FEATURE_NOTIFICATIONS !== 'false',

  /**
   * Enable file uploads
   */
  enableFileUpload:
    process.env.REACT_APP_FEATURE_FILE_UPLOAD !== 'false',

  /**
   * Enable gamification features (XP, achievements, etc.)
   */
  enableGamification:
    process.env.REACT_APP_FEATURE_GAMIFICATION !== 'false',

  /**
   * Enable analytics tracking
   */
  enableAnalytics:
    process.env.REACT_APP_FEATURE_ANALYTICS === 'true',
};

// ============================================
// UI/UX Settings
// ============================================

/**
 * Default language
 * @type {string}
 */
export const DEFAULT_LANGUAGE = process.env.REACT_APP_LANGUAGE || 'ko';

/**
 * Default theme
 * @type {string}
 */
export const DEFAULT_THEME = process.env.REACT_APP_THEME || 'light';

/**
 * Items per page for pagination
 * @type {number}
 */
export const ITEMS_PER_PAGE = parseInt(
  process.env.REACT_APP_ITEMS_PER_PAGE || '20',
  10
);

/**
 * Max file upload size in bytes (default: 100MB)
 * @type {number}
 */
export const MAX_FILE_SIZE = parseInt(
  process.env.REACT_APP_MAX_FILE_SIZE || '104857600',
  10
);

// ============================================
// External Services
// ============================================

/**
 * Google Analytics tracking ID
 * @type {string|null}
 */
export const GOOGLE_ANALYTICS_ID =
  process.env.REACT_APP_GOOGLE_ANALYTICS_ID || null;

/**
 * Sentry DSN for error tracking
 * @type {string|null}
 */
export const SENTRY_DSN = process.env.REACT_APP_SENTRY_DSN || null;

// ============================================
// Development Helpers
// ============================================

/**
 * Log configuration to console in development
 */
if (ENVIRONMENT === 'development' && DEBUG) {
  console.log('🔧 Application Configuration:', {
    API_URL,
    WS_URL,
    ENVIRONMENT,
    FEATURES,
    APP_NAME,
    APP_VERSION,
  });
}

/**
 * Validate required environment variables
 */
const validateConfig = () => {
  const requiredVars = [
    // Add any required environment variables here
  ];

  const missing = requiredVars.filter((varName) => !process.env[varName]);

  if (missing.length > 0) {
    console.error(
      '❌ Missing required environment variables:',
      missing.join(', ')
    );

    if (ENVIRONMENT === 'production') {
      throw new Error(
        `Missing required environment variables: ${missing.join(', ')}`
      );
    }
  }
};

validateConfig();

// ============================================
// Export Default Config Object
// ============================================

export default {
  // API
  API_BASE_URL,
  API_VERSION,
  API_URL,

  // WebSocket
  WS_BASE_URL,
  WS_PATH,
  WS_URL,
  WS_RECONNECT_CONFIG,

  // Authentication
  AUTH_TOKEN_KEY,
  REFRESH_TOKEN_KEY,
  SESSION_TIMEOUT,

  // Application
  APP_NAME,
  APP_VERSION,
  ENVIRONMENT,
  DEBUG,

  // Features
  FEATURES,

  // UI/UX
  DEFAULT_LANGUAGE,
  DEFAULT_THEME,
  ITEMS_PER_PAGE,
  MAX_FILE_SIZE,

  // External Services
  GOOGLE_ANALYTICS_ID,
  SENTRY_DSN,
};
