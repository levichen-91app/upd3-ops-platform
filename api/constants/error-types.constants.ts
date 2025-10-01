/**
 * 錯誤原因和服務域名常數定義
 *
 * 遵循 Google Cloud API ErrorInfo 結構
 *
 * @see https://cloud.google.com/apis/design/errors#error_info
 * @see constitution.md 第 4.5 節
 */

// ==========================================
// Error Reasons (UPPER_SNAKE_CASE)
// ==========================================

/**
 * 錯誤原因（Error Reasons）
 * 用於 ErrorDetail 的 reason 欄位
 * 遵循 UPPER_SNAKE_CASE 命名規範
 */
export const ERROR_REASONS = {
  // ==========================================
  // Network Errors
  // ==========================================

  /**
   * 請求超時
   * 使用場景：API 請求超過指定的超時時間
   */
  TIMEOUT: 'TIMEOUT',

  /**
   * 連線失敗
   * 使用場景：無法建立連線、連線被拒絕
   */
  CONNECTION_FAILED: 'CONNECTION_FAILED',

  /**
   * DNS 解析失敗
   * 使用場景：無法解析主機名稱
   */
  DNS_RESOLUTION_FAILED: 'DNS_RESOLUTION_FAILED',

  // ==========================================
  // HTTP Errors
  // ==========================================

  /**
   * HTTP 錯誤
   * 使用場景：收到 HTTP 4xx/5xx 錯誤回應
   */
  HTTP_ERROR: 'HTTP_ERROR',

  /**
   * 回應格式無效
   * 使用場景：無法解析 JSON、XML 等格式錯誤
   */
  INVALID_RESPONSE_FORMAT: 'INVALID_RESPONSE_FORMAT',

  // ==========================================
  // Resource Errors
  // ==========================================

  /**
   * 資源不存在
   * 使用場景：查詢的資源找不到
   */
  RESOURCE_MISSING: 'RESOURCE_MISSING',

  /**
   * 資源已存在
   * 使用場景：嘗試建立重複的資源
   */
  RESOURCE_ALREADY_EXISTS: 'RESOURCE_ALREADY_EXISTS',

  // ==========================================
  // Authentication Errors
  // ==========================================

  /**
   * 缺少認證憑證
   * 使用場景：未提供 API Key、Token 等
   */
  MISSING_CREDENTIALS: 'MISSING_CREDENTIALS',

  /**
   * 認證憑證無效
   * 使用場景：API Key 錯誤、Token 無效
   */
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',

  /**
   * Token 已過期
   * 使用場景：JWT Token 過期、Session 逾時
   */
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',

  // ==========================================
  // Validation Errors
  // ==========================================

  /**
   * 參數無效
   * 使用場景：參數格式錯誤、類型不符
   */
  INVALID_PARAMETER: 'INVALID_PARAMETER',

  /**
   * 缺少必填欄位
   * 使用場景：請求缺少必要的參數或欄位
   */
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',

  // ==========================================
  // Rate Limiting
  // ==========================================

  /**
   * 超過速率限制
   * 使用場景：API 呼叫頻率超過限制
   */
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',

  // ==========================================
  // Unknown Errors
  // ==========================================

  /**
   * 未知錯誤
   * 使用場景：無法分類的錯誤
   */
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const;

// ==========================================
// Service Domains (kebab-case)
// ==========================================

/**
 * 服務域名（Service Domains）
 * 識別錯誤來自哪個外部服務
 * 使用 kebab-case 命名規範
 */
export const SERVICE_DOMAINS = {
  /**
   * Marketing Cloud 服務
   * 負責設備查詢、推播通知
   */
  MARKETING_CLOUD: 'marketing-cloud',

  /**
   * Whale API 服務
   * 負責供應商資料管理
   */
  WHALE_API: 'whale-api',

  /**
   * NS Report 服務
   * 負責通知狀態報表生成
   */
  NS_REPORT: 'ns-report',

  /**
   * NC Detail 服務
   * 負責通知詳細資訊查詢
   */
  NC_DETAIL: 'nc-detail',
} as const;

// ==========================================
// ErrorDetail Type Prefix
// ==========================================

/**
 * ErrorDetail 的 @type 欄位前綴
 * 遵循 Google API 的 @type 格式
 */
export const ERROR_DETAIL_TYPE_PREFIX = 'type.upd3ops.com';

/**
 * ErrorDetail 的標準 @type 值
 */
export const ERROR_DETAIL_TYPES = {
  /**
   * 一般錯誤資訊
   */
  ERROR_INFO: `${ERROR_DETAIL_TYPE_PREFIX}/ErrorInfo`,

  /**
   * 資源相關資訊
   */
  RESOURCE_INFO: `${ERROR_DETAIL_TYPE_PREFIX}/ResourceInfo`,
} as const;

// ==========================================
// Type Definitions
// ==========================================

/**
 * 錯誤原因類型
 */
export type ErrorReason = (typeof ERROR_REASONS)[keyof typeof ERROR_REASONS];

/**
 * 服務域名類型
 */
export type ServiceDomain =
  (typeof SERVICE_DOMAINS)[keyof typeof SERVICE_DOMAINS];

/**
 * ErrorDetail 類型
 */
export type ErrorDetailType =
  (typeof ERROR_DETAIL_TYPES)[keyof typeof ERROR_DETAIL_TYPES];
