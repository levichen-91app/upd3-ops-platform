import { HttpException } from '@nestjs/common';
import { ERROR_CODES } from '../../constants/error-codes.constants';

/**
 * 稽核儲存異常
 *
 * 當稽核日誌儲存或讀取失敗時拋出此異常
 */
export class AuditStorageException extends HttpException {
  constructor(message: string, details?: Record<string, any>) {
    super(
      {
        code: ERROR_CODES.UNAVAILABLE,
        message,
        details: details
          ? [{ '@type': 'type.upd3ops.com/StorageError', ...details }]
          : [],
      },
      503,
    );
  }
}
