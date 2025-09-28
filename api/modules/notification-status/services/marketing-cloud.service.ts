import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom, timeout } from 'rxjs';
import { IMarketingCloudService } from '../interfaces/marketing-cloud.interface';
import { DeviceDto } from '../dto/device.dto';
import { MarketingCloudConfig } from '../../../config/marketing-cloud.config';

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
      if (error.name === 'TimeoutError') {
        throw new Error('TIMEOUT_ERROR: Marketing Cloud API request timed out');
      }

      // Handle HTTP errors
      if (error.response) {
        const statusCode = error.response.status;
        throw new Error(
          `EXTERNAL_API_ERROR: Marketing Cloud API returned status ${statusCode}`,
        );
      }

      // Handle connection errors
      if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
        throw new Error(
          'EXTERNAL_API_ERROR: Unable to connect to Marketing Cloud API',
        );
      }

      // Handle other errors
      throw new Error(`EXTERNAL_API_ERROR: ${error.message}`);
    }
  }
}
