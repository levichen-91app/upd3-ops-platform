import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import {
  INSReportService,
  StatusReportData,
} from './ns-report.service.interface';
import { StatusReportRequestDto } from '../dto/status-report-request.dto';
import { ExternalApiErrorHandler } from '../../../common/helpers/external-api-error-handler';
import { SERVICE_DOMAINS } from '../../../constants/error-types.constants';
import {
  HTTP_CONFIG,
  FALLBACK_URLS,
} from '../../../constants/http-config.constants';

/**
 * 外部 NS Report Service 實作
 *
 * 負責與外部 NS Report API 進行 HTTP 通訊
 * 實作 INSReportService 介面，符合依賴抽象原則
 */
@Injectable()
export class ExternalNSReportService implements INSReportService {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * 向外部 NS Report API 請求狀態報告
   *
   * @param request - 報告查詢請求參數
   * @returns Promise<StatusReportData> - 包含下載連結和過期時間
   * @throws {ExternalApiException} - 各種外部 API 錯誤情況
   */
  async getStatusReport(
    request: StatusReportRequestDto,
  ): Promise<StatusReportData> {
    try {
      // 取得配置參數
      const baseUrl =
        this.configService.get<string>('nsReport.baseUrl') ||
        FALLBACK_URLS.NS_REPORT_API;
      const endpoint =
        this.configService.get<string>('nsReport.endpoint') ||
        '/v3/GetNotificationStatusReport';
      const timeout =
        this.configService.get<number>('nsReport.timeout') ||
        HTTP_CONFIG.LONG_OPERATION_TIMEOUT;

      const url = `${baseUrl}${endpoint}`;

      // 建構請求參數
      const payload = {
        nsId: request.nsId,
        notificationDate: request.notificationDate,
        notificationType: request.notificationType,
      };

      // HTTP 請求配置
      const requestConfig = {
        timeout,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'UPD3-OPS-Platform/1.0',
        },
      };

      // 發送 HTTP POST 請求
      const response = await firstValueFrom(
        this.httpService.post(url, payload, requestConfig),
      );

      // 驗證回應格式
      this.validateResponseFormat(response.data);

      // 回傳標準化資料
      return {
        downloadUrl: response.data.downloadUrl,
        expiredTime: response.data.expiredTime,
      };
    } catch (error: any) {
      // 使用統一的錯誤處理器，自動映射到對應的 Google RPC Code
      ExternalApiErrorHandler.handleAxiosError(error, SERVICE_DOMAINS.NS_REPORT);
    }
  }

  /**
   * 驗證外部 API 回應格式
   *
   * @param data - 外部 API 回應資料
   * @throws {Error} - 當回應格式無效時
   */
  private validateResponseFormat(data: any): void {
    if (!data || typeof data !== 'object') {
      throw new Error(
        'Invalid response format: response data is not an object',
      );
    }

    if (!data.downloadUrl || typeof data.downloadUrl !== 'string') {
      throw new Error(
        'Invalid response format: downloadUrl is missing or invalid',
      );
    }

    if (
      data.expiredTime === null ||
      data.expiredTime === undefined ||
      typeof data.expiredTime !== 'number'
    ) {
      throw new Error(
        'Invalid response format: expiredTime is missing or invalid',
      );
    }

    if (data.expiredTime <= 0) {
      throw new Error('Invalid response format: expiredTime must be positive');
    }
  }
}
