import { Injectable, BadGatewayException, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { SupplierUpdateRequestDto } from './dto/supplier-update-request.dto';
import { ErrorCode } from '../../common/enums/error-code.enum';
import { firstValueFrom } from 'rxjs';

export interface SupplierUpdateResult {
  updatedCount: number;
}

@Injectable()
export class SuppliersService {
  private readonly logger = new Logger(SuppliersService.name);
  private readonly whaleApiUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.whaleApiUrl = this.configService.get<string>('WHALE_API_URL') || 'https://api.whale.example.com';
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

    try {
      // Call Whale API to perform the actual update
      const response = await firstValueFrom(
        this.httpService.post(`${this.whaleApiUrl}/update-supplier-id`, {
          shopId,
          market: updateDto.market,
          oldSupplierId: updateDto.oldSupplierId,
          newSupplierId: updateDto.newSupplierId,
          operator,
        }, {
          timeout: 10000,
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'upd3-ops-platform/1.0',
          },
        })
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
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorResponse = error && typeof error === 'object' && 'response' in error ? (error as any).response : undefined;
      const errorCode = error && typeof error === 'object' && 'code' in error ? (error as any).code : undefined;

      this.logger.error(`Whale API call failed`, {
        shopId,
        error: errorMessage,
        status: errorResponse?.status,
        data: errorResponse?.data,
      });

      if (errorCode === 'ECONNREFUSED' || errorCode === 'ENOTFOUND' || errorCode === 'ETIMEDOUT' || errorCode === 'ECONNABORTED') {
        throw new BadGatewayException({
          code: ErrorCode.WHALE_API_UNAVAILABLE,
          message: 'External service is temporarily unavailable',
          details: {
            service: 'whale-api',
            errorCode: errorCode,
            timeout: 10000,
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
}