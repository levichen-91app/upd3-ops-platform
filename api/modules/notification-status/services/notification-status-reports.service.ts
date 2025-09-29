import { Inject, Injectable } from '@nestjs/common';
import type {
  INSReportService,
  StatusReportData,
} from './ns-report.service.interface';
import { NS_REPORT_SERVICE_TOKEN } from './ns-report.service.interface';
import { StatusReportRequestDto } from '../dto/status-report-request.dto';
import { StatusReportResponseDto } from '../dto/status-report-response.dto';

/**
 * 通知狀態報告服務
 *
 * 負責處理通知狀態報告查詢的業務邏輯
 * 整合外部 NS Report API
 */
@Injectable()
export class NotificationStatusReportsService {
  constructor(
    @Inject(NS_REPORT_SERVICE_TOKEN)
    private readonly nsReportService: INSReportService,
  ) {}

  /**
   * 取得通知狀態報告
   *
   * @param request - 報告查詢請求參數
   * @param requestId - 統一的請求追蹤 ID
   * @returns Promise<StatusReportData> - 包含下載連結和過期時間的原始資料
   * @throws {ExternalApiException} - 當外部 API 調用失敗時
   */
  async getStatusReport(
    request: StatusReportRequestDto,
    requestId: string,
  ): Promise<{ downloadUrl: string; expiredTime: number }> {
    try {
      // 調用外部 NS Report API
      const reportData = await this.nsReportService.getStatusReport(request);

      // 回傳原始資料，讓 ResponseFormatInterceptor 處理包裝
      return {
        downloadUrl: reportData.downloadUrl,
        expiredTime: reportData.expiredTime,
      };
    } catch (error) {
      // 記錄請求 ID 以便錯誤追蹤（實際應用中會透過 logger 記錄）
      // 重新拋出錯誤，讓上層處理
      throw error;
    }
  }
}
