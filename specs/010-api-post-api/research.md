# Research: 通知狀態報告查詢 API

**Feature**: POST /api/v1/notification-status/reports
**Date**: 2025-09-28
**Status**: Complete

## Technical Decisions

### NestJS 依賴抽象化模式

**Decision**: 使用介面抽象 (INSReportService) 封裝外部 NS Report API 調用

**Rationale**:
- 符合憲章規範一「依賴抽象，而非實作」
- 提升可測試性，可輕易使用 Jest Mock 進行單元測試
- 未來若需更換外部服務供應商，只需替換實作類別

**Alternatives considered**:
- 直接在 controller 中調用外部 API：違反依賴倒置原則
- 使用 HttpService 包裝：缺乏業務語意，難以測試

**Implementation Pattern**:
```typescript
// 介面定義
export interface INSReportService {
  getStatusReport(request: StatusReportRequest): Promise<StatusReportData>;
}

// 注入 Token
export const NS_REPORT_SERVICE_TOKEN = 'INSReportService';
```

### 錯誤處理策略

**Decision**: 外部 API 失敗立即回傳 EXTERNAL_API_ERROR，不進行重試

**Rationale**:
- 符合憲章規範五「錯誤處理分層」
- 明確區分外部 API 錯誤 (500) 與業務邏輯錯誤 (400)
- 根據 clarification 結果，營運需求偏向快速失敗而非等待重試

**Alternatives considered**:
- 自動重試機制：可能導致回應時間過長，不符合立即回傳 presigned URL 需求
- 指數退避重試：增加系統複雜度，但營運場景不需要

### Request ID 生成策略

**Decision**: 使用既有 RequestIdService，格式為 `req-reports-{timestamp}-{randomId}`

**Rationale**:
- 符合憲章規範四「Request ID 統一生成」
- 保持與其他 API 一致的追蹤格式
- 便於日誌分析和問題排查

**Implementation**:
```typescript
this.requestIdService.generateRequestId('reports')
```

### 認證機制

**Decision**: 複用既有 ny-operator header 認證模式

**Rationale**:
- 與其他通知 API 保持一致性
- 無需額外的認證基礎設施
- 符合內部工具的安全需求

**Alternatives considered**:
- JWT token：過度工程，內部工具無此必要
- IP 白名單：管理複雜度高，不適合容器化環境

### Testing 架構

**Decision**: 三層測試架構 - 單元測試 (.spec.ts) + 整合測試 (.integration.spec.ts) + 合約測試 (.contract.spec.ts)

**Rationale**:
- 符合憲章 7.1 測試分層架構
- 單元測試 Mock 所有外部依賴，專注業務邏輯
- 整合測試驗證 HTTP 請求/回應流程
- 合約測試確保 API 回應格式符合 OpenAPI 規範

**Mock Strategy**:
```typescript
// ✅ 正確：使用 Jest Mock + overrideProvider
const mockNSReportService = {
  getStatusReport: jest.fn(),
};

// ❌ 禁止：使用 HTTP 攔截器或真實 URL
```

### 配置管理

**Decision**: 使用 registerAs 註冊 NS Report API 配置

**Rationale**:
- 符合憲章配置外部化原則
- 支援環境變數注入和型別驗證
- 易於測試環境配置覆蓋

**Configuration Structure**:
```typescript
export default registerAs('nsReport', () => ({
  baseUrl: process.env.NS_REPORT_API_URL || 'https://api.nsreport.example.com',
  timeout: parseInt(process.env.NS_REPORT_API_TIMEOUT || '30000'),
  version: 'v3'
}));
```

## External Dependencies Analysis

### @nestjs/axios
- **Purpose**: HTTP 客戶端，用於調用外部 NS Report API
- **Version**: Compatible with NestJS 10.x
- **Usage**: 包裝在 ExternalNSReportService 實作中

### class-validator & class-transformer
- **Purpose**: DTO 驗證和轉換
- **Validation Rules**: UUID format (nsId), Date format (YYYY/MM/DD), Enum values (notification type)

### @nestjs/swagger
- **Purpose**: API 文檔生成
- **Usage**: 所有 DTO 包含 @ApiProperty 註解，符合 OpenAPI 規範

## Performance Considerations

### Response Time Target
- **Goal**: <2 秒完成整個請求流程
- **Bottleneck**: 外部 NS Report API 回應時間
- **Mitigation**: 立即回傳 presigned URL，將等待時間轉移至下載階段

### Concurrency
- **Expected Load**: <100 requests/minute (內部營運工具)
- **Scaling**: 單一 NestJS 實例足以處理預期負載
- **Resource**: 無狀態設計，易於水平擴展

## Security Analysis

### Authentication
- **Method**: ny-operator header 驗證
- **Scope**: 內部營運團隊存取
- **Risk**: 低 - 內部工具，已有既定認證機制

### Data Privacy
- **Clarification Result**: 不需特殊資料隱私記錄
- **TSV Content**: 包含通知狀態資料，但視為標準 API 存取
- **Presigned URL**: 由外部服務提供，本 API 僅轉發

## Integration Points

### External NS Report API
- **Endpoint**: `/v3/GetNotificationStatusReport`
- **Method**: POST
- **Payload**: nsId, notificationDate, notificationType
- **Response**: 包含 downloadUrl 和 expiredTime 的物件
- **Failure Modes**: timeout, 4xx 客戶端錯誤, 5xx 服務器錯誤

### Notification Status Module
- **Integration**: 新增 reports endpoint 至既有模組
- **Shared Components**: 錯誤處理、Request ID 生成、認證機制
- **Module Structure**: 保持與既有 devices, history, detail endpoints 一致

## Conclusion

所有技術決策均符合專案憲章要求，無 NEEDS CLARIFICATION 項目。Ready for Phase 1 設計階段。