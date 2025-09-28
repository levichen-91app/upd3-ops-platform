import { HttpException } from '@nestjs/common';
import { ERROR_CODES } from '../../constants/error-codes.constants';

/**
 * 外部 API 異常
 *
 * 當調用外部 API 失敗時拋出此異常
 * 統一回傳 HTTP 500 狀態碼，符合憲章的錯誤分層原則
 */
export class ExternalApiException extends HttpException {
  /**
   * 建構外部 API 異常
   *
   * @param message - 錯誤訊息
   * @param details - 錯誤詳細資訊
   */
  constructor(message: string, details?: any) {
    super(
      {
        code: ERROR_CODES.EXTERNAL_API_ERROR,
        message: message || '外部 API 調用失敗',
        details,
      },
      500,
    );
  }
}