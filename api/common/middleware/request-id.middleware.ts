import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { RequestContextService } from '../services/request-context.service';
import { RequestContextFactory } from '../interfaces/request-context.interface';
import { REQUEST_ID_CONSTANTS } from '../../constants/request-id.constants';
import { RequestIdService } from '../services/request-id.service';

/**
 * Middleware to generate unique request IDs for tracing and logging
 * Format: req-{timestamp}-{uuid}
 */
@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  constructor(private readonly requestIdService: RequestIdService) {}

  public use(req: Request, res: Response, next: NextFunction): void {
    // Check if request ID already exists (from client or upstream proxy)
    let requestId = req.headers[REQUEST_ID_CONSTANTS.HEADER_NAME] as string;

    // Generate new request ID if none exists or invalid format
    if (!requestId || !this.requestIdService.validateRequestId(requestId)) {
      requestId = this.requestIdService.generateRequestId();
    }

    // Store request ID in request object for access by other middleware/handlers
    (req as any)[REQUEST_ID_CONSTANTS.PROPERTY_NAME] = requestId;

    // Add request ID to response headers for client tracking
    res.set(REQUEST_ID_CONSTANTS.HEADER_NAME, requestId);

    // Create and set request context for the entire request lifecycle
    const requestContext = RequestContextFactory.fromExpressRequest(
      req,
      requestId,
    );
    RequestContextService.setContext(requestContext);

    next();
  }

  /**
   * Static method to get request ID from request object
   */
  public static getRequestId(req: Request): string {
    return (req as any)[REQUEST_ID_CONSTANTS.PROPERTY_NAME] || 'unknown';
  }

  /**
   * Static method to get request ID header name
   */
  public static getRequestIdHeader(): string {
    return REQUEST_ID_CONSTANTS.HEADER_NAME;
  }
}
