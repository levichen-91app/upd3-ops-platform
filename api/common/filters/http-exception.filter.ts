import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { BaseApiException } from '../exceptions/base-api.exception';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const requestId = request.headers['x-request-id'] || 'unknown';

    const errorResponse = {
      error: exception.message,
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    // Log the exception with structured format
    this.logger.error(
      'HTTP Exception caught',
      JSON.stringify({
        requestId,
        timestamp: new Date().toISOString(),
        method: request.method,
        url: request.url,
        statusCode: status,
        error: exception.message,
        stack: exception.stack,
        isBaseApiException: exception instanceof BaseApiException,
        exceptionResponse: exception.getResponse(),
      }),
    );

    // Check if it's a BaseApiException with errorCode
    if (exception instanceof BaseApiException) {
      const exceptionResponse = exception.getResponse() as any;
      this.logger.log(
        'BaseApiException response:',
        JSON.stringify(exceptionResponse),
      );
      response.status(status).json({
        success: false,
        error: {
          message: exceptionResponse.message,
          errorCode: exceptionResponse.errorCode,
        },
      });
    } else {
      // For client errors (4xx), return simplified error message
      if (status >= 400 && status < 500) {
        response.status(status).json({
          success: false,
          error: exception.message,
        });
      } else {
        // For server errors (5xx), return generic error message
        response.status(status).json({
          success: false,
          error: 'Internal server error',
        });
      }
    }
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
