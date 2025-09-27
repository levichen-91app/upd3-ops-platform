import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';
import { RequestContext } from '../interfaces/request-context.interface';

/**
 * Service for managing request context throughout the application lifecycle
 * Uses AsyncLocalStorage to maintain context across async operations
 */
@Injectable()
export class RequestContextService {
  private static readonly contextStore =
    new AsyncLocalStorage<RequestContext>();

  /**
   * Set the request context for the current async context
   */
  static setContext(context: RequestContext): void {
    this.contextStore.enterWith(context);
  }

  /**
   * Get the current request context
   * Returns undefined if no context is set
   */
  static getCurrentContext(): RequestContext | undefined {
    return this.contextStore.getStore();
  }

  /**
   * Get the current request ID
   * Returns 'unknown' if no context is set
   */
  static getRequestId(): string {
    const context = this.getCurrentContext();
    return context?.requestId || 'unknown';
  }

  /**
   * Get the current timestamp from context
   */
  static getTimestamp(): Date | undefined {
    const context = this.getCurrentContext();
    return context?.timestamp;
  }

  /**
   * Get the current HTTP method from context
   */
  static getMethod(): string | undefined {
    const context = this.getCurrentContext();
    return context?.method;
  }

  /**
   * Get the current URL from context
   */
  static getUrl(): string | undefined {
    const context = this.getCurrentContext();
    return context?.url;
  }

  /**
   * Get the current shop ID from context
   */
  static getShopId(): number | undefined {
    const context = this.getCurrentContext();
    return context?.shopId;
  }

  /**
   * Get the current operator from context
   */
  static getOperator(): string | undefined {
    const context = this.getCurrentContext();
    return context?.operator;
  }

  /**
   * Execute a function with a specific request context
   */
  static runWithContext<T>(context: RequestContext, fn: () => T): T {
    return this.contextStore.run(context, fn);
  }

  /**
   * Execute an async function with a specific request context
   */
  static async runWithContextAsync<T>(
    context: RequestContext,
    fn: () => Promise<T>,
  ): Promise<T> {
    return this.contextStore.run(context, fn);
  }

  /**
   * Check if request context is available
   */
  static hasContext(): boolean {
    return this.contextStore.getStore() !== undefined;
  }

  /**
   * Get context data for logging purposes
   */
  static getContextForLogging(): Record<string, any> {
    const context = this.getCurrentContext();
    if (!context) {
      return { requestId: 'unknown' };
    }

    return {
      requestId: context.requestId,
      timestamp: context.timestamp.toISOString(),
      method: context.method,
      url: context.url,
      shopId: context.shopId,
      operator: context.operator,
      userAgent: context.userAgent,
      ip: context.ip,
    };
  }
}
