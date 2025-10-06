/**
 * 稽核日誌服務介面定義
 *
 * 定義稽核日誌記錄和查詢的抽象介面，支援多種儲存實作
 */

/**
 * 稽核日誌資料結構
 */
export interface AuditLogData {
  /** 唯一識別碼 (UUID v4) */
  id: string;
  /** 操作時間戳記 (ISO 8601) */
  timestamp: string;
  /** 操作者識別 (ny-operator header) */
  operator: string;
  /** HTTP 方法 */
  method: string;
  /** API 路徑 */
  path: string;
  /** 查詢參數 */
  queryParams?: Record<string, any>;
  /** 請求主體 (已遮罩敏感資料) */
  requestBody?: Record<string, any>;
  /** HTTP 回應狀態碼 */
  statusCode: number;
  /** 客戶端 IP 位址 */
  ipAddress?: string;
  /** 使用者代理字串 */
  userAgent?: string;
  /** 關聯的請求 ID */
  requestId: string;
  /** 業務頁面識別 */
  page?: string;
  /** 業務動作描述 */
  action?: string;
  /** 業務相關欄位 */
  fields?: Record<string, any>;
}

/**
 * 稽核日誌查詢條件
 */
export interface AuditLogQueryCriteria {
  /** 操作者過濾 */
  operatorFilter?: string;
  /** API 路徑關鍵字過濾 */
  pathFilter?: string;
  /** 業務頁面過濾 */
  pageFilter?: string;
  /** 業務動作過濾 */
  action?: string;
  /** HTTP 方法過濾 */
  method?: string;
  /** HTTP 狀態碼過濾 */
  statusCode?: number;
  /** 查詢起始時間 */
  startDate?: Date;
  /** 查詢結束時間 */
  endDate?: Date;
  /** 每頁筆數 */
  limit?: number;
  /** 分頁偏移量 */
  offset?: number;
}

/**
 * 稽核日誌查詢結果項目
 */
export interface AuditLogEntry {
  /** 唯一識別碼 */
  id: string;
  /** 操作者 */
  operator: string;
  /** 頁面識別 */
  page: string;
  /** 動作描述 */
  action: string;
  /** 業務相關欄位 */
  fields: Record<string, any>;
  /** 技術元資料 */
  metadata: {
    method: string;
    path: string;
    statusCode: number;
  };
  /** IP 位址 */
  ipAddress?: string;
  /** 使用者代理 */
  userAgent?: string;
  /** 建立時間 */
  createdAt: string;
  /** 請求 ID */
  requestId: string;
}

/**
 * 稽核日誌查詢結果
 */
export interface AuditLogQueryResult {
  /** 查詢結果項目列表 */
  data: AuditLogEntry[];
  /** 分頁資訊 */
  pagination: {
    total: number;
    limit: number;
    offset: number;
  };
}

/**
 * 稽核日誌服務介面
 */
export interface IAuditLogService {
  /**
   * 記錄稽核日誌
   * @param data 稽核日誌資料
   * @returns Promise<void>
   * @throws AuditStorageException 當儲存失敗時
   */
  log(data: AuditLogData): Promise<void>;

  /**
   * 查詢稽核日誌
   * @param criteria 查詢條件
   * @returns Promise<AuditLogQueryResult>
   * @throws AuditStorageException 當查詢失敗時
   */
  query(criteria: AuditLogQueryCriteria): Promise<AuditLogQueryResult>;

  /**
   * 清理過期檔案
   * @returns Promise<void>
   */
  cleanupExpiredFiles(): Promise<void>;
}

/**
 * 稽核日誌服務 DI Token
 */
export const AUDIT_LOG_SERVICE_TOKEN = 'IAuditLogService';

/**
 * 稽核日誌裝飾器配置
 */
export interface AuditLogConfig {
  /** 業務頁面識別 */
  page: string;
  /** 業務動作描述 */
  action: string;
}
