/**
 * 稽核日誌檔案管理工具
 *
 * 提供檔案讀寫、檔案命名、日期範圍計算等功能
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  AUDIT_LOG_FILE_CONFIG,
  AUDIT_LOG_RETENTION,
} from '../constants/audit-log.constants';
import {
  AUDIT_LOGS_DIR,
  getAuditLogFilePathByDate,
} from '../constants/file-paths.constants';

/**
 * 稽核日誌檔案管理器
 */
export class AuditLogFileManager {
  /**
   * 取得今日稽核日誌檔案路徑
   *
   * @returns 今日稽核日誌檔案路徑
   */
  static getTodayFilePath(): string {
    const today = this.formatDate(new Date());
    return getAuditLogFilePathByDate(today);
  }

  /**
   * 取得指定日期的稽核日誌檔案路徑
   *
   * @param date 日期
   * @returns 稽核日誌檔案路徑
   */
  static getFilePathByDate(date: Date): string {
    const dateStr = this.formatDate(date);
    return getAuditLogFilePathByDate(dateStr);
  }

  /**
   * 格式化日期為 YYYYMMDD
   *
   * @param date 日期
   * @returns 格式化後的日期字串
   */
  static formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
  }

  /**
   * 寫入稽核日誌到檔案
   *
   * 使用同步寫入確保資料一致性
   *
   * @param data 稽核日誌資料
   * @throws Error 當寫入失敗時
   */
  static writeLog(data: any): void {
    // 確保目錄存在
    this.ensureDirectoryExists();

    // 取得今日檔案路徑
    const filePath = this.getTodayFilePath();

    // 序列化為 JSON 並加上換行符
    const jsonLine =
      JSON.stringify(data) + AUDIT_LOG_FILE_CONFIG.LINE_SEPARATOR;

    // 同步寫入檔案 (append 模式)
    fs.appendFileSync(filePath, jsonLine, {
      encoding: AUDIT_LOG_FILE_CONFIG.ENCODING as BufferEncoding,
    });
  }

  /**
   * 讀取指定日期範圍的稽核日誌
   *
   * @param startDate 起始日期
   * @param endDate 結束日期
   * @returns 稽核日誌資料陣列
   */
  static readLogs(startDate: Date, endDate: Date): any[] {
    const logs: any[] = [];

    // 取得日期範圍內的所有檔案
    const filePaths = this.getFilePathsInDateRange(startDate, endDate);

    // 讀取每個檔案
    for (const filePath of filePaths) {
      if (fs.existsSync(filePath)) {
        const fileContent = fs.readFileSync(filePath, {
          encoding: AUDIT_LOG_FILE_CONFIG.ENCODING as BufferEncoding,
        });

        // 解析 JSON Lines 格式
        const lines = fileContent
          .split(AUDIT_LOG_FILE_CONFIG.LINE_SEPARATOR)
          .filter((line) => line.trim().length > 0);

        for (const line of lines) {
          try {
            const log = JSON.parse(line);
            logs.push(log);
          } catch (error) {
            // 忽略無法解析的行
            console.warn(`Failed to parse log line: ${line}`, error);
          }
        }
      }
    }

    return logs;
  }

  /**
   * 取得日期範圍內的所有檔案路徑
   *
   * @param startDate 起始日期
   * @param endDate 結束日期
   * @returns 檔案路徑陣列
   */
  static getFilePathsInDateRange(startDate: Date, endDate: Date): string[] {
    const filePaths: string[] = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      filePaths.push(this.getFilePathByDate(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return filePaths;
  }

  /**
   * 取得過期檔案列表 (超過保留天數)
   *
   * @returns 過期檔案路徑陣列
   */
  static getExpiredFiles(): string[] {
    // 確保目錄存在
    if (!fs.existsSync(AUDIT_LOGS_DIR)) {
      return [];
    }

    const expiredFiles: string[] = [];
    const files = fs.readdirSync(AUDIT_LOGS_DIR);
    const cutoffDate = new Date();
    cutoffDate.setDate(
      cutoffDate.getDate() - AUDIT_LOG_RETENTION.RETENTION_DAYS,
    );

    for (const file of files) {
      // 檢查檔案名稱格式: audit-YYYYMMDD.jsonl
      const match = file.match(/^audit-(\d{8})\.jsonl$/);
      if (match) {
        const dateStr = match[1];
        const fileDate = this.parseDate(dateStr);

        if (fileDate && fileDate < cutoffDate) {
          expiredFiles.push(path.join(AUDIT_LOGS_DIR, file));
        }
      }
    }

    return expiredFiles;
  }

  /**
   * 刪除過期檔案
   *
   * @returns 刪除的檔案數量
   */
  static deleteExpiredFiles(): number {
    const expiredFiles = this.getExpiredFiles();
    let deletedCount = 0;

    for (const filePath of expiredFiles) {
      try {
        fs.unlinkSync(filePath);
        deletedCount++;
      } catch (error) {
        console.error(`Failed to delete expired file: ${filePath}`, error);
      }
    }

    return deletedCount;
  }

  /**
   * 解析日期字串 (YYYYMMDD)
   *
   * @param dateStr 日期字串
   * @returns Date 物件，解析失敗時返回 null
   */
  private static parseDate(dateStr: string): Date | null {
    if (dateStr.length !== 8) {
      return null;
    }

    const year = parseInt(dateStr.substring(0, 4), 10);
    const month = parseInt(dateStr.substring(4, 6), 10) - 1;
    const day = parseInt(dateStr.substring(6, 8), 10);

    const date = new Date(year, month, day);

    // 驗證日期有效性
    if (
      date.getFullYear() === year &&
      date.getMonth() === month &&
      date.getDate() === day
    ) {
      return date;
    }

    return null;
  }

  /**
   * 確保稽核日誌目錄存在
   */
  static ensureDirectoryExists(): void {
    if (!fs.existsSync(AUDIT_LOGS_DIR)) {
      fs.mkdirSync(AUDIT_LOGS_DIR, { recursive: true });
    }
  }

  /**
   * 取得檔案大小 (bytes)
   *
   * @param filePath 檔案路徑
   * @returns 檔案大小，檔案不存在時返回 0
   */
  static getFileSize(filePath: string): number {
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      return stats.size;
    }
    return 0;
  }

  /**
   * 取得所有稽核日誌檔案的總大小
   *
   * @returns 總大小 (bytes)
   */
  static getTotalSize(): number {
    if (!fs.existsSync(AUDIT_LOGS_DIR)) {
      return 0;
    }

    let totalSize = 0;
    const files = fs.readdirSync(AUDIT_LOGS_DIR);

    for (const file of files) {
      if (file.endsWith(AUDIT_LOG_FILE_CONFIG.FILE_EXTENSION)) {
        const filePath = path.join(AUDIT_LOGS_DIR, file);
        totalSize += this.getFileSize(filePath);
      }
    }

    return totalSize;
  }
}
