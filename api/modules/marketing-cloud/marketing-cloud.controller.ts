import {
  Controller,
  Get,
  Param,
  Headers,
  Logger,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiHeader,
  ApiResponse,
  ApiExtraModels,
  getSchemaPath,
} from '@nestjs/swagger';
import { MarketingCloudService } from './marketing-cloud.service';
import {
  GetMemberDevicesQueryDto,
  IsValidShopId,
  IsValidPhone,
} from './dto/get-member-devices-query.dto';
import {
  MemberDevicesResponse,
  createMemberDevicesResponse,
} from './dto/member-devices-response.dto';
import {
  ApiErrorResponse,
  ErrorObject,
} from '../../common/interfaces/api-error-response.interface';
import {
  maskPhoneNumber,
  createSafeLogMessage,
} from '../../common/utils/privacy.util';

/**
 * Marketing Cloud Controller
 * RESTful API endpoints for Marketing Cloud Device integration
 */
@ApiTags('Marketing Cloud')
@ApiExtraModels(MemberDevicesResponse, ApiErrorResponse)
@Controller('api/v1/shops/:shopId/members/by-phone/:phone')
export class MarketingCloudController {
  private readonly logger = new Logger(MarketingCloudController.name);

  constructor(private readonly marketingCloudService: MarketingCloudService) {}

  /**
   * Get member devices from Marketing Cloud
   * GET /api/v1/shops/{shopId}/members/by-phone/{phone}/devices
   */
  @Get('devices')
  @ApiOperation({
    summary: '查詢會員裝置清單',
    description:
      '透過商店 ID 和手機號碼查詢該會員在 Marketing Cloud 中註冊的所有裝置',
    operationId: 'getMemberDevices',
  })
  @ApiParam({
    name: 'shopId',
    description: '商店 ID',
    type: 'integer',
    example: 12345,
    schema: {
      type: 'integer',
      minimum: 1,
    },
  })
  @ApiParam({
    name: 'phone',
    description: '會員手機號碼',
    type: 'string',
    example: '0912345678',
    schema: {
      type: 'string',
      minLength: 1,
    },
  })
  @ApiHeader({
    name: 'ny-operator',
    description: '操作者識別',
    required: true,
    schema: {
      type: 'string',
      minLength: 1,
    },
    example: 'system-admin',
  })
  @ApiResponse({
    status: 200,
    description: '成功取得會員裝置清單',
    schema: {
      $ref: getSchemaPath(MemberDevicesResponse),
    },
  })
  @ApiResponse({
    status: 400,
    description: '請求參數無效',
    schema: {
      $ref: getSchemaPath(ApiErrorResponse),
    },
  })
  @ApiResponse({
    status: 401,
    description: '缺少操作者識別',
    schema: {
      $ref: getSchemaPath(ApiErrorResponse),
    },
  })
  @ApiResponse({
    status: 404,
    description: '會員不存在或無裝置資料',
    schema: {
      $ref: getSchemaPath(ApiErrorResponse),
    },
  })
  @ApiResponse({
    status: 502,
    description: '外部服務異常',
    schema: {
      $ref: getSchemaPath(ApiErrorResponse),
    },
  })
  async getMemberDevices(
    @Param('shopId') shopIdParam: string,
    @Param('phone') phone: string,
    @Headers('ny-operator') operator?: string,
  ): Promise<MemberDevicesResponse> {
    const requestId = this.generateRequestId();
    const maskedPhone = maskPhoneNumber(phone);

    this.logger.log(
      createSafeLogMessage('Received getMemberDevices request', {
        shopId: shopIdParam,
        phone: maskedPhone,
        operator,
        requestId,
      }),
    );

    try {
      // Validate ny-operator header
      if (!operator) {
        this.logger.warn(
          createSafeLogMessage('Missing ny-operator header', {
            requestId,
          }),
        );

        throw new UnauthorizedException('Missing ny-operator header');
      }

      // Validate and parse shopId
      const shopId = this.validateShopId(shopIdParam, requestId);

      // Validate phone (basic validation, format not checked per FR-015)
      this.validatePhone(phone, requestId);

      // Create DTO for internal validation (optional, since we've already validated)
      const queryDto: GetMemberDevicesQueryDto = {
        shopId,
        phone,
        operator,
      };

      this.logger.debug(
        createSafeLogMessage('Request validation completed', {
          shopId,
          phone: maskedPhone,
          operator,
          requestId,
        }),
      );

      // Call service
      const memberDevicesData =
        await this.marketingCloudService.getMemberDevices(
          shopId,
          phone,
          operator,
        );

      // Create response
      const response = createMemberDevicesResponse(
        shopId,
        phone,
        memberDevicesData.devices,
        requestId,
      );

      this.logger.log(
        createSafeLogMessage(
          'getMemberDevices request completed successfully',
          {
            shopId,
            phone: maskedPhone,
            deviceCount: memberDevicesData.totalCount,
            operator,
            requestId,
          },
        ),
      );

      return response;
    } catch (error) {
      this.logger.error(
        createSafeLogMessage('getMemberDevices request failed', {
          shopId: shopIdParam,
          phone: maskedPhone,
          operator: operator || '[missing]',
          requestId,
          error: error instanceof Error ? error.message : String(error),
          errorType:
            error instanceof Error ? error.constructor.name : typeof error,
        }),
      );

      // Re-throw NestJS exceptions (they will be handled by exception filters)
      throw error;
    }
  }

  /**
   * Validate shop ID parameter
   */
  private validateShopId(shopIdParam: string, requestId: string): number {
    // Check if it's a valid number
    const shopId = parseInt(shopIdParam, 10);

    if (isNaN(shopId)) {
      this.logger.warn(
        createSafeLogMessage('Invalid shop ID format - not a number', {
          shopIdParam,
          requestId,
        }),
      );

      throw new BadRequestException(
        'Invalid shop ID format - must be a number',
        {
          description: `Received: ${shopIdParam}`,
        },
      );
    }

    // Check if it's positive
    if (shopId <= 0) {
      this.logger.warn(
        createSafeLogMessage('Invalid shop ID - must be positive', {
          shopId,
          requestId,
        }),
      );

      throw new BadRequestException(
        'Invalid shop ID - must be a positive integer',
        {
          description: `Received: ${shopId}`,
        },
      );
    }

    return shopId;
  }

  /**
   * Validate phone parameter
   * According to FR-015, we don't validate format, just ensure it's not empty
   */
  private validatePhone(phone: string, requestId: string): void {
    if (!phone || phone.trim().length === 0) {
      this.logger.warn(
        createSafeLogMessage('Invalid phone - empty or whitespace only', {
          requestId,
        }),
      );

      throw new BadRequestException('Phone number cannot be empty');
    }

    // Additional check for URL encoding issues
    if (phone.includes('%20') || phone.includes('+')) {
      this.logger.warn(
        createSafeLogMessage('Phone number appears to be URL encoded', {
          phone: maskPhoneNumber(phone),
          requestId,
        }),
      );

      throw new BadRequestException(
        'Phone number contains invalid characters',
        {
          description: 'Phone number should not contain URL encoded characters',
        },
      );
    }
  }

  /**
   * Generate unique request ID for tracking
   */
  private generateRequestId(): string {
    const timestamp = Date.now().toString(36);
    const randomStr = Math.random().toString(36).substring(2, 8);
    return `req-${timestamp}-${randomStr}`;
  }
}
