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
@ApiExtraModels(ApiErrorResponse)
@Controller('api/v1/shops/:shopId/members/by-phone/:phone')
export class MarketingCloudController {
  private readonly logger = new Logger(MarketingCloudController.name);

  constructor() {}


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
