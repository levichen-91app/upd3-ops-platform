# Notification Status Proxy API - 錯誤處理策略

## 1. 統一回應格式設計

### 成功回應格式

```typescript
interface ApiResponse<T> {
  success: true;
  data: T;
  timestamp: string; // ISO 8601 格式
  requestId: string; // 格式：req-{api}-{timestamp}
}
```

### 錯誤回應格式

```typescript
interface ApiErrorResponse {
  success: false;
  error: {
    code: string; // 標準化錯誤代碼
    message: string; // 用戶友好的錯誤訊息
    details?: any; // 詳細錯誤資訊 (可選)
  };
  timestamp: string; // 錯誤發生時間
  requestId: string; // 請求追蹤ID
}
```

## 2. 標準化錯誤代碼定義

### 2.1 客戶端錯誤 (4xx)

| 錯誤代碼                 | HTTP狀態 | 說明                 | 處理建議                   |
| ------------------------ | -------- | -------------------- | -------------------------- |
| `VALIDATION_ERROR`       | 400      | 輸入參數驗證失敗     | 檢查請求參數格式和範圍     |
| `DEVICE_NOT_FOUND`       | 404      | 找不到符合的裝置資料 | 確認shopId和phone是否正確  |
| `NOTIFICATION_NOT_FOUND` | 404      | 找不到指定的通知     | 確認notificationId是否存在 |
| `DATE_OUT_OF_RANGE`      | 400      | 查詢日期超過允許範圍 | 調整查詢日期至180天內      |

### 2.2 外部服務錯誤 (5xx)

| 錯誤代碼                | HTTP狀態 | 說明            | 處理建議                   |
| ----------------------- | -------- | --------------- | -------------------------- |
| `EXTERNAL_API_ERROR`    | 500      | 外部API調用失敗 | 檢查外部服務狀態，稍後重試 |
| `TIMEOUT_ERROR`         | 500      | 請求處理超時    | 稍後重試，考慮增加timeout  |
| `RATE_LIMIT_ERROR`      | 500      | 請求頻率限制    | 等待指定時間後重試         |
| `INTERNAL_SERVER_ERROR` | 500      | 內部服務錯誤    | 聯絡系統管理員             |

## 3. 詳細錯誤情境處理

### 3.1 參數驗證錯誤

```typescript
// 單一欄位錯誤
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "輸入參數驗證失敗",
    "details": "shopId must be greater than 0"
  },
  "timestamp": "2024-01-15T10:35:00Z",
  "requestId": "req-devices-123456"
}

// 多欄位錯誤
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "輸入參數驗證失敗",
    "details": [
      {
        "field": "shopId",
        "message": "must be greater than 0",
        "value": -1
      },
      {
        "field": "phone",
        "message": "must be a valid phone number",
        "value": "invalid_phone"
      }
    ]
  },
  "timestamp": "2024-01-15T10:35:00Z",
  "requestId": "req-devices-123456"
}
```

### 3.2 外部API錯誤

```typescript
// Marketing Cloud API 錯誤
{
  "success": false,
  "error": {
    "code": "EXTERNAL_API_ERROR",
    "message": "Marketing Cloud 服務暫時無法使用",
    "details": {
      "service": "Marketing Cloud Device API",
      "endpoint": "/v1/shops/12345/phones/0912345678/devices",
      "statusCode": 500,
      "originalError": "Internal Server Error",
      "retryable": true,
      "retryAfter": 60
    }
  },
  "timestamp": "2024-01-15T10:35:00Z",
  "requestId": "req-devices-123456"
}

// Whale API 錯誤
{
  "success": false,
  "error": {
    "code": "EXTERNAL_API_ERROR",
    "message": "Whale API 服務異常",
    "details": {
      "service": "Whale Notification API",
      "endpoint": "/api/v1/notifications/12345",
      "statusCode": 404,
      "originalError": "NOT_FOUND",
      "retryable": false
    }
  },
  "timestamp": "2024-01-15T10:35:00Z",
  "requestId": "req-history-123457"
}

// NC Detail API 錯誤
{
  "success": false,
  "error": {
    "code": "EXTERNAL_API_ERROR",
    "message": "NC Detail 服務回應異常",
    "details": {
      "service": "NC Detail API",
      "endpoint": "/api/v1/notifications/detail/12345/a4070188-050d-47f7-ab24-2523145408cf",
      "statusCode": 400,
      "originalError": "NCId Should be Guid",
      "retryable": false
    }
  },
  "timestamp": "2024-01-15T10:35:00Z",
  "requestId": "req-detail-123458"
}

// NS Report API 錯誤
{
  "success": false,
  "error": {
    "code": "EXTERNAL_API_ERROR",
    "message": "NS Report 服務無法產生報告",
    "details": {
      "service": "NS Report API",
      "endpoint": "/v3/GetNotificationStatusReport",
      "statusCode": 400,
      "originalError": "輸入參數錯誤",
      "retryable": false
    }
  },
  "timestamp": "2024-01-15T10:35:00Z",
  "requestId": "req-report-123459"
}
```

### 3.3 超時錯誤

```typescript
{
  "success": false,
  "error": {
    "code": "TIMEOUT_ERROR",
    "message": "請求處理超時",
    "details": {
      "service": "Whale Notification API",
      "endpoint": "/api/v1/notifications/12345",
      "timeoutMs": 10000,
      "actualTimeMs": 10001,
      "retryable": true,
      "retryAfter": 30
    }
  },
  "timestamp": "2024-01-15T10:35:00Z",
  "requestId": "req-history-123457"
}
```

### 3.4 頻率限制錯誤

```typescript
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_ERROR",
    "message": "請求頻率超過限制",
    "details": {
      "service": "Marketing Cloud Device API",
      "limit": 100,
      "window": "1h",
      "remaining": 0,
      "resetTime": "2024-01-15T11:35:00Z",
      "retryAfter": 60
    }
  },
  "timestamp": "2024-01-15T10:35:00Z",
  "requestId": "req-devices-123456"
}
```

### 3.5 業務邏輯錯誤

```typescript
// 日期範圍錯誤
{
  "success": false,
  "error": {
    "code": "DATE_OUT_OF_RANGE",
    "message": "查詢日期必須在180天內",
    "details": {
      "requestDate": "2023/01/15",
      "currentDate": "2024/01/15",
      "maxAllowedDate": "2023/07/15",
      "allowedDays": 180
    }
  },
  "timestamp": "2024-01-15T10:35:00Z",
  "requestId": "req-report-123459"
}

// 資料不存在但非錯誤狀況
{
  "success": true,
  "data": null,
  "timestamp": "2024-01-15T10:35:00Z",
  "requestId": "req-detail-123458"
}
```

1. **一致性**：統一的錯誤回應格式
2. **可追蹤性**：每個請求都有唯一ID
3. **可診斷性**：詳細的錯誤資訊和外部API狀態
