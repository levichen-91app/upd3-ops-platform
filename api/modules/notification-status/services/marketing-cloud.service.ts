import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom, timeout } from 'rxjs';
import { IMarketingCloudService } from '../interfaces/marketing-cloud.interface';
import { DeviceDto } from '../dto/device.dto';
import { MarketingCloudConfig } from '../../../config/marketing-cloud.config';
import { ExternalApiException } from '../../../common/exceptions/external-api.exception';
import { ERROR_CODES } from '../../../constants/error-codes.constants';

@Injectable()
export class MarketingCloudService implements IMarketingCloudService {
  private readonly logger = new Logger(MarketingCloudService.name);
  private readonly config: MarketingCloudConfig;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.config =
      this.configService.get<MarketingCloudConfig>('marketingCloud')!;
  }

  async getDevices(shopId: number, phone: string): Promise<DeviceDto[]> {
    try {
      this.logger.log(
        `Fetching devices for shopId: ${shopId}, phone: ${phone} from Marketing Cloud`,
      );

      const url = `${this.config.baseUrl}/devices`;
      const params = { shopId: shopId.toString(), phone };

      const response = await firstValueFrom(
        this.httpService
          .get(url, { params })
          .pipe(timeout(this.config.timeout)),
      );

      this.logger.log(
        `Marketing Cloud responded with ${response.data?.length || 0} devices for shopId: ${shopId}`,
      );

      // Handle null, undefined, or non-array responses as empty
      if (!response.data || !Array.isArray(response.data)) {
        return [];
      }

      return response.data;
    } catch (error: any) {
      this.logger.error(
        `Failed to fetch devices from Marketing Cloud for shopId: ${shopId}, phone: ${phone}`,
        error.stack,
      );

      // Handle timeout errors
      if (
        error.name === 'TimeoutError' ||
        error.message?.startsWith('TIMEOUT_ERROR:')
      ) {
        throw new ExternalApiException(
          'Marketing Cloud API 請求逾時',
          { errorType: 'TIMEOUT', originalError: error.message },
          ERROR_CODES.TIMEOUT_ERROR,
        );
      }

      // Handle HTTP errors
      if (error.response) {
        const statusCode = error.response.status;
        throw new ExternalApiException(
          `Marketing Cloud API 回傳狀態碼 ${statusCode}`,
          { statusCode, originalError: error.message },
        );
      }

      // Handle connection errors
      if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
        throw new ExternalApiException('無法連接到 Marketing Cloud API', {
          errorType: 'CONNECTION',
          originalError: error.message,
        });
      }

      // Handle other errors
      throw new ExternalApiException('Marketing Cloud API 調用失敗', {
        originalError: error.message,
      });
    }
  }
}
