# Research: Proxy API 標準化重構

**Feature**: 004-proxy-api
**Date**: 2025-09-26

## Research Overview

此功能為現有 Proxy API 的標準化重構，基於詳細的澄清記錄和企業級 API 設計標準。所有技術決策已在規格階段明確，無額外研究需求。

## Technology Stack Research

### NestJS Framework 與標準化
**Decision**: 繼續使用 NestJS 11.x，加強標準化中間件和攔截器
**Rationale**: 現有架構已建立，NestJS 提供完整的企業級 API 開發功能
**Alternatives considered**: 無 - 保持現有技術棧，符合憲章簡化原則

### 統一回應格式實作方式
**Decision**: 使用 NestJS 攔截器 (Interceptors) 統一回應格式
**Rationale**: 攔截器可自動處理所有 API 回應，確保格式一致性
**Alternatives considered**:
- 在每個 Controller 手動處理：維護困難，容易遺漏
- 使用裝飾器：複雜度較高，攔截器更適合全域處理

### Request ID 生成策略
**Decision**: uuid + timestamp 組合，格式為 `req-{timestamp}-{uuid}`
**Rationale**: 基於澄清記錄，提供唯一性和時間排序能力
**Alternatives considered**: 已在澄清階段決定，無需額外研究

### 錯誤處理架構
**Decision**: 全域例外過濾器 + 結構化錯誤代碼系統
**Rationale**:
- 全域過濾器確保所有錯誤統一處理
- 結構化錯誤代碼提供清楚的錯誤分類
- 英文錯誤訊息 (基於澄清記錄)
**Alternatives considered**: 分散式錯誤處理 - 不符合標準化要求

## API 設計標準研究

### RESTful URL 設計
**Decision**: 從 `POST /proxy/whale/update-supplier-id` 改為 `PATCH /api/v1/shops/{shopId}/suppliers`
**Rationale**:
- 遵循資源導向設計原則
- 使用 PATCH 表示部分更新語義
- shopId 作為路徑參數提供業務上下文
- 加入 `/api/v1` 版本控制
**Alternatives considered**: PUT 方法 - PATCH 更適合部分更新場景

### HTTP 狀態碼標準化
**Decision**:
- PATCH 成功: 200 OK
- 驗證錯誤: 400 Bad Request
- 授權錯誤: 401 Unauthorized
- 上游服務錯誤: 502 Bad Gateway
**Rationale**: 符合 HTTP 標準語義和企業級 API 設計慣例
**Alternatives considered**: 無 - HTTP 標準已定義明確語義

## Integration Patterns Research

### 與 Whale API 整合保持
**Decision**: 保持現有整合邏輯，只改變外部介面
**Rationale**:
- 不改變核心業務邏輯 (規格要求)
- 降低重構風險
- 專注於 API 標準化而非業務邏輯變更
**Alternatives considered**: 重構整合邏輯 - 超出此次重構範圍

### 向後相容性策略
**Decision**: 完全移除舊端點，無需相容性支援
**Rationale**: 基於澄清記錄「系統還沒上線，所以直接把舊的移除即可」
**Alternatives considered**:
- 雙端點並存：不必要的複雜度
- 重定向策略：無實際需求

## Testing Strategy Research

### 測試覆蓋率維持
**Decision**: 維持現有 ≥ 80% 覆蓋率，更新測試以配合新 API 設計
**Rationale**:
- 憲章要求維持測試品質
- 重構過程中確保功能正確性
- 新增標準化回應格式的測試案例
**Alternatives considered**: 降低覆蓋率要求 - 不符合憲章標準

### 測試執行效能
**Decision**: 所有測試必須在 2 秒內完成
**Rationale**: 規格明確要求，現有測試框架 (Jest + Supertest) 支援
**Alternatives considered**: 無 - 效能要求已明確定義

## Performance Requirements Research

### 回應時間基準
**Decision**: API 回應時間不得超過目前基準的 10%
**Rationale**: 規格要求，確保重構不影響效能
**Implementation approach**:
- 測量現有 API 效能基準
- 在重構過程中持續監控
- 優化中間件和攔截器效能
**Alternatives considered**: 無基準限制 - 不符合規格要求

## Documentation Standards Research

### OpenAPI 文檔更新
**Decision**: 完整更新 Swagger/OpenAPI 規格以反映新設計
**Rationale**:
- 憲章要求完整的 API 文檔
- 新的統一回應格式需要文檔化
- 錯誤代碼系統需要詳細說明
**Alternatives considered**: 部分更新 - 不符合企業級標準要求

### DTO 驗證和註解
**Decision**: 所有 DTO 包含完整的 class-validator 規則和 @ApiProperty 註解
**Rationale**:
- 確保輸入驗證完整性
- 自動生成準確的 API 文檔
- 符合 NestJS 最佳實踐
**Alternatives considered**: 手動驗證 - 容易遺漏，不符合自動化原則

## Implementation Approach Research

### 重構順序策略
**Decision**:
1. 建立統一回應格式基礎設施
2. 實作中間件和攔截器
3. 重構 Controller 和 URL 設計
4. 更新錯誤處理
5. 更新測試和文檔
**Rationale**:
- 基礎設施優先，確保標準化基礎
- 逐步重構降低風險
- 測試和文檔最後更新確保同步
**Alternatives considered**: 同時重構所有部分 - 風險過高

### 中間件執行順序
**Decision**: Request ID 生成 → 日誌記錄 → 回應格式攔截器 → 錯誤處理過濾器
**Rationale**:
- Request ID 最先生成，供後續中間件使用
- 日誌記錄需要 Request ID
- 回應攔截器處理成功回應
- 錯誤過濾器處理例外情況
**Alternatives considered**: 其他順序 - 可能導致功能衝突

## Conclusion

所有技術決策已基於規格要求和澄清記錄確定，無未解決的技術問題。重構策略明確，風險可控，符合憲章要求。

**Research Complete**: ✅ 無額外研究需求，可進行 Phase 1 設計階段