import { Injectable, ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Response, Request } from 'express';
import { ApiErrorResponse, ErrorObject } from '../interfaces/api-error-response.interface';
import { ErrorCode, ErrorCodeCategory } from '../enums/error-code.enum';
import { RequestIdMiddleware } from '../middleware/request-id.middleware';

@Injectable()
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const requestId = RequestIdMiddleware.getRequestId(request);

    let status: number;
    let errorCode: ErrorCode;
    let message: string;
    let details: any = undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      // Check if exception response has custom error structure
      if (typeof exceptionResponse === 'object' && exceptionResponse !== null && 'code' in exceptionResponse) {
        const customError = exceptionResponse as any;
        errorCode = customError.code;
        message = customError.message;
        details = customError.details;
      }
      // Handle validation errors
      else if (status === 400 && typeof exceptionResponse === 'object' && 'message' in exceptionResponse) {
        const messages = Array.isArray(exceptionResponse.message)
          ? exceptionResponse.message
          : [exceptionResponse.message];

        message = messages[0] || 'Validation failed';
        errorCode = message.toLowerCase().includes('required')
          ? ErrorCode.MISSING_REQUIRED_FIELD
          : ErrorCode.VALIDATION_ERROR;
        details = { validationErrors: messages };
      }
      // Handle authorization errors
      else if (status === 401) {
        errorCode = ErrorCode.UNAUTHORIZED_ACCESS;
        message = 'Invalid or missing authentication credentials';
      }
      // Handle other HTTP exceptions
      else {
        errorCode = status >= 500 ? ErrorCode.INTERNAL_SERVER_ERROR : ErrorCode.VALIDATION_ERROR;
        message = typeof exceptionResponse === 'string' ? exceptionResponse : exception.message;
      }
    } else {
      // Handle non-HTTP exceptions
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      errorCode = ErrorCode.INTERNAL_SERVER_ERROR;
      message = exception instanceof Error ? exception.message : 'Internal server error';
    }

    // Log the exception
    this.logger.error('Exception caught', {
      requestId,
      method: request.method,
      url: request.url,
      statusCode: status,
      errorCode,
      message,
      stack: exception instanceof Error ? exception.stack : undefined,
    });

    // Create standardized error response
    const errorResponse = new ApiErrorResponse(
      new ErrorObject(errorCode, message, details),
      requestId
    );

    response.status(status).json(errorResponse);
  }
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const requestId = request.headers['x-request-id'] || 'unknown';

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.message
        : 'Internal server error';

    // Log the exception with structured format
    this.logger.error(
      'Unhandled exception caught',
      JSON.stringify({
        requestId,
        timestamp: new Date().toISOString(),
        method: request.method,
        url: request.url,
        statusCode: status,
        error: message,
        stack: exception instanceof Error ? exception.stack : 'No stack trace',
      }),
    );

    response.status(status).json({
      error: status >= 500 ? 'Internal server error' : message,
    });
  }
}
