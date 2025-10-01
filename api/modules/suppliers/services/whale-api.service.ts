import {
  Injectable,
  Logger,
  Inject,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import type { ConfigType } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { SupplierUpdateRequestDto } from '../dto/supplier-update-request.dto';
import {
  IWhaleApiService,
  WhaleApiUpdateResponse,
} from '../interfaces/whale-api.interface';
import { ExternalApiErrorHandler } from '../../../common/helpers/external-api-error-handler';
import { SERVICE_DOMAINS } from '../../../constants/error-types.constants';
import externalApisConfig from '../../../config/external-apis.config';
import { HTTP_CONFIG } from '../../../constants/http-config.constants';
import { NY_OPERATOR_HEADER } from '../../../constants/headers.constants';

@Injectable()
export class WhaleApiService implements IWhaleApiService {
  private readonly logger = new Logger(WhaleApiService.name);
  private readonly whaleApiConfig: {
    baseUrl: string;
    timeout: number;
    retries: number;
  };

  constructor(
    private readonly httpService: HttpService,
    @Inject(externalApisConfig.KEY)
    private readonly apisConfig: ConfigType<typeof externalApisConfig>,
  ) {
    const environment = (process.env.NODE_ENV || 'development') as
      | 'development'
      | 'staging'
      | 'production'
      | 'test';
    const market = (process.env.MARKET || 'TW') as 'TW' | 'HK' | 'MY';

    // Get configuration for current environment and market
    const envConfig = this.apisConfig.whaleApi[environment];
    const marketConfig = envConfig[market];

    this.whaleApiConfig = {
      baseUrl: process.env.WHALE_API_URL_OVERRIDE || marketConfig.url,
      timeout: process.env.WHALE_API_TIMEOUT
        ? parseInt(process.env.WHALE_API_TIMEOUT)
        : marketConfig.timeout || HTTP_CONFIG.DEFAULT_TIMEOUT,
      retries: process.env.WHALE_API_RETRIES
        ? parseInt(process.env.WHALE_API_RETRIES)
        : marketConfig.retries || HTTP_CONFIG.DEFAULT_RETRIES,
    };

    this.logger.log(`Whale API configured for ${environment}/${market}`, {
      baseUrl: this.whaleApiConfig.baseUrl,
      timeout: this.whaleApiConfig.timeout,
      retries: this.whaleApiConfig.retries,
    });
  }

  async updateSupplierId(
    shopId: number,
    updateDto: SupplierUpdateRequestDto,
    operator: string,
  ): Promise<WhaleApiUpdateResponse> {
    this.logger.log(
      `Calling Whale API to update supplier ID for shop ${shopId}`,
      {
        shopId,
        market: updateDto.market,
        oldSupplierId: updateDto.oldSupplierId,
        newSupplierId: updateDto.newSupplierId,
        operator,
      },
    );

    try {
      const response = await firstValueFrom(
        this.httpService.post(
          `${this.whaleApiConfig.baseUrl}/update-supplier-id`,
          {
            shopId,
            market: updateDto.market,
            oldSupplierId: updateDto.oldSupplierId,
            newSupplierId: updateDto.newSupplierId,
          },
          {
            timeout: this.whaleApiConfig.timeout,
            headers: {
              'Content-Type': 'application/json',
              'User-Agent': 'upd3-ops-platform/1.0',
              [NY_OPERATOR_HEADER]: operator,
            },
          },
        ),
      );

      this.logger.log(`Whale API response received`, {
        shopId,
        statusCode: response.status,
        updatedCount: response.data?.updatedCount || 0,
      });

      return {
        updatedCount: response.data?.updatedCount || 0,
      };
    } catch (error: any) {
      this.logger.error(`Whale API call failed for shop ${shopId}`, {
        shopId,
        error: error.message,
        status: error.response?.status,
      });

      // 使用統一的錯誤處理器，自動映射到對應的 Google RPC Code
      ExternalApiErrorHandler.handleAxiosError(error, SERVICE_DOMAINS.WHALE_API);
    }
  }
}
