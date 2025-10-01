import {
  Injectable,
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response, Request } from 'express';
import {
  ApiErrorResponse,
  ErrorObject,
} from '../interfaces/api-error-response.interface';
import { ERROR_CODES } from '../../constants/error-codes.constants';
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
    let errorCode: string;
    let message: string;
    let details: any = undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      // Check if exception response has custom error structure
      if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null &&
        'code' in exceptionResponse
      ) {
        const customError = exceptionResponse as any;
        errorCode = customError.code;
        message = customError.message;
        details = customError.details;
      }
      // Handle validation errors (400)
      else if (
        status === 400 &&
        typeof exceptionResponse === 'object' &&
        'message' in exceptionResponse
      ) {
        const messages = Array.isArray(exceptionResponse.message)
          ? exceptionResponse.message
          : [exceptionResponse.message];

        message = messages[0] || 'Invalid request parameters provided';
        errorCode = ERROR_CODES.INVALID_ARGUMENT; // Google RPC Code
        details = [
          {
            '@type': 'type.upd3ops.com/ValidationError',
            validationErrors: messages,
          },
        ];
      }
      // Handle authorization errors (401)
      else if (status === 401) {
        errorCode = ERROR_CODES.UNAUTHENTICATED; // Google RPC Code
        message = 'Authentication required';
      }
      // Handle forbidden errors (403)
      else if (status === 403) {
        errorCode = ERROR_CODES.PERMISSION_DENIED; // Google RPC Code
        message = 'Permission denied';
      }
      // Handle not found errors (404)
      else if (status === 404) {
        errorCode = ERROR_CODES.NOT_FOUND; // Google RPC Code
        message = 'Requested resource not found';
      }
      // Handle other HTTP exceptions
      else {
        errorCode = status >= 500 ? ERROR_CODES.INTERNAL : ERROR_CODES.INVALID_ARGUMENT;
        message =
          typeof exceptionResponse === 'string'
            ? exceptionResponse
            : exception.message;
      }
    } else {
      // Handle non-HTTP exceptions
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      errorCode = ERROR_CODES.INTERNAL; // Google RPC Code
      message =
        exception instanceof Error
          ? exception.message
          : 'Internal server error';
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
      requestId,
    );

    response.status(status).json(errorResponse);
  }
}
