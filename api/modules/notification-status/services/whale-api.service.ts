import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';
import {
  IWhaleApiService,
  WhaleApiNotificationResponse,
} from '../interfaces/whale-api.interface';

@Injectable()
export class WhaleApiService implements IWhaleApiService {
  private readonly logger = new Logger(WhaleApiService.name);
  private readonly baseUrl: string;
  private readonly timeoutMs: number;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.baseUrl =
      this.configService.get<string>('whaleApi.baseUrl') ||
      'http://whale-api-internal.qa.91dev.tw';
    this.timeoutMs =
      this.configService.get<number>('whaleApi.timeout') || 10000;
  }

  async getNotificationHistory(
    notificationId: number,
  ): Promise<WhaleApiNotificationResponse | null> {
    const url = `${this.baseUrl}/api/v1/notifications/${notificationId}`;

    this.logger.log(`Calling Whale API: ${url} (timeout: ${this.timeoutMs}ms)`);

    try {
      const response = await firstValueFrom(
        this.httpService.get<WhaleApiNotificationResponse>(url, {
          timeout: this.timeoutMs,
        }),
      );

      this.logger.log(
        `Whale API response received for notification ${notificationId}`,
      );

      // Handle different response scenarios
      if (!response.data) {
        return null;
      }

      // Handle NOT_FOUND response
      if (response.data.code === 'NOT_FOUND' || !response.data.data) {
        this.logger.log(
          `Notification ${notificationId} not found in Whale API`,
        );
        return null;
      }

      return response.data;
    } catch (error: any) {
      this.logger.error(
        `Whale API call failed for notification ${notificationId}:`,
        error.message,
      );

      // Handle axios timeout
      if (error.code === 'ECONNABORTED') {
        throw new Error(
          `Timeout: Request took longer than ${this.timeoutMs}ms`,
        );
      }

      // Handle axios HTTP errors
      if (error.response) {
        const httpError = new Error(
          `HTTP Error ${error.response.status}: ${error.response.statusText}`,
        );
        httpError.name = 'AxiosError';
        (httpError as any).response = error.response;
        throw httpError;
      }

      // Network or other error
      throw error;
    }
  }
}
