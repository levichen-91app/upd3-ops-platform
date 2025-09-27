import {
  Injectable,
  BadGatewayException,
  Logger,
  Inject,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import type { ConfigType } from '@nestjs/config';
import { SupplierUpdateRequestDto } from './dto/supplier-update-request.dto';
import { ErrorCode } from '../../common/enums/error-code.enum';
import { firstValueFrom } from 'rxjs';
import externalApisConfig, { isMockModeEnabled } from '../../config/external-apis.config';

export interface SupplierUpdateResult {
  updatedCount: number;
}

@Injectable()
export class SuppliersService {
  private readonly logger = new Logger(SuppliersService.name);
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
        : marketConfig.timeout || 10000,
      retries: process.env.WHALE_API_RETRIES
        ? parseInt(process.env.WHALE_API_RETRIES)
        : marketConfig.retries || 3,
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
  ): Promise<SupplierUpdateResult> {
    this.logger.log(`Updating supplier ID for shop ${shopId}`, {
      shopId,
      market: updateDto.market,
      oldSupplierId: updateDto.oldSupplierId,
      newSupplierId: updateDto.newSupplierId,
      operator,
    });

    // Check if mock mode is enabled (supports both global MOCK_MODE and WHALE_API_MOCK_MODE)
    const mockMode = isMockModeEnabled('whale_api');

    if (mockMode) {
      return this.getMockUpdateResult(shopId, updateDto, operator);
    }

    try {
      // Call Whale API to perform the actual update
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
              'ny-operator': operator,
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
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorResponse =
        error && typeof error === 'object' && 'response' in error
          ? (error as any).response
          : undefined;
      const errorCode =
        error && typeof error === 'object' && 'code' in error
          ? (error as any).code
          : undefined;

      this.logger.error(`Whale API call failed`, {
        shopId,
        error: errorMessage,
        status: errorResponse?.status,
        data: errorResponse?.data,
      });

      if (
        errorCode === 'ECONNREFUSED' ||
        errorCode === 'ENOTFOUND' ||
        errorCode === 'ETIMEDOUT' ||
        errorCode === 'ECONNABORTED'
      ) {
        throw new BadGatewayException({
          code: ErrorCode.WHALE_API_UNAVAILABLE,
          message: 'External service is temporarily unavailable',
          details: {
            service: 'whale-api',
            errorCode: errorCode,
            timeout: this.whaleApiConfig.timeout,
          },
        });
      }

      if (errorResponse?.status >= 400) {
        throw new BadGatewayException({
          code: ErrorCode.EXTERNAL_SERVICE_ERROR,
          message: 'External service error',
          details: {
            service: 'whale-api',
            statusCode: errorResponse.status,
            message: errorResponse?.data?.message,
          },
        });
      }

      // Re-throw other errors as-is
      throw error;
    }
  }

  /**
   * Generate mock update result for F2E integration
   */
  private async getMockUpdateResult(
    shopId: number,
    updateDto: SupplierUpdateRequestDto,
    operator: string,
  ): Promise<SupplierUpdateResult> {
    this.logger.log('Using Mock Whale API data', {
      shopId,
      market: updateDto.market,
      oldSupplierId: updateDto.oldSupplierId,
      newSupplierId: updateDto.newSupplierId,
      operator,
      mode: 'MOCK',
    });

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 200));

    // Generate mock result based on input data for consistency
    let mockUpdatedCount = 0;

    // Generate predictable mock results based on shopId
    if (shopId === 404) {
      // Special case: simulate shop not found or no records to update
      mockUpdatedCount = 0;
    } else if (shopId % 10 === 0) {
      // Shops ending in 0: simulate large update (100-500 records)
      mockUpdatedCount = 100 + (shopId % 400);
    } else {
      // Normal cases: simulate small updates (1-50 records)
      mockUpdatedCount = 1 + (shopId % 50);
    }

    const result: SupplierUpdateResult = {
      updatedCount: mockUpdatedCount,
    };

    this.logger.log('Mock Whale API request completed successfully', {
      shopId,
      market: updateDto.market,
      updatedCount: mockUpdatedCount,
      operator,
      mode: 'MOCK',
    });

    return result;
  }
}
