import { ApiProperty } from '@nestjs/swagger';
import { DeviceDto } from './device.dto';

export class DeviceQueryResponseDto {
  @ApiProperty({
    description: 'Success indicator',
    example: true,
    enum: [true],
  })
  success!: true;

  @ApiProperty({
    description: 'List of customer devices (may be empty)',
    type: [DeviceDto],
  })
  data!: DeviceDto[];

  @ApiProperty({
    description: 'Response generation time',
    example: '2024-01-15T10:35:00Z',
    format: 'date-time',
  })
  timestamp!: string;

  @ApiProperty({
    description: 'Request tracking ID',
    example: 'req-devices-123456',
    pattern: '^req-devices-[a-zA-Z0-9]+$',
  })
  requestId!: string;
}

export class ErrorDto {
  @ApiProperty({
    description: 'Standard error code',
    enum: [
      'VALIDATION_ERROR',
      'DEVICE_NOT_FOUND',
      'EXTERNAL_API_ERROR',
      'TIMEOUT_ERROR',
      'RATE_LIMIT_ERROR',
      'INTERNAL_SERVER_ERROR',
      'UNAUTHORIZED',
    ],
  })
  code!: string;

  @ApiProperty({
    description: 'User-friendly error message',
    example: 'Input parameter validation failed',
  })
  message!: string;

  @ApiProperty({
    description: 'Additional error context (optional)',
    required: false,
  })
  details?: any;
}

export class ErrorResponseDto {
  @ApiProperty({
    description: 'Fixed false for errors',
    example: false,
    enum: [false],
  })
  success!: false;

  @ApiProperty({
    description: 'Error information',
    type: ErrorDto,
  })
  error!: ErrorDto;

  @ApiProperty({
    description: 'Error occurrence time',
    example: '2024-01-15T10:35:00Z',
    format: 'date-time',
  })
  timestamp!: string;

  @ApiProperty({
    description: 'Request tracking ID',
    example: 'req-devices-123456',
  })
  requestId!: string;
}
