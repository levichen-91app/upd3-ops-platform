/**
 * Google Cloud API 標準錯誤代碼
 *
 * 遵循 Google Cloud API 設計指南和 gRPC Status Codes
 *
 * @see https://cloud.google.com/apis/design/errors
 * @see https://grpc.github.io/grpc/core/md_doc_statuscodes.html
 * @see constitution.md 第 4.5 節
 */
export const ERROR_CODES = {
  // ==========================================
  // Standard Google RPC Codes
  // ==========================================

  /**
   * INVALID_ARGUMENT (HTTP 400)
   * 客戶端指定了無效的參數
   * 使用場景：參數驗證失敗、格式錯誤、必填欄位缺失
   */
  INVALID_ARGUMENT: 'INVALID_ARGUMENT',

  /**
   * UNAUTHENTICATED (HTTP 401)
   * 缺少有效的身份驗證憑證
   * 使用場景：缺少 token、token 過期、認證失敗
   */
  UNAUTHENTICATED: 'UNAUTHENTICATED',

  /**
   * PERMISSION_DENIED (HTTP 403)
   * 呼叫者沒有權限執行指定操作
   * 使用場景：權限不足、角色不符、IP 限制
   */
  PERMISSION_DENIED: 'PERMISSION_DENIED',

  /**
   * NOT_FOUND (HTTP 404)
   * 找不到指定的資源
   * 使用場景：資源不存在、ID 無效、已被刪除
   */
  NOT_FOUND: 'NOT_FOUND',

  /**
   * RESOURCE_EXHAUSTED (HTTP 429)
   * 資源配額耗盡或超過速率限制
   * 使用場景：API 呼叫超過配額、請求頻率過高
   */
  RESOURCE_EXHAUSTED: 'RESOURCE_EXHAUSTED',

  /**
   * INTERNAL (HTTP 500)
   * 內部伺服器錯誤
   * 使用場景：未預期的系統錯誤、程式邏輯錯誤
   */
  INTERNAL: 'INTERNAL',

  /**
   * UNAVAILABLE (HTTP 503)
   * 服務暫時不可用
   * 使用場景：服務維護中、資料庫連線失敗、外部 API 5xx 錯誤
   */
  UNAVAILABLE: 'UNAVAILABLE',

  /**
   * DEADLINE_EXCEEDED (HTTP 504)
   * 請求超過指定的截止時間
   * 使用場景：請求超時、處理時間過長
   */
  DEADLINE_EXCEEDED: 'DEADLINE_EXCEEDED',

  // ==========================================
  // Custom Application Codes (遵循 Google 命名風格)
  // ==========================================

  /**
   * EXTERNAL_API_ERROR (HTTP 500)
   * 外部 API 調用失敗的通用錯誤
   *
   * 注意：此代碼已棄用，請改用：
   * - DEADLINE_EXCEEDED: 超時錯誤
   * - UNAVAILABLE: 連線失敗、服務不可用
   * - NOT_FOUND: 外部 API 返回 404
   * - PERMISSION_DENIED: 外部 API 返回 401/403
   *
   * @deprecated 請使用更具體的 Google RPC Code
   */
  EXTERNAL_API_ERROR: 'EXTERNAL_API_ERROR',
} as const;

/**
 * 錯誤代碼到 HTTP Status 的映射表
 * 根據 Google Cloud API 標準定義
 */
export const ERROR_CODE_TO_HTTP_STATUS: Record<string, number> = {
  INVALID_ARGUMENT: 400,
  UNAUTHENTICATED: 401,
  PERMISSION_DENIED: 403,
  NOT_FOUND: 404,
  RESOURCE_EXHAUSTED: 429,
  INTERNAL: 500,
  UNAVAILABLE: 503,
  DEADLINE_EXCEEDED: 504,
  EXTERNAL_API_ERROR: 500, // Deprecated
};

/**
 * 錯誤代碼類型定義
 */
export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

/**
 * HTTP Status 到錯誤代碼的反向映射
 * 用於從 HTTP Status 推斷錯誤代碼
 */
export const HTTP_STATUS_TO_ERROR_CODE: Record<number, ErrorCode> = {
  400: ERROR_CODES.INVALID_ARGUMENT,
  401: ERROR_CODES.UNAUTHENTICATED,
  403: ERROR_CODES.PERMISSION_DENIED,
  404: ERROR_CODES.NOT_FOUND,
  429: ERROR_CODES.RESOURCE_EXHAUSTED,
  500: ERROR_CODES.INTERNAL,
  503: ERROR_CODES.UNAVAILABLE,
  504: ERROR_CODES.DEADLINE_EXCEEDED,
};
