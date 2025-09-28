import { Injectable, Logger } from '@nestjs/common';
import { Observable, of, timer } from 'rxjs';
import { retryWhen, mergeMap, scan, takeWhile } from 'rxjs/operators';

export interface RetryConfig {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
  retryableErrors: string[];
}

@Injectable()
export class HttpRetryService {
  private readonly logger = new Logger(HttpRetryService.name);

  private readonly defaultConfig: RetryConfig = {
    maxRetries: 3,
    baseDelayMs: 1000,
    maxDelayMs: 30000,
    retryableErrors: ['ECONNABORTED', 'ENOTFOUND', 'ECONNRESET', 'ETIMEDOUT'],
  };

  createRetryOperator<T>(config: Partial<RetryConfig> = {}) {
    const finalConfig = { ...this.defaultConfig, ...config };

    return (source: Observable<T>) =>
      source.pipe(
        retryWhen((errors) =>
          errors.pipe(
            scan((retryCount, error) => {
              this.logger.warn(
                `HTTP request failed (attempt ${retryCount + 1}/${finalConfig.maxRetries}): ${error.message}`,
              );

              // Check if error is retryable
              const isRetryable = this.isRetryableError(
                error,
                finalConfig.retryableErrors,
              );

              if (!isRetryable || retryCount >= finalConfig.maxRetries - 1) {
                this.logger.error(
                  `HTTP request failed permanently after ${retryCount + 1} attempts: ${error.message}`,
                );
                throw error;
              }

              return retryCount + 1;
            }, 0),
            takeWhile((retryCount) => retryCount < finalConfig.maxRetries),
            mergeMap((retryCount: number) =>
              timer(this.calculateDelay(retryCount, finalConfig)),
            ),
          ),
        ),
      );
  }

  private isRetryableError(error: any, retryableErrors: string[]): boolean {
    if (!error) return false;

    // Check error code
    if (error.code && retryableErrors.includes(error.code)) {
      return true;
    }

    // Check for specific HTTP status codes that are retryable
    if (error.response?.status) {
      const status = error.response.status;
      // Retry on 5xx errors and some 4xx errors
      return status >= 500 || status === 408 || status === 429;
    }

    return false;
  }

  private calculateDelay(retryCount: number, config: RetryConfig): number {
    // Exponential backoff with jitter
    const exponentialDelay = config.baseDelayMs * Math.pow(2, retryCount);
    const jitter = Math.random() * 0.1 * exponentialDelay; // 10% jitter
    const delayWithJitter = exponentialDelay + jitter;

    return Math.min(delayWithJitter, config.maxDelayMs);
  }

  async executeWithRetry<T>(
    operation: () => Promise<T>,
    config: Partial<RetryConfig> = {},
  ): Promise<T> {
    const finalConfig = { ...this.defaultConfig, ...config };
    let lastError: any;

    for (let attempt = 0; attempt < finalConfig.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;

        if (!this.isRetryableError(error, finalConfig.retryableErrors)) {
          this.logger.error(
            `Non-retryable error on attempt ${attempt + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`,
          );
          throw error;
        }

        if (attempt < finalConfig.maxRetries - 1) {
          const delayMs = this.calculateDelay(attempt, finalConfig);
          this.logger.warn(
            `Retrying operation after ${delayMs}ms (attempt ${attempt + 1}/${finalConfig.maxRetries})`,
          );
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
      }
    }

    this.logger.error(
      `Operation failed after ${finalConfig.maxRetries} attempts`,
    );
    throw lastError;
  }
}
