# Marketing Cloud Device API Integration

**版本:** 1.0
**建立日期:** 2025-09-27
**狀態:** 設計階段

## 1. 產品概述

### 1.1 目標
提供一個 RESTful API 端點，讓內部系統能夠透過商店 ID 和會員手機號碼，查詢該會員在 Marketing Cloud 系統中的所有裝置資訊，特別是推播 Token 相關資料。

### 1.2 業務價值
- 統一裝置資訊查詢入口
- 支援精準推播和裝置管理功能
- 提供完整的裝置歷史記錄

## 2. 功能需求

### 2.1 核心功能
**取得會員裝置清單**
- 輸入：商店 ID + 會員手機號碼
- 輸出：該會員的所有裝置資訊（包含推播 Token、平台資訊、時間戳記等）
- 資料來源：Marketing Cloud Device API

### 2.2 資料內容
回傳完整的裝置資訊，包含：
- 裝置唯一識別碼 (guid)
- 裝置 UDID (udid)
- 推播 Token (token)
- 商店 ID (shopId)
- 平台定義 (platformDef) - iOS/Android
- 會員 ID (memberId)
- 廣告追蹤 ID (advertiseId)
- App 版本 (appVersion)
- 建立時間 (createdDateTime)
- 更新時間 (updatedDateTime)

## 3. API 設計規格

### 3.1 端點定義
```
GET /api/v1/shops/{shopId}/members/by-phone/{phone}/devices
```

**設計考量:**
- 使用 `by-phone` 明確表達查詢方式，符合 RESTful 資源導向設計
- 預留未來擴展空間：`/members/by-id/{memberId}/devices`
- 避免 URL 路徑的識別符衝突問題

### 3.2 請求參數
**Path Parameters:**
- `shopId` (integer, required): 商店 ID
- `phone` (string, required): 會員手機號碼

**Headers:**
- `ny-operator` (string, required): 操作者識別，用於日誌記錄

### 3.3 回應格式

**成功回應 (200 OK):**
```json
{
  "success": true,
  "data": {
    "shopId": 12345,
    "phone": "0912345678",
    "devices": [
      {
        "guid": "550e8400-e29b-41d4-a716-446655440000",
        "udid": "A1B2C3D4E5F6",
        "token": "abc123def456...",
        "shopId": 12345,
        "platformDef": "iOS",
        "memberId": 67890,
        "advertiseId": "12345678-1234-5678-9012-123456789012",
        "appVersion": "1.2.3",
        "updatedDateTime": "2025-09-27T10:30:00.000Z",
        "createdDateTime": "2025-09-01T08:15:00.000Z"
      }
    ],
    "totalCount": 1
  },
  "timestamp": "2025-09-27T10:45:00.000Z",
  "requestId": "req-20250927104500-uuid"
}
```

**錯誤回應:**
- `400 Bad Request`: 輸入參數格式錯誤
- `401 Unauthorized`: 缺少或無效的 ny-operator header
- `404 Not Found`: 會員不存在或該會員無任何裝置資料
- `502 Bad Gateway`: Marketing Cloud 服務異常

## 4. 技術規格

### 4.1 架構設計
- **代理模式**: 透明代理外部 Marketing Cloud Device API
- **錯誤對應**: 直接對應外部 API 的 HTTP 狀態碼
- **資料透傳**: 回傳完整的外部 API 資料，不進行過濾
- **擴展性設計**: 使用 `by-phone` 路徑模式，預留未來 `by-id` 擴展空間

### 4.2 外部依賴
- **Marketing Cloud Device API**
  - QA 環境: `http://marketing-cloud-service.qa.91dev.tw`
  - 正式環境: `http://marketing-cloud-service-internal.91app.io`
  - 端點: `/v1/shops/{shopId}/phones/{phone}/devices`

**多環境配置:**
- Development: 使用 QA 環境
- Staging: 使用 QA 環境
- Production: 使用正式環境

### 4.3 錯誤處理策略
| 外部 API 回應 | 我們的回應 | 說明 |
|---------------|------------|------|
| 200 + Device[] | 200 + 包裝後資料 | 正常情況 |
| 404 | 404 + ApiErrorResponse | 會員不存在或無裝置資料（不區分） |
| 400 | 400 + ApiErrorResponse | 參數錯誤 |
| 5xx/網路錯誤 | 502 + ApiErrorResponse | 外部服務異常 |

