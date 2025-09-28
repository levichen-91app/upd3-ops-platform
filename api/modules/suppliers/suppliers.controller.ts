import {
  Controller,
  Patch,
  Body,
  Param,
  Headers,
  ParseIntPipe,
  ValidationPipe,
  BadRequestException,
  UnauthorizedException,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import {
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiHeader,
  ApiBody,
  ApiTags,
  ApiSecurity,
} from '@nestjs/swagger';
import { SupplierUpdateRequestDto } from './dto/supplier-update-request.dto';
import { SuppliersService } from './suppliers.service';
import { ErrorCode } from '../../common/enums/error-code.enum';
import { ApiErrorResponse } from '../../common/interfaces/api-error-response.interface';
import { RequestIdMiddleware } from '../../common/middleware/request-id.middleware';

@ApiTags('Suppliers')
@Controller('api/v1/shops/:shopId/suppliers')
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Patch()
  @ApiSecurity('operator-auth')
  @ApiOperation({
    summary: 'Update supplier ID for products',
    description:
      'Updates supplier ID for all products matching the specified criteria in a shop and market',
  })
  @ApiParam({
    name: 'shopId',
    type: 'integer',
    description: 'Shop identifier',
    example: 12345,
  })
  @ApiHeader({
    name: 'ny-operator',
    description: 'Operator identification',
    required: true,
    example: 'user@91app.com',
  })
  @ApiBody({
    type: SupplierUpdateRequestDto,
    description: 'Supplier update parameters',
  })
  @ApiResponse({
    status: 200,
    description: 'Supplier ID updated successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        data: {
          type: 'object',
          properties: {
            updatedCount: { type: 'integer', example: 5 },
            shopId: { type: 'integer', example: 12345 },
            market: { type: 'string', example: 'TW' },
            supplierId: { type: 'integer', example: 200 },
          },
        },
        timestamp: { type: 'string', example: '2025-09-26T14:30:52.123Z' },
        requestId: {
          type: 'string',
          example:
            'req-20250926143052-a8b2c4d6e8f0-1234-5678-90ab-cdef12345678',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error or business rule violation',
    type: ApiErrorResponse,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - missing or invalid operator header',
    type: ApiErrorResponse,
  })
  @ApiResponse({
    status: 502,
    description: 'Bad Gateway - external service unavailable',
    type: ApiErrorResponse,
  })
  async updateSupplierId(
    @Param('shopId', ParseIntPipe) shopId: number,
    @Headers('ny-operator') operator: string,
    @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
    updateDto: SupplierUpdateRequestDto,
    @Req() request: Request,
  ) {
    // Validate shopId is positive
    if (shopId <= 0) {
      throw new BadRequestException({
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Shop ID must be a positive integer',
        details: { shopId },
      });
    }

    // Validate operator header
    if (!operator || operator.trim() === '') {
      throw new UnauthorizedException({
        code: ErrorCode.UNAUTHORIZED_ACCESS,
        message: 'Missing or empty ny-operator header',
      });
    }

    // Business logic validation: supplier IDs must be different
    if (updateDto.oldSupplierId === updateDto.newSupplierId) {
      throw new BadRequestException({
        code: ErrorCode.SUPPLIER_IDS_IDENTICAL,
        message: 'Old and new supplier IDs must be different',
        details: {
          oldSupplierId: updateDto.oldSupplierId,
          newSupplierId: updateDto.newSupplierId,
        },
      });
    }

    const requestId = RequestIdMiddleware.getRequestId(request);

    // Call service to perform the update
    const result = await this.suppliersService.updateSupplierId(
      shopId,
      updateDto,
      operator,
      requestId,
    );

    return {
      updatedCount: result.updatedCount,
      shopId: shopId,
      market: updateDto.market,
      supplierId: updateDto.newSupplierId,
    };
  }
}
