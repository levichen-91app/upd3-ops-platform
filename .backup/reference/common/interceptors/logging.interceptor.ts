import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const { method, url, headers } = request;
    const requestId = this.getOrGenerateRequestId(request);
    const startTime = Date.now();

    // Log incoming request
    this.logger.log(
      'Incoming request',
      JSON.stringify({
        requestId,
        timestamp: new Date().toISOString(),
        method,
        url,
        userAgent: headers['user-agent'],
        remoteAddress: request.ip,
      }),
    );

    return next.handle().pipe(
      tap({
        next: (data) => {
          const duration = Date.now() - startTime;
          this.logger.log(
            'Request completed',
            JSON.stringify({
              requestId,
              timestamp: new Date().toISOString(),
              method,
              url,
              statusCode: response.statusCode,
              duration: `${duration}ms`,
              responseSize: JSON.stringify(data).length,
            }),
          );
        },
        error: (error) => {
          const duration = Date.now() - startTime;
          this.logger.error(
            'Request failed',
            JSON.stringify({
              requestId,
              timestamp: new Date().toISOString(),
              method,
              url,
              statusCode: error.status || 500,
              duration: `${duration}ms`,
              error: error.message,
            }),
          );
        },
      }),
    );
  }

  /**
   * Get existing request ID or generate a new one
   */
  private getOrGenerateRequestId(request: Request): string {
    // Check if request ID already exists (set by middleware)
    if (request.headers['x-request-id']) {
      return request.headers['x-request-id'] as string;
    }

    // Generate new request ID if not exists
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    request.headers['x-request-id'] = requestId;
    return requestId;
  }
}
