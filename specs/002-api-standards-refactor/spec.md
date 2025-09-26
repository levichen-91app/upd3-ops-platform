# API 標準化重構需求文件

**規格 ID**: 002-api-standards-refactor
**建立日期**: 2025-09-26
**狀態**: Draft
**優先級**: High

## 概述

目前的 Proxy API 實作與專案 Constitution 中定義的企業級 API 設計標準存在顯著落差。本需求文件旨在將現有 API 重構以完全符合 Constitution 標準，確保 API 設計的一致性、可維護性和企業級品質。

## 問題陳述

經過詳細分析，現有 Proxy API 與 Constitution 標準存在以下主要落差：

1. **URL 設計不符合 RESTful 原則**
2. **回應格式未統一標準化**
3. **HTTP 狀態碼使用不當**
4. **錯誤處理格式不一致**
5. **無 API 版本控制策略**
6. **OpenAPI 文件不完整**
7. **缺少標準化中間件**

## 需求範圍

### 包含範圍
- ✅ 重構現有 Proxy API 以符合 Constitution 標準
- ✅ 實作統一的回應格式和錯誤處理
- ✅ 建立標準化的中間件和攔截器
- ✅ 更新所有相關測試案例
- ✅ 完善 OpenAPI/Swagger 文件

### 排除範圍
- ❌ 不改變核心業務邏輯
- ❌ 不修改外部 Whale API 介面
- ❌ 不影響現有資料庫結構

## 功能需求

### 1. URL 設計標準化 🔥

**當前狀態**:
```
POST /proxy/whale/update-supplier-id
```

**目標狀態** (採用方案 B):
```
PATCH /api/v1/shops/{shopId}/suppliers
```

**需求詳細**:
- 加入 `/api/v1` 版本前綴
- 移除 URL 中的動詞，改為資源導向設計
- 使用 `PATCH` 表示部分更新（更換供應商）
- shopId 從 URL 路徑取得，作為業務上下文
- market, oldSupplierId, newSupplierId 從 request body 取得

**Request 格式**:
```http
PATCH /api/v1/shops/12345/suppliers
Content-Type: application/json
ny-operator: Amy Wang

{
  "market": "TW",
  "oldSupplierId": 100,
  "newSupplierId": 200
}
```

### 2. 統一回應格式 🔥

**當前格式**:
```typescript
// 成功
{ success: true, data: {...} }
// 錯誤
{ error: "error message" }
```

**目標格式**:
```typescript
// 成功回應
interface ApiResponse<T> {
  success: true;
  data: T;
  timestamp: string;
  requestId: string;
}

// 錯誤回應
interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
  requestId: string;
}
```

### 3. HTTP 狀態碼修正 🔥

**需求**:
- POST 建立資源：`201 Created`
- PUT 完整更新：`200 OK`
- PATCH 部分更新：`200 OK`
- 驗證錯誤：`400 Bad Request`
- 授權錯誤：`401 Unauthorized`
- 上游服務錯誤：`502 Bad Gateway`

### 4. 標準化錯誤處理 🔥

**需求**:
- 實作統一的錯誤代碼系統
- 使用結構化錯誤回應格式
- 支援多語言錯誤訊息
- 包含詳細的錯誤上下文

**錯誤代碼分類**:
```typescript
enum ApiErrorCode {
  // 驗證錯誤 (1000-1999)
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',

  // 業務邏輯錯誤 (4000-4999)
  BUSINESS_RULE_VIOLATION = 'BUSINESS_RULE_VIOLATION',
  SUPPLIER_IDS_IDENTICAL = 'SUPPLIER_IDS_IDENTICAL',

  // 系統錯誤 (5000-5999)
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  WHALE_API_UNAVAILABLE = 'WHALE_API_UNAVAILABLE',
}
```

### 5. API 版本控制 ⚠️

**需求**:
- 所有 API 端點加入 `/api/v1` 前綴
- 建立版本控制策略文件
- 支援版本升級和向後相容

### 6. 統一中間件和攔截器 ⚠️

**需求**:
- Request ID 生成和追蹤
- 標準化日誌格式
- 回應格式統一攔截器
- 錯誤處理全域過濾器

**Request ID 格式標準** (已澄清):
- 格式: `req-{timestamp}-{randomString}`
- 範例: `req-20250926143052-a8b2c4d6e`
- 實作: 使用 uuid v4 或 nanoid 生成隨機字串部分

