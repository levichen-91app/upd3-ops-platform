import { ApiProperty } from '@nestjs/swagger';
import type { NotificationDetail, NotificationReport } from '../interfaces/nc-detail.interface';

export class NotificationReportDto {
  @ApiProperty({ description: '總筆數', example: 1000 })
  Total!: number;

  @ApiProperty({ description: '找不到使用者資料', example: 50 })
  NoUserData!: number;

  @ApiProperty({ description: '被黑名單篩掉', example: 20 })
  InBlackList!: number;

  @ApiProperty({ description: '不想收到這種訊息', example: 30 })
  DontWantToReceiveThisMessageType!: number;

  @ApiProperty({ description: '已遞送', example: 800 })
  Sent!: number;

  @ApiProperty({ description: '遞送失敗', example: 50 })
  Fail!: number;

  @ApiProperty({ description: '沒有遞送出去', example: 30 })
  DidNotSend!: number;

  @ApiProperty({ description: '取消', example: 20 })
  Cancel!: number;

  @ApiProperty({ description: '沒有Token資料 (Push專用)', example: 0, required: false })
  NoTokenData?: number;

  @ApiProperty({ description: 'NS收到 (Push/SMS專用)', example: 0, required: false })
  Received?: number;

  @ApiProperty({ description: 'Email是空值 (Email專用)', example: 0, required: false })
  EmailIsEmpty?: number;

  @ApiProperty({ description: '手機是空值 (SMS專用)', example: 0, required: false })
  CellPhoneIsEmpty?: number;

  @ApiProperty({ description: '客戶確實收到 (SMS專用)', example: 0, required: false })
  Success?: number;

  @ApiProperty({ description: '供應商取消遞送 (SMS專用)', example: 0, required: false })
  Declined?: number;

  @ApiProperty({ description: '非TW電話 (SMS專用)', example: 0, required: false })
  CellPhoneIsNotTW?: number;

  @ApiProperty({ description: '非MY電話 (SMS專用)', example: 0, required: false })
  CellPhoneIsNotMY?: number;
}

export class NotificationDetailDto {
  @ApiProperty({
    description: '通知中心ID',
    example: 'a4070188-050d-47f7-ab24-2523145408cf',
    format: 'uuid',
  })
  NCId!: string;

  @ApiProperty({
    description: '通知服務ID',
    example: 'd68e720f-62ed-4955-802b-8e3f04c56a19',
    format: 'uuid',
  })
  NSId!: string;

  @ApiProperty({
    description: '通知狀態',
    example: 'Completed',
    enum: ['Scheduled', 'Processing', 'Completed', 'Failed', 'Cancelled'],
  })
  Status!: 'Scheduled' | 'Processing' | 'Completed' | 'Failed' | 'Cancelled';

  @ApiProperty({
    description: '通知類型',
    example: 'Push',
    enum: ['Push', 'Email', 'SMS'],
  })
  ChannelType!: 'Push' | 'Email' | 'SMS';

  @ApiProperty({
    description: '建立時間',
    example: '2025-09-15T01:58:31.117',
    format: 'date-time',
  })
  CreateDateTime!: string;

  @ApiProperty({
    description: '發送報告',
    type: NotificationReportDto,
  })
  Report!: NotificationReportDto;

  @ApiProperty({
    description: '簡訊報告連結',
    example: null,
    nullable: true,
    required: false,
  })
  ShortMessageReportLink?: string | null;
}

export class ApiSuccessResponseDto<T> {
  @ApiProperty({ description: '操作是否成功', example: true })
  success!: true;

  @ApiProperty({ description: '回應資料' })
  data!: T | null;

  @ApiProperty({
    description: '回應時間戳',
    example: '2025-01-27T10:35:00Z',
    format: 'date-time',
  })
  timestamp!: string;

  @ApiProperty({
    description: '請求追蹤ID',
    example: 'req-detail-123456',
  })
  requestId!: string;
}

export class ErrorDetailDto {
  @ApiProperty({
    description: '錯誤代碼',
    example: 'VALIDATION_ERROR',
    enum: [
      'VALIDATION_ERROR',
      'EXTERNAL_API_ERROR',
      'TIMEOUT_ERROR',
      'DATA_FORMAT_ERROR',
      'INTERNAL_SERVER_ERROR',
    ],
  })
  code!: string;

  @ApiProperty({
    description: '錯誤訊息',
    example: '輸入參數驗證失敗',
  })
  message!: string;

  @ApiProperty({
    description: '錯誤詳細資訊',
    example: 'shopId must be greater than 0',
    required: false,
  })
  details?: any;
}

export class ApiErrorResponseDto {
  @ApiProperty({ description: '操作是否成功', example: false })
  success!: false;

  @ApiProperty({
    description: '錯誤詳情',
    type: ErrorDetailDto,
  })
  error!: ErrorDetailDto;

  @ApiProperty({
    description: '錯誤時間戳',
    example: '2025-01-27T10:35:00Z',
    format: 'date-time',
  })
  timestamp!: string;

  @ApiProperty({
    description: '請求追蹤ID',
    example: 'req-detail-123456',
  })
  requestId!: string;
}

export class NotificationDetailResponseDto extends ApiSuccessResponseDto<NotificationDetailDto> {
  @ApiProperty({
    description: '通知詳細資訊 (可能為null)',
    type: NotificationDetailDto,
    nullable: true,
  })
  declare data: NotificationDetailDto | null;
}