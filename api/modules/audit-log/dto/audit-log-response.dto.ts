import { ApiProperty } from '@nestjs/swagger';

/**
 * 稽核日誌項目 DTO
 */
export class AuditLogEntryDto {
  @ApiProperty({
    description: '稽核日誌唯一識別碼',
    format: 'uuid',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
  })
  id!: string;

  @ApiProperty({
    description: '操作者識別',
    maxLength: 255,
    example: 'admin@91app.com',
  })
  operator!: string;

  @ApiProperty({
    description: '操作頁面或功能識別',
    maxLength: 100,
    example: 'supplier-management',
  })
  page!: string;

  @ApiProperty({
    description: '操作動作描述',
    maxLength: 50,
    example: 'update-supplier',
  })
  action!: string;

  @ApiProperty({
    description: '操作相關的業務欄位',
    additionalProperties: true,
    example: {
      shopId: 12345,
      market: 'TW',
      oldSupplierId: 100,
      newSupplierId: 200,
    },
  })
  fields!: Record<string, any>;

  @ApiProperty({
    description: '技術相關的元資料',
    example: {
      method: 'PATCH',
      path: '/api/v1/shops/12345/suppliers',
      statusCode: 200,
    },
  })
  metadata!: {
    method: string;
    path: string;
    statusCode: number;
  };

  @ApiProperty({
    description: '客戶端 IP 位址 (IPv4/IPv6)',
    maxLength: 45,
    required: false,
    example: '192.168.1.100',
  })
  ipAddress?: string;

  @ApiProperty({
    description: '使用者代理字串',
    maxLength: 1000,
    required: false,
    example: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  })
  userAgent?: string;

  @ApiProperty({
    description: '稽核日誌建立時間 (ISO 8601)',
    format: 'date-time',
    example: '2025-10-06T14:30:52.123Z',
  })
  createdAt!: string;

  @ApiProperty({
    description: '關聯的請求追蹤 ID',
    pattern: '^req-\\d{14}-[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$',
    example: 'req-20251006143052-abc123',
  })
  requestId!: string;
}

/**
 * 分頁資訊 DTO
 */
export class PaginationInfoDto {
  @ApiProperty({
    description: '符合查詢條件的總筆數',
    minimum: 0,
    example: 150,
  })
  total!: number;

  @ApiProperty({
    description: '每頁筆數',
    minimum: 1,
    maximum: 100,
    example: 50,
  })
  limit!: number;

  @ApiProperty({
    description: '分頁偏移量',
    minimum: 0,
    example: 0,
  })
  offset!: number;
}

/**
 * 稽核日誌查詢成功回應 DTO
 */
export class AuditLogQueryResponseDto {
  @ApiProperty({
    description: '操作成功標識',
    enum: [true],
    example: true,
  })
  success!: true;

  @ApiProperty({
    description: '稽核日誌項目清單',
    type: [AuditLogEntryDto],
  })
  data!: AuditLogEntryDto[];

  @ApiProperty({
    description: '分頁資訊',
    type: PaginationInfoDto,
  })
  pagination!: PaginationInfoDto;

  @ApiProperty({
    description: '回應時間戳記 (ISO 8601)',
    format: 'date-time',
    example: '2025-10-06T14:30:52.123Z',
  })
  timestamp!: string;

  @ApiProperty({
    description: '請求追蹤 ID',
    pattern: '^req-\\d{14}-[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$',
    example: 'req-20251006143052-abc123',
  })
  requestId!: string;
}
