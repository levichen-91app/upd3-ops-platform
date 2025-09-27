import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { RequestIdMiddleware } from '../middleware/request-id.middleware';
import { RequestContextService } from '../services/request-context.service';

/**
 * Parameter decorator to inject the current request ID into controller methods
 *
 * Usage:
 * ```typescript
 * @Get()
 * async getData(@RequestId() requestId: string) {
 *   // requestId contains the current request ID
 * }
 * ```
 *
 * The decorator tries to get the request ID from RequestContextService first,
 * then falls back to the traditional RequestIdMiddleware method for compatibility.
 */
export const RequestId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    // Try to get from RequestContextService first (preferred method)
    const requestId = RequestContextService.getRequestId();
    if (requestId && requestId !== 'unknown') {
      return requestId;
    }

    // Fallback to traditional method for compatibility
    const request = ctx.switchToHttp().getRequest();
    return RequestIdMiddleware.getRequestId(request);
  },
);

/**
 * Parameter decorator to inject the entire request context into controller methods
 *
 * Usage:
 * ```typescript
 * @Get()
 * async getData(@RequestContext() context: RequestContext) {
 *   // context contains the full request context
 * }
 * ```
 */
export const RequestContext = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    return RequestContextService.getCurrentContext();
  },
);

/**
 * Parameter decorator to inject specific context properties
 *
 * Usage:
 * ```typescript
 * @Get()
 * async getData(
 *   @RequestContextProperty('shopId') shopId: number,
 *   @RequestContextProperty('operator') operator: string
 * ) {
 *   // shopId and operator from request context
 * }
 * ```
 */
export const RequestContextProperty = createParamDecorator(
  (property: keyof import('../interfaces/request-context.interface').RequestContext, ctx: ExecutionContext) => {
    const context = RequestContextService.getCurrentContext();
    return context ? context[property] : undefined;
  },
);