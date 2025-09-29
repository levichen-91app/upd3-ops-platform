import { StatusReportRequestDto } from '../dto/status-report-request.dto';

/**
 * NS Report API 回應資料介面
 *
 * 外部 NS Report API 回傳的核心資料結構
 */
export interface StatusReportData {
  /**
   * 報告下載連結 (presigned URL)
   * 包含簽章和過期時間參數的 S3 URL
   */
  downloadUrl: string;

  /**
   * 下載連結過期時間 (秒數)
   * 從現在開始算起的有效時間長度
   */
  expiredTime: number;
}

/**
 * NS Report Service 介面
 *
 * 負責與外部 NS Report API 互動的服務抽象層
 * 實作依賴注入模式，方便測試和更換實作
 */
export interface INSReportService {
  /**
   * 取得通知狀態報告
   *
   * @param request - 報告查詢請求參數
   * @returns Promise<StatusReportData> - 包含下載連結和過期時間的報告資料
   * @throws {ExternalApiException} - 當外部 API 調用失敗時
   */
  getStatusReport(request: StatusReportRequestDto): Promise<StatusReportData>;
}

/**
 * NS Report Service 注入 Token
 *
 * 用於 NestJS 依賴注入容器識別 INSReportService 介面的實作
 * 符合憲章要求的依賴抽象模式
 */
export const NS_REPORT_SERVICE_TOKEN = 'INSReportService';
