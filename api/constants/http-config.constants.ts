/**
 * HTTP 配置常數統一定義
 *
 * 根據憲章第4.3節規範，集中管理所有 HTTP 相關配置常數
 * 避免在代碼中散落 magic number，確保一致性和可維護性
 */

/**
 * HTTP 請求配置常數
 */
export const HTTP_CONFIG = {
  /**
   * 預設 HTTP 請求超時時間（毫秒）
   * 適用於一般 API 調用
   */
  DEFAULT_TIMEOUT: 10000,

  /**
   * 預設最大重定向次數
   * 用於 HTTP 請求自動跟隨重定向
   */
  DEFAULT_MAX_REDIRECTS: 3,

  /**
   * 長時間操作的超時時間（毫秒）
   * 適用於報表生成、大批量資料處理等耗時操作
   */
  LONG_OPERATION_TIMEOUT: 30000,

  /**
   * 預設重試次數
   * 當請求失敗時的自動重試次數
   */
  DEFAULT_RETRIES: 3,

  /**
   * 短超時時間（毫秒）
   * 適用於快速檢查、健康檢查等輕量級操作
   */
  SHORT_TIMEOUT: 5000,
} as const;

/**
 * Fallback URLs（僅用於配置未設定時）
 *
 * ⚠️ 警告：這些 URL 僅用於開發和測試環境
 * 正式環境必須透過環境變數 (.env) 覆蓋這些預設值
 */
export const FALLBACK_URLS = {
  /**
   * Whale API 內部服務預設 URL
   * 環境變數：WHALE_API_BASE_URL
   */
  WHALE_API: 'http://whale-api-internal.qa.91dev.tw',

  /**
   * NS Report API 預設 URL
   * 環境變數：NS_REPORT_BASE_URL
   */
  NS_REPORT_API: 'https://default.nsreport.api.com',
} as const;

/**
 * HTTP 狀態碼常數
 * 用於明確表達業務邏輯中的狀態碼判斷
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
} as const;
