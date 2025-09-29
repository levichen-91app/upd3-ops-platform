/**
 * Request ID 統一常數定義
 *
 * 根據憲章第4.4節規範，統一管理所有 Request ID 相關常數
 * 確保格式一致性和便於維護
 */

export const REQUEST_ID_CONSTANTS = {
  /**
   * HTTP Header 名稱
   * 用於 client-server 間傳遞 Request ID
   */
  HEADER_NAME: 'x-request-id',

  /**
   * Request 對象中的屬性名稱
   * 用於在 Express Request 對象中存取 Request ID
   */
  PROPERTY_NAME: 'requestId',

  /**
   * Request ID 格式驗證正則表達式
   * 格式: req-{yyyymmddhhmmss}-{uuid-v4}
   * 範例: req-20250928143052-a8b2c4d6-dd70-4edd-9f86-a2cfc0e8be22
   */
  PATTERN:
    /^req-\d{14}-[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/,

  /**
   * Request ID 固定前綴
   */
  PREFIX: 'req-',
} as const;

/**
 * Request ID 相關的型別定義
 */
export type RequestIdType = string;

/**
 * 驗證 Request ID 格式是否正確
 *
 * @param requestId - 要驗證的 Request ID
 * @returns 是否符合格式要求
 */
export function isValidRequestId(requestId: string): boolean {
  return REQUEST_ID_CONSTANTS.PATTERN.test(requestId);
}

/**
 * 從 Request ID 中提取時間戳
 *
 * @param requestId - Request ID
 * @returns 時間戳字串 (yyyymmddhhmmss) 或 null
 */
export function extractTimestamp(requestId: string): string | null {
  const match = requestId.match(/^req-(\d{14})-/);
  return match ? match[1] : null;
}
