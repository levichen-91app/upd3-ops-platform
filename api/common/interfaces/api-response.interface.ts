import { ApiProperty } from '@nestjs/swagger';

/**
 * Generic successful API response format
 * Used for all successful API responses to ensure consistency
 */
export class ApiResponse<T> {
  @ApiProperty({
    description: 'Success indicator (always true for successful responses)',
    example: true,
    enum: [true],
  })
  public readonly success: true = true;

  @ApiProperty({
    description: 'Response data (type varies by endpoint)',
  })
  public readonly data: T;

  @ApiProperty({
    description: 'ISO 8601 timestamp of the response',
    example: '2025-09-26T14:30:52.123Z',
    format: 'date-time',
  })
  public readonly timestamp: string;

  @ApiProperty({
    description: 'Unique request identifier for tracing',
    example: 'req-20250926143052-a8b2c4d6e8f0-1234-5678-90ab-cdef12345678',
    pattern: '^req-\\d{14}-[a-f0-9-]{36}$',
  })
  public readonly requestId: string;

  constructor(data: T, requestId: string) {
    this.data = data;
    this.requestId = requestId;
    this.timestamp = new Date().toISOString();
  }
}

/**
 * Type alias for cleaner usage in controllers
 */
export type ApiResponseType<T> = ApiResponse<T>;