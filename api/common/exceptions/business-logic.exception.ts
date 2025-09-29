import { HttpException } from '@nestjs/common';

/**
 * 業務邏輯異常
 *
 * 用於處理業務邏輯層的錯誤，如資源不存在等情況
 * 統一回傳 HTTP 404 狀態碼，符合憲章的錯誤分層原則
 */
export class BusinessNotFoundException extends HttpException {
  /**
   * 建構業務邏輯異常
   *
   * @param code - 錯誤代碼
   * @param message - 錯誤訊息
   * @param details - 錯誤詳細資訊
   */
  constructor(code: string, message: string, details?: any) {
    super(
      {
        code,
        message,
        details,
      },
      404,
    );
  }
}
