import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Headers,
  Query,
  Req,
  UseFilters,
  UseGuards,
  ValidationPipe,
  UsePipes,
  HttpCode,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiHeader,
  ApiResponse,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiUnauthorizedResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { NotificationStatusService } from './notification-status.service';
import { NotificationStatusReportsService } from './services/notification-status-reports.service';
import { NotificationDetailQueryDto } from './dto/notification-detail-query.dto';
import {
  NotificationDetailResponseDto,
  ApiErrorResponseDto,
} from './dto/notification-detail-response.dto';
import { NotificationDetail } from './interfaces/nc-detail.interface';
import { DeviceQueryRequestDto } from './dto/device-query-request.dto';
import {
  DeviceQueryResponseDto,
  ErrorResponseDto,
} from './dto/device-response.dto';
import { NotificationHistoryQuery } from './dto/notification-history-query.dto';
import { NotificationHistoryResponse } from './dto/notification-history-response.dto';
import { StatusReportRequestDto } from './dto/status-report-request.dto';
import { StatusReportResponseDto, StatusReportErrorResponseDto } from './dto/status-report-response.dto';
import { NyOperatorGuard } from './guards/ny-operator.guard';
import { NotificationStatusExceptionFilter } from '../../common/filters/notification-status-exception.filter';
import { RequestIdMiddleware } from '../../common/middleware/request-id.middleware';
import { NY_OPERATOR_HEADER } from '../../constants/headers.constants';