**錯誤回應統一格式:**
- 所有錯誤都包裝成 ApiErrorResponse 格式
- 保持回應結構一致性，便於前端處理
- 包含 requestId 以便問題追蹤

### 4.4 日誌記錄
**記錄內容:**
- ✅ 操作者資訊 (ny-operator)
- ✅ 請求時間和回應時間
- ✅ shopId 和回應狀態
- ✅ 裝置數量 (成功時)
- ✅ 錯誤詳細資訊 (失敗時)

**隱私保護:**
- ❌ 手機號碼遮蔽處理 (如: `091****678`)
- ❌ 不記錄 Token 等敏感裝置資訊
- ❌ 不記錄完整的 UDID 或廣告 ID

## 5. 非功能需求

### 5.1 效能需求
- 回應時間: < 2 秒 (正常情況)
- 外部 API 超時設定: 10 秒

### 5.2 可用性需求
- 依賴外部 Marketing Cloud 服務的可用性
- 當外部服務異常時，回傳明確的錯誤訊息

### 5.3 安全需求
- 需要 ny-operator header 進行操作者識別
- 遵循現有的 API 安全標準

## 6. 實作考量

### 6.1 配置管理
- 使用現有的 external-apis.config.ts 架構
- 支援多環境配置 (development/staging/production)
- Marketing Cloud API 配置結構：
```typescript
marketingCloudApi: {
  development: {
    baseUrl: 'http://marketing-cloud-service.qa.91dev.tw',
    timeout: 10000,
  },
  staging: {
    baseUrl: 'http://marketing-cloud-service.qa.91dev.tw',
    timeout: 10000,
  },
  production: {
    baseUrl: 'http://marketing-cloud-service-internal.91app.io',
    timeout: 15000,
  },
  test: {
    baseUrl: 'http://marketing-cloud-service.qa.91dev.tw',
    timeout: 5000,
  },
}
```

### 6.2 測試策略
- 單元測試: Service 層邏輯
- 整合測試: 完整的 API 流程（使用 mock）
- 契約測試: 驗證 API 格式符合規格

### 6.3 監控與維護
- 使用現有的錯誤處理和日誌系統
- 監控外部 API 呼叫的成功率和回應時間

## 7. 交付內容

### 7.1 程式碼
- Controller: `api/modules/marketing-cloud/marketing-cloud.controller.ts`
- Service: `api/modules/marketing-cloud/marketing-cloud.service.ts`
- DTO: `api/modules/marketing-cloud/dto/`
- Module: `api/modules/marketing-cloud/marketing-cloud.module.ts`

### 7.2 未來擴展考量
當需要支援 Member ID 查詢時，可以無縫新增：
```
GET /api/v1/shops/{shopId}/members/by-id/{memberId}/devices
```
- 使用相同的 Service 和 DTO 結構
- 僅需新增 Controller 方法和路由

### 7.3 配置
- 更新 `external-apis.config.ts` 加入 Marketing Cloud API 配置
- 環境變數範例更新：
```bash
# Marketing Cloud API Configuration
MARKETING_CLOUD_API_URL_OVERRIDE=  # Optional override
MARKETING_CLOUD_API_TIMEOUT=10000
```

### 7.4 測試
- 完整的測試套件（單元測試 + 整合測試）
- API 文件測試

### 7.5 文件
- OpenAPI/Swagger 規格
- API 使用範例

## 8. 時程規劃

### Phase 1: 基礎實作 (1-2 天)
- [ ] 建立基本的 Controller 和 Service
- [ ] 實作外部 API 呼叫邏輯
- [ ] 基本錯誤處理

### Phase 2: 完善功能 (1 天)
- [ ] 完整的錯誤處理和日誌
- [ ] DTO 驗證和資料轉換
- [ ] Swagger 文件

### Phase 3: 測試與優化 (1 天)
- [ ] 完整測試套件
- [ ] 效能測試和優化
- [ ] 文件完善

## 9. 風險評估

### 9.1 技術風險
- **外部 API 變更**: 中等風險，需要版本管理和監控
- **外部服務穩定性**: 中等風險，需要適當的超時和重試機制

### 9.2 業務風險
- **資料準確性**: 依賴外部系統的資料品質
- **回應時間**: 受外部 API 效能影響

### 9.3 風險緩解
- 實作適當的錯誤處理和使用者回饋
- 監控外部 API 的健康狀況
- 準備 fallback 機制（如有需要）

---

**核准簽名:**
- 產品負責人: ____________
- 技術負責人: ____________
- 日期: ____________