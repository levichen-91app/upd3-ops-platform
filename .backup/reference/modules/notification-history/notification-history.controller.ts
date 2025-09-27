import {
  Controller,
  Get,
  Param,
  Headers,
  HttpException,
  HttpStatus,
  Logger,
  ParseIntPipe,
  UsePipes,
  ValidationPipe,
  Req
} from '@nestjs/common';
import type { Request } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiHeader,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiNotFoundResponse,
  ApiBadGatewayResponse
} from '@nestjs/swagger';
import { NotificationHistoryService } from './notification-history.service';
import { RequestIdMiddleware } from '../../common/middleware/request-id.middleware';
import {
  NotificationHistoryResponse,
  NotificationHistoryResponseClass,
  ValidationErrorResponseClass,
  UnauthorizedErrorResponseClass,
  NotFoundErrorResponseClass,
  WhaleApiUnavailableErrorResponseClass
} from './dto/api-response.dto';

@ApiTags('Notification History')
@Controller('api/v1/shops')
@UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
export class NotificationHistoryController {
  private readonly logger = new Logger(NotificationHistoryController.name);

  constructor(
    private readonly notificationHistoryService: NotificationHistoryService,
  ) {}

  @Get(':shopId/notifications/:notificationId/history')
  @ApiOperation({
    summary: '查詢通知歷程',
    description: '查詢指定商店和通知的歷程資料，包含通知中心 ID (ncId) 和預約發送時間 (bookDateTime)'
  })
  @ApiParam({
    name: 'shopId',
    type: 'number',
    description: '商店 ID（正整數）',
    example: 12345
  })
  @ApiParam({
    name: 'notificationId',
    type: 'number',
    description: '通知 ID（正整數）',
    example: 67890
  })
  @ApiHeader({
    name: 'ny-operator',
    description: '操作者識別碼',
    required: true,
    example: 'system-admin'
  })
  @ApiResponse({
    status: 200,
    description: '成功取得通知歷程資料',
    type: NotificationHistoryResponseClass
  })
  @ApiBadRequestResponse({
    description: '參數驗證錯誤',
    type: ValidationErrorResponseClass
  })
  @ApiUnauthorizedResponse({
    description: '未授權存取',
    type: UnauthorizedErrorResponseClass
  })
  @ApiNotFoundResponse({
    description: '通知記錄不存在',
    type: NotFoundErrorResponseClass
  })
  @ApiBadGatewayResponse({
    description: 'Whale API 服務無法使用',
    type: WhaleApiUnavailableErrorResponseClass
  })
  async getNotificationHistory(
    @Param('shopId') shopIdParam: string,
    @Param('notificationId') notificationIdParam: string,
    @Req() req: Request,
    @Headers('ny-operator') nyOperator?: string,
  ): Promise<NotificationHistoryResponse> {
    const requestId = RequestIdMiddleware.getRequestId(req);

    // Parse and validate parameters - collect all validation errors
    const validationErrors: any = {};
    let shopId: number | undefined;
    let notificationId: number | undefined;

    // Parse shopId with strict validation
    const shopIdTrimmed = shopIdParam.trim();
    // Check if it's a valid integer string (no decimals, no special chars)
    if (!/^\d+$/.test(shopIdTrimmed)) {
      validationErrors.shopId = 'Shop ID must be integer type (not string or decimal)';
    } else {
      const shopIdNum = parseInt(shopIdTrimmed, 10);
      if (shopIdNum <= 0) {
        validationErrors.shopId = 'Shop ID must be a positive integer (minimum 1)';
      } else {
        shopId = shopIdNum;
      }
    }

    // Parse notificationId with strict validation
    const notificationIdTrimmed = notificationIdParam.trim();
    // Check if it's a valid integer string (no decimals, no special chars)
    if (!/^\d+$/.test(notificationIdTrimmed)) {
      validationErrors.notificationId = 'Notification ID must be integer type (not string or decimal)';
    } else {
      const notificationIdNum = parseInt(notificationIdTrimmed, 10);
      if (notificationIdNum <= 0) {
        validationErrors.notificationId = 'Notification ID must be a positive integer (minimum 1)';
      } else {
        notificationId = notificationIdNum;
      }
    }

    // If there are validation errors, throw a single exception with all details
    if (Object.keys(validationErrors).length > 0) {
      let message = 'Invalid request parameters';
      if (validationErrors.shopId && validationErrors.notificationId) {
        message = 'Invalid shop and notification parameters - values must meet minimum requirements';
      } else if (validationErrors.shopId) {
        if (validationErrors.shopId.includes('integer type')) {
          message = 'Invalid shop parameter - must be integer type (not string or decimal)';
        } else {
          message = 'Invalid shop parameter - must meet minimum value requirements';
        }
      } else if (validationErrors.notificationId) {
        if (validationErrors.notificationId.includes('integer type')) {
          message = 'Invalid notification parameter - must be integer type (not string or decimal)';
        } else {
          message = 'Invalid notification parameter - must meet minimum value requirements';
        }
      }

      throw new HttpException({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message,
          details: validationErrors
        },
        timestamp: new Date().toISOString(),
        requestId,
      }, HttpStatus.BAD_REQUEST);
    }

    this.logger.log(`[${requestId}] GET /api/v1/shops/${shopId}/notifications/${notificationId}/history`);

    // Validate authentication
    if (!nyOperator || nyOperator.trim().length === 0) {
      this.logger.warn(`[${requestId}] Missing or invalid ny-operator header`);
      throw new HttpException({
        success: false,
        error: {
          code: 'UNAUTHORIZED_ACCESS',
          message: 'Missing or invalid ny-operator header'
        },
        timestamp: new Date().toISOString(),
        requestId,
      }, HttpStatus.UNAUTHORIZED);
    }

    try {
      const notificationHistory = await this.notificationHistoryService.getNotificationHistory(
        shopId!,
        notificationId!,
        requestId
      );

      this.logger.log(`[${requestId}] Successfully retrieved notification history for shopId=${shopId}, notificationId=${notificationId}`);

      return {
        success: true,
        data: notificationHistory,
        timestamp: new Date().toISOString(),
        requestId,
      };
    } catch (error: any) {
      this.logger.error(`[${requestId}] Failed to get notification history: ${error.message}`, error.stack);

      if (error instanceof HttpException) {
        // Re-format error response to ensure consistent structure
        const response = error.getResponse() as any;
        throw new HttpException({
          success: false,
          error: response.code ? response : {
            code: response.error?.code || 'UNKNOWN_ERROR',
            message: response.error?.message || response.message || 'Unknown error',
            details: response.error?.details || response.details
          },
          timestamp: new Date().toISOString(),
          requestId,
        }, error.getStatus());
      }

      // Fallback error
      throw new HttpException({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Internal server error',
        },
        timestamp: new Date().toISOString(),
        requestId,
      }, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}