# Research Findings: Marketing Cloud 裝置 API 整合

## 技術決策摘要

### HTTP Client 選擇
**Decision**: 使用 @nestjs/axios (基於 Axios)
**Rationale**:
- NestJS 官方推薦的 HTTP 客戶端
- 提供 RxJS Observable 支援，與 NestJS 生態整合良好
- 支援完整的超時、重試、錯誤處理機制
- 已在專案中使用 (參考 suppliers.service.ts)

**Alternatives considered**: node-fetch, got
- node-fetch: 過於底層，需要額外包裝
- got: 功能強大但增加學習成本，與 NestJS 整合度較低

### 外部 API 配置管理
**Decision**: 擴展現有的 external-apis.config.ts，新增 Marketing Cloud API 配置
**Rationale**:
- 符合專案既有的配置管理模式
- 支援多環境配置 (development/staging/production)
- 使用 registerAs 模式提供強型別支援
- 環境變數覆蓋機制已建立

**Alternatives considered**: 獨立配置檔案
- 獨立檔案: 會破壞統一配置管理原則

### 錯誤處理策略
**Decision**: 直接對應外部 API HTTP 狀態碼，包裝為 ApiErrorResponse 格式
**Rationale**:
- 透明代理原則，保持原始錯誤語意
- 符合專案統一錯誤回應格式標準
- 簡化錯誤處理邏輯，降低維護複雜度

**Alternatives considered**: 自定義錯誤碼轉換
- 轉換邏輯: 增加複雜度，可能遺失原始錯誤資訊

### 日誌隱私保護實作
**Decision**: 使用字串遮蔽函數處理敏感資訊
**Rationale**:
- 符合 FR-010 隱私保護需求
- 手機號碼遮蔽為 `091****678` 格式
- Token 和 UDID 完全不記錄
- 可在現有日誌架構中實作

**Alternatives considered**: 完全不記錄相關欄位
- 不記錄: 會影響問題追蹤和除錯能力

## 測試策略詳細分析

### 單元測試目標與脈絡
**目標**: 驗證 MarketingCloudService 的核心業務邏輯
**測試脈絡**:
- 隔離外部依賴 (HttpService mock)
- 測試錯誤轉換邏輯正確性
- 驗證日誌遮蔽功能運作
- 確保配置注入機制正常

**關鍵測試案例**:
1. 成功回應資料轉換
2. 各種 HTTP 錯誤狀態碼對應
3. 網路超時處理
4. 日誌隱私遮蔽邏輯
5. 配置參數使用正確性

### 整合測試目標與脈絡
**目標**: 驗證 Controller 到 Service 的完整流程
**測試脈絡**:
- 使用 TestingModule 設置完整模組
- Mock 外部 HTTP 呼叫
- 測試完整請求-回應週期
- 驗證 DTO 驗證機制

**關鍵測試案例**:
1. 完整 API 端點功能測試
2. 請求參數驗證
3. Header 驗證 (ny-operator)
4. 回應格式標準化
5. 錯誤處理端到端流程

### E2E 測試目標與脈絡
**目標**: 模擬真實使用場景的完整系統測試
**測試脈絡**:
- 啟動完整應用程式
- 使用真實的 HTTP 請求
- Mock 外部 Marketing Cloud API
- 測試完整的用戶使用流程

**關鍵測試案例**:
1. 真實 HTTP 請求測試
2. Swagger 文件一致性驗證
3. 多種錯誤情境端到端測試
4. 效能和超時測試
5. 併發請求處理測試

## API 設計模式分析

### RESTful URL 設計
**Decision**: GET /api/v1/shops/{shopId}/members/by-phone/{phone}/devices
**Rationale**:
- 遵循資源導向設計原則
- 清楚表達查詢方式 (by-phone)
- 預留未來擴展空間 (by-id)
- 避免路徑參數衝突

### 回應格式標準化
**Decision**: 使用專案既有的 ApiResponse<T> 和 ApiErrorResponse 格式
**Rationale**:
- 保持 API 回應一致性
- 包含 timestamp 和 requestId 用於追蹤
- 符合專案 API 設計規範

## 外部依賴整合模式

### Marketing Cloud API 整合
**Decision**: 透明代理模式，不快取、不轉換資料
**Rationale**:
- 符合 FR-005 透明代理需求
- 降低系統複雜度
- 保持資料即時性
- 避免快取一致性問題

### 超時和重試機制
**Decision**: 5 秒超時，不實作重試機制
**Rationale**:
- 符合澄清需求 (5 seconds timeout)
- 透明代理原則，不改變外部 API 行為
- 避免過度複雜化

## 模組架構設計

### NestJS 模組結構
```
api/modules/marketing-cloud/
├── marketing-cloud.controller.ts
├── marketing-cloud.service.ts
├── marketing-cloud.module.ts
├── dto/
│   ├── get-member-devices-query.dto.ts
│   └── member-devices-response.dto.ts
└── entities/
    └── device.entity.ts
```

**Rationale**: 遵循 NestJS 模組化最佳實踐，職責分離清楚