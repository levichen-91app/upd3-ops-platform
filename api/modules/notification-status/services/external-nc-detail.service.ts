import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom, catchError } from 'rxjs';
import { AxiosError } from 'axios';
import { INcDetailService, NotificationDetail } from '../interfaces/nc-detail.interface';

interface NcDetailApiResponse {
  RequestId: string;
  StatusCode: number;
  Message: string;
  Data: NotificationDetail | null;
}

@Injectable()
export class ExternalNcDetailService implements INcDetailService {
  private readonly logger = new Logger(ExternalNcDetailService.name);
  private readonly config: any;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.config = this.configService.get('ncApi');
  }

  async getNotificationDetail(shopId: number, ncId: string): Promise<NotificationDetail | null> {
    const url = `${this.config.baseUrl}/api/v1/notifications/detail/${shopId}/${ncId}`;

    this.logger.log(`Calling NC Detail API: ${url}`);

    try {
      const response = await firstValueFrom(
        this.httpService.get<NcDetailApiResponse>(url, {
          timeout: this.config.timeout,
        }).pipe(
          catchError((error: AxiosError) => {
            this.logger.error(`NC Detail API error: ${error.message}`, error.stack);

            if (error.code === 'ECONNABORTED') {
              throw new Error(`TIMEOUT_ERROR: NC Detail API timeout after ${this.config.timeout}ms`);
            }

            if (error.response) {
              const status = error.response.status;
              const errorData = error.response.data;

              if (status === 400) {
                throw new Error(`VALIDATION_ERROR: ${JSON.stringify(errorData)}`);
              }

              if (status >= 500) {
                throw new Error(`EXTERNAL_API_ERROR: NC Detail API returned ${status}`);
              }
            }

            throw new Error(`EXTERNAL_API_ERROR: ${error.message}`);
          })
        )
      );

      this.logger.log(`NC Detail API response status: ${response.status}`);

      // Validate response structure
      if (!response.data || typeof response.data !== 'object') {
        throw new Error('DATA_FORMAT_ERROR: Invalid response format from NC Detail API');
      }

      const apiResponse = response.data;

      // Handle API-level errors
      if (apiResponse.StatusCode !== 200) {
        throw new Error(`EXTERNAL_API_ERROR: NC Detail API returned status ${apiResponse.StatusCode}`);
      }

      // Return the data (can be null if notification not found)
      return apiResponse.Data;

    } catch (error) {
      this.logger.error(`Failed to get notification detail for shopId: ${shopId}, ncId: ${ncId}`, error);
      throw error;
    }
  }
}