import { Logger } from '@nestjs/common';
import { RequestContextService } from '../services/request-context.service';

/**
 * Interface for structured log data
 */
export interface LogData {
  message: string;
  requestId: string;
  timestamp?: string;
  context?: string;
  [key: string]: any;
}

/**
 * Utility class for logging with request context
 * Automatically includes request context information in all log messages
 */
export class LoggerUtil {
  /**
   * Create a logger with structured context data
   */
  static withRequestContext(
    message: string,
    additionalData?: Record<string, any>,
    context?: string,
  ): LogData {
    const requestContext = RequestContextService.getCurrentContext();

    const logData: LogData = {
      message,
      requestId: requestContext?.requestId || 'unknown',
      timestamp: new Date().toISOString(),
      ...(context && { context }),
      ...additionalData,
    };

    // Add additional context information if available
    if (requestContext) {
      logData.method = requestContext.method;
      logData.url = requestContext.url;
      logData.shopId = requestContext.shopId;
      logData.operator = requestContext.operator;
      if (requestContext.userAgent) {
        logData.userAgent = requestContext.userAgent;
      }
      if (requestContext.ip) {
        logData.ip = requestContext.ip;
      }
    }

    return logData;
  }

  /**
   * Log info level message with request context
   */
  static logInfo(
    logger: Logger,
    message: string,
    additionalData?: Record<string, any>,
    context?: string,
  ): void {
    const logData = this.withRequestContext(message, additionalData, context);
    logger.log(JSON.stringify(logData));
  }

  /**
   * Log error level message with request context
   */
  static logError(
    logger: Logger,
    message: string,
    error?: Error | unknown,
    additionalData?: Record<string, any>,
    context?: string,
  ): void {
    const logData = this.withRequestContext(message, additionalData, context);

    if (error) {
      if (error instanceof Error) {
        logData.error = {
          name: error.name,
          message: error.message,
          stack: error.stack,
        };
      } else {
        logData.error = error;
      }
    }

    logger.error(JSON.stringify(logData));
  }

  /**
   * Log warning level message with request context
   */
  static logWarn(
    logger: Logger,
    message: string,
    additionalData?: Record<string, any>,
    context?: string,
  ): void {
    const logData = this.withRequestContext(message, additionalData, context);
    logger.warn(JSON.stringify(logData));
  }

  /**
   * Log debug level message with request context
   */
  static logDebug(
    logger: Logger,
    message: string,
    additionalData?: Record<string, any>,
    context?: string,
  ): void {
    const logData = this.withRequestContext(message, additionalData, context);
    logger.debug(JSON.stringify(logData));
  }

  /**
   * Log verbose level message with request context
   */
  static logVerbose(
    logger: Logger,
    message: string,
    additionalData?: Record<string, any>,
    context?: string,
  ): void {
    const logData = this.withRequestContext(message, additionalData, context);
    logger.verbose(JSON.stringify(logData));
  }

  /**
   * Get request context data for logging external API calls
   */
  static getApiCallLogData(
    apiName: string,
    method: string,
    url: string,
    additionalData?: Record<string, any>,
  ): LogData {
    return this.withRequestContext(`External API call: ${apiName}`, {
      apiName,
      apiMethod: method,
      apiUrl: url,
      ...additionalData,
    });
  }

  /**
   * Log API call start with request context
   */
  static logApiCallStart(
    logger: Logger,
    apiName: string,
    method: string,
    url: string,
    requestData?: any,
  ): void {
    const logData = this.getApiCallLogData(apiName, method, url, {
      phase: 'start',
      requestData: requestData ? JSON.stringify(requestData) : undefined,
    });
    logger.log(JSON.stringify(logData));
  }

  /**
   * Log API call success with request context
   */
  static logApiCallSuccess(
    logger: Logger,
    apiName: string,
    method: string,
    url: string,
    duration: number,
    responseData?: any,
  ): void {
    const logData = this.getApiCallLogData(apiName, method, url, {
      phase: 'success',
      duration,
      responseData: responseData ? JSON.stringify(responseData) : undefined,
    });
    logger.log(JSON.stringify(logData));
  }

  /**
   * Log API call error with request context
   */
  static logApiCallError(
    logger: Logger,
    apiName: string,
    method: string,
    url: string,
    duration: number,
    error: Error | unknown,
  ): void {
    const logData = this.getApiCallLogData(apiName, method, url, {
      phase: 'error',
      duration,
    });

    if (error instanceof Error) {
      logData.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
      };
    } else {
      logData.error = error;
    }

    logger.error(JSON.stringify(logData));
  }
}
