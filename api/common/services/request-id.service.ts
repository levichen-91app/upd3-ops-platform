import { Injectable } from '@nestjs/common';

/**
 * Request ID 統一生成服務
 *
 * 負責生成統一格式的請求追蹤 ID，確保：
 * - 格式一致性
 * - 便於日誌分析
 * - 問題排查追蹤
 */
@Injectable()
export class RequestIdService {
  /**
   * 生成 Request ID
   *
   * @param prefix - 前綴類型，用於區分不同的 API
   * @returns 格式化的 Request ID
   */
  generateRequestId(prefix: 'devices' | 'error' | 'reports'): string {
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2);
    return `req-${prefix}-${timestamp}-${randomId}`;
  }

  /**
   * 驗證 Request ID 格式
   *
   * @param requestId - 要驗證的 Request ID
   * @returns 是否符合格式要求
   */
  validateRequestId(requestId: string): boolean {
    const REQUEST_ID_PATTERN = /^req-(devices|error|reports)-[0-9]+-[a-zA-Z0-9]+$/;
    return REQUEST_ID_PATTERN.test(requestId);
  }

  /**
   * 從 Request ID 解析前綴
   *
   * @param requestId - Request ID
   * @returns 前綴類型，如果格式不正確則返回 null
   */
  parsePrefix(requestId: string): string | null {
    const match = requestId.match(/^req-([^-]+)-/);
    return match ? match[1] : null;
  }
}