import { ApiProperty } from '@nestjs/swagger';

/**
 * Error object structure for API error responses
 */
export class ErrorObject {
  @ApiProperty({
    description: 'Structured error code',
    example: 'VALIDATION_ERROR',
    enum: [
      // Validation errors (1000-1999)
      'VALIDATION_ERROR',
      'MISSING_REQUIRED_FIELD',
      'INVALID_FIELD_FORMAT',
      'INVALID_MARKET_CODE',
      'INVALID_SUPPLIER_ID',
      // Business logic errors (4000-4999)
      'BUSINESS_RULE_VIOLATION',
      'SUPPLIER_IDS_IDENTICAL',
      'SUPPLIER_NOT_FOUND',
      'SHOP_NOT_FOUND',
      // System errors (5000-5999)
      'EXTERNAL_SERVICE_ERROR',
      'WHALE_API_UNAVAILABLE',
      'DATABASE_CONNECTION_ERROR',
      'INTERNAL_SERVER_ERROR',
      'UNAUTHORIZED_ACCESS',
    ],
  })
  public readonly code: string;

  @ApiProperty({
    description: 'English error message',
    example: 'Market is required',
    minLength: 1,
  })
  public readonly message: string;

  @ApiProperty({
    description: 'Optional error context and additional information',
    example: { field: 'market' },
    required: false,
  })
  public readonly details?: any;

  constructor(code: string, message: string, details?: any) {
    this.code = code;
    this.message = message;
    this.details = details;
  }
}

/**
 * Standardized error response format
 * Used for all API error responses to ensure consistency
 */
export class ApiErrorResponse {
  @ApiProperty({
    description: 'Success indicator (always false for error responses)',
    example: false,
    enum: [false],
  })
  public readonly success: false = false;

  @ApiProperty({
    description: 'Error information object',
    type: ErrorObject,
  })
  public readonly error: ErrorObject;

  @ApiProperty({
    description: 'ISO 8601 timestamp of the error response',
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

  constructor(error: ErrorObject, requestId: string) {
    this.error = error;
    this.requestId = requestId;
    this.timestamp = new Date().toISOString();
  }

  /**
   * Factory method for creating validation error responses
   */
  public static validationError(
    message: string,
    details: any,
    requestId: string,
  ): ApiErrorResponse {
    return new ApiErrorResponse(
      new ErrorObject('VALIDATION_ERROR', message, details),
      requestId,
    );
  }

  /**
   * Factory method for creating business logic error responses
   */
  public static businessError(
    code: string,
    message: string,
    details: any,
    requestId: string,
  ): ApiErrorResponse {
    return new ApiErrorResponse(
      new ErrorObject(code, message, details),
      requestId,
    );
  }

  /**
   * Factory method for creating system error responses
   */
  public static systemError(
    code: string,
    message: string,
    details: any,
    requestId: string,
  ): ApiErrorResponse {
    return new ApiErrorResponse(
      new ErrorObject(code, message, details),
      requestId,
    );
  }
}
