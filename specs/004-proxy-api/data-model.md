# Data Model: Proxy API 標準化重構

**Feature**: 004-proxy-api
**Date**: 2025-09-26

## Entity Overview

此重構主要涉及 API 介面層的標準化，核心實體為請求、回應和錯誤處理相關的資料結構。不涉及資料庫 schema 變更。

## Core Entities

### SupplierUpdateRequest
**Description**: 供應商更新請求的輸入資料
**Source**: FR-003 - 從 request body 取得的參數

**Attributes**:
- `market`: string (市場代碼, 例如 "TW", "HK")
- `oldSupplierId`: number (原供應商 ID)
- `newSupplierId`: number (新供應商 ID)

**Validation Rules**:
- `market` 必須為有效的市場代碼 (非空字串)
- `oldSupplierId` 必須為正整數
- `newSupplierId` 必須為正整數
- `oldSupplierId` 不得等於 `newSupplierId` (業務邏輯驗證)

**API Mapping**:
- URL 路徑: `shopId` 從 `/api/v1/shops/{shopId}/suppliers` 取得
- Request Body: `{ market, oldSupplierId, newSupplierId }`
- Header: `ny-operator` 操作者資訊

### ApiResponse<T>
**Description**: 統一的成功回應格式
**Source**: FR-005 - 統一回應格式需求

**Attributes**:
- `success`: boolean (固定為 true)
- `data`: T (泛型資料內容)
- `timestamp`: string (ISO 8601 格式的時間戳)
- `requestId`: string (唯一請求識別碼)

**Validation Rules**:
- `success` 必須為 true (成功回應)
- `timestamp` 必須符合 ISO 8601 格式
- `requestId` 必須符合格式 `req-{timestamp}-{uuid}`
- `data` 內容依據具體 API 而定

**Example**:
```json
{
  "success": true,
  "data": {
    "updatedCount": 5,
    "shopId": 12345,
    "market": "TW",
    "supplierId": 200
  },
  "timestamp": "2025-09-26T14:30:52.123Z",
  "requestId": "req-20250926143052-a8b2c4d6e"
}
```

### ApiErrorResponse
**Description**: 統一的錯誤回應格式
**Source**: FR-006, FR-007 - 錯誤回應格式需求

**Attributes**:
- `success`: boolean (固定為 false)
- `error`: ErrorObject (錯誤詳細資訊)
- `timestamp`: string (ISO 8601 格式的時間戳)
- `requestId`: string (唯一請求識別碼)

**Error Object Structure**:
- `code`: string (結構化錯誤代碼)
- `message`: string (英文錯誤訊息)
- `details?`: any (可選的額外錯誤詳情)

**Validation Rules**:
- `success` 必須為 false (錯誤回應)
- `error.code` 必須符合錯誤代碼分類系統
- `error.message` 必須為英文 (基於澄清記錄)
- `timestamp` 和 `requestId` 格式要求同 ApiResponse

**Example**:
```json
{
  "success": false,
  "error": {
    "code": "SUPPLIER_IDS_IDENTICAL",
    "message": "Old and new supplier IDs must be different",
    "details": {
      "oldSupplierId": 100,
      "newSupplierId": 100
    }
  },
  "timestamp": "2025-09-26T14:30:52.123Z",
  "requestId": "req-20250926143052-a8b2c4d6e"
}
```

### ErrorCode
**Description**: 結構化錯誤代碼系統
**Source**: FR-014 - 錯誤處理標準化需求

**Categories**:
- **驗證錯誤 (1000-1999)**: `VALIDATION_ERROR`, `MISSING_REQUIRED_FIELD`
- **業務邏輯錯誤 (4000-4999)**: `BUSINESS_RULE_VIOLATION`, `SUPPLIER_IDS_IDENTICAL`
- **系統錯誤 (5000-5999)**: `EXTERNAL_SERVICE_ERROR`, `WHALE_API_UNAVAILABLE`

**Validation Rules**:
- 錯誤代碼必須為預定義的列舉值
- 代碼分類必須對應正確的數字範圍
- 每個錯誤代碼有對應的標準英文訊息

### RequestContext
**Description**: 請求上下文資訊
**Source**: FR-019 - Request ID 生成和追蹤

**Attributes**:
- `requestId`: string (格式: `req-{timestamp}-{uuid}`)
- `timestamp`: Date (請求時間)
- `method`: string (HTTP 方法, 例如 "PATCH")
- `url`: string (請求 URL)
- `shopId`: number (從路徑參數解析)
- `operator`: string (從 ny-operator header 取得)
- `userAgent?`: string (可選的用戶代理資訊)
- `ip?`: string (可選的 IP 地址)

**Validation Rules**:
- `requestId` 格式必須符合 UUID + timestamp 組合
- `method` 必須為有效的 HTTP 方法
- `shopId` 必須為正整數
- `operator` 不可為空

### LogEntry
**Description**: 標準化日誌記錄格式
**Source**: FR-020 - 標準化日誌格式

**Attributes**:
- `timestamp`: string (ISO 8601 格式)
- `level`: string (日誌等級: "info", "warn", "error")
- `requestId`: string (關聯的請求 ID)
- `method`: string (HTTP 方法)
- `url`: string (請求 URL)
- `statusCode`: number (回應狀態碼)
- `responseTime`: number (回應時間，毫秒)
- `userAgent?`: string (可選)
- `ip?`: string (可選)
- `message`: string (日誌訊息)

**Validation Rules**:
- 所有必填欄位不可為空
- `statusCode` 必須為有效的 HTTP 狀態碼
- `responseTime` 必須為非負數
- `level` 必須為有效的日誌等級

## Entity Relationships

```
RequestContext (1) ──── LogEntry (1)
     │
     └──── ApiResponse<T> (1) ──── SupplierUpdateRequest (1)
     │
     └──── ApiErrorResponse (1) ──── ErrorCode (1)
```

## State Transitions

### Request Processing Flow
```
Incoming Request → RequestContext Created
     │
     ├── Validation Success → SupplierUpdateRequest → ApiResponse<T>
     │
     └── Validation Failure → ErrorCode → ApiErrorResponse
     │
     └── LogEntry Created (for all cases)
```

### Error Handling Flow
```
Exception Thrown → ErrorCode Classification → ApiErrorResponse Generation → LogEntry
```

## Data Validation Summary

**Input Validation**:
- 使用 class-validator 裝飾器驗證所有 DTO
- 路徑參數 (shopId) 型別驗證
- Header 參數 (ny-operator) 存在性驗證
- 業務邏輯驗證 (相同供應商 ID 檢查)

**Output Validation**:
- 統一回應格式強制執行
- 錯誤代碼分類正確性檢查
- 時間戳格式一致性保證
- Request ID 唯一性確保

**Business Rules**:
- 供應商 ID 不得相同
- 市場代碼必須有效
- 操作者資訊必須提供
- 與 Whale API 的整合邏輯不變

## Implementation Notes

**TypeScript 介面定義**:
- 所有實體使用 TypeScript 介面定義
- 啟用 strict mode 確保型別安全
- 使用泛型 `ApiResponse<T>` 支援不同資料類型

**NestJS 整合**:
- DTO 類別使用 class-validator 和 class-transformer
- @ApiProperty 裝飾器提供 Swagger 文檔
- 攔截器和過濾器處理統一格式

**效能考量**:
- Request ID 生成使用快取策略
- 日誌記錄異步處理
- 錯誤處理避免深層 stack trace

此資料模型設計專注於 API 介面層的標準化，不影響現有的資料庫 schema 和核心業務邏輯，符合重構的範圍限制。