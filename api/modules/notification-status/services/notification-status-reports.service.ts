import { Inject, Injectable } from '@nestjs/common';
import type { INSReportService, StatusReportData } from './ns-report.service.interface';
import { NS_REPORT_SERVICE_TOKEN } from './ns-report.service.interface';
import { RequestIdService } from '../../../common/services/request-id.service';
import { StatusReportRequestDto } from '../dto/status-report-request.dto';
import { StatusReportResponseDto } from '../dto/status-report-response.dto';

/**
 * 通知狀態報告服務
 *
 * 負責處理通知狀態報告查詢的業務邏輯
 * 整合外部 NS Report API 和 Request ID 生成服務
 */
@Injectable()
export class NotificationStatusReportsService {
  constructor(
    @Inject(NS_REPORT_SERVICE_TOKEN)
    private readonly nsReportService: INSReportService,
    private readonly requestIdService: RequestIdService,
  ) {}

  /**
   * 取得通知狀態報告
   *
   * @param request - 報告查詢請求參數
   * @returns Promise<StatusReportResponseDto> - 包含下載連結、過期時間和請求追蹤資訊
   * @throws {ExternalApiException} - 當外部 API 調用失敗時
   */
  async getStatusReport(request: StatusReportRequestDto): Promise<StatusReportResponseDto> {
    // 生成唯一的請求識別碼
    const requestId = this.requestIdService.generateRequestId('reports');

    try {
      // 調用外部 NS Report API
      const reportData = await this.nsReportService.getStatusReport(request);

      // 回傳標準化的成功回應
      return {
        success: true,
        data: {
          downloadUrl: reportData.downloadUrl,
          expiredTime: reportData.expiredTime,
        },
        requestId,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      // 記錄請求 ID 以便錯誤追蹤（實際應用中會透過 logger 記錄）
      // 重新拋出錯誤，讓上層處理
      throw error;
    }
  }
}