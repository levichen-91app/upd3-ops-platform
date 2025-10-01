/**
 * 標準化錯誤訊息模板
 *
 * 對應 Google RPC Error Codes 和各服務域的特定訊息
 *
 * @see constitution.md 第 4.5 節
 */
import { ERROR_CODES } from './error-codes.constants';
import { SERVICE_DOMAINS } from './error-types.constants';

// ==========================================
// Standard RPC Error Messages
// ==========================================

/**
 * 標準化錯誤訊息
 * 對應 Google RPC Error Codes
 */
export const ERROR_MESSAGES = {
  /**
   * INVALID_ARGUMENT (400)
   */
  [ERROR_CODES.INVALID_ARGUMENT]: 'Invalid request parameters provided',

  /**
   * UNAUTHENTICATED (401)
   */
  [ERROR_CODES.UNAUTHENTICATED]: 'Authentication required',

  /**
   * PERMISSION_DENIED (403)
   */
  [ERROR_CODES.PERMISSION_DENIED]: 'Permission denied',

  /**
   * NOT_FOUND (404)
   */
  [ERROR_CODES.NOT_FOUND]: 'Requested resource not found',

  /**
   * RESOURCE_EXHAUSTED (429)
   */
  [ERROR_CODES.RESOURCE_EXHAUSTED]: 'Rate limit exceeded',

  /**
   * INTERNAL (500)
   */
  [ERROR_CODES.INTERNAL]: 'Internal server error',

  /**
   * UNAVAILABLE (503)
   */
  [ERROR_CODES.UNAVAILABLE]: 'Service temporarily unavailable',

  /**
   * DEADLINE_EXCEEDED (504)
   */
  [ERROR_CODES.DEADLINE_EXCEEDED]: 'Request deadline exceeded',

  /**
   * EXTERNAL_API_ERROR (500) - Deprecated
   * @deprecated 請使用更具體的 Google RPC Code
   */
  [ERROR_CODES.EXTERNAL_API_ERROR]: 'External API call failed',
} as const;

// ==========================================
// Service-Specific Error Messages
// ==========================================

/**
 * 特定服務的錯誤訊息模板
 * 根據服務域名和錯誤原因提供更具體的訊息
 */
export const SERVICE_ERROR_MESSAGES = {
  /**
   * Marketing Cloud 服務錯誤訊息
   */
  [SERVICE_DOMAINS.MARKETING_CLOUD]: {
    TIMEOUT: 'Marketing Cloud API request timeout',
    CONNECTION_FAILED: 'Unable to connect to Marketing Cloud service',
    NOT_FOUND: 'Device not found in Marketing Cloud',
    RATE_LIMIT_EXCEEDED: 'Marketing Cloud rate limit exceeded',
    HTTP_ERROR: 'Marketing Cloud service error',
    INVALID_RESPONSE_FORMAT: 'Invalid response format from Marketing Cloud',
  },

  /**
   * Whale API 服務錯誤訊息
   */
  [SERVICE_DOMAINS.WHALE_API]: {
    TIMEOUT: 'Whale API request timeout',
    CONNECTION_FAILED: 'Unable to connect to Whale API service',
    NOT_FOUND: 'Supplier not found in Whale API',
    RATE_LIMIT_EXCEEDED: 'Whale API rate limit exceeded',
    HTTP_ERROR: 'Whale API service error',
    INVALID_RESPONSE_FORMAT: 'Invalid response format from Whale API',
  },

  /**
   * NS Report 服務錯誤訊息
   */
  [SERVICE_DOMAINS.NS_REPORT]: {
    TIMEOUT: 'NS Report API request timeout',
    CONNECTION_FAILED: 'Unable to connect to NS Report service',
    NOT_FOUND: 'Report not found in NS Report',
    RATE_LIMIT_EXCEEDED: 'NS Report rate limit exceeded',
    HTTP_ERROR: 'NS Report service error',
    INVALID_RESPONSE_FORMAT: 'Invalid response format from NS Report',
  },

  /**
   * NC Detail 服務錯誤訊息
   */
  [SERVICE_DOMAINS.NC_DETAIL]: {
    TIMEOUT: 'NC Detail API request timeout',
    CONNECTION_FAILED: 'Unable to connect to NC Detail service',
    NOT_FOUND: 'Notification detail not found',
    RATE_LIMIT_EXCEEDED: 'NC Detail rate limit exceeded',
    HTTP_ERROR: 'NC Detail service error',
    INVALID_RESPONSE_FORMAT: 'Invalid response format from NC Detail',
  },
} as const;

// ==========================================
// Business Logic Error Messages
// ==========================================

/**
 * 業務邏輯錯誤訊息
 * 用於業務層的特定錯誤場景
 */
export const BUSINESS_ERROR_MESSAGES = {
  /**
   * 設備相關錯誤
   */
  DEVICE_NOT_FOUND: 'No devices found for the specified customer',
  DEVICE_LIMIT_EXCEEDED: 'Device count exceeds maximum limit',

  /**
   * 通知相關錯誤
   */
  NOTIFICATION_NOT_FOUND: 'Notification not found',
  NOTIFICATION_EXPIRED: 'Notification has expired',

  /**
   * 供應商相關錯誤
   */
  SUPPLIER_NOT_FOUND: 'Supplier not found',
  SUPPLIER_IDS_IDENTICAL: 'Source and target supplier IDs must be different',

  /**
   * 商店相關錯誤
   */
  SHOP_NOT_FOUND: 'Shop not found',
  SHOP_INACTIVE: 'Shop is inactive',

  /**
   * 資源相關錯誤
   */
  RESOURCE_NOT_FOUND: 'Requested resource not found',
  DUPLICATE_RESOURCE: 'Resource already exists',

  /**
   * 驗證相關錯誤
   */
  INVALID_PHONE_FORMAT: 'Invalid phone number format',
  INVALID_DATE_FORMAT: 'Invalid date format',
  DATE_OUT_OF_RANGE: 'Date is out of valid range',
  MISSING_REQUIRED_HEADER: 'Required header is missing',
} as const;

// ==========================================
// Type Definitions
// ==========================================

/**
 * 錯誤訊息類型
 */
export type ErrorMessage =
  | (typeof ERROR_MESSAGES)[keyof typeof ERROR_MESSAGES]
  | (typeof BUSINESS_ERROR_MESSAGES)[keyof typeof BUSINESS_ERROR_MESSAGES];

/**
 * 服務錯誤訊息類型
 */
export type ServiceErrorMessage =
  (typeof SERVICE_ERROR_MESSAGES)[keyof typeof SERVICE_DOMAINS][string];
