import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { RequestContextService } from '../services/request-context.service';
import { RequestContextFactory } from '../interfaces/request-context.interface';
import {
  REQUEST_ID_CONSTANTS,
  isValidRequestId,
} from '../../constants/request-id.constants';

/**
 * Middleware to generate unique request IDs for tracing and logging
 * Format: req-{timestamp}-{uuid}
 */
@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  public use(req: Request, res: Response, next: NextFunction): void {
    // Check if request ID already exists (from client or upstream proxy)
    let requestId = req.headers[REQUEST_ID_CONSTANTS.HEADER_NAME] as string;

    // Generate new request ID if none exists or invalid format
    if (!requestId || !isValidRequestId(requestId)) {
      requestId = this.generateRequestId();
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
   * Generate a unique request ID with timestamp and UUID
   * Format: req-{yyyymmddhhmmss}-{uuid-v4}
   */
  private generateRequestId(): string {
    const timestamp = this.generateTimestamp();
    const uuid = uuidv4();
    return `${REQUEST_ID_CONSTANTS.PREFIX}${timestamp}-${uuid}`;
  }

  /**
   * Generate timestamp in format: yyyymmddhhmmss
   */
  private generateTimestamp(): string {
    const now = new Date();
    const year = now.getFullYear().toString();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const seconds = now.getSeconds().toString().padStart(2, '0');

    return `${year}${month}${day}${hours}${minutes}${seconds}`;
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
