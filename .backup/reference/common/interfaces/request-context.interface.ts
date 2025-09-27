/**
 * Request context information for tracking and logging
 * Contains all relevant information about an incoming HTTP request
 */
export interface RequestContext {
  /**
   * Unique request identifier in format: req-{timestamp}-{uuid}
   */
  requestId: string;

  /**
   * Request timestamp
   */
  timestamp: Date;

  /**
   * HTTP method (e.g., "PATCH", "POST", "GET")
   */
  method: string;

  /**
   * Complete request URL
   */
  url: string;

  /**
   * Shop ID extracted from path parameters
   */
  shopId: number;

  /**
   * Operator information from ny-operator header
   */
  operator: string;

  /**
   * Optional user agent information
   */
  userAgent?: string;

  /**
   * Optional client IP address
   */
  ip?: string;

  /**
   * Optional request headers for debugging
   */
  headers?: Record<string, string>;

  /**
   * Optional request body for logging (be careful with sensitive data)
   */
  body?: any;
}

/**
 * Factory class for creating RequestContext instances
 */
export class RequestContextFactory {
  /**
   * Create RequestContext from Express request object
   */
  public static fromExpressRequest(
    req: any,
    requestId: string,
  ): RequestContext {
    return {
      requestId,
      timestamp: new Date(),
      method: req.method,
      url: req.originalUrl || req.url,
      shopId: parseInt(req.params.shopId, 10),
      operator: req.headers['ny-operator'] || 'unknown',
      userAgent: req.headers['user-agent'],
      ip: req.ip || req.connection.remoteAddress,
      headers: this.sanitizeHeaders(req.headers),
      body: this.sanitizeBody(req.body),
    };
  }

  /**
   * Sanitize headers to remove sensitive information
   */
  private static sanitizeHeaders(
    headers: Record<string, any>,
  ): Record<string, string> {
    const sanitized: Record<string, string> = {};
    const allowedHeaders = [
      'content-type',
      'content-length',
      'user-agent',
      'accept',
      'accept-encoding',
      'ny-operator',
    ];

    for (const [key, value] of Object.entries(headers)) {
      if (
        allowedHeaders.includes(key.toLowerCase()) &&
        typeof value === 'string'
      ) {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  /**
   * Sanitize request body to remove sensitive information
   */
  private static sanitizeBody(body: any): any {
    if (!body || typeof body !== 'object') {
      return body;
    }

    // For supplier update requests, all fields are safe to log
    if (body.market && body.oldSupplierId && body.newSupplierId) {
      return {
        market: body.market,
        oldSupplierId: body.oldSupplierId,
        newSupplierId: body.newSupplierId,
      };
    }

    // For other requests, be more careful
    const sanitized: any = {};
    const sensitiveFields = ['password', 'token', 'secret', 'key'];

    for (const [key, value] of Object.entries(body)) {
      if (!sensitiveFields.some((field) => key.toLowerCase().includes(field))) {
        sanitized[key] = value;
      } else {
        sanitized[key] = '[REDACTED]';
      }
    }

    return sanitized;
  }
}
