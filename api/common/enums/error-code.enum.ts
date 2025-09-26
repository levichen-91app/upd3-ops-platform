/**
 * Structured error code system for API responses
 * Categorized by error type and severity for consistent error handling
 */
export enum ErrorCode {
  // Validation Errors (1000-1999)
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  INVALID_FIELD_FORMAT = 'INVALID_FIELD_FORMAT',
  INVALID_MARKET_CODE = 'INVALID_MARKET_CODE',
  INVALID_SUPPLIER_ID = 'INVALID_SUPPLIER_ID',

  // Business Logic Errors (4000-4999)
  BUSINESS_RULE_VIOLATION = 'BUSINESS_RULE_VIOLATION',
  SUPPLIER_IDS_IDENTICAL = 'SUPPLIER_IDS_IDENTICAL',
  SUPPLIER_NOT_FOUND = 'SUPPLIER_NOT_FOUND',
  SHOP_NOT_FOUND = 'SHOP_NOT_FOUND',

  // System Errors (5000-5999)
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  WHALE_API_UNAVAILABLE = 'WHALE_API_UNAVAILABLE',
  DATABASE_CONNECTION_ERROR = 'DATABASE_CONNECTION_ERROR',
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  UNAUTHORIZED_ACCESS = 'UNAUTHORIZED_ACCESS',
}

/**
 * Error code categories for different error types
 */
export class ErrorCodeCategory {
  public static readonly VALIDATION_RANGE = { min: 1000, max: 1999 };
  public static readonly BUSINESS_LOGIC_RANGE = { min: 4000, max: 4999 };
  public static readonly SYSTEM_ERROR_RANGE = { min: 5000, max: 5999 };

  /**
   * Get error category based on error code
   */
  public static getCategory(errorCode: ErrorCode): 'validation' | 'business' | 'system' | 'unknown' {
    const validationCodes = [
      ErrorCode.VALIDATION_ERROR,
      ErrorCode.MISSING_REQUIRED_FIELD,
      ErrorCode.INVALID_FIELD_FORMAT,
      ErrorCode.INVALID_MARKET_CODE,
      ErrorCode.INVALID_SUPPLIER_ID,
    ];

    const businessCodes = [
      ErrorCode.BUSINESS_RULE_VIOLATION,
      ErrorCode.SUPPLIER_IDS_IDENTICAL,
      ErrorCode.SUPPLIER_NOT_FOUND,
      ErrorCode.SHOP_NOT_FOUND,
    ];

    const systemCodes = [
      ErrorCode.EXTERNAL_SERVICE_ERROR,
      ErrorCode.WHALE_API_UNAVAILABLE,
      ErrorCode.DATABASE_CONNECTION_ERROR,
      ErrorCode.INTERNAL_SERVER_ERROR,
      ErrorCode.UNAUTHORIZED_ACCESS,
    ];

    if (validationCodes.includes(errorCode)) {
      return 'validation';
    }
    if (businessCodes.includes(errorCode)) {
      return 'business';
    }
    if (systemCodes.includes(errorCode)) {
      return 'system';
    }
    return 'unknown';
  }

  /**
   * Get HTTP status code for error category
   */
  public static getHttpStatus(errorCode: ErrorCode): number {
    const category = this.getCategory(errorCode);

    switch (category) {
      case 'validation':
        return 400; // Bad Request
      case 'business':
        return 400; // Bad Request (business rule violations are client errors)
      case 'system':
        if (errorCode === ErrorCode.UNAUTHORIZED_ACCESS) {
          return 401; // Unauthorized
        }
        if (errorCode === ErrorCode.WHALE_API_UNAVAILABLE || errorCode === ErrorCode.EXTERNAL_SERVICE_ERROR) {
          return 502; // Bad Gateway
        }
        return 500; // Internal Server Error
      default:
        return 500; // Internal Server Error
    }
  }
}