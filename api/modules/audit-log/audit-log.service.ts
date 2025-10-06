import {
  Injectable,
  Inject,
  BadRequestException,
  OnModuleInit,
} from '@nestjs/common';
import type {
  IAuditLogService,
  AuditLogQueryCriteria,
} from './interfaces/audit-log.interface';
import { AUDIT_LOG_SERVICE_TOKEN } from './interfaces/audit-log.interface';
import { AuditLogQueryDto } from './dto/audit-log-query.dto';
import { AuditLogQueryResponseDto } from './dto/audit-log-response.dto';
import { AUDIT_LOG_QUERY_LIMITS } from '../../common/constants/audit-log.constants';
import { ERROR_CODES } from '../../constants/error-codes.constants';
import * as cron from 'node-cron';

/**
 * 稽核日誌主服務
 *
 * 協調稽核日誌的記錄和查詢業務邏輯
 */
@Injectable()
export class AuditLogService implements OnModuleInit {
  constructor(
    @Inject(AUDIT_LOG_SERVICE_TOKEN)
    private readonly auditLogService: IAuditLogService,
  ) {}

  /**
   * 模組初始化時執行
   *
   * 1. 執行一次檔案清理
   * 2. 設定定時清理任務
   */
  onModuleInit() {
    // 啟動時立即執行一次清理
    this.auditLogService.cleanupExpiredFiles().catch((error) => {
      console.error('Failed to cleanup expired files on startup:', error);
    });

    // 設定每日清理排程 (凌晨 2:00)
    cron.schedule('0 2 * * *', async () => {
      await this.auditLogService.cleanupExpiredFiles();
    });
  }

  /**
   * 查詢稽核日誌
   *
   * @param queryDto 查詢 DTO
   * @param requestId 請求 ID
   * @returns 查詢結果
   */
  async query(
    queryDto: AuditLogQueryDto,
    requestId: string,
  ): Promise<AuditLogQueryResponseDto> {
    // 驗證查詢參數
    this.validateQueryParams(queryDto);

    // 轉換為查詢條件
    const criteria: AuditLogQueryCriteria = {
      operatorFilter: queryDto.operatorFilter,
      pathFilter: queryDto.pathFilter,
      pageFilter: queryDto.pageFilter,
      action: queryDto.action,
      method: queryDto.method,
      statusCode: queryDto.statusCode,
      startDate: queryDto.startDate ? new Date(queryDto.startDate) : undefined,
      endDate: queryDto.endDate ? new Date(queryDto.endDate) : undefined,
      limit: queryDto.limit,
      offset: queryDto.offset,
    };

    // 執行查詢
    const result = await this.auditLogService.query(criteria);

    // 建立回應
    return {
      success: true,
      data: result.data,
      pagination: result.pagination,
      timestamp: new Date().toISOString(),
      requestId,
    };
  }

  /**
   * 驗證查詢參數
   *
   * @param queryDto 查詢 DTO
   * @throws BadRequestException 當參數無效時
   */
  private validateQueryParams(queryDto: AuditLogQueryDto): void {
    // 驗證日期範圍
    if (queryDto.startDate && queryDto.endDate) {
      const startDate = new Date(queryDto.startDate);
      const endDate = new Date(queryDto.endDate);

      // 檢查 endDate >= startDate
      if (endDate < startDate) {
        throw new BadRequestException({
          code: ERROR_CODES.INVALID_ARGUMENT,
          message: 'End date must be greater than or equal to start date',
          details: [
            {
              '@type': 'type.upd3ops.com/ValidationError',
              field: 'endDate',
              reason: 'INVALID_DATE_RANGE',
            },
          ],
        });
      }

      // 檢查查詢範圍不超過 7 天
      const daysDiff =
        (endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000);
      if (daysDiff > AUDIT_LOG_QUERY_LIMITS.MAX_QUERY_DAYS) {
        throw new BadRequestException({
          code: ERROR_CODES.INVALID_ARGUMENT,
          message: 'Query date range exceeds 7-day limit',
          details: [
            {
              '@type': 'type.upd3ops.com/ValidationError',
              field: 'startDate',
              reason: 'DATE_RANGE_EXCEEDED',
              maxDays: AUDIT_LOG_QUERY_LIMITS.MAX_QUERY_DAYS,
            },
          ],
        });
      }
    }

    // 驗證分頁參數
    if (
      queryDto.limit !== undefined &&
      (queryDto.limit < AUDIT_LOG_QUERY_LIMITS.MIN_LIMIT ||
        queryDto.limit > AUDIT_LOG_QUERY_LIMITS.MAX_LIMIT)
    ) {
      throw new BadRequestException({
        code: ERROR_CODES.INVALID_ARGUMENT,
        message: 'Invalid pagination parameters',
        details: [
          {
            '@type': 'type.upd3ops.com/ValidationError',
            field: 'limit',
            reason: 'PARAMETER_OUT_OF_RANGE',
            maxValue: AUDIT_LOG_QUERY_LIMITS.MAX_LIMIT,
          },
        ],
      });
    }

    if (
      queryDto.offset !== undefined &&
      queryDto.offset < AUDIT_LOG_QUERY_LIMITS.MIN_OFFSET
    ) {
      throw new BadRequestException({
        code: ERROR_CODES.INVALID_ARGUMENT,
        message: 'Invalid pagination parameters',
        details: [
          {
            '@type': 'type.upd3ops.com/ValidationError',
            field: 'offset',
            reason: 'PARAMETER_OUT_OF_RANGE',
            minValue: AUDIT_LOG_QUERY_LIMITS.MIN_OFFSET,
          },
        ],
      });
    }
  }
}
