import {
  Controller,
  Get,
  Query,
  Headers,
  Req,
  HttpCode,
  HttpStatus,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiSecurity } from '@nestjs/swagger';
import type { Request } from 'express';
import { AuditLogService } from './audit-log.service';
import { AuditLogQueryDto } from './dto/audit-log-query.dto';
import { AuditLogQueryResponseDto } from './dto/audit-log-response.dto';
import { NY_OPERATOR_HEADER } from '../../constants/headers.constants';
import { ERROR_CODES } from '../../constants/error-codes.constants';

/**
 * 稽核日誌控制器
 *
 * 處理稽核日誌查詢相關的 HTTP 請求
 */
@ApiTags('audit-logs')
@ApiSecurity('OperatorAuth')
@Controller('api/v1/audit-logs')
export class AuditLogController {
  constructor(private readonly auditLogService: AuditLogService) {}

  /**
   * 查詢稽核日誌
   *
   * @param query 查詢參數
   * @param operator 操作者 (ny-operator header)
   * @param request HTTP 請求
   * @returns 稽核日誌查詢結果
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: '查詢稽核日誌',
    description: `查詢系統操作稽核日誌，支援多種過濾條件和分頁。

**查詢限制**:
- 最多查詢 7 天內的資料
- 每頁最多 100 筆記錄
- 需要有效的 ny-operator 認證標頭

**查詢範圍**:
- \`/api/v1/shops/*\` 端點的寫入操作
- \`/api/v1/notification-status/*\` 端點的寫入操作
- 方法: POST, PUT, PATCH, DELETE`,
  })
  @ApiResponse({
    status: 200,
    description: '查詢成功',
    type: AuditLogQueryResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: '請求參數錯誤',
  })
  @ApiResponse({
    status: 401,
    description: '認證失敗',
  })
  @ApiResponse({
    status: 503,
    description: '服務暫時不可用',
  })
  async query(
    @Query() query: AuditLogQueryDto,
    @Headers(NY_OPERATOR_HEADER) operator: string,
    @Req() request: Request,
  ): Promise<AuditLogQueryResponseDto> {
    // 驗證 ny-operator header
    if (!operator || operator.trim().length === 0) {
      throw new UnauthorizedException({
        code: ERROR_CODES.UNAUTHENTICATED,
        message: 'Missing or invalid ny-operator header',
        details: [
          {
            '@type': 'type.upd3ops.com/AuthError',
            reason: 'MISSING_OPERATOR_HEADER',
          },
        ],
      });
    }

    // 取得 Request ID
    const requestId = (request as any).requestId;

    // 執行查詢
    const result = await this.auditLogService.query(query, requestId);

    return result;
  }
}
