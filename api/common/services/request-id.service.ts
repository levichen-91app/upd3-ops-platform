import { Injectable } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import {
  REQUEST_ID_CONSTANTS,
  isValidRequestId,
} from '../../constants/request-id.constants';

/**
 * Request ID 統一生成服務
 *
 * 遵循規範 4.4：統一 Request ID 生成邏輯
 * 格式：req-{yyyymmddhhmmss}-{uuid-v4}
 *
 * @example
 * ```typescript
 * const requestId = requestIdService.generateRequestId();
 * // 'req-20250928143052-a8b2c4d6-dd70-4edd-9f86-a2cfc0e8be22'
 * ```
 */
@Injectable()
export class RequestIdService {
  /**
   * 生成符合規範的 Request ID
   *
   * 格式：req-{yyyymmddhhmmss}-{uuid-v4}
   * - 時間戳使用 14 位數字格式（年月日時分秒）
   * - UUID 使用標準的 v4 格式（36 字元）
   *
   * @returns Request ID 字串
   * @example 'req-20250928143052-a8b2c4d6-dd70-4edd-9f86-a2cfc0e8be22'
   */
  generateRequestId(): string {
    const timestamp = this.generateTimestamp();
    const uuid = uuidv4();
    return `${REQUEST_ID_CONSTANTS.PREFIX}${timestamp}-${uuid}`;
  }

  /**
   * 驗證 Request ID 格式
   *
   * 使用正則表達式驗證 Request ID 是否符合標準格式
   *
   * @param requestId - 待驗證的 Request ID
   * @returns 是否符合格式要求
   */
  validateRequestId(requestId: string): boolean {
    return isValidRequestId(requestId);
  }

  /**
   * 生成時間戳 (yyyymmddhhmmss)
   *
   * 將當前時間轉換為 14 位數字字串
   * 格式：年(4位) + 月(2位) + 日(2位) + 時(2位) + 分(2位) + 秒(2位)
   *
   * @returns 14 位數字時間戳
   * @example '20250928143052'
   */
  private generateTimestamp(): string {
    const now = new Date();
    const year = now.getFullYear().toString();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');

    return `${year}${month}${day}${hours}${minutes}${seconds}`;
  }
}
