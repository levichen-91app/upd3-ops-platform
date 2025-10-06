/**
 * 敏感資料遮罩工具
 *
 * 提供遞迴遍歷和遮罩敏感資料的功能
 */

import {
  SENSITIVE_PATTERNS,
  MASKED_VALUE,
} from '../constants/audit-log.constants';

/**
 * 敏感資料遮罩器
 */
export class SensitiveDataMasker {
  /**
   * 遮罩敏感資料
   *
   * 遞迴遍歷物件和陣列，將符合敏感欄位模式的值替換為 "***"
   *
   * @param data 原始資料
   * @returns 遮罩後的資料
   */
  static mask(data: any): any {
    // 處理 null 和 undefined
    if (data === null || data === undefined) {
      return data;
    }

    // 處理基本型別
    if (typeof data !== 'object') {
      return data;
    }

    // 處理陣列
    if (Array.isArray(data)) {
      return data.map((item) => this.mask(item));
    }

    // 處理物件
    const masked: any = {};
    for (const [key, value] of Object.entries(data)) {
      if (this.isSensitiveField(key)) {
        // 敏感欄位遮罩
        masked[key] = MASKED_VALUE;
      } else {
        // 遞迴處理巢狀結構
        masked[key] = this.mask(value);
      }
    }

    return masked;
  }

  /**
   * 檢查欄位名稱是否為敏感欄位
   *
   * @param fieldName 欄位名稱
   * @returns 是否為敏感欄位
   */
  private static isSensitiveField(fieldName: string): boolean {
    return SENSITIVE_PATTERNS.some((pattern) => pattern.test(fieldName));
  }

  /**
   * 批量遮罩多個物件
   *
   * @param dataArray 資料陣列
   * @returns 遮罩後的資料陣列
   */
  static maskBatch(dataArray: any[]): any[] {
    return dataArray.map((data) => this.mask(data));
  }

  /**
   * 檢查資料中是否包含敏感欄位
   *
   * @param data 資料
   * @returns 是否包含敏感欄位
   */
  static containsSensitiveData(data: any): boolean {
    if (data === null || data === undefined || typeof data !== 'object') {
      return false;
    }

    if (Array.isArray(data)) {
      return data.some((item) => this.containsSensitiveData(item));
    }

    for (const [key, value] of Object.entries(data)) {
      if (this.isSensitiveField(key)) {
        return true;
      }
      if (typeof value === 'object' && this.containsSensitiveData(value)) {
        return true;
      }
    }

    return false;
  }
}
