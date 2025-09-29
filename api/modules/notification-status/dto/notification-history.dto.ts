import { ApiProperty } from '@nestjs/swagger';
import {
  IsInt,
  IsString,
  IsBoolean,
  IsDateString,
  IsUUID,
  Min,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { WhaleReport } from './whale-report.dto';

export enum NotificationStatus {
  SCHEDULED = 'Scheduled',
  BOOKED = 'Booked',
  SENT = 'Sent',
  ERROR = 'Error',
  SUCCESS = 'Success',
  FAIL = 'Fail',
  PARTIAL_FAIL = 'PartialFail',
  NO_USER = 'NoUser',
}

export class NotificationHistory {
  @ApiProperty({
    description: '通知ID',
    type: 'integer',
    format: 'int64',
    example: 12345,
  })
  @IsInt()
  @Min(1)
  id!: number;

  @ApiProperty({
    description: '通知頻道',
    type: 'string',
    example: 'Push',
  })
  @IsString()
  channel!: string;

  @ApiProperty({
    description: '預定發送時間',
    type: 'string',
    format: 'date-time',
    example: '2024-01-15T10:30:00Z',
  })
  @IsDateString()
  bookDatetime!: string;

  @ApiProperty({
    description: '實際發送時間',
    type: 'string',
    format: 'date-time',
    nullable: true,
    example: '2024-01-15T10:35:00Z',
  })
  @IsOptional()
  @IsDateString()
  sentDatetime?: string | null;

  @ApiProperty({
    description: 'Notification Center ID',
    type: 'string',
    format: 'uuid',
    example: 'a4070188-050d-47f7-ab24-2523145408cf',
  })
  @IsString()
  @IsUUID()
  ncId!: string;

  @ApiProperty({
    description: 'NC Extension ID',
    type: 'integer',
    example: 67890,
  })
  @IsInt()
  ncExtId!: number;

  @ApiProperty({
    description: '通知狀態',
    enum: NotificationStatus,
    example: NotificationStatus.SUCCESS,
  })
  @IsEnum(NotificationStatus)
  status!: NotificationStatus;

  @ApiProperty({
    description: '是否已結算',
    type: 'boolean',
    example: true,
  })
  @IsBoolean()
  isSettled!: boolean;

  @ApiProperty({
    description: '原始受眾數量',
    type: 'integer',
    minimum: 0,
    example: 1000,
  })
  @IsInt()
  @Min(0)
  originalAudienceCount!: number;

  @ApiProperty({
    description: '篩選後受眾數量',
    type: 'integer',
    minimum: 0,
    example: 950,
  })
  @IsInt()
  @Min(0)
  filteredAudienceCount!: number;

  @ApiProperty({
    description: '實際發送數量',
    type: 'integer',
    minimum: 0,
    example: 900,
  })
  @IsInt()
  @Min(0)
  sentAudienceCount!: number;

  @ApiProperty({
    description: '實際接收數量',
    type: 'integer',
    minimum: 0,
    example: 850,
  })
  @IsInt()
  @Min(0)
  receivedAudienceCount!: number;

  @ApiProperty({
    description: '發送失敗數量',
    type: 'integer',
    minimum: 0,
    example: 50,
  })
  @IsInt()
  @Min(0)
  sentFailedCount!: number;

  @ApiProperty({
    description: '統計報告',
    type: () => WhaleReport,
  })
  report!: WhaleReport;
}
