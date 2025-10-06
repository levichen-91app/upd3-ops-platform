import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AuditLogController } from './audit-log.controller';
import { AuditLogService } from './audit-log.service';
import { FileSystemAuditLogService } from './services/file-system-audit-log.service';
import { AuditLogInterceptor } from './interceptors/audit-log.interceptor';
import { AUDIT_LOG_SERVICE_TOKEN } from './interfaces/audit-log.interface';

/**
 * 稽核日誌模組
 *
 * 提供系統操作稽核日誌的記錄和查詢功能
 */
@Module({
  imports: [HttpModule],
  controllers: [AuditLogController],
  providers: [
    AuditLogService,
    AuditLogInterceptor,
    {
      provide: AUDIT_LOG_SERVICE_TOKEN,
      useClass: FileSystemAuditLogService,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditLogInterceptor,
    },
  ],
  exports: [AUDIT_LOG_SERVICE_TOKEN],
})
export class AuditLogModule {}