@ApiTags('Notification Status')
@Controller('api/v1/notification-status')
@UseFilters(NotificationStatusExceptionFilter)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class NotificationStatusController {
  constructor(
    private readonly notificationStatusService: NotificationStatusService,
    private readonly reportsService: NotificationStatusReportsService,
  ) {}

  @Get('detail/:shopId/:ncId')
  @ApiOperation({
    summary: '查詢通知詳細資訊',
    description:
      '透過商店ID和通知中心ID查詢通知的詳細資訊，獲取NSId、狀態、報告等資訊',
  })
  @ApiParam({
    name: 'shopId',
    description: '商店ID (正整數)',
    example: 12345,
    type: 'integer',
  })
  @ApiParam({
    name: 'ncId',
    description: '通知中心ID (UUID格式)',
    example: 'a4070188-050d-47f7-ab24-2523145408cf',
    type: 'string',
    format: 'uuid',
  })
  @ApiHeader({
    name: 'ny-operator',
    description: '操作者識別',
    example: 'john.doe',
    required: true,
  })
  @ApiOkResponse({
    description: '成功取得通知詳細資訊 (可能為null)',
    type: NotificationDetailResponseDto,
  })
  @ApiBadRequestResponse({
    description: '參數驗證失敗',
    type: ApiErrorResponseDto,
  })
  @ApiInternalServerErrorResponse({
    description: '內部服務錯誤',
    type: ApiErrorResponseDto,
  })
  async getNotificationDetail(
    @Param('shopId') shopId: string,
    @Param('ncId') ncId: string,
    @Headers('ny-operator') nyOperator: string,
    @Req() request: Request,
  ): Promise<NotificationDetail | null> {
    // Validate ny-operator header
    if (!nyOperator || nyOperator.trim() === '') {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'Missing required header',
        details: 'ny-operator header is required',
      });
    }

    // Create and validate query DTO
    const queryDto = new NotificationDetailQueryDto();
    queryDto.shopId = parseInt(shopId, 10);
    queryDto.ncId = ncId;
    queryDto.nyOperator = nyOperator;

    // Validate shopId
    if (isNaN(queryDto.shopId) || queryDto.shopId <= 0) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: '輸入參數驗證失敗',
        details: 'shopId must be a positive integer',
      });
    }

    // Validate ncId format (basic UUID check)
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(queryDto.ncId)) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: '輸入參數驗證失敗',
        details: 'ncId must be a valid UUID format',
      });
    }

    const requestId = RequestIdMiddleware.getRequestId(request);

    return await this.notificationStatusService.getNotificationDetail(
      queryDto.shopId,
      queryDto.ncId,
      queryDto.nyOperator,
      requestId,
    );
  }

  @Get('devices')
  @UseGuards(NyOperatorGuard)
  @ApiOperation({
    summary: 'Query customer device information',
    description:
      'Retrieve all registered devices for a specific customer identified by shop ID and phone number. Used by operations teams to investigate notification delivery issues.',
  })
  @ApiQuery({
    name: 'shopId',
    description: 'Shop identifier',
    example: 12345,
    type: 'integer',
  })
  @ApiQuery({
    name: 'phone',
    description: 'Customer phone number',
    example: '0912345678',
    type: 'string',
  })
  @ApiHeader({
    name: 'ny-operator',
    description: 'Operations team authentication header',
    example: 'operations-team',
    required: true,
  })
  @ApiOkResponse({
    description: 'Successfully retrieved device list',
    type: DeviceQueryResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Parameter validation failure',
    type: ErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Authentication required',
    type: ErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'No devices found for customer',
    type: ErrorResponseDto,
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal server error',
    type: ErrorResponseDto,
  })
  async getDevices(
    @Query() queryDto: DeviceQueryRequestDto,
    @Req() request: Request,
  ): Promise<DeviceQueryResponseDto> {
    const requestId = RequestIdMiddleware.getRequestId(request);

    const result = await this.notificationStatusService.getDevices(
      queryDto.shopId,
      queryDto.phone,
      requestId,
    );
    return result;
  }

  @Get('history/:notificationId')
  @UseGuards(NyOperatorGuard)
  @ApiOperation({
    summary: '查詢通知活動歷程',
    description: '透過通知ID查詢活動執行歷程，獲取ncId和bookDateTime',
  })
  @ApiParam({
    name: 'notificationId',
    description: '通知ID',
    example: 12345,
    type: 'integer',
    format: 'int64',
  })
  @ApiHeader({
    name: 'ny-operator',
    description: '操作者認證標頭',
    example: 'operations-team',
    required: true,
  })
  @ApiOkResponse({
    description: '成功取得活動歷程',
    type: NotificationHistoryResponse,
  })
  @ApiBadRequestResponse({
    description: '參數驗證失敗',
    type: ApiErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: '認證失敗',
    type: ApiErrorResponseDto,
  })
  @ApiNotFoundResponse({
    description: '通知不存在',
    type: ApiErrorResponseDto,
  })
  @ApiInternalServerErrorResponse({
    description: '內部服務錯誤',
    type: ApiErrorResponseDto,
  })
  async getNotificationHistory(
    @Param('notificationId') notificationIdParam: string,
    @Req() request: Request,
  ): Promise<NotificationHistoryResponse> {
    // Validate parameter format first (reject decimals, non-numeric strings)
    if (!/^\d+$/.test(notificationIdParam)) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: '通知ID必須為正整數',
        details: 'notificationId must be a positive integer',
      });
    }

    // Validate and transform parameter
    const notificationId = parseInt(notificationIdParam, 10);

    if (isNaN(notificationId) || notificationId <= 0 || !Number.isInteger(notificationId)) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: '通知ID必須為正整數',
        details: 'notificationId must be a positive integer',
      });
    }

    const requestId = RequestIdMiddleware.getRequestId(request);

    return await this.notificationStatusService.getNotificationHistory(notificationId, requestId);
  }

  @Post('reports')
  @HttpCode(200)
  @UseGuards(NyOperatorGuard)
  @ApiOperation({
    summary: '查詢通知狀態報告',
    description: '根據 nsId、通知日期和通知類型查詢詳細的通知狀態報告，回傳 presigned URL 供下載 TSV 格式報告',
  })
  @ApiHeader({
    name: NY_OPERATOR_HEADER,
    description: '內部營運團隊認證標頭',
    example: 'internal-ops-team',
    required: true,
  })
  @ApiOkResponse({
    description: '成功取得報告下載連結',
    type: StatusReportResponseDto,
  })
  @ApiBadRequestResponse({
    description: '輸入參數驗證失敗',
    type: StatusReportErrorResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: '認證失敗：缺少或無效的 ny-operator header',
    type: StatusReportErrorResponseDto,
  })
  @ApiInternalServerErrorResponse({
    description: '外部 API 調用失敗',
    type: StatusReportErrorResponseDto,
  })
  async getStatusReports(
    @Body() requestDto: StatusReportRequestDto,
    @Req() request: Request,
  ): Promise<{ downloadUrl: string; expiredTime: number }> {
    // NyOperatorGuard 已驗證 ny-operator header
    const requestId = RequestIdMiddleware.getRequestId(request);

    // 直接調用服務層處理業務邏輯
    return await this.reportsService.getStatusReport(requestDto, requestId);
  }
}
