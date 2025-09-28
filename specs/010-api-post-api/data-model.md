# Data Model: 通知狀態報告查詢 API

**Feature**: POST /api/v1/notification-status/reports
**Date**: 2025-09-28
**Status**: Complete

## Entity Definitions

### StatusReportRequest
**Purpose**: 請求通知狀態報告的輸入參數

**Fields**:
- `nsId`: string (UUID format, required)
  - **Description**: Notification Service ID，唯一識別通知
  - **Validation**: UUID v4 格式驗證
  - **Example**: "d68e720f-62ed-4955-802b-8e3f04c56a19"

- `notificationDate`: string (required)
  - **Description**: 通知日期，用於定位報告檔案
  - **Format**: YYYY/MM/DD
  - **Validation**: 正則表達式 `^\\d{4}/\\d{2}/\\d{2}$`
  - **Example**: "2024/01/15"

- `notificationType`: enum (required)
  - **Description**: 通知類型，決定報告檔案格式
  - **Allowed Values**: ['sms', 'push', 'line', 'email']
  - **Example**: "push"

**Business Rules**:
- 所有欄位皆為必填
- nsId 必須為有效的 UUID 格式
- notificationDate 不驗證日期範圍（根據 clarification 結果）
- notificationType 必須在支援清單內

### StatusReportData
**Purpose**: 成功取得報告後的回應資料

**Fields**:
- `downloadUrl`: string (required)
  - **Description**: S3 presigned URL，用於下載 TSV 報告檔
  - **Format**: 完整的 HTTP(S) URL
  - **Example**: "https://s3.amazonaws.com/bucket/reports/report-123.tsv?signature=..."

- `expiredTime`: number (required)
  - **Description**: presigned URL 的有效秒數
  - **Unit**: 秒 (seconds)
  - **Typical Value**: 3600 (1 小時)
  - **Example**: 3600

**Business Rules**:
- downloadUrl 由外部 NS Report API 提供，本系統不驗證 URL 有效性
- expiredTime 表示從回應時間起的有效期限
- 檔案格式固定為 TSV (Tab-Separated Values)

### ApiResponse<T>
**Purpose**: 統一的 API 回應格式包裝

**Fields**:
- `success`: boolean (required)
  - **Description**: 操作是否成功
  - **Value**: 固定為 true（成功回應時）

- `data`: T (required)
  - **Description**: 實際回應資料
  - **Type**: 泛型，依不同 API 而異
  - **For this endpoint**: StatusReportData

- `timestamp`: string (required)
  - **Description**: 回應產生時間戳
  - **Format**: ISO 8601 format
  - **Example**: "2024-01-15T10:35:00Z"

- `requestId`: string (required)
  - **Description**: 請求追蹤 ID
  - **Format**: "req-reports-{timestamp}-{randomId}"
  - **Example**: "req-reports-123456789-abc123"

### ApiErrorResponse
**Purpose**: 錯誤情況的統一回應格式

**Fields**:
- `success`: boolean (required)
  - **Description**: 操作狀態
  - **Value**: 固定為 false（錯誤回應時）

- `error`: object (required)
  - **Fields**:
    - `code`: string (required) - 錯誤代碼
    - `message`: string (required) - 使用者友好的錯誤訊息
    - `details`: any (optional) - 詳細錯誤資訊

- `timestamp`: string (required)
  - **Description**: 錯誤發生時間戳
  - **Format**: ISO 8601 format

- `requestId`: string (required)
  - **Description**: 請求追蹤 ID

## Entity Relationships

```
StatusReportRequest ──→ [API Processing] ──→ StatusReportData
                    │
                    └──→ [Error Handling] ──→ ApiErrorResponse
```

**Flow Description**:
1. `StatusReportRequest` 包含使用者輸入的查詢參數
2. 系統驗證請求格式，若失敗產生 `ApiErrorResponse` (400)
3. 系統調用外部 NS Report API，若失敗產生 `ApiErrorResponse` (500)
4. 外部 API 成功回應時，包裝為 `ApiResponse<StatusReportData>` (200)

## Data Validation Rules

### Input Validation (Request DTO)
```typescript
class StatusReportRequestDto {
  @IsUUID(4)
  @ApiProperty({
    example: 'd68e720f-62ed-4955-802b-8e3f04c56a19',
    description: 'Notification Service ID (UUID格式)'
  })
  nsId: string;

  @Matches(/^\d{4}\/\d{2}\/\d{2}$/)
  @ApiProperty({
    example: '2024/01/15',
    description: '通知日期 (YYYY/MM/DD格式)'
  })
  notificationDate: string;

  @IsIn(['sms', 'push', 'line', 'email'])
  @ApiProperty({
    enum: ['sms', 'push', 'line', 'email'],
    description: '通知類型'
  })
  notificationType: NotificationType;
}
```

### Output Validation (Response DTO)
```typescript
class StatusReportDataDto {
  @IsUrl()
  @ApiProperty({
    example: 'https://s3.amazonaws.com/bucket/reports/report-123.tsv?signature=...',
    description: 'TSV 報告檔下載連結'
  })
  downloadUrl: string;

  @IsNumber()
  @Min(1)
  @ApiProperty({
    example: 3600,
    description: 'presigned URL 有效秒數'
  })
  expiredTime: number;
}
```

## State Transitions

**Request Lifecycle**:
1. **Submitted**: 請求送達系統
2. **Validating**: 參數格式驗證中
3. **Authenticated**: ny-operator header 驗證通過
4. **Processing**: 調用外部 NS Report API
5. **Completed**: 回傳 presigned URL
6. **Failed**: 驗證失敗或外部 API 錯誤

**Error States**:
- **ValidationError**: 參數格式不正確 → 400 Bad Request
- **AuthenticationError**: ny-operator header 無效 → 401 Unauthorized
- **ExternalApiError**: NS Report API 調用失敗 → 500 Internal Server Error

## Storage Requirements

**No Persistent Storage**: 此 API 為純代理服務，不涉及資料持久化
- 請求參數不儲存
- 回應資料不快取
- presigned URL 不記錄
- 無需資料庫 schema

**Temporary Data**: 僅在記憶體中保存請求處理期間的暫時資料
- Request ID 追蹤資訊
- 外部 API 調用結果
- 錯誤上下文資訊

## Integration Schema

### External NS Report API Contract
```json
// Request to /v3/GetNotificationStatusReport
{
  "nsId": "d68e720f-62ed-4955-802b-8e3f04c56a19",
  "notificationDate": "2024/01/15",
  "notificationType": "push"
}

// Response from NS Report API
{
  "downloadUrl": "https://s3.amazonaws.com/bucket/reports/report-123.tsv?signature=...",
  "expiredTime": 3600
}
```

**Error Response from External API**:
- 4xx: 客戶端錯誤 (參數格式、權限問題)
- 5xx: 服務器錯誤 (服務不可用、逾時)
- Connection errors: 網路連線問題

## Conclusion

資料模型設計完全基於功能需求，符合 NestJS DTO 模式和 OpenAPI 規範。所有實體都有明確的驗證規則和業務語意，支援 TDD 開發流程。