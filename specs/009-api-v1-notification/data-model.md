# Data Model: 通知活動歷程查詢 API

**Feature**: `/api/v1/notification-status/history/{notificationId}`
**Date**: 2025-09-28
**Branch**: `009-api-v1-notification`

## Core Entities

### NotificationHistory
通知活動歷程的主要資料實體，包含通知的完整生命週期資訊。

**屬性**:
- `id`: number (int64) - 通知ID，唯一識別符
- `channel`: string - 通知頻道 (例: "Push", "Email", "SMS")
- `bookDatetime`: string (ISO datetime) - 預定發送時間
- `sentDatetime`: string (ISO datetime, nullable) - 實際發送時間
- `ncId`: string (UUID) - Notification Center ID，用於下游系統整合
- `ncExtId`: number - NC Extension ID
- `status`: NotificationStatus - 通知當前狀態
- `isSettled`: boolean - 是否已完成結算
- `originalAudienceCount`: number - 原始受眾數量
- `filteredAudienceCount`: number - 篩選後受眾數量
- `sentAudienceCount`: number - 實際發送數量
- `receivedAudienceCount`: number - 實際接收數量
- `sentFailedCount`: number - 發送失敗數量
- `report`: WhaleReport - 詳細統計報告

**驗證規則**:
- `id` 必須為正整數
- `channel` 不可為空
- `bookDatetime` 必須為有效的ISO日期時間格式
- `ncId` 必須為有效的UUID格式
- 所有數量欄位必須為非負整數

**狀態轉換**:
```
Scheduled → Booked → Sent → (Success | Fail | PartialFail | NoUser)
            ↓
          Error (任何階段都可能發生)
```

### WhaleReport
來自 Whale API 的統計報告資料。

**屬性**:
- `Total`: number - 總處理數量
- `Sent`: number - 已發送數量
- `Success`: number - 成功數量
- `Fail`: number - 失敗數量
- `NoUser`: number - 找不到用戶數量

**驗證規則**:
- 所有欄位必須為非負整數
- `Total` 應該等於其他欄位的總和（業務邏輯驗證）

**關係約束**:
- `Total >= Sent >= Success`
- `Total = Success + Fail + NoUser`

### NotificationStatus (Enum)
通知狀態的枚舉類型。

**可能值**:
- `Scheduled` - 已排程
- `Booked` - 已預約
- `Sent` - 已發送
- `Error` - 發生錯誤
- `Success` - 成功完成
- `Fail` - 完全失敗
- `PartialFail` - 部分失敗
- `NoUser` - 沒有符合條件的用戶

## Request/Response Models

### NotificationHistoryQuery
API 請求的路徑參數模型。

**屬性**:
- `notificationId`: number - 通知ID（路徑參數）

**驗證規則**:
- 必須為正整數
- 範圍：1 到 2^63-1 (int64 範圍)

### NotificationHistoryResponse
API 成功回應的資料模型。

**屬性**:
- `success`: boolean - 固定為 true
- `data`: NotificationHistory - 通知歷程資料
- `timestamp`: string (ISO datetime) - 回應時間戳
- `requestId`: string - 請求追蹤ID，格式：`req-history-{timestamp}-{random}`

### ApiErrorResponse
API 錯誤回應的資料模型。

**屬性**:
- `success`: boolean - 固定為 false
- `error`: ErrorDetail - 錯誤詳細資訊
- `timestamp`: string (ISO datetime) - 錯誤發生時間戳
- `requestId`: string - 請求追蹤ID，格式：`req-error-{timestamp}-{random}`

### ErrorDetail
錯誤詳細資訊。

**屬性**:
- `code`: string - 錯誤代碼
- `message`: string - 用戶友善的錯誤訊息
- `details`: any (optional) - 額外的錯誤詳細資訊

**錯誤代碼定義**:
- `VALIDATION_ERROR` - 參數驗證失敗 (400)
- `UNAUTHORIZED` - 認證失敗 (401)
- `NOTIFICATION_NOT_FOUND` - 通知不存在 (404)
- `EXTERNAL_API_ERROR` - 外部API調用失敗 (500)
- `TIMEOUT_ERROR` - 請求超時 (500)
- `INTERNAL_SERVER_ERROR` - 內部系統錯誤 (500)

## External Integration Models

### WhaleApiRequest
呼叫 Whale API 的請求模型。

**屬性**:
- `notificationId`: number - 通知ID
- `timeout`: number - 請求超時設定（毫秒）

### WhaleApiResponse
Whale API 的原始回應模型。

**屬性**:
- 對應 NotificationHistory 的所有欄位
- 需要進行資料轉換以符合內部模型格式

## Data Flow

```
1. API Request (notificationId)
   → 驗證參數格式
2. Authentication Check (ny-operator header)
   → 驗證認證資訊
3. Whale API Call (notificationId)
   → 呼叫外部服務
4. Data Transformation (WhaleApiResponse → NotificationHistory)
   → 轉換資料格式
5. Response Generation (NotificationHistoryResponse)
   → 產生統一回應格式
```

## Error Handling Strategy

**External API Errors (500)**:
- Whale API 不可用
- Whale API 回應超時
- Whale API 回傳非 2xx 狀態碼

**Business Logic Errors (404)**:
- 通知ID不存在
- Whale API 回傳空資料

**Validation Errors (400)**:
- notificationId 格式無效
- notificationId 超出範圍

**Authentication Errors (401)**:
- ny-operator header 缺失
- ny-operator header 無效

## Performance Considerations

**Response Time Target**: < 5 seconds
**Concurrency**: No specific limits (infrastructure-dependent)
**Caching**: Not implemented (immediate external API calls)
**Retry Logic**: Not implemented (fail-fast approach)