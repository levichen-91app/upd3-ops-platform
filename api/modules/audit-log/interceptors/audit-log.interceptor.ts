import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Inject,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import type { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import type {
  IAuditLogService,
  AuditLogData,
  AuditLogConfig,
} from '../interfaces/audit-log.interface';
import { AUDIT_LOG_SERVICE_TOKEN } from '../interfaces/audit-log.interface';
import {
  AUDIT_METADATA_KEY,
  AUDITABLE_METHODS,
} from '../../../common/constants/audit-log.constants';

/**
 * 稽核日誌攔截器
 *
 * 攔截標記了 @AuditLog 裝飾器的端點，自動記錄操作日誌
 */
@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditLogInterceptor.name);

  constructor(
    private readonly reflector: Reflector,
    @Inject(AUDIT_LOG_SERVICE_TOKEN)
    private readonly auditLogService: IAuditLogService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    // 取得 @AuditLog decorator 的 metadata
    const auditConfig = this.reflector.get<AuditLogConfig>(
      AUDIT_METADATA_KEY,
      context.getHandler(),
    );

    // 如果沒有 @AuditLog decorator，直接放行
    if (!auditConfig) {
      return next.handle();
    }

    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest<Request>();
    const response = httpContext.getResponse<Response>();

    // 只記錄寫入操作
    if (!AUDITABLE_METHODS.includes(request.method as any)) {
      return next.handle();
    }

    // 記錄請求開始時間
    const startTime = Date.now();

    return next.handle().pipe(
      tap(() => {
        // 請求成功完成，記錄稽核日誌
        this.logAudit(
          request,
          response,
          auditConfig,
          response.statusCode || 200,
        );
      }),
      catchError((error) => {
        // 請求失敗，仍然記錄稽核日誌
        const statusCode = error.status || error.statusCode || 500;
        this.logAudit(request, response, auditConfig, statusCode);
        return throwError(() => error);
      }),
    );
  }

  /**
   * 記錄稽核日誌
   *
   * @param request HTTP 請求
   * @param response HTTP 回應
   * @param config 稽核配置
   * @param statusCode HTTP 狀態碼
   */
  private async logAudit(
    request: Request,
    response: Response,
    config: AuditLogConfig,
    statusCode: number,
  ): Promise<void> {
    try {
      // 取得操作者 (ny-operator header)
      const operator = (request.headers['ny-operator'] as string) || 'unknown';

      // 取得 Request ID
      const requestId = (request as any).requestId || uuidv4();

      // 取得 IP 位址
      const ipAddress =
        (request.headers['x-forwarded-for'] as string)?.split(',')[0] ||
        request.ip ||
        request.socket.remoteAddress;

      // 取得 User Agent
      const userAgent = request.headers['user-agent'];

      // 建立稽核日誌資料
      const auditData: AuditLogData = {
        id: uuidv4(),
        timestamp: new Date().toISOString(),
        operator,
        method: request.method,
        path: request.path,
        queryParams: Object.keys(request.query).length > 0 ? request.query : undefined,
        requestBody:
          request.body && Object.keys(request.body).length > 0
            ? request.body
            : undefined,
        statusCode,
        ipAddress,
        userAgent,
        requestId,
        page: config.page,
        action: config.action,
        fields: this.extractFields(request, config),
      };

      // 非同步記錄日誌 (不阻塞回應)
      await this.auditLogService.log(auditData);
    } catch (error: any) {
      // 記錄失敗不應影響主流程
      this.logger.error(
        `Failed to log audit: ${error?.message || 'Unknown error'}`,
        error?.stack,
      );
    }
  }

  /**
   * 提取業務相關欄位
   *
   * @param request HTTP 請求
   * @param config 稽核配置
   * @returns 業務欄位
   */
  private extractFields(
    request: Request,
    config: AuditLogConfig,
  ): Record<string, any> {
    const fields: Record<string, any> = {};

    // 提取路徑參數
    if (request.params) {
      Object.assign(fields, request.params);
    }

    // 提取關鍵的 body 欄位 (不包含敏感資料)
    if (request.body) {
      const safeFields = ['id', 'name', 'type', 'status', 'market', 'shopId'];
      for (const field of safeFields) {
        if (request.body[field] !== undefined) {
          fields[field] = request.body[field];
        }
      }
    }

    return fields;
  }
}
