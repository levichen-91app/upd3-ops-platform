import { SetMetadata } from '@nestjs/common';
import { AUDIT_METADATA_KEY } from '../constants/audit-log.constants';
import { AuditLogConfig } from '../../modules/audit-log/interfaces/audit-log.interface';

/**
 * 稽核日誌裝飾器
 *
 * 用於標記需要記錄稽核日誌的 API 端點
 *
 * @param config 稽核配置
 * @returns MethodDecorator
 *
 * @example
 * ```typescript
 * @AuditLog({ page: 'supplier-management', action: 'create-supplier' })
 * @Post()
 * async createSupplier(@Body() dto: CreateSupplierDto) {
 *   // ...
 * }
 * ```
 */
export const AuditLog = (config: AuditLogConfig): MethodDecorator => {
  return SetMetadata(AUDIT_METADATA_KEY, config);
};
