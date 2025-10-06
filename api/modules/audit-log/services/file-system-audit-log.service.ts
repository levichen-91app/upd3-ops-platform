import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import {
  IAuditLogService,
  AuditLogData,
  AuditLogQueryCriteria,
  AuditLogQueryResult,
  AuditLogEntry,
} from '../interfaces/audit-log.interface';
import { SensitiveDataMasker } from '../../../common/utils/sensitive-data-masker';
import { AuditLogFileManager } from '../../../common/utils/audit-log-file-manager';
import { AuditStorageException } from '../../../common/exceptions/audit-storage.exception';
import {
  AUDIT_LOG_QUERY_LIMITS,
  AUDIT_LOG_ERROR_MESSAGES,
} from '../../../common/constants/audit-log.constants';

/**
 * 檔案系統稽核日誌服務
 *
 * 使用檔案系統 (JSON Lines) 實作稽核日誌的記錄和查詢
 */
@Injectable()
export class FileSystemAuditLogService implements IAuditLogService {
  private readonly logger = new Logger(FileSystemAuditLogService.name);

  /**
   * 記錄稽核日誌
   *
   * @param data 稽核日誌資料
   * @throws AuditStorageException 當儲存失敗時
   */
  async log(data: AuditLogData): Promise<void> {
    try {
      // 遮罩敏感資料
      const maskedData = {
        ...data,
        queryParams: data.queryParams
          ? SensitiveDataMasker.mask(data.queryParams)
          : undefined,
        requestBody: data.requestBody
          ? SensitiveDataMasker.mask(data.requestBody)
          : undefined,
      };

      // 寫入檔案
      AuditLogFileManager.writeLog(maskedData);

      this.logger.log(
        `Audit log recorded: ${data.method} ${data.path} by ${data.operator}`,
      );
    } catch (error: any) {
      this.logger.error(
        `Failed to write audit log: ${error?.message || 'Unknown error'}`,
        error?.stack,
      );
      throw new AuditStorageException(AUDIT_LOG_ERROR_MESSAGES.STORAGE_FAILED, {
        error: error?.message || 'Unknown error',
      });
    }
  }

  /**
   * 查詢稽核日誌
   *
   * @param criteria 查詢條件
   * @returns 查詢結果
   * @throws AuditStorageException 當查詢失敗時
   */
  async query(criteria: AuditLogQueryCriteria): Promise<AuditLogQueryResult> {
    try {
      // 設定預設查詢範圍 (7 天內)
      const endDate = criteria.endDate || new Date();
      const startDate =
        criteria.startDate ||
        new Date(
          endDate.getTime() -
            AUDIT_LOG_QUERY_LIMITS.MAX_QUERY_DAYS * 24 * 60 * 60 * 1000,
        );

      // 驗證查詢範圍
      this.validateDateRange(startDate, endDate);

      // 讀取日誌檔案
      const logs = AuditLogFileManager.readLogs(startDate, endDate);

      // 過濾日誌
      const filteredLogs = this.filterLogs(logs, criteria);

      // 計算分頁
      const limit = criteria.limit || AUDIT_LOG_QUERY_LIMITS.DEFAULT_LIMIT;
      const offset = criteria.offset || 0;
      const total = filteredLogs.length;

      // 分頁切片
      const paginatedLogs = filteredLogs.slice(offset, offset + limit);

      // 轉換為查詢結果格式
      const data = paginatedLogs.map((log) => this.transformToEntry(log));

      return {
        data,
        pagination: {
          total,
          limit,
          offset,
        },
      };
    } catch (error: any) {
      if (error instanceof AuditStorageException) {
        throw error;
      }

      this.logger.error(
        `Failed to query audit logs: ${error?.message || 'Unknown error'}`,
        error?.stack,
      );
      throw new AuditStorageException(AUDIT_LOG_ERROR_MESSAGES.QUERY_FAILED, {
        error: error?.message || 'Unknown error',
      });
    }
  }

  /**
   * 清理過期檔案
   */
  async cleanupExpiredFiles(): Promise<void> {
    try {
      const deletedCount = AuditLogFileManager.deleteExpiredFiles();
      this.logger.log(`Cleaned up ${deletedCount} expired audit log files`);
    } catch (error: any) {
      this.logger.error(
        `Failed to cleanup expired files: ${error?.message || 'Unknown error'}`,
        error?.stack,
      );
    }
  }

  /**
   * 驗證查詢日期範圍
   *
   * @param startDate 起始日期
   * @param endDate 結束日期
   * @throws AuditStorageException 當日期範圍無效時
   */
  private validateDateRange(startDate: Date, endDate: Date): void {
    // 檢查 endDate >= startDate
    if (endDate < startDate) {
      throw new AuditStorageException(
        AUDIT_LOG_ERROR_MESSAGES.INVALID_DATE_RANGE,
        {
          reason: 'END_DATE_BEFORE_START_DATE',
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        },
      );
    }

    // 檢查查詢範圍不超過 7 天
    const daysDiff =
      (endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000);
    if (daysDiff > AUDIT_LOG_QUERY_LIMITS.MAX_QUERY_DAYS) {
      throw new AuditStorageException(
        AUDIT_LOG_ERROR_MESSAGES.INVALID_DATE_RANGE,
        {
          reason: 'DATE_RANGE_EXCEEDED',
          maxDays: AUDIT_LOG_QUERY_LIMITS.MAX_QUERY_DAYS,
          requestedDays: Math.ceil(daysDiff),
        },
      );
    }
  }

  /**
   * 過濾日誌
   *
   * @param logs 原始日誌資料
   * @param criteria 查詢條件
   * @returns 過濾後的日誌
   */
  private filterLogs(
    logs: AuditLogData[],
    criteria: AuditLogQueryCriteria,
  ): AuditLogData[] {
    return logs.filter((log) => {
      // 操作者過濾
      if (
        criteria.operatorFilter &&
        !log.operator.includes(criteria.operatorFilter)
      ) {
        return false;
      }

      // 路徑過濾
      if (criteria.pathFilter && !log.path.includes(criteria.pathFilter)) {
        return false;
      }

      // 頁面過濾
      if (criteria.pageFilter && log.page !== criteria.pageFilter) {
        return false;
      }

      // 動作過濾
      if (criteria.action && log.action !== criteria.action) {
        return false;
      }

      // HTTP 方法過濾
      if (criteria.method && log.method !== criteria.method) {
        return false;
      }

      // 狀態碼過濾
      if (
        criteria.statusCode !== undefined &&
        log.statusCode !== criteria.statusCode
      ) {
        return false;
      }

      return true;
    });
  }

  /**
   * 轉換為查詢結果格式
   *
   * @param log 原始日誌資料
   * @returns 查詢結果項目
   */
  private transformToEntry(log: AuditLogData): AuditLogEntry {
    return {
      id: log.id,
      operator: log.operator,
      page: log.page || 'unknown',
      action: log.action || 'unknown',
      fields: log.fields || {},
      metadata: {
        method: log.method,
        path: log.path,
        statusCode: log.statusCode,
      },
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      createdAt: log.timestamp,
      requestId: log.requestId,
    };
  }
}
