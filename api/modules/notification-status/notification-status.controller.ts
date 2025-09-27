import {
  Controller,
  Get,
  Param,
  Headers,
  UseFilters,
  ValidationPipe,
  UsePipes,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiHeader,
  ApiResponse,
  ApiOkResponse,
  ApiBadRequestResponse,
  ApiInternalServerErrorResponse,
} from '@nestjs/swagger';
import { NotificationStatusService } from './notification-status.service';
import { NotificationDetailQueryDto } from './dto/notification-detail-query.dto';
import {
  NotificationDetailResponseDto,
  ApiErrorResponseDto,
} from './dto/notification-detail-response.dto';
import { NotificationStatusExceptionFilter } from '../../common/filters/notification-status-exception.filter';

@ApiTags('Notification Status')
@Controller('api/v1/notification-status')
@UseFilters(NotificationStatusExceptionFilter)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class NotificationStatusController {
  constructor(
    private readonly notificationStatusService: NotificationStatusService,
  ) {}

  @Get('detail/:shopId/:ncId')
  @ApiOperation({
    summary: '查詢通知詳細資訊',
    description: '透過商店ID和通知中心ID查詢通知的詳細資訊，獲取NSId、狀態、報告等資訊',
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
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(queryDto.ncId)) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: '輸入參數驗證失敗',
        details: 'ncId must be a valid UUID format',
      });
    }

    return await this.notificationStatusService.getNotificationDetail(
      queryDto.shopId,
      queryDto.ncId,
      queryDto.nyOperator,
    );
  }
}