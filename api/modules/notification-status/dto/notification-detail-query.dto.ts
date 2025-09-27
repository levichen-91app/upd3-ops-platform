import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsUUID, IsNotEmpty, IsString, Min } from 'class-validator';
import { Transform } from 'class-transformer';

export class NotificationDetailQueryDto {
  @ApiProperty({
    description: '商店ID',
    example: 12345,
    minimum: 1,
  })
  @IsInt({ message: 'shopId must be an integer' })
  @Min(1, { message: 'shopId must be greater than 0' })
  @Transform(({ value }) => parseInt(value))
  shopId!: number;

  @ApiProperty({
    description: '通知中心ID (UUID格式)',
    example: 'a4070188-050d-47f7-ab24-2523145408cf',
    format: 'uuid',
  })
  @IsUUID('4', { message: 'ncId must be a valid UUID' })
  ncId!: string;

  @ApiProperty({
    description: '操作者識別 (來自ny-operator header)',
    example: 'john.doe',
  })
  @IsNotEmpty({ message: 'ny-operator header is required' })
  @IsString({ message: 'ny-operator must be a string' })
  nyOperator!: string;
}