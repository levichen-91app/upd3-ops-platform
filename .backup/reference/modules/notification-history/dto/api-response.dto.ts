import { ApiProperty } from '@nestjs/swagger';
import { NotificationHistoryData } from './notification-history-data.dto';

/**
 * Generic success response format following Constitution API standards
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  timestamp: string;
  requestId: string;
}

/**
 * Generic error response format following Constitution API standards
 */
export interface ApiErrorResponse {
  success: boolean;
  error: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
  requestId: string;
}

/**
 * Success response for notification history queries
 */
export type NotificationHistoryResponse = ApiResponse<NotificationHistoryData>;

/**
 * Validation error response (400)
 */
export type ValidationErrorResponse = ApiErrorResponse & {
  error: {
    code: 'VALIDATION_ERROR';
    message: string;
    details: any;
  };
};

/**
 * Unauthorized error response (401)
 */
export type UnauthorizedErrorResponse = ApiErrorResponse & {
  error: {
    code: 'UNAUTHORIZED_ACCESS';
    message: string;
  };
};

/**
 * Not found error response (404)
 */
export type NotFoundErrorResponse = ApiErrorResponse & {
  error: {
    code: 'NOTIFICATION_NOT_FOUND';
    message: string;
    details: { notificationId: number; shopId: number };
  };
};

/**
 * Service unavailable error response (502)
 */
export type WhaleApiUnavailableErrorResponse = ApiErrorResponse & {
  error: {
    code: 'WHALE_API_UNAVAILABLE';
    message: string;
    details: { shopId: number; notificationId: number };
  };
};

// Classes for Swagger documentation
export class NotificationHistoryResponseClass {
  @ApiProperty({ example: true })
  success: boolean = true;

  @ApiProperty({ type: NotificationHistoryData })
  data!: NotificationHistoryData;

  @ApiProperty({ example: '2025-09-27T14:30:00.000Z' })
  timestamp: string = '';

  @ApiProperty({ example: 'req-20250927143000-12345678-1234-5678-9abc-def012345678' })
  requestId: string = '';
}

export class ValidationErrorResponseClass {
  @ApiProperty({ example: false })
  success: boolean = false;

  @ApiProperty({
    example: {
      code: 'VALIDATION_ERROR',
      message: 'Invalid request parameters',
      details: { shopId: 'Shop ID must be a positive integer' }
    }
  })
  error: {
    code: string;
    message: string;
    details: any;
  } = {
    code: '',
    message: '',
    details: {}
  };

  @ApiProperty({ example: '2025-09-27T14:30:00.000Z' })
  timestamp: string = '';

  @ApiProperty({ example: 'req-20250927143000-12345678-1234-5678-9abc-def012345678' })
  requestId: string = '';
}

export class UnauthorizedErrorResponseClass {
  @ApiProperty({ example: false })
  success: boolean = false;

  @ApiProperty({
    example: {
      code: 'UNAUTHORIZED_ACCESS',
      message: 'Missing or invalid ny-operator header'
    }
  })
  error: {
    code: string;
    message: string;
  } = {
    code: '',
    message: ''
  };

  @ApiProperty({ example: '2025-09-27T14:30:00.000Z' })
  timestamp: string = '';

  @ApiProperty({ example: 'req-20250927143000-12345678-1234-5678-9abc-def012345678' })
  requestId: string = '';
}

export class NotFoundErrorResponseClass {
  @ApiProperty({ example: false })
  success: boolean = false;

  @ApiProperty({
    example: {
      code: 'NOTIFICATION_NOT_FOUND',
      message: 'Notification not found in Whale API',
      details: { notificationId: 99404, shopId: 12345 }
    }
  })
  error: {
    code: string;
    message: string;
    details: any;
  } = {
    code: '',
    message: '',
    details: {}
  };

  @ApiProperty({ example: '2025-09-27T14:30:00.000Z' })
  timestamp: string = '';

  @ApiProperty({ example: 'req-20250927143000-12345678-1234-5678-9abc-def012345678' })
  requestId: string = '';
}

export class WhaleApiUnavailableErrorResponseClass {
  @ApiProperty({ example: false })
  success: boolean = false;

  @ApiProperty({
    example: {
      code: 'WHALE_API_UNAVAILABLE',
      message: 'Whale API is temporarily unavailable',
      details: { shopId: 12345, notificationId: 67890 }
    }
  })
  error: {
    code: string;
    message: string;
    details: any;
  } = {
    code: '',
    message: '',
    details: {}
  };

  @ApiProperty({ example: '2025-09-27T14:30:00.000Z' })
  timestamp: string = '';

  @ApiProperty({ example: 'req-20250927143000-12345678-1234-5678-9abc-def012345678' })
  requestId: string = '';
}