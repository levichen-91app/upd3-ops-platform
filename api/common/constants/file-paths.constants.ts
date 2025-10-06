/**
 * 檔案路徑相關常數定義
 *
 * 集中管理所有檔案系統路徑配置
 */

import * as path from 'path';

/**
 * 專案根目錄
 */
export const PROJECT_ROOT = path.resolve(__dirname, '../../../');

/**
 * 日誌根目錄
 */
export const LOGS_ROOT = path.join(PROJECT_ROOT, 'logs');

/**
 * 稽核日誌目錄
 */
export const AUDIT_LOGS_DIR = path.join(LOGS_ROOT, 'audit');

/**
 * 取得稽核日誌檔案路徑
 * @param filename 檔案名稱 (例如: audit-20251006.jsonl)
 * @returns 完整檔案路徑
 */
export function getAuditLogFilePath(filename: string): string {
  return path.join(AUDIT_LOGS_DIR, filename);
}

/**
 * 取得日期對應的稽核日誌檔案路徑
 * @param date 日期字串 (格式: YYYYMMDD)
 * @returns 完整檔案路徑
 */
export function getAuditLogFilePathByDate(date: string): string {
  return getAuditLogFilePath(`audit-${date}.jsonl`);
}
