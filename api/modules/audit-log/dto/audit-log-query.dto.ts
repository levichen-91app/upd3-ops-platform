import { ApiProperty } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsInt,
  IsEnum,
  IsDateString,
  Min,
  Max,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  AUDIT_LOG_QUERY_LIMITS,
  AUDITABLE_METHODS,
} from '../../../common/constants/audit-log.constants';

/**
 * 稽核日誌查詢 DTO
 *
 * 定義查詢 API 的請求參數和驗證規則
 */
export class AuditLogQueryDto {
  @ApiProperty({
    description: '過濾特定操作者',
    required: false,
    maxLength: 255,
    example: 'admin@91app.com',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  operatorFilter?: string;

  @ApiProperty({
    description: '過濾特定 API 路徑關鍵字',
    required: false,
    maxLength: 500,
    example: 'suppliers',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  pathFilter?: string;

  @ApiProperty({
    description: '過濾特定業務頁面',
    required: false,
    maxLength: 100,
    example: 'supplier-management',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  pageFilter?: string;

  @ApiProperty({
    description: '過濾特定業務動作',
    required: false,
    maxLength: 50,
    example: 'update-supplier',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  action?: string;

  @ApiProperty({
    description: '過濾特定 HTTP 方法',
    required: false,
    enum: AUDITABLE_METHODS,
    example: 'POST',
  })
  @IsOptional()
  @IsEnum(AUDITABLE_METHODS)
  method?: string;

  @ApiProperty({
    description: '過濾特定 HTTP 狀態碼',
    required: false,
    minimum: 100,
    maximum: 599,
    example: 200,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(100)
  @Max(599)
  statusCode?: number;

  @ApiProperty({
    description: '查詢起始時間 (ISO 8601)，最早 7 天前',
    required: false,
    type: String,
    format: 'date-time',
    example: '2025-10-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({
    description: '查詢結束時間 (ISO 8601)，必須 >= startDate',
    required: false,
    type: String,
    format: 'date-time',
    example: '2025-10-06T23:59:59.999Z',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({
    description: '每頁筆數',
    required: false,
    minimum: AUDIT_LOG_QUERY_LIMITS.MIN_LIMIT,
    maximum: AUDIT_LOG_QUERY_LIMITS.MAX_LIMIT,
    default: AUDIT_LOG_QUERY_LIMITS.DEFAULT_LIMIT,
    example: 50,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(AUDIT_LOG_QUERY_LIMITS.MIN_LIMIT)
  @Max(AUDIT_LOG_QUERY_LIMITS.MAX_LIMIT)
  limit?: number = AUDIT_LOG_QUERY_LIMITS.DEFAULT_LIMIT;

  @ApiProperty({
    description: '分頁偏移量',
    required: false,
    minimum: AUDIT_LOG_QUERY_LIMITS.MIN_OFFSET,
    default: 0,
    example: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(AUDIT_LOG_QUERY_LIMITS.MIN_OFFSET)
  offset?: number = 0;
}
