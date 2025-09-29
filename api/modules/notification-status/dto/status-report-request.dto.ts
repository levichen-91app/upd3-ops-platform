import { IsUUID, IsNotEmpty, IsString, Matches, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { NotificationType } from '../../../constants/notification-types.constants';

/**
 * 狀態報告請求 DTO
 *
 * 用於驗證 POST /api/v1/notification-status/reports 的請求參數
 * 包含完整的 class-validator 驗證規則和 Swagger 文檔註解
 */
export class StatusReportRequestDto {
  @ApiProperty({
    description: '通知系統 ID (UUID 格式)',
    example: 'd68e720f-62ed-4955-802b-8e3f04c56a19',
    type: 'string',
    format: 'uuid',
  })
  @IsNotEmpty({ message: 'nsId should not be empty' })
  @IsUUID('4', { message: 'nsId must be a valid UUID' })
  nsId!: string;

  @ApiProperty({
    description: '通知發送日期 (YYYY/MM/DD 格式)',
    example: '2024/01/15',
    type: 'string',
    pattern: '^\\d{4}/\\d{2}/\\d{2}$',
  })
  @IsNotEmpty({ message: 'notificationDate should not be empty' })
  @IsString({ message: 'notificationDate must be a string' })
  @Matches(/^(19|20)\d{2}\/(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])$/, {
    message: 'notificationDate must be in YYYY/MM/DD format',
  })
  notificationDate!: string;

  @ApiProperty({
    description: '通知類型',
    example: 'push',
    enum: NotificationType,
    enumName: 'NotificationType',
  })
  @IsNotEmpty({ message: 'notificationType should not be empty' })
  @IsString({ message: 'notificationType must be a string' })
  @IsIn(Object.values(NotificationType), {
    message: 'notificationType must be one of: sms, push, line, email',
  })
  notificationType!: string;
}
