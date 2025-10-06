/**
 * 稽核日誌相關常數定義
 *
 * 包含敏感資料模式、檔案命名規則、查詢限制等設定
 */

/**
 * 敏感資料欄位名稱模式 (不區分大小寫)
 * 符合這些模式的欄位值將被遮罩為 "***"
 */
export const SENSITIVE_PATTERNS = [
  /password/i,
  /passwd/i,
  /pwd/i,
  /token/i,
  /accesstoken/i,
  /refreshtoken/i,
  /secret/i,
  /clientsecret/i,
  /apisecret/i,
  /key/i,
  /apikey/i,
  /privatekey/i,
  /auth/i,
  /authorization/i,
] as const;

/**
 * 稽核日誌檔案設定
 */
export const AUDIT_LOG_FILE_CONFIG = {
  /** 檔案名稱前綴 */
  FILE_PREFIX: 'audit-',
  /** 檔案副檔名 */
  FILE_EXTENSION: '.jsonl',
  /** 日期格式 (YYYYMMDD) */
  DATE_FORMAT: 'YYYYMMDD',
  /** 檔案編碼 */
  ENCODING: 'utf-8',
  /** 換行符 */
  LINE_SEPARATOR: '\n',
} as const;

/**
 * 稽核日誌查詢限制
 */
export const AUDIT_LOG_QUERY_LIMITS = {
  /** 最大查詢天數 */
  MAX_QUERY_DAYS: 7,
  /** 預設每頁筆數 */
  DEFAULT_LIMIT: 50,
  /** 最大每頁筆數 */
  MAX_LIMIT: 100,
  /** 最小每頁筆數 */
  MIN_LIMIT: 1,
  /** 最小偏移量 */
  MIN_OFFSET: 0,
} as const;

/**
 * 稽核日誌保留設定
 */
export const AUDIT_LOG_RETENTION = {
  /** 檔案保留天數 (30 天後自動清理) */
  RETENTION_DAYS: 30,
  /** 清理排程 Cron 表達式 (每日凌晨 2:00) */
  CLEANUP_CRON: '0 2 * * *',
} as const;

/**
 * 需要稽核的 HTTP 方法
 */
export const AUDITABLE_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'] as const;

/**
 * 稽核日誌錯誤訊息
 */
export const AUDIT_LOG_ERROR_MESSAGES = {
  STORAGE_FAILED: 'Failed to write audit log to storage',
  STORAGE_UNAVAILABLE: 'Audit log storage temporarily unavailable',
  QUERY_FAILED: 'Failed to query audit logs',
  INVALID_DATE_RANGE: 'Query date range exceeds 7-day limit',
  INVALID_PAGINATION: 'Invalid pagination parameters',
  FILE_READ_ERROR: 'Failed to read audit log file',
  FILE_WRITE_ERROR: 'Failed to write audit log file',
  DIRECTORY_CREATE_ERROR: 'Failed to create audit log directory',
} as const;

/**
 * 稽核日誌元資料鍵名
 */
export const AUDIT_METADATA_KEY = 'audit:config';

/**
 * 稽核日誌遮罩值
 */
export const MASKED_VALUE = '***';
