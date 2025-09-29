import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import {
  INSReportService,
  StatusReportData,
} from './ns-report.service.interface';
import { StatusReportRequestDto } from '../dto/status-report-request.dto';
import { ExternalApiException } from '../../../common/exceptions/external-api.exception';

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
        'https://default.nsreport.api.com';
      const endpoint =
        this.configService.get<string>('nsReport.endpoint') ||
        '/v3/GetNotificationStatusReport';
      const timeout =
        this.configService.get<number>('nsReport.timeout') || 30000;

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
    } catch (error) {
      // 轉換為標準化的外部 API 異常
      throw this.handleExternalApiError(error);
    }
  }

  /**
   * 驗證外部 API 回應格式
   *
   * @param data - 外部 API 回應資料
   * @throws {ExternalApiException} - 當回應格式無效時
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

  /**
   * 處理外部 API 錯誤並轉換為標準異常
   *
   * @param error - 原始錯誤物件
   * @returns ExternalApiException - 標準化的外部 API 異常
   */
  private handleExternalApiError(error: any): ExternalApiException {
    // HTTP 回應錯誤 (4xx, 5xx)
    if (error.response) {
      const { status, statusText, data } = error.response;
      return new ExternalApiException('外部 NS Report API 調用失敗', {
        originalMessage: error.message,
        errorType: 'HttpException',
        statusCode: status,
        statusText: statusText,
        responseData: data,
      });
    }

    // 超時錯誤
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      return new ExternalApiException('外部 NS Report API 調用失敗', {
        originalMessage: error.message,
        errorType: 'TimeoutError',
        errorCode: error.code,
      });
    }

    // 連接錯誤
    if (
      error.code === 'ECONNREFUSED' ||
      error.code === 'ENOTFOUND' ||
      error.code === 'ECONNRESET'
    ) {
      return new ExternalApiException('外部 NS Report API 調用失敗', {
        originalMessage: error.message,
        errorType: 'ConnectionError',
        errorCode: error.code,
      });
    }

    // JSON 解析錯誤
    if (error instanceof SyntaxError || error.name === 'SyntaxError') {
      return new ExternalApiException('外部 NS Report API 調用失敗', {
        originalMessage: error.message,
        errorType: 'SyntaxError',
      });
    }

    // 回應格式驗證錯誤
    if (error.message?.includes('Invalid response format')) {
      return new ExternalApiException('外部 NS Report API 調用失敗', {
        originalMessage: error.message,
        errorType: 'InvalidResponseError',
      });
    }

    // 其他未預期錯誤
    return new ExternalApiException('外部 NS Report API 調用失敗', {
      originalMessage: error.message || 'Unknown error',
      errorType: error.name || 'UnknownError',
    });
  }
}
