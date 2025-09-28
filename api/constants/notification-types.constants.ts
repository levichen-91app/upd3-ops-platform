/**
 * 通知類型常數定義
 *
 * 定義系統支援的通知類型，用於：
 * - DTO 驗證
 * - 外部 API 調用
 * - 錯誤訊息顯示
 */
export enum NotificationType {
  SMS = 'sms',
  PUSH = 'push',
  LINE = 'line',
  EMAIL = 'email',
}

/**
 * 通知類型陣列，用於驗證
 */
export const NOTIFICATION_TYPES = Object.values(NotificationType);

/**
 * 通知類型顯示名稱對應
 */
export const NOTIFICATION_TYPE_LABELS = {
  [NotificationType.SMS]: '簡訊',
  [NotificationType.PUSH]: '推播',
  [NotificationType.LINE]: 'LINE',
  [NotificationType.EMAIL]: '電子郵件',
} as const;