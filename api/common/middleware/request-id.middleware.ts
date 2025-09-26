import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Generate request ID if not present
    const requestId = req.headers['x-request-id'] || this.generateRequestId();

    // Set request ID in request headers
    req.headers['x-request-id'] = requestId as string;

    // Set request ID in response headers for client tracking
    res.setHeader('x-request-id', requestId);

    next();
  }

  /**
   * Generate a unique request ID
   * Uses timestamp + random string for better readability in logs
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
