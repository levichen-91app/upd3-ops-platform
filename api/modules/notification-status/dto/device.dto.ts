import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsInt,
  IsUUID,
  IsEnum,
  IsISO8601,
  Min,
} from 'class-validator';

export enum PlatformDef {
  IOS = 'iOS',
  ANDROID = 'Android',
}

export class DeviceDto {
  @ApiProperty({
    description: 'Device unique identifier',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
  })
  @IsUUID()
  guid!: string;

  @ApiProperty({
    description: 'Device UDID',
    example: 'device_udid_123',
  })
  @IsString()
  udid!: string;

  @ApiProperty({
    description: 'Push notification token',
    example: 'device_token_123',
  })
  @IsString()
  token!: string;

  @ApiProperty({
    description: 'Associated shop ID',
    example: 12345,
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  shopId!: number;

  @ApiProperty({
    description: 'Device platform',
    enum: PlatformDef,
    example: 'iOS',
  })
  @IsEnum(PlatformDef)
  platformDef!: PlatformDef;

  @ApiProperty({
    description: 'Associated member ID',
    example: 67890,
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  memberId!: number;

  @ApiProperty({
    description: 'Advertising tracking ID',
    example: 'ad_id_123',
    required: false,
  })
  @IsString()
  advertiseId?: string;

  @ApiProperty({
    description: 'Application version',
    example: '1.2.3',
    required: false,
  })
  @IsString()
  appVersion?: string;

  @ApiProperty({
    description: 'Device registration time',
    example: '2024-01-15T10:00:00Z',
    format: 'date-time',
  })
  @IsISO8601()
  createdDateTime!: string;

  @ApiProperty({
    description: 'Last update time',
    example: '2024-01-15T10:30:00Z',
    format: 'date-time',
  })
  @IsISO8601()
  updatedDateTime!: string;
}
