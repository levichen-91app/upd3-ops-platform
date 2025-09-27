import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom, timeout, catchError } from 'rxjs';
import { AxiosError } from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { whaleNotificationApiConfig, isMockModeEnabled } from '../../config/external-apis.config';
import { NotificationHistoryData } from './dto/notification-history-data.dto';
import { NotificationStatus } from './dto/notification-status.enum';

@Injectable()
export class NotificationHistoryService {
  private readonly logger = new Logger(NotificationHistoryService.name);

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  async getNotificationHistory(
    shopId: number,
    notificationId: number,
    requestId: string,
  ): Promise<NotificationHistoryData> {
    this.logger.log(`[${requestId}] Fetching notification history for shopId=${shopId}, notificationId=${notificationId}`);

    // Check if mock mode is enabled
    if (isMockModeEnabled('WHALE_NOTIFICATION')) {
      this.logger.log(`[${requestId}] Mock mode enabled, returning mock data`);
      return this.getMockData(shopId, notificationId);
    }

    try {
      // Call external Whale API
      const whaleResponse = await this.callWhaleApi(shopId, notificationId, requestId);

      // Transform and return data
      return this.transformWhaleResponse(whaleResponse, shopId, notificationId);
    } catch (error: any) {
      this.logger.error(`[${requestId}] Failed to fetch notification history: ${error.message}`, error.stack);

      if (error instanceof HttpException) {
        throw error;
      }

      // Handle different types of errors
      if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        throw new HttpException(
          {
            code: 'WHALE_API_UNAVAILABLE',
            message: 'Whale API is temporarily unavailable',
            details: {
              shopId,
              notificationId,
            },
          },
          HttpStatus.BAD_GATEWAY,
        );
      }

      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        throw new HttpException(
          {
            code: 'WHALE_API_UNAVAILABLE',
            message: 'Whale API request timeout',
            details: {
              shopId,
              notificationId,
              timeout: whaleNotificationApiConfig.timeout,
            },
          },
          HttpStatus.BAD_GATEWAY,
        );
      }

      // Generic error
      throw new HttpException(
        {
          code: 'WHALE_API_UNAVAILABLE',
          message: 'Failed to fetch notification history from Whale API',
          details: {
            shopId,
            notificationId,
          },
        },
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  private async callWhaleApi(
    shopId: number,
    notificationId: number,
    requestId: string,
  ): Promise<any> {
    const url = `${whaleNotificationApiConfig.baseUrl}/shops/${shopId}/notifications/${notificationId}/history`;

    this.logger.log(`[${requestId}] Calling Whale API: ${url}`);

    try {
      const response = await firstValueFrom(
        this.httpService.get(url, {
          headers: {
            'Content-Type': 'application/json',
            'x-request-id': requestId,
          },
          timeout: whaleNotificationApiConfig.timeout,
        }).pipe(
          timeout(whaleNotificationApiConfig.timeout),
          catchError((error: AxiosError) => {
            if (error.response?.status === 404) {
              throw new HttpException(
                {
                  code: 'NOTIFICATION_NOT_FOUND',
                  message: 'Notification not found in Whale API',
                  details: {
                    shopId,
                    notificationId,
                  },
                },
                HttpStatus.NOT_FOUND,
              );
            }
            throw error;
          })
        )
      );

      return (response as any).data;
    } catch (error: any) {
      this.logger.error(`[${requestId}] Whale API call failed: ${error.message}`);
      throw error;
    }
  }

  private transformWhaleResponse(
    whaleResponse: any,
    shopId: number,
    notificationId: number,
  ): NotificationHistoryData {
    // Extract core fields from Whale API response
    return {
      shopId,
      notificationId,
      ncId: whaleResponse.ncId,
      bookDateTime: whaleResponse.bookDateTime,
      status: whaleResponse.status || NotificationStatus.PENDING,
      channel: whaleResponse.channel || 'Email',
      sentDateTime: whaleResponse.sentDateTime,
      isSettled: whaleResponse.isSettled || false,
      originalAudienceCount: whaleResponse.originalAudienceCount || 0,
      sentAudienceCount: whaleResponse.sentAudienceCount || 0,
      receivedAudienceCount: whaleResponse.receivedAudienceCount || 0,
      createdAt: whaleResponse.createdAt || new Date().toISOString(),
      updatedAt: whaleResponse.updatedAt || new Date().toISOString(),
    };
  }

  private getMockData(shopId: number, notificationId: number): NotificationHistoryData {
    // Special mock scenarios based on notificationId
    if (notificationId.toString().endsWith('404')) {
      throw new HttpException(
        {
          code: 'NOTIFICATION_NOT_FOUND',
          message: 'Notification not found in Whale API',
          details: {
            shopId,
            notificationId,
          },
        },
        HttpStatus.NOT_FOUND,
      );
    }

    // Minimal data scenario for notificationId ending with 000
    if (notificationId.toString().endsWith('000')) {
      return {
        shopId,
        notificationId,
        ncId: uuidv4(),
        bookDateTime: new Date().toISOString(),
        status: NotificationStatus.SUCCESS,
        channel: 'Email',
        isSettled: true,
        originalAudienceCount: 1,
        sentAudienceCount: 1,
        receivedAudienceCount: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    // Full mock data for regular cases
    return {
      shopId,
      notificationId,
      ncId: 'a4070188-050d-47f7-ab24-2523145408cf',
      bookDateTime: '2024-01-15T10:30:00Z',
      status: NotificationStatus.SUCCESS as NotificationStatus,
      channel: 'Email',
      sentDateTime: '2024-01-15T10:35:00Z',
      isSettled: true,
      originalAudienceCount: 1000,
      sentAudienceCount: 900,
      receivedAudienceCount: 850,
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-15T10:35:00Z',
    };
  }

  generateRequestId(): string {
    const now = new Date();
    const timestamp = now.toISOString().replace(/[-:T]/g, '').substring(0, 14);

    // Generate UUID v4 format parts
    const hex = () => Math.floor(Math.random() * 16).toString(16);
    const uuid = [
      Array(8).fill(0).map(() => hex()).join(''),
      Array(4).fill(0).map(() => hex()).join(''),
      Array(4).fill(0).map(() => hex()).join(''),
      Array(4).fill(0).map(() => hex()).join(''),
      Array(12).fill(0).map(() => hex()).join('')
    ].join('-');

    return `req-${timestamp}-${uuid}`;
  }

  private maskPhoneNumber(text: string): string {
    // Mask phone numbers in logs for privacy
    return text.replace(/(\d{3})\d{4}(\d{3})/g, '$1****$2');
  }
}