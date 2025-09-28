import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ApiErrorResponseDto } from '../../modules/notification-status/dto/notification-detail-response.dto';

@Catch()
export class NotificationStatusExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(NotificationStatusExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorCode = 'INTERNAL_SERVER_ERROR';
    let message = 'Internal server error';
    let details: any = undefined;

    // Handle different types of exceptions
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const responseObj = exceptionResponse as any;

        // Handle NestJS ValidationPipe errors
        if (status === HttpStatus.BAD_REQUEST && Array.isArray(responseObj.message)) {
          errorCode = 'VALIDATION_ERROR';
          message = '輸入參數驗證失敗';
          // Convert ValidationPipe error messages to expected format
          details = responseObj.message.map((msg: string) => {
            // Parse field name from validation message
            const fieldMatch = msg.match(/^(\w+)\s/);
            const field = fieldMatch ? fieldMatch[1] : 'unknown';
            return {
              field,
              message: msg,
            };
          });
        } else {
          message = responseObj.message || exception.message;
          details = responseObj.details;

          // Set error code based on status or custom code
          if (responseObj.code) {
            errorCode = responseObj.code;
          } else if (status === HttpStatus.BAD_REQUEST) {
            errorCode = 'VALIDATION_ERROR';
          } else if (status === HttpStatus.NOT_FOUND) {
            errorCode = responseObj.code === 'NOTIFICATION_NOT_FOUND' ? 'NOTIFICATION_NOT_FOUND' : 'DEVICE_NOT_FOUND';
          } else if (status === HttpStatus.UNAUTHORIZED) {
            errorCode = 'UNAUTHORIZED';
          }
        }
      } else {
        message = exception.message;
      }
    } else if (exception instanceof Error) {
      const errorMessage = exception.message;

      // Parse custom error codes from service layer
      if (errorMessage === 'TIMEOUT_ERROR' || errorMessage.startsWith('TIMEOUT_ERROR:')) {
        status = HttpStatus.INTERNAL_SERVER_ERROR;
        errorCode = 'TIMEOUT_ERROR';
        message = '請求處理超時';
        details = {
          service: 'Whale API',
          timeoutMs: 10000,
          error: errorMessage.startsWith('TIMEOUT_ERROR:') ? errorMessage.replace('TIMEOUT_ERROR: ', '') : errorMessage
        };
      } else if (errorMessage === 'EXTERNAL_API_ERROR' || errorMessage.startsWith('EXTERNAL_API_ERROR:')) {
        status = HttpStatus.INTERNAL_SERVER_ERROR;
        errorCode = 'EXTERNAL_API_ERROR';
        message = '外部服務調用失敗';
        details = {
          service: 'Whale API',
          error: errorMessage.startsWith('EXTERNAL_API_ERROR:') ? errorMessage.replace('EXTERNAL_API_ERROR: ', '') : errorMessage
        };
      } else if (errorMessage.startsWith('DATA_FORMAT_ERROR:')) {
        status = HttpStatus.INTERNAL_SERVER_ERROR;
        errorCode = 'DATA_FORMAT_ERROR';
        message = '外部API資料格式異常';
        details = { error: errorMessage.replace('DATA_FORMAT_ERROR: ', '') };
      } else if (errorMessage.startsWith('VALIDATION_ERROR:')) {
        status = HttpStatus.BAD_REQUEST;
        errorCode = 'VALIDATION_ERROR';
        message = '輸入參數驗證失敗';
        details = { error: errorMessage.replace('VALIDATION_ERROR: ', '') };
      } else {
        message = errorMessage;
      }
    }

    // Generate request ID if not present
    const requestId = (request as any).requestId || `req-error-${Date.now()}`;
    const timestamp = new Date().toISOString();

    // Extract operator for logging
    const operator = request.headers['ny-operator'] as string;

    // Log the error with context
    this.logger.error(
      `API Error - ${request.method} ${request.url} - Status: ${status}, Code: ${errorCode}, Operator: ${operator}, RequestId: ${requestId}`,
      {
        exception: exception instanceof Error ? exception.stack : exception,
        request: {
          method: request.method,
          url: request.url,
          params: request.params,
          query: request.query,
          headers: {
            'ny-operator': operator,
            'user-agent': request.headers['user-agent'],
          },
        },
        response: {
          statusCode: status,
          errorCode,
          message,
        },
        operator,
        requestId,
        timestamp,
      },
    );

    // Build standardized error response
    const errorResponse: ApiErrorResponseDto = {
      success: false,
      error: {
        code: errorCode,
        message,
        details,
      },
      timestamp,
      requestId,
    };

    response.status(status).json(errorResponse);
  }
}
