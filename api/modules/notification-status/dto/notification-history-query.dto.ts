import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class NotificationHistoryQuery {
  @ApiProperty({
    description: '通知ID',
    type: 'integer',
    format: 'int64',
    minimum: 1,
    example: 12345,
  })
  @Type(() => Number)
  @IsInt({ message: '通知ID必須為整數' })
  @Min(1, { message: '通知ID必須為正整數' })
  notificationId!: number;
}
