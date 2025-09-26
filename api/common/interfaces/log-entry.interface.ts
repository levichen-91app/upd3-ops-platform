/**
 * Log entry levels following standard logging practices
 */
export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

/**
 * Standardized log entry format for consistent application logging
 * Used by logging middleware and throughout the application
 */
export interface LogEntry {
  /**
   * ISO 8601 timestamp of the log entry
   */
  timestamp: string;

  /**
   * Log level indicating severity
   */
  level: LogLevel;

  /**
   * Request ID for correlation with API requests
   */
  requestId: string;

  /**
   * HTTP method for the request
   */
  method: string;

  /**
   * Request URL
   */
  url: string;

  /**
   * HTTP response status code
   */
  statusCode: number;

  /**
   * Response time in milliseconds
   */
  responseTime: number;

  /**
   * Optional user agent information
   */
  userAgent?: string;

  /**
   * Optional client IP address
   */
  ip?: string;

  /**
   * Log message describing the event
   */
  message: string;

  /**
   * Optional additional context data
   */
  context?: Record<string, any>;

  /**
   * Optional error information (for error-level logs)
   */
  error?: {
    name: string;
    message: string;
    stack?: string;
    code?: string;
  };
}

/**
 * Factory class for creating LogEntry instances
 */
export class LogEntryFactory {
  /**
   * Create a request log entry
   */
  public static createRequestLog(
    requestId: string,
    method: string,
    url: string,
    userAgent?: string,
    ip?: string,
  ): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level: 'info',
      requestId,
      method,
      url,
      statusCode: 0, // Will be updated when response is sent
      responseTime: 0, // Will be calculated when response is sent
      userAgent,
      ip,
      message: `Incoming ${method} request to ${url}`,
    };
  }

  /**
   * Create a response log entry
   */
  public static createResponseLog(
    requestId: string,
    method: string,
    url: string,
    statusCode: number,
    responseTime: number,
    userAgent?: string,
    ip?: string,
  ): LogEntry {
    const level: LogLevel = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';

    return {
      timestamp: new Date().toISOString(),
      level,
      requestId,
      method,
      url,
      statusCode,
      responseTime,
      userAgent,
      ip,
      message: `${method} ${url} - ${statusCode} in ${responseTime}ms`,
    };
  }

  /**
   * Create an error log entry
   */
  public static createErrorLog(
    requestId: string,
    method: string,
    url: string,
    error: Error,
    context?: Record<string, any>,
  ): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level: 'error',
      requestId,
      method,
      url,
      statusCode: 500, // Default for unhandled errors
      responseTime: 0,
      message: `Error in ${method} ${url}: ${error.message}`,
      context,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
        code: (error as any).code,
      },
    };
  }

  /**
   * Create a performance warning log entry
   */
  public static createPerformanceLog(
    requestId: string,
    method: string,
    url: string,
    responseTime: number,
    threshold: number = 5000,
  ): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level: 'warn',
      requestId,
      method,
      url,
      statusCode: 200,
      responseTime,
      message: `Slow response: ${method} ${url} took ${responseTime}ms (threshold: ${threshold}ms)`,
      context: {
        threshold,
        exceeded: responseTime - threshold,
      },
    };
  }

  /**
   * Create a business logic log entry
   */
  public static createBusinessLog(
    requestId: string,
    message: string,
    level: LogLevel = 'info',
    context?: Record<string, any>,
  ): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      requestId,
      method: 'BUSINESS',
      url: 'N/A',
      statusCode: 0,
      responseTime: 0,
      message,
      context,
    };
  }
}