import { HttpException } from '@nestjs/common';
import { ERROR_CODE_TO_HTTP_STATUS } from '../../constants/error-codes.constants';

/**
 * ErrorDetail 結構（模仿 Google Cloud API ErrorInfo）
 *
 * @see https://cloud.google.com/apis/design/errors#error_info
 */
export interface ErrorDetail {
  /**
   * 錯誤類型（遵循 Google API 的 @type 格式）
   * 例如：'type.upd3ops.com/ErrorInfo'
   */
  '@type': string;

  /**
   * 錯誤原因（UPPER_SNAKE_CASE）
   * 例如：'TIMEOUT', 'CONNECTION_FAILED'
   */
  reason: string;

  /**
   * 服務域名（kebab-case）
   * 例如：'marketing-cloud', 'whale-api'
   */
  domain: string;

  /**
   * 額外的元數據
   */
  metadata?: Record<string, any>;
}

/**
 * 外部 API 錯誤異常
 *
 * 支援 Google Cloud API 風格的錯誤代碼映射：
 * - 不同錯誤代碼對應不同的 HTTP Status Code
 * - 使用 ErrorDetail 提供結構化錯誤資訊
 * - 支援多個 ErrorDetail（陣列格式）
 *
 * @example
 * ```typescript
 * throw new ExternalApiException(
 *   ERROR_CODES.DEADLINE_EXCEEDED,
 *   'Marketing Cloud API request timeout',
 *   {
 *     '@type': 'type.upd3ops.com/ErrorInfo',
 *     reason: 'TIMEOUT',
 *     domain: 'marketing-cloud',
 *     metadata: { timeout: 10000 }
 *   }
 * );
 * ```
 *
 * @see constitution.md 第 4.5 節
 */
export class ExternalApiException extends HttpException {
  /**
   * 建構外部 API 異常
   *
   * @param errorCode - Google RPC 錯誤代碼 (UPPER_SNAKE_CASE)
   * @param message - 錯誤訊息
   * @param details - ErrorDetail 或 ErrorDetail 陣列
   */
  constructor(
    errorCode: string,
    message: string,
    details?: ErrorDetail | ErrorDetail[],
  ) {
    // 根據錯誤代碼映射到對應的 HTTP Status
    const httpStatus = ERROR_CODE_TO_HTTP_STATUS[errorCode] || 500;

    // 確保 details 為陣列格式
    const detailsArray = Array.isArray(details)
      ? details
      : details
        ? [details]
        : [];

    super(
      {
        code: errorCode,
        message,
        details: detailsArray,
      },
      httpStatus,
    );
  }
}
