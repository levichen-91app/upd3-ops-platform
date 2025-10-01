import { HttpException } from '@nestjs/common';
import { ERROR_CODES } from '../../constants/error-codes.constants';
import { ERROR_DETAIL_TYPES } from '../../constants/error-types.constants';

/**
 * 業務邏輯錯誤：資源找不到
 *
 * 使用 Google Cloud API NOT_FOUND 錯誤代碼
 * 統一回傳 HTTP 404 狀態碼
 *
 * @example
 * ```typescript
 * throw new BusinessNotFoundException(
 *   'No devices found for the specified customer',
 *   { shopId: 12345, phone: '0912345678' }
 * );
 * ```
 *
 * @see constitution.md 第 4.5 節
 */
export class BusinessNotFoundException extends HttpException {
  /**
   * 建構業務邏輯找不到資源異常
   *
   * @param message - 錯誤訊息
   * @param details - 資源相關的詳細資訊
   */
  constructor(message: string, details?: Record<string, any>) {
    // 使用 Google RPC NOT_FOUND 錯誤代碼
    const detailsArray = details
      ? [
          {
            '@type': ERROR_DETAIL_TYPES.RESOURCE_INFO,
            ...details,
          },
        ]
      : [];

    super(
      {
        code: ERROR_CODES.NOT_FOUND,
        message,
        details: detailsArray,
      },
      404,
    );
  }
}
