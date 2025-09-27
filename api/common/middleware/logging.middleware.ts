import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { LogEntry, LogEntryFactory } from '../interfaces/log-entry.interface';
import { RequestIdMiddleware } from './request-id.middleware';

@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  private readonly logger = new Logger(LoggingMiddleware.name);

  use(req: Request, res: Response, next: NextFunction): void {
    const startTime = Date.now();
    const requestId = RequestIdMiddleware.getRequestId(req);

    // Log incoming request
    const requestLog = LogEntryFactory.createRequestLog(
      requestId,
      req.method,
      req.originalUrl || req.url,
      req.headers['user-agent'],
      req.ip || req.connection?.remoteAddress,
    );
    this.logger.log(requestLog.message, requestLog);

    // Override response.end to capture response details
    const originalEnd = res.end;
    res.end = function (chunk?: any, encoding?: any): Response {
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      const statusCode = res.statusCode;

      // Log response
      const responseLog = LogEntryFactory.createResponseLog(
        requestId,
        req.method,
        req.originalUrl || req.url,
        statusCode,
        responseTime,
        req.headers['user-agent'],
        req.ip || req.connection?.remoteAddress,
      );

      const logger = new Logger(LoggingMiddleware.name);
      logger.log(responseLog.message, responseLog);

      // Log performance warning if response is slow
      if (responseTime > 5000) {
        const perfLog = LogEntryFactory.createPerformanceLog(
          requestId,
          req.method,
          req.originalUrl || req.url,
          responseTime,
        );
        logger.warn(perfLog.message, perfLog);
      }

      return originalEnd.call(this, chunk, encoding);
    };

    next();
  }
}
