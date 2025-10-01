/**
 * 外部 API 錯誤處理器
 *
 * 統一處理 Axios 錯誤並轉換為標準化的 ExternalApiException
 * 根據錯誤類型自動映射到對應的 Google RPC Code
 *
 * @see constitution.md 第 4.5 節
 */
import { AxiosError } from 'axios';
import { ERROR_CODES } from '../../constants/error-codes.constants';
import {
  ERROR_REASONS,
  ERROR_DETAIL_TYPE_PREFIX,
  type ServiceDomain,
} from '../../constants/error-types.constants';
import {
  ExternalApiException,
  type ErrorDetail,
} from '../exceptions/external-api.exception';

/**
 * 外部 API 錯誤處理器
 */
export class ExternalApiErrorHandler {
  /**
   * 處理 Axios 錯誤
   *
   * 根據錯誤類型自動映射到對應的 Google RPC Code：
   * - 超時錯誤 → DEADLINE_EXCEEDED (504)
   * - 連線失敗 → UNAVAILABLE (503)
   * - HTTP 404 → NOT_FOUND (404)
   * - HTTP 401/403 → PERMISSION_DENIED (403)
   * - HTTP 429 → RESOURCE_EXHAUSTED (429)
   * - HTTP 5xx → UNAVAILABLE (503)
   * - 未知錯誤 → INTERNAL (500)
   *
   * @param error - Axios 錯誤對象
   * @param serviceDomain - 服務域名 (kebab-case)
   * @throws ExternalApiException 標準化的外部 API 異常
   */
  static handleAxiosError(
    error: AxiosError,
    serviceDomain: ServiceDomain,
  ): never {
    // 1. 超時錯誤 → DEADLINE_EXCEEDED (504)
    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      throw new ExternalApiException(
        ERROR_CODES.DEADLINE_EXCEEDED,
        `${serviceDomain} API request timeout`,
        ExternalApiErrorHandler.createErrorDetail(
          ERROR_REASONS.TIMEOUT,
          serviceDomain,
          {
            timeout: error.config?.timeout,
            url: error.config?.url,
          },
        ),
      );
    }

    // 2. 連線失敗 → UNAVAILABLE (503)
    if (
      error.code === 'ECONNREFUSED' ||
      error.code === 'ENOTFOUND' ||
      error.code === 'ETIMEDOUT' ||
      error.code === 'ECONNRESET'
    ) {
      throw new ExternalApiException(
        ERROR_CODES.UNAVAILABLE,
        `Unable to connect to ${serviceDomain} service`,
        ExternalApiErrorHandler.createErrorDetail(
          ERROR_REASONS.CONNECTION_FAILED,
          serviceDomain,
          {
            errorCode: error.code,
            url: error.config?.url,
          },
        ),
      );
    }

    // 3. HTTP 錯誤（根據 status code 映射）
    if (error.response) {
      const status = error.response.status;
      const url = error.config?.url;

      // 404 → NOT_FOUND
      if (status === 404) {
        throw new ExternalApiException(
          ERROR_CODES.NOT_FOUND,
          `Resource not found in ${serviceDomain}`,
          ExternalApiErrorHandler.createErrorDetail(
            ERROR_REASONS.RESOURCE_MISSING,
            serviceDomain,
            {
              httpStatus: status,
              url,
              responseData: error.response.data,
            },
          ),
        );
      }

      // 401/403 → PERMISSION_DENIED
      if (status === 401 || status === 403) {
        throw new ExternalApiException(
          ERROR_CODES.PERMISSION_DENIED,
          `${serviceDomain} authentication failed`,
          ExternalApiErrorHandler.createErrorDetail(
            ERROR_REASONS.INVALID_CREDENTIALS,
            serviceDomain,
            {
              httpStatus: status,
              url,
            },
          ),
        );
      }

      // 429 → RESOURCE_EXHAUSTED
      if (status === 429) {
        throw new ExternalApiException(
          ERROR_CODES.RESOURCE_EXHAUSTED,
          `${serviceDomain} rate limit exceeded`,
          ExternalApiErrorHandler.createErrorDetail(
            ERROR_REASONS.RATE_LIMIT_EXCEEDED,
            serviceDomain,
            {
              httpStatus: status,
              retryAfter: error.response.headers['retry-after'],
              url,
            },
          ),
        );
      }

      // 400 → INVALID_ARGUMENT
      if (status === 400) {
        throw new ExternalApiException(
          ERROR_CODES.INVALID_ARGUMENT,
          `${serviceDomain} rejected request parameters`,
          ExternalApiErrorHandler.createErrorDetail(
            ERROR_REASONS.INVALID_PARAMETER,
            serviceDomain,
            {
              httpStatus: status,
              url,
              responseData: error.response.data,
            },
          ),
        );
      }

      // 5xx → UNAVAILABLE
      if (status >= 500) {
        throw new ExternalApiException(
          ERROR_CODES.UNAVAILABLE,
          `${serviceDomain} service error`,
          ExternalApiErrorHandler.createErrorDetail(
            ERROR_REASONS.HTTP_ERROR,
            serviceDomain,
            {
              httpStatus: status,
              statusText: error.response.statusText,
              url,
              responseData: error.response.data,
            },
          ),
        );
      }
    }

    // 4. JSON 解析錯誤
    if (error instanceof SyntaxError || error.name === 'SyntaxError') {
      throw new ExternalApiException(
        ERROR_CODES.INTERNAL,
        `Failed to parse ${serviceDomain} response`,
        ExternalApiErrorHandler.createErrorDetail(
          ERROR_REASONS.INVALID_RESPONSE_FORMAT,
          serviceDomain,
          {
            originalMessage: error.message,
          },
        ),
      );
    }

    // 5. 未知錯誤 → INTERNAL
    throw new ExternalApiException(
      ERROR_CODES.INTERNAL,
      `Unexpected error calling ${serviceDomain}`,
      ExternalApiErrorHandler.createErrorDetail(
        ERROR_REASONS.UNKNOWN_ERROR,
        serviceDomain,
        {
          errorName: error.name,
          errorMessage: error.message,
          errorCode: (error as any).code,
        },
      ),
    );
  }

  /**
   * 建立標準化的 ErrorDetail（遵循 Google ErrorInfo 格式）
   *
   * @param reason - 錯誤原因 (UPPER_SNAKE_CASE)
   * @param domain - 服務域名 (kebab-case)
   * @param metadata - 額外的元數據
   * @returns ErrorDetail 對象
   */
  static createErrorDetail(
    reason: string,
    domain: string,
    metadata?: Record<string, any>,
  ): ErrorDetail {
    return {
      '@type': `${ERROR_DETAIL_TYPE_PREFIX}/ErrorInfo`,
      reason,
      domain,
      metadata,
    };
  }

  /**
   * 處理一般錯誤（非 Axios 錯誤）
   *
   * @param error - 錯誤對象
   * @param serviceDomain - 服務域名
   * @throws ExternalApiException
   */
  static handleGenericError(error: Error, serviceDomain: ServiceDomain): never {
    throw new ExternalApiException(
      ERROR_CODES.INTERNAL,
      `Unexpected error calling ${serviceDomain}`,
      ExternalApiErrorHandler.createErrorDetail(
        ERROR_REASONS.UNKNOWN_ERROR,
        serviceDomain,
        {
          errorName: error.name,
          errorMessage: error.message,
          stack: error.stack,
        },
      ),
    );
  }
}
