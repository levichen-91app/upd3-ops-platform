import {
  Controller,
  Post,
  Body,
  Headers,
  BadRequestException,
  Logger,
  HttpStatus,
} from '@nestjs/common';
import { BaseApiException } from '../../common/exceptions/base-api.exception';
import { ApiErrorCode } from '../../common/exceptions/error-codes';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiHeader,
  ApiProperty,
} from '@nestjs/swagger';
import { ProxyService } from './proxy.service';
import { UpdateSupplierRequestDto } from './dto/update-supplier-request.dto';
import { UpdateSupplierSuccessResponse } from './interfaces/update-supplier-response.interface';

/**
 * Swagger response schemas
 */
class UpdateSupplierSuccessResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({
    example: {
      updatedCount: 5,
      shopId: 12345,
      market: 'TW',
      supplierId: 200,
    },
  })
  data: {
    updatedCount: number;
    shopId: number;
    market: string;
    supplierId: number;
  };
}

class ErrorResponseDto {
  @ApiProperty({ example: 'Missing required header: ny-operator' })
  error: string;
}

@ApiTags('Proxy')
@Controller('proxy/whale')
export class ProxyController {
  private readonly logger = new Logger(ProxyController.name);

  constructor(private readonly proxyService: ProxyService) {}

  @Post('update-supplier-id')
  @ApiOperation({
    summary: 'Proxy to Whale API for updating supplier ID',
    description: `
      Forwards supplier ID update requests to Whale API TW QA server.
      Validates input, logs all requests/responses, and handles errors gracefully.

      This endpoint:
      - Validates the request payload using class-validator
      - Requires the ny-operator header for tracking
      - Forwards requests to http://whale-api-internal.qa.91dev.tw/admin/update-supplier-id
      - Returns the response from Whale API without modification
      - Logs all requests and responses with timestamps and request IDs
    `,
  })
  @ApiHeader({
    name: 'ny-operator',
    description: 'Operation header for tracking (forwarded to Whale API)',
    required: true,
    example: 'Amy Wang',
  })
  @ApiResponse({
    status: 200,
    description: 'Supplier ID updated successfully',
    type: UpdateSupplierSuccessResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation error or missing header',
    type: ErrorResponseDto,
    examples: {
      'missing-header': {
        summary: 'ny-operator header is missing',
        value: { error: 'Missing required header: ny-operator' },
      },
      'validation-error': {
        summary: 'Request payload validation failed',
        value: {
          error: 'Validation failed: shopId must be a positive integer',
        },
      },
      'same-supplier-ids': {
        summary: 'Business logic validation failed',
        value: { error: 'Old and new supplier IDs must be different' },
      },
    },
  })
  @ApiResponse({
    status: 502,
    description: 'Bad Gateway - Whale API error or unexpected response format',
    type: ErrorResponseDto,
    examples: {
      'upstream-error': {
        summary: 'Whale API returned an HTTP error',
        value: { error: 'Whale API returned an error' },
      },
      'invalid-format': {
        summary: 'Whale API response does not match expected format',
        value: { error: 'Whale API response format is invalid' },
      },
      unreachable: {
        summary: 'Network error or timeout connecting to Whale API',
        value: { error: 'Whale API unreachable or error' },
      },
    },
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error',
    type: ErrorResponseDto,
  })
  async updateSupplierId(
    @Body() requestDto: UpdateSupplierRequestDto,
    @Headers('ny-operator') nyOperator?: string,
  ): Promise<UpdateSupplierSuccessResponse> {
    const requestId = this.generateRequestId();

    this.logger.log(
      `[${requestId}] Received supplier update request`,
      JSON.stringify({
        requestId,
        timestamp: new Date().toISOString(),
        shopId: requestDto.shopId,
        market: requestDto.market,
        nyOperator: nyOperator || 'missing',
      }),
    );

    // Validate ny-operator header
    if (!nyOperator || nyOperator.trim().length === 0) {
      this.logger.warn(
        `[${requestId}] Request rejected: missing ny-operator header`,
      );
      throw new BaseApiException(
        'Missing required header: ny-operator',
        ApiErrorCode.MISSING_REQUIRED_HEADER,
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      const result = await this.proxyService.updateSupplier(
        requestDto,
        nyOperator.trim(),
      );

      this.logger.log(
        `[${requestId}] Request completed successfully`,
        JSON.stringify({
          requestId,
          timestamp: new Date().toISOString(),
          updatedCount: result.data.updatedCount,
        }),
      );

      return result;
    } catch (error) {
      this.logger.error(
        `[${requestId}] Request failed`,
        JSON.stringify({
          requestId,
          timestamp: new Date().toISOString(),
          error: error.message,
          status: error.status || 500,
        }),
      );
      throw error;
    }
  }

  /**
   * Generates a unique request ID for tracking
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
