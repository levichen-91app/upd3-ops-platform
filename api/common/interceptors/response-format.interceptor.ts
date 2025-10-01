import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponse } from '../interfaces/api-response.interface';
import { RequestIdMiddleware } from '../middleware/request-id.middleware';

@Injectable()
export class ResponseFormatInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => {
        // 如果資料已經是正確的回應格式（包含 success, data, timestamp, requestId），則直接回傳
        if (
          data &&
          typeof data === 'object' &&
          'success' in data &&
          'data' in data &&
          'timestamp' in data &&
          'requestId' in data
        ) {
          return data;
        }

        // 否則包裝成標準格式
        const request = context.switchToHttp().getRequest();
        const requestId = RequestIdMiddleware.getRequestId(request);
        return new ApiResponse(data, requestId);
      }),
    );
  }
}
