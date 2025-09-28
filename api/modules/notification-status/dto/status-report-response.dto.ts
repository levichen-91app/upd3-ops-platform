import { ApiProperty } from '@nestjs/swagger';

/**
 * 狀態報告回應資料 DTO
 *
 * 外部 NS Report API 回傳的核心資料結構
 */
export class StatusReportDataDto {
  @ApiProperty({
    description: '報告下載連結 (presigned URL)',
    example: 'https://s3.amazonaws.com/reports/notification-report-123.tsv?signature=abc123&expires=1640995200',
    type: 'string',
    format: 'uri',
  })
  downloadUrl!: string;

  @ApiProperty({
    description: '下載連結過期時間 (秒數)',
    example: 3600,
    type: 'number',
    minimum: 1,
  })
  expiredTime!: number;
}

/**
 * 狀態報告成功回應 DTO
 *
 * POST /api/v1/notification-status/reports 成功回應的完整結構
 */
export class StatusReportResponseDto {
  @ApiProperty({
    description: '請求是否成功',
    example: true,
    type: 'boolean',
  })
  success!: boolean;

  @ApiProperty({
    description: '報告資料',
    type: StatusReportDataDto,
  })
  data!: StatusReportDataDto;

  @ApiProperty({
    description: '請求時間戳記 (ISO 8601 格式)',
    example: '2024-01-15T10:30:00.000Z',
    type: 'string',
    format: 'date-time',
  })
  timestamp!: string;

  @ApiProperty({
    description: '請求識別碼',
    example: 'req-reports-1705317000000-abc123',
    type: 'string',
    pattern: '^req-reports-\\d+-[a-zA-Z0-9]+$',
  })
  requestId!: string;
}

/**
 * 狀態報告錯誤詳情 DTO
 *
 * 各種錯誤情況的詳細資訊
 */
export class StatusReportErrorDetailsDto {
  @ApiProperty({
    description: '錯誤欄位名稱 (驗證錯誤時)',
    example: 'nsId',
    type: 'string',
    required: false,
  })
  field?: string;

  @ApiProperty({
    description: '欄位錯誤訊息 (驗證錯誤時)',
    example: 'nsId must be a valid UUID',
    type: 'string',
    required: false,
  })
  message?: string;

  @ApiProperty({
    description: '認證 header 名稱 (認證錯誤時)',
    example: 'ny-operator',
    type: 'string',
    required: false,
  })
  header?: string;

  @ApiProperty({
    description: '提供的 header 值 (認證錯誤時)',
    example: '',
    type: 'string',
    required: false,
    nullable: true,
  })
  provided?: string | null;

  @ApiProperty({
    description: '原始錯誤訊息 (外部 API 錯誤時)',
    example: 'Request timeout',
    type: 'string',
    required: false,
  })
  originalMessage?: string;

  @ApiProperty({
    description: '錯誤類型 (外部 API 錯誤時)',
    example: 'TimeoutError',
    type: 'string',
    required: false,
  })
  errorType?: string;

  @ApiProperty({
    description: 'HTTP 狀態碼 (外部 API 錯誤時)',
    example: 500,
    type: 'number',
    required: false,
  })
  statusCode?: number;

  @ApiProperty({
    description: 'HTTP 狀態文字 (外部 API 錯誤時)',
    example: 'Internal Server Error',
    type: 'string',
    required: false,
  })
  statusText?: string;

  @ApiProperty({
    description: '錯誤代碼 (連接錯誤時)',
    example: 'ECONNREFUSED',
    type: 'string',
    required: false,
  })
  errorCode?: string;
}

/**
 * 狀態報告錯誤結構 DTO
 */
export class StatusReportErrorDto {
  @ApiProperty({
    description: '錯誤代碼',
    example: 'VALIDATION_ERROR',
    type: 'string',
    enum: ['VALIDATION_ERROR', 'UNAUTHORIZED', 'EXTERNAL_API_ERROR'],
  })
  code!: string;

  @ApiProperty({
    description: '錯誤訊息',
    example: '輸入參數驗證失敗',
    type: 'string',
  })
  message!: string;

  @ApiProperty({
    description: '錯誤詳細資訊',
    oneOf: [
      { type: 'array', items: { $ref: '#/components/schemas/StatusReportErrorDetailsDto' } },
      { $ref: '#/components/schemas/StatusReportErrorDetailsDto' },
    ],
    required: false,
  })
  details?: StatusReportErrorDetailsDto[] | StatusReportErrorDetailsDto;
}

/**
 * 狀態報告錯誤回應 DTO
 *
 * POST /api/v1/notification-status/reports 錯誤回應的完整結構
 */
export class StatusReportErrorResponseDto {
  @ApiProperty({
    description: '請求是否成功',
    example: false,
    type: 'boolean',
  })
  success!: boolean;

  @ApiProperty({
    description: '錯誤資訊',
    type: StatusReportErrorDto,
  })
  error!: StatusReportErrorDto;

  @ApiProperty({
    description: '請求時間戳記 (ISO 8601 格式)',
    example: '2024-01-15T10:30:00.000Z',
    type: 'string',
    format: 'date-time',
  })
  timestamp!: string;

  @ApiProperty({
    description: '請求識別碼',
    example: 'req-reports-1705317000000-abc123',
    type: 'string',
    pattern: '^req-reports-\\d+-[a-zA-Z0-9]+$',
  })
  requestId!: string;
}