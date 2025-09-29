/**
 * 錯誤代碼常數定義
 *
 * 統一定義系統中使用的錯誤代碼，確保一致性和可維護性
 */
export const ERROR_CODES = {
  // 驗證錯誤
  VALIDATION_ERROR: 'VALIDATION_ERROR',

  // 認證錯誤
  UNAUTHORIZED: 'UNAUTHORIZED',

  // 外部 API 錯誤
  EXTERNAL_API_ERROR: 'EXTERNAL_API_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',

  // 業務邏輯錯誤
  DEVICE_NOT_FOUND: 'DEVICE_NOT_FOUND',
  NOTIFICATION_NOT_FOUND: 'NOTIFICATION_NOT_FOUND',

  // 日期範圍錯誤
  DATE_OUT_OF_RANGE: 'DATE_OUT_OF_RANGE',

  // 速率限制錯誤
  RATE_LIMIT_ERROR: 'RATE_LIMIT_ERROR',

  // 內部服務錯誤
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
} as const;

/**
 * 錯誤代碼類型定義
 */
export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];
