import { ApiProperty } from '@nestjs/swagger';

/**
 * Notification Status Enum
 * Represents all possible statuses for notification history records
 *
 * Based on Whale API notification system status definitions
 * Used to track the lifecycle and outcome of notification delivery
 */
export enum NotificationStatus {
  /** 通知已成功發送並確認送達 */
  SUCCESS = 'Success',

  /** 通知發送失敗 */
  FAILED = 'Failed',

  /** 通知等待處理中 */
  PENDING = 'Pending',

  /** 通知已被取消 */
  CANCELLED = 'Cancelled',

  /** 通知已排程但尚未發送 */
  SCHEDULED = 'Scheduled',

  /** 通知已預約但尚未到發送時間 */
  BOOKED = 'Booked',

  /** 通知已發送 */
  SENT = 'Sent',

  /** 通知發送時發生錯誤 */
  ERROR = 'Error',

  /** 通知發送失敗 */
  FAIL = 'Fail',

  /** 通知部分發送失敗 */
  PARTIAL_FAIL = 'PartialFail',

  /** 找不到目標用戶 */
  NO_USER = 'NoUser',
}

/**
 * OpenAPI schema decorator for NotificationStatus enum
 * Provides Swagger documentation for API endpoints
 */
export const NotificationStatusApiProperty = () =>
  ApiProperty({
    description: '通知狀態',
    enum: NotificationStatus,
    enumName: 'NotificationStatus',
    example: NotificationStatus.SUCCESS,
    examples: {
      success: {
        value: NotificationStatus.SUCCESS,
        description: '成功發送',
      },
      scheduled: {
        value: NotificationStatus.SCHEDULED,
        description: '已排程',
      },
      failed: {
        value: NotificationStatus.FAILED,
        description: '發送失敗',
      },
      error: {
        value: NotificationStatus.ERROR,
        description: '發生錯誤',
      },
    },
  });

/**
 * Status category helper for grouping similar statuses
 */
export class NotificationStatusHelper {
  /**
   * Success statuses indicate successful delivery
   */
  static readonly SUCCESS_STATUSES = [
    NotificationStatus.SUCCESS,
    NotificationStatus.SENT,
  ];

  /**
   * Pending statuses indicate processing or scheduled states
   */
  static readonly PENDING_STATUSES = [
    NotificationStatus.PENDING,
    NotificationStatus.SCHEDULED,
    NotificationStatus.BOOKED,
  ];

  /**
   * Failed statuses indicate delivery failures
   */
  static readonly FAILED_STATUSES = [
    NotificationStatus.FAILED,
    NotificationStatus.ERROR,
    NotificationStatus.FAIL,
    NotificationStatus.PARTIAL_FAIL,
    NotificationStatus.NO_USER,
    NotificationStatus.CANCELLED,
  ];

  /**
   * Check if status indicates successful delivery
   */
  static isSuccess(status: NotificationStatus): boolean {
    return this.SUCCESS_STATUSES.includes(status);
  }

  /**
   * Check if status indicates pending/processing state
   */
  static isPending(status: NotificationStatus): boolean {
    return this.PENDING_STATUSES.includes(status);
  }

  /**
   * Check if status indicates failure
   */
  static isFailed(status: NotificationStatus): boolean {
    return this.FAILED_STATUSES.includes(status);
  }

  /**
   * Get status category
   */
  static getCategory(status: NotificationStatus): 'success' | 'pending' | 'failed' {
    if (this.isSuccess(status)) return 'success';
    if (this.isPending(status)) return 'pending';
    return 'failed';
  }
}