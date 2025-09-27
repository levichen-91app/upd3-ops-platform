import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsBoolean, IsOptional, IsEnum, Min, IsUUID, IsDateString, IsNotEmpty } from 'class-validator';
import { NotificationStatus } from './notification-status.enum';

/**
 * NotificationHistoryData DTO
 *
 * Maps to the Whale API response structure for notification history data.
 * This DTO represents the complete notification history entity with all fields
 * as expected by the contract and integration tests.
 *
 * Core fields (primary business requirements):
 * - ncId: Notification Center ID (UUID format)
 * - bookDateTime: Scheduled send time (ISO 8601 format)
 *
 * Based on test specifications from:
 * - test/contract/notification-history-success.contract.spec.ts
 * - test/integration/notification-history-success.integration.spec.ts
 */
export class NotificationHistoryData {
  /**
   * Shop ID to identify the shop
   * @example 12345
   */
  @ApiProperty({
    description: 'Shop ID to identify the shop',
    example: 12345,
    type: Number,
  })
  @IsNumber()
  @Min(1)
  shopId: number = 0;

  /**
   * Notification ID to identify the specific notification
   * @example 67890
   */
  @ApiProperty({
    description: 'Notification ID to identify the specific notification',
    example: 67890,
    type: Number,
  })
  @IsNumber()
  @Min(1)
  notificationId: number = 0;

  /**
   * Notification Center ID (core field)
   * Primary business requirement - UUID format
   * @example "a4070188-050d-47f7-ab24-2523145408cf"
   */
  @ApiProperty({
    description: 'Notification Center ID (UUID format) - core business field',
    example: 'a4070188-050d-47f7-ab24-2523145408cf',
    type: String,
    format: 'uuid',
  })
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  ncId: string = '';

  /**
   * Scheduled send time (core field)
   * Primary business requirement - ISO 8601 format
   * @example "2024-01-15T10:30:00Z"
   */
  @ApiProperty({
    description: 'Scheduled send time (ISO 8601 format) - core business field',
    example: '2024-01-15T10:30:00Z',
    type: String,
    format: 'date-time',
  })
  @IsString()
  @IsNotEmpty()
  @IsDateString()
  bookDateTime: string = '';

  /**
   * Current status of the notification
   * @example "Success"
   */
  @ApiProperty({
    description: 'Current status of the notification',
    example: 'Success',
    enum: NotificationStatus,
  })
  @IsEnum(NotificationStatus)
  status: NotificationStatus = NotificationStatus.PENDING;

  /**
   * Notification channel used
   * @example "Email"
   */
  @ApiProperty({
    description: 'Notification channel used (Email, SMS, Push, etc.)',
    example: 'Email',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  channel: string = '';

  /**
   * Actual send time (optional)
   * Only present if the notification has been sent
   * @example "2024-01-15T10:35:00Z"
   */
  @ApiProperty({
    description: 'Actual send time (ISO 8601 format) - optional, only if sent',
    example: '2024-01-15T10:35:00Z',
    type: String,
    format: 'date-time',
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsDateString()
  sentDateTime?: string;

  /**
   * Whether the notification processing has been completed
   * @example true
   */
  @ApiProperty({
    description: 'Whether the notification processing has been completed',
    example: true,
    type: Boolean,
  })
  @IsBoolean()
  isSettled: boolean = false;

  /**
   * Original target audience count
   * @example 1000
   */
  @ApiProperty({
    description: 'Original target audience count',
    example: 1000,
    type: Number,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  originalAudienceCount: number = 0;

  /**
   * Number of notifications actually sent
   * Should be <= originalAudienceCount
   * @example 900
   */
  @ApiProperty({
    description: 'Number of notifications actually sent (≤ originalAudienceCount)',
    example: 900,
    type: Number,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  sentAudienceCount: number = 0;

  /**
   * Number of notifications successfully received
   * Should be <= sentAudienceCount
   * @example 850
   */
  @ApiProperty({
    description: 'Number of notifications successfully received (≤ sentAudienceCount)',
    example: 850,
    type: Number,
    minimum: 0,
  })
  @IsNumber()
  @Min(0)
  receivedAudienceCount: number = 0;

  /**
   * Creation timestamp
   * @example "2024-01-15T10:00:00Z"
   */
  @ApiProperty({
    description: 'Creation timestamp (ISO 8601 format)',
    example: '2024-01-15T10:00:00Z',
    type: String,
    format: 'date-time',
  })
  @IsString()
  @IsNotEmpty()
  @IsDateString()
  createdAt: string = '';

  /**
   * Last update timestamp
   * @example "2024-01-15T10:35:00Z"
   */
  @ApiProperty({
    description: 'Last update timestamp (ISO 8601 format)',
    example: '2024-01-15T10:35:00Z',
    type: String,
    format: 'date-time',
  })
  @IsString()
  @IsNotEmpty()
  @IsDateString()
  updatedAt: string = '';
}