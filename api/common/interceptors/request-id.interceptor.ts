import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Request } from 'express';
import { REQUEST_ID_CONSTANTS } from '../../constants/request-id.constants';
import { RequestIdService } from '../services/request-id.service';

/**
 * Request ID Interceptor
 *
 * 確保所有 API 回應都包含 Request ID
 * 優先使用 Middleware 已生成的 Request ID，若不存在則生成新的
 */
@Injectable()
export class RequestIdInterceptor implements NestInterceptor {
  constructor(private readonly requestIdService: RequestIdService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request: Request = context.switchToHttp().getRequest();

    // 優先使用 Middleware 已生成的 Request ID
    let requestId = (request as any)[REQUEST_ID_CONSTANTS.PROPERTY_NAME];

    // 如果 Middleware 未設定（例如某些特殊路由），則生成新的
    if (!requestId) {
      requestId = this.requestIdService.generateRequestId();
      (request as any)[REQUEST_ID_CONSTANTS.PROPERTY_NAME] = requestId;
    }

    return next.handle().pipe(
      map((data) => {
        // If the response is already a structured API response, return as is
        if (data && typeof data === 'object' && 'success' in data) {
          return data;
        }

        // Otherwise, wrap in standard success format
        return {
          success: true,
          data,
          timestamp: new Date().toISOString(),
          requestId,
        };
      }),
    );
  }
}
