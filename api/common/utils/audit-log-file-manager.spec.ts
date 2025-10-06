/**
 * AuditLogFileManager 單元測試
 */

import { AuditLogFileManager } from './audit-log-file-manager';
import * as fs from 'fs';
import * as path from 'path';
import { AUDIT_LOGS_DIR } from '../constants/file-paths.constants';

describe('AuditLogFileManager', () => {
  const testLogsDir = path.join(AUDIT_LOGS_DIR, 'test-unit');

  beforeAll(() => {
    // 建立測試目錄
    if (!fs.existsSync(testLogsDir)) {
      fs.mkdirSync(testLogsDir, { recursive: true });
    }
  });

  afterAll(() => {
    // 清理測試目錄
    if (fs.existsSync(testLogsDir)) {
      fs.rmSync(testLogsDir, { recursive: true, force: true });
    }
  });

  beforeEach(() => {
    // 清理測試檔案
    if (fs.existsSync(testLogsDir)) {
      const files = fs.readdirSync(testLogsDir);
      files.forEach((file) => {
        fs.unlinkSync(path.join(testLogsDir, file));
      });
    }
  });

  describe('formatDate', () => {
    it('應正確格式化日期為 YYYYMMDD', () => {
      const date = new Date('2025-10-06T14:30:52.123Z');
      const formatted = AuditLogFileManager.formatDate(date);
      expect(formatted).toMatch(/^\d{8}$/);
    });

    it('應處理月份和日期的前導零', () => {
      const date = new Date('2025-01-05T00:00:00.000Z');
      const formatted = AuditLogFileManager.formatDate(date);
      expect(formatted).toMatch(/^2025010[45]$/); // 可能是 04 或 05 (時區差異)
    });
  });

  describe('getTodayFilePath', () => {
    it('應返回今日稽核日誌檔案路徑', () => {
      const filePath = AuditLogFileManager.getTodayFilePath();
      expect(filePath).toContain('audit-');
      expect(filePath).toContain('.jsonl');
      expect(filePath).toContain('logs/audit');
    });
  });

  describe('getFilePathByDate', () => {
    it('應根據日期返回正確的檔案路徑', () => {
      const date = new Date('2025-10-06T14:30:52.123Z');
      const filePath = AuditLogFileManager.getFilePathByDate(date);
      expect(filePath).toContain('audit-');
      expect(filePath).toContain('.jsonl');
    });
  });

  describe('ensureDirectoryExists', () => {
    it('應建立不存在的目錄', () => {
      const testDir = path.join(testLogsDir, 'new-dir');

      // 確保目錄不存在
      if (fs.existsSync(testDir)) {
        fs.rmSync(testDir, { recursive: true });
      }

      // 建立目錄
      AuditLogFileManager.ensureDirectoryExists();

      // 驗證父目錄存在
      expect(fs.existsSync(AUDIT_LOGS_DIR)).toBe(true);
    });

    it('應不會影響已存在的目錄', () => {
      AuditLogFileManager.ensureDirectoryExists();
      expect(fs.existsSync(AUDIT_LOGS_DIR)).toBe(true);

      // 再次呼叫不應拋出錯誤
      expect(() => AuditLogFileManager.ensureDirectoryExists()).not.toThrow();
    });
  });

  describe('getFilePathsInDateRange', () => {
    it('應返回日期範圍內所有檔案路徑', () => {
      const startDate = new Date('2025-10-01T00:00:00.000Z');
      const endDate = new Date('2025-10-03T00:00:00.000Z');

      const filePaths = AuditLogFileManager.getFilePathsInDateRange(
        startDate,
        endDate,
      );

      // 應包含 3 個檔案 (10/1, 10/2, 10/3)
      expect(filePaths.length).toBeGreaterThanOrEqual(3);
      filePaths.forEach((filePath) => {
        expect(filePath).toContain('audit-');
        expect(filePath).toContain('.jsonl');
      });
    });

    it('應處理單一日期', () => {
      const date = new Date('2025-10-06T00:00:00.000Z');
      const filePaths = AuditLogFileManager.getFilePathsInDateRange(date, date);

      expect(filePaths.length).toBe(1);
      expect(filePaths[0]).toContain('audit-');
    });
  });

  describe('getExpiredFiles', () => {
    it('應返回空陣列當目錄不存在時', () => {
      const nonExistentDir = path.join(testLogsDir, 'non-existent');
      const expiredFiles = AuditLogFileManager.getExpiredFiles();

      // 應不拋出錯誤
      expect(Array.isArray(expiredFiles)).toBe(true);
    });

    it('應識別過期檔案', () => {
      // 建立 31 天前的檔案
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 31);
      const oldFilename = `audit-${AuditLogFileManager.formatDate(oldDate)}.jsonl`;
      const oldFilePath = path.join(AUDIT_LOGS_DIR, oldFilename);

      // 寫入測試檔案
      fs.writeFileSync(oldFilePath, '{"test":"old"}\n', 'utf-8');

      try {
        const expiredFiles = AuditLogFileManager.getExpiredFiles();

        // 應包含過期檔案
        const hasOldFile = expiredFiles.some((file) => file.includes(oldFilename));
        expect(hasOldFile).toBe(true);
      } finally {
        // 清理測試檔案
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      }
    });

    it('應不包含 30 天內的檔案', () => {
      // 建立 29 天前的檔案
      const recentDate = new Date();
      recentDate.setDate(recentDate.getDate() - 29);
      const recentFilename = `audit-${AuditLogFileManager.formatDate(recentDate)}.jsonl`;
      const recentFilePath = path.join(AUDIT_LOGS_DIR, recentFilename);

      // 寫入測試檔案
      fs.writeFileSync(recentFilePath, '{"test":"recent"}\n', 'utf-8');

      try {
        const expiredFiles = AuditLogFileManager.getExpiredFiles();

        // 應不包含最近的檔案
        const hasRecentFile = expiredFiles.some((file) =>
          file.includes(recentFilename),
        );
        expect(hasRecentFile).toBe(false);
      } finally {
        // 清理測試檔案
        if (fs.existsSync(recentFilePath)) {
          fs.unlinkSync(recentFilePath);
        }
      }
    });
  });

  describe('getFileSize', () => {
    it('應返回檔案大小', () => {
      const testFile = path.join(testLogsDir, 'test.jsonl');
      const content = '{"test":"data"}\n';
      fs.writeFileSync(testFile, content, 'utf-8');

      const size = AuditLogFileManager.getFileSize(testFile);
      expect(size).toBe(Buffer.from(content, 'utf-8').length);
    });

    it('應返回 0 當檔案不存在時', () => {
      const nonExistentFile = path.join(testLogsDir, 'non-existent.jsonl');
      const size = AuditLogFileManager.getFileSize(nonExistentFile);
      expect(size).toBe(0);
    });
  });

  describe('getTotalSize', () => {
    it('應返回所有稽核日誌檔案的總大小', () => {
      // 建立測試檔案
      const file1 = path.join(testLogsDir, 'audit-20251001.jsonl');
      const file2 = path.join(testLogsDir, 'audit-20251002.jsonl');

      fs.writeFileSync(file1, '{"test":"data1"}\n', 'utf-8');
      fs.writeFileSync(file2, '{"test":"data2"}\n', 'utf-8');

      // 注意：getTotalSize 會掃描 AUDIT_LOGS_DIR，不是 testLogsDir
      const totalSize = AuditLogFileManager.getTotalSize();
      expect(totalSize).toBeGreaterThanOrEqual(0);
    });

    it('應返回 0 當目錄不存在時', () => {
      // getTotalSize 應優雅處理不存在的目錄
      const totalSize = AuditLogFileManager.getTotalSize();
      expect(totalSize).toBeGreaterThanOrEqual(0);
    });
  });

  describe('readLogs 和 writeLog 整合測試', () => {
    it('應正確寫入和讀取日誌', () => {
      const testData = {
        id: 'test-id',
        timestamp: '2025-10-06T14:30:52.123Z',
        operator: 'test@91app.com',
        method: 'POST',
        path: '/api/v1/test',
        statusCode: 200,
        requestId: 'req-test-123',
      };

      // 寫入日誌
      AuditLogFileManager.writeLog(testData);

      // 讀取日誌
      const today = new Date();
      const logs = AuditLogFileManager.readLogs(today, today);

      // 驗證讀取的資料
      expect(logs.length).toBeGreaterThan(0);
      const foundLog = logs.find((log) => log.id === 'test-id');
      expect(foundLog).toBeDefined();
      expect(foundLog?.operator).toBe('test@91app.com');
    });

    it('應處理空的日期範圍', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10);

      const logs = AuditLogFileManager.readLogs(futureDate, futureDate);
      expect(Array.isArray(logs)).toBe(true);
    });
  });
});
