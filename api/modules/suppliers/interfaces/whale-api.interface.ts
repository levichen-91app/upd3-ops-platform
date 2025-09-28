import { SupplierUpdateRequestDto } from '../dto/supplier-update-request.dto';

export interface WhaleApiUpdateResponse {
  updatedCount: number;
}

export interface IWhaleApiService {
  updateSupplierId(
    shopId: number,
    updateDto: SupplierUpdateRequestDto,
    operator: string,
  ): Promise<WhaleApiUpdateResponse>;
}

export const WHALE_API_SERVICE_TOKEN = 'IWhaleApiService';
