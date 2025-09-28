import { Injectable, Logger, Inject } from '@nestjs/common';
import { SupplierUpdateRequestDto } from './dto/supplier-update-request.dto';
import type { IWhaleApiService } from './interfaces/whale-api.interface';
import { WHALE_API_SERVICE_TOKEN } from './interfaces/whale-api.interface';

export interface SupplierUpdateResult {
  updatedCount: number;
}

@Injectable()
export class SuppliersService {
  private readonly logger = new Logger(SuppliersService.name);

  constructor(
    @Inject(WHALE_API_SERVICE_TOKEN)
    private readonly whaleApiService: IWhaleApiService,
  ) {}

  async updateSupplierId(
    shopId: number,
    updateDto: SupplierUpdateRequestDto,
    operator: string,
    requestId: string,
  ): Promise<SupplierUpdateResult> {
    this.logger.log(
      `Processing supplier ID update for shop ${shopId} - requestId: ${requestId}`,
      {
        shopId,
        market: updateDto.market,
        oldSupplierId: updateDto.oldSupplierId,
        newSupplierId: updateDto.newSupplierId,
        operator,
        requestId,
      },
    );

    // Delegate to the whale API service
    const result = await this.whaleApiService.updateSupplierId(
      shopId,
      updateDto,
      operator,
    );

    this.logger.log(`Supplier ID update completed - requestId: ${requestId}`, {
      shopId,
      updatedCount: result.updatedCount,
      requestId,
    });

    return {
      updatedCount: result.updatedCount,
    };
  }
}
