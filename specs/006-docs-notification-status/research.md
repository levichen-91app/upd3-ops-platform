# Research: 通知詳細資訊查詢 API

## 技術決策與研究結果

### 1. 外部API整合模式
**決策**: 採用憲章的依賴抽象化模式
**理由**:
- 符合憲章「依賴抽象，而非實作」原則
- 提供可測試性，能輕易用Mock取代依賴
- 支援未來供應商更換的可替換性

**實作方式**:
- 定義 `INcDetailService` 介面
- 建立 `NC_DETAIL_SERVICE_TOKEN` 注入令牌
- 實作具體的 `ExternalNcDetailService`
- 在Module中註冊Provider

**替代方案考量**: 直接呼叫外部API - 被拒絕，因違反憲章抽象化原則

### 2. 參數驗證策略
**決策**: 使用 class-validator 和 DTO模式
**理由**:
- 符合憲章要求的DTO驗證規範
- 與NestJS框架整合良好
- 支援Swagger文檔自動生成

**驗證規則**:
- shopId: 正整數，最小值1
- ncId: UUID格式驗證
- ny-operator header: 必填字串

### 3. 錯誤處理機制
**決策**: 統一錯誤回應格式 + Exception Filters
**理由**:
- 符合憲章統一回應格式要求
- 提供一致的錯誤追蹤能力
- 支援外部API錯誤的詳細診斷

**錯誤類型**:
- ValidationException (400): 參數驗證失敗
- ExternalApiException (500): 外部API調用異常
- TimeoutException (500): 外部API超時
- DataFormatException (500): 外部API資料格式異常

### 4. 日誌記錄策略
**決策**: 使用NestJS內建Logger + 結構化日誌
**理由**:
- 與NestJS框架原生整合
- 支援不同日誌等級
- 便於ELK Stack整合

**記錄內容**:
- 請求追蹤ID (requestId)
- 操作者資訊 (ny-operator)
- 請求參數 (shopId, ncId)
- 外部API調用狀態
- 回應時間和狀態碼

### 5. HTTP Client配置
**決策**: 使用 @nestjs/axios + 自訂攔截器
**理由**:
- NestJS官方推薦的HTTP客戶端
- 支援攔截器進行統一錯誤處理
- 內建超時和重試機制

**配置策略**:
- 10秒超時設定
- 3次重試機制
- 指數退避策略
- 請求/回應日誌攔截器

### 6. 模組架構設計
**決策**: 建立獨立的notification-status模組
**理由**:
- 符合憲章高內聚、低耦合原則
- 便於未來功能擴展
- 清晰的職責分離

**模組結構**:
```
api/src/modules/notification-status/
├── dto/
│   ├── notification-detail-query.dto.ts
│   └── notification-detail-response.dto.ts
├── interfaces/
│   └── nc-detail.interface.ts
├── services/
│   ├── notification-status.service.ts
│   └── external-nc-detail.service.ts
├── notification-status.controller.ts
└── notification-status.module.ts
```

## 技術風險評估

### 高風險
- **外部API可用性**: NC Detail API服務中斷會影響功能
  - 緩解策略: 完善的錯誤處理和日誌記錄

### 中風險
- **資料格式變更**: 外部API回應格式改變
  - 緩解策略: 嚴格的介面定義和版本控制

### 低風險
- **效能問題**: 10秒超時可能過長
  - 緩解策略: 監控實際回應時間，必要時調整

## 遵循憲章檢查清單

✅ 所有對外部依賴的存取透過抽象介面進行
✅ 業務邏輯層不直接依賴具體實作Class
✅ 規劃完整的單元測試覆蓋
✅ 採用TDD開發流程
✅ 使用registerAs強型別配置注入
✅ 符合RESTful API設計標準
✅ 包含Swagger文檔規劃