**標準化日誌格式** (已澄清):
```json
{
  "timestamp": "2025-09-26T14:30:52.123Z",
  "level": "info",
  "requestId": "req-20250926143052-a8b2c4d6e",
  "method": "PATCH",
  "url": "/api/v1/shops/12345/suppliers",
  "statusCode": 200,
  "responseTime": 145,
  "userAgent": "Mozilla/5.0...",
  "ip": "192.168.1.100",
  "message": "Request processed successfully"
}
```

### 7. OpenAPI 文件完善 📝

**需求**:
- 更新所有 DTO 以符合新格式
- 完整的錯誤場景文件
- 標準化的 API 註解
- 自動生成的 API 文件

## 非功能需求

### 效能需求
- API 回應時間不得超過目前基準的 10%
- 所有測試必須在 2 秒內完成

### 相容性需求
- 在過渡期間維持向後相容
- 提供廢棄通知機制

### 測試需求
- 測試覆蓋率維持 ≥ 80%
- 所有現有測試必須通過
- 新增標準化回應格式的測試案例

## 驗收標準

### 必須滿足條件 (Must Have)
- [ ] 所有 API 端點遵循 `/api/v1` 版本控制
- [ ] 統一回應格式包含 `timestamp` 和 `requestId`
- [ ] 錯誤回應格式標準化且包含錯誤代碼
- [ ] HTTP 狀態碼使用正確
- [ ] 所有測試通過且覆蓋率 ≥ 80%
- [ ] OpenAPI 文件完整更新

### 應該滿足條件 (Should Have)
- [ ] 建立 API 版本控制機制
- [ ] 統一日誌格式
- [ ] 完善中間件和攔截器

### 可以滿足條件 (Could Have)
- [ ] 多語言錯誤訊息支援
- [ ] API 使用統計和監控
- [ ] 自動化 API 文件生成

## 實施計劃

### 第一階段：核心標準化 (優先級: 🔥)
1. 建立統一回應格式的基礎類別和介面
2. 重構現有 Controller 以使用新的 URL 設計
3. 更新錯誤處理機制
4. 修正 HTTP 狀態碼

### 第二階段：中間件和版本控制 (優先級: ⚠️)
1. 實作統一的攔截器和中間件
2. 建立 API 版本控制機制
3. 完善日誌和追蹤機制

### 第三階段：文件和監控 (優先級: 📝)
1. 更新 OpenAPI 文件
2. 加入 API 監控和統計
3. 完善測試覆蓋率

### 測試策略 (已澄清)

**測試分類標準**:
- **單元測試 (Unit Tests)**: 測試單一 Service、Pipe 或 Class 的內部邏輯，依賴項全部被模擬
- **整合測試 (Integration Tests)**: 測試從 Controller 到資料庫的完整模組流程，只模擬外部 API
- **端到端測試 (E2E Tests)**: 模擬真實使用者對運行應用程式發起 HTTP 請求，驗證完整流程
- **效能測試 (Performance Tests)**: 測試 API 回應時間和併發處理能力

**測試執行要求**:
- 每個階段完成後必須通過所有現有測試
- 新增功能必須有對應的測試案例
- 進行回歸測試確保無破壞性變更
- 測試覆蓋率維持 ≥ 80%

## 風險評估

### 高風險 (已調整)
- **測試覆蓋**: 大範圍重構可能影響測試穩定性

### 中風險
- **開發時間**: 重構工作量較大
- **學習曲線**: 團隊需要適應新的 API 設計模式

### 緩解策略 (已簡化)
- 分階段實施，每階段驗證功能正確性
- 充分的測試和監控
- 由於系統尚未上線，無需考慮向後相容性問題

## 成功指標

### 技術指標 (已調整)
- 100% 的 API 端點符合 Constitution 標準
- 測試覆蓋率 ≥ 80%
- 由於是內部系統且尚未上線，暫不設定效能指標
- 確保所有現有測試通過

### 業務指標
- 開發團隊對 API 標準滿意度提升
- API 文件完整度和可用性提升
- 未來新 API 開發效率提升

## 相依性和假設

### 相依性
- 現有的 Constitution 標準文件
- NestJS 框架的功能和限制
- Whale API 的穩定性

### 假設
- Constitution 標準已經過充分驗證
- 開發團隊對新標準有足夠理解
- 外部相依服務 (Whale API) 保持穩定

---

**審核**: 待審核
**核准**: 待核准
**開發負責人**: 待指派
**預估工時**: 5-8 工作天