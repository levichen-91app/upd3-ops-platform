import {
  Injectable,
  BadRequestException,
  BadGatewayException,
  Logger,
  HttpStatus,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { UpdateSupplierRequestDto } from './dto/update-supplier-request.dto';
import {
  UpdateSupplierSuccessResponse,
  isSuccessResponse,
} from './interfaces/update-supplier-response.interface';
import { BaseApiException } from '../../common/exceptions/base-api.exception';
import { ApiErrorCode } from '../../common/exceptions/error-codes';

@Injectable()
export class ProxyService {
  private readonly logger = new Logger(ProxyService.name);
  private readonly whaleApiUrl =
    'http://whale-api-internal.qa.91dev.tw/admin/update-supplier-id';

  constructor(private readonly httpService: HttpService) {}

  /**
   * Updates supplier ID by forwarding request to Whale API
   * @param requestDto - The validated request payload
   * @param nyOperator - The ny-operator header value
   * @returns Promise<UpdateSupplierSuccessResponse>
   * @throws BadRequestException for business logic validation errors
   * @throws BadGatewayException for upstream API errors
   */
  async updateSupplier(
    requestDto: UpdateSupplierRequestDto,
    nyOperator: string,
  ): Promise<UpdateSupplierSuccessResponse> {
    // Business logic validation
    if (requestDto.oldSupplierId === requestDto.newSupplierId) {
      throw new BadRequestException(
        'Old and new supplier IDs must be different',
      );
    }

    try {
      this.logger.log(
        `Forwarding supplier update request for shop ${requestDto.shopId}`,
      );

      // Forward request to Whale API
      const response = await firstValueFrom(
        this.httpService.post(this.whaleApiUrl, requestDto, {
          headers: {
            'ny-operator': nyOperator,
            'Content-Type': 'application/json',
          },
        }),
      );

      // Validate response format
      const responseData = response.data;

      this.logger.log(
        `Whale API raw response:`,
        JSON.stringify({
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
          data: responseData,
        }),
      );

      // Handle different Whale API response formats
      const normalizedResponse = this.normalizeWhaleApiResponse(responseData);

      if (!normalizedResponse) {
        this.logger.error(
          'Invalid response format from Whale API',
          JSON.stringify({
            expectedFormat:
              'success: true, data: { updatedCount, shopId, market, supplierId }',
            actualResponse: responseData,
            responseType: typeof responseData,
            hasSuccessField: typeof responseData === 'object' && responseData !== null && 'success' in responseData,
            hasDataField: typeof responseData === 'object' && responseData !== null && 'data' in responseData,
          }),
        );
        throw new BadGatewayException(
          'External API response format is invalid',
        );
      }

      this.logger.log(
        `Successfully updated ${normalizedResponse.data.updatedCount} stories for shop ${requestDto.shopId}`,
      );

      return normalizedResponse;
    } catch (error) {
      if (
        error instanceof BaseApiException ||
        error instanceof BadRequestException ||
        error instanceof BadGatewayException
      ) {
        throw error;
      }

      // Handle HTTP errors from Whale API
      this.logger.error('Error calling Whale API:', error);

      if (error.response) {
        // Whale API returned an error response
        const status = error.response.status;
        const errorData = error.response.data;
        this.logger.error(`Whale API error ${status}:`, errorData);
        throw new BadGatewayException('External API returned an error');
      } else if (error.code === 'ECONNABORTED') {
        // Timeout error
        this.logger.error('Timeout calling Whale API');
        throw new BadGatewayException('External API timeout');
      } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        // Network connectivity issues
        this.logger.error('Network error calling Whale API');
        throw new BadGatewayException('External API unreachable');
      } else {
        // Other unknown errors
        this.logger.error('Unknown error calling Whale API:', error.message);
        throw new BadGatewayException('External API error');
      }
    }
  }

  /**
   * Normalizes Whale API response to our expected format
   * Handles: { code: "Success", data: {...} } -> { success: true, data: {...} }
   */
  private normalizeWhaleApiResponse(
    responseData: any,
  ): UpdateSupplierSuccessResponse | null {
    if (!responseData || typeof responseData !== 'object') {
      return null;
    }

    // Handle Whale API format: { code: "Success", data: {...} }
    if (responseData.code === 'Success' && responseData.data) {
      const { data } = responseData;

      // Validate data structure - only require essential fields
      if (
        typeof data === 'object' &&
        typeof data.updatedCount === 'number' &&
        typeof data.shopId === 'number'
      ) {
        return {
          success: true,
          data: {
            updatedCount: data.updatedCount,
            shopId: data.shopId,
            market: data.market || 'TW', // Default to TW if not provided
            supplierId: data.supplierId || data.newSupplierId, // Use newSupplierId if supplierId not provided
            // Include any additional fields from the response
            ...data,
          },
        };
      }
    }

    // Handle our expected format: { success: true, data: {...} }
    if (isSuccessResponse(responseData)) {
      const { data } = responseData;
      if (
        typeof data === 'object' &&
        typeof data.updatedCount === 'number' &&
        typeof data.shopId === 'number'
      ) {
        // Ensure the response has the required structure
        return {
          success: true,
          data: {
            updatedCount: data.updatedCount,
            shopId: data.shopId,
            market: data.market || 'TW', // Default to TW if not provided
            supplierId: data.supplierId || data.newSupplierId, // Use newSupplierId if supplierId not provided
            // Include any additional fields from the response
            ...data,
          },
        };
      }
    }

    return null;
  }

  /**
   * Validates that the response from Whale API has the expected structure
   */
  private isValidWhaleApiResponse(
    responseData: any,
  ): responseData is UpdateSupplierSuccessResponse {
    return this.normalizeWhaleApiResponse(responseData) !== null;
  }
}
