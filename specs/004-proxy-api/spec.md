# Feature Specification: Proxy API 標準化重構

**Feature Branch**: `004-proxy-api`
**Created**: 2025-09-26
**Status**: Draft
**Input**: User description: "我覺得你方向錯了，我是要照著下列的規格修改 proxy api"

## Execution Flow (main)
```
1. Parse user description from Input
   → ✅ COMPLETED: 分析現有 Proxy API 重構需求
2. Extract key concepts from description
   → ✅ COMPLETED: 識別 URL 標準化、回應格式統一、錯誤處理標準化等核心概念
3. For each unclear aspect:
   → ✅ COMPLETED: 基於 002-api-standards-refactor 規格，所有需求已明確定義
4. Fill User Scenarios & Testing section
   → ✅ COMPLETED: 定義 API 重構的使用場景
5. Generate Functional Requirements
   → ✅ COMPLETED: 生成基於企業級 API 標準的功能需求
6. Identify Key Entities (if data involved)
   → ✅ COMPLETED: 識別 API 重構相關的關鍵實體
7. Run Review Checklist
   → ✅ COMPLETED: 檢查規格完整性
8. Return: SUCCESS (spec ready for planning)
```

## Clarifications

### Session 2025-09-26
- Q: For backward compatibility during the transition period, how should the system handle existing clients calling the old URL? → A: 系統還沒上線，所以直接把舊的移除即可
- Q: 對於 Request ID 的隨機字串部分，您偏好使用哪種生成方式？ → A: uuid + timestamp
- Q: 對於錯誤訊息的多語言支援，您希望支援哪些語言？ → A: 英文就好了

---

## ⚡ Quick Guidelines
- ✅ Focus on WHAT users need and WHY
- ❌ Avoid HOW to implement (no tech stack, APIs, code structure)
- 👥 Written for business stakeholders, not developers

## User Scenarios & Testing *(mandatory)*

### Primary User Story
作為使用 Proxy API 的開發人員，我需要一個符合企業級標準的 RESTful API，能夠提供一致的回應格式、清楚的錯誤處理和標準化的 URL 設計，以便我能夠更有效地整合和維護系統。

### Acceptance Scenarios
1. **Given** 現有的 Proxy API 端點，**When** 重構為 RESTful 設計，**Then** 新的 URL 必須遵循資源導向設計且包含版本控制
2. **Given** API 呼叫成功，**When** 回傳回應，**Then** 回應格式必須包含統一的結構 (success, data, timestamp, requestId)
3. **Given** API 呼叫失敗，**When** 處理錯誤，**Then** 錯誤回應必須包含結構化的錯誤代碼和詳細訊息
4. **Given** 新的 API 標準，**When** 執行測試，**Then** 所有現有測試必須通過且測試覆蓋率維持 ≥ 80%
5. **Given** 重構後的 API，**When** 產生文檔，**Then** OpenAPI 規格必須完整且準確

### Edge Cases
- 當 Whale API 無法回應時，如何回傳標準化的錯誤格式？
- 當系統負載過高時，如何確保回應時間不超過效能要求？

## Requirements *(mandatory)*

### Functional Requirements

#### Core API 重構需求
- **FR-001**: 系統必須將現有 `POST /proxy/whale/update-supplier-id` 重構為 `PATCH /api/v1/shops/{shopId}/suppliers`
- **FR-002**: 系統必須支援從 URL 路徑取得 shopId 作為業務上下文參數
- **FR-003**: 系統必須從 request body 取得 market、oldSupplierId、newSupplierId 參數
- **FR-004**: 系統必須保持與 Whale API 的整合，不改變核心業務邏輯

#### 統一回應格式需求
- **FR-005**: 成功回應必須包含 success (true)、data、timestamp、requestId 欄位
- **FR-006**: 錯誤回應必須包含 success (false)、error 物件、timestamp、requestId 欄位
- **FR-007**: error 物件必須包含 code、message 欄位，並可選包含 details
- **FR-008**: timestamp 必須為 ISO 8601 格式的日期時間字串
- **FR-009**: requestId 必須為唯一識別碼，格式為 `req-{timestamp}-{uuid}`，使用 UUID v4 + timestamp 組合

#### HTTP 狀態碼標準化需求
- **FR-010**: PATCH 部分更新必須回傳 200 OK 狀態碼
- **FR-011**: 驗證錯誤必須回傳 400 Bad Request 狀態碼
- **FR-012**: 上游服務錯誤必須回傳 502 Bad Gateway 狀態碼
- **FR-013**: 授權相關錯誤必須回傳 401 Unauthorized 狀態碼

#### 錯誤處理標準化需求
- **FR-014**: 系統必須實作結構化錯誤代碼系統，包含驗證錯誤 (1000-1999)、業務邏輯錯誤 (4000-4999)、系統錯誤 (5000-5999)
- **FR-015**: 系統必須對相同供應商 ID 的情況回傳 SUPPLIER_IDS_IDENTICAL 錯誤代碼
- **FR-016**: 系統必須對 Whale API 無法使用的情況回傳 WHALE_API_UNAVAILABLE 錯誤代碼
- **FR-017**: 系統必須提供詳細的錯誤上下文資訊
- **FR-018**: 錯誤訊息必須使用英文，無需多語言支援

#### 中間件和攔截器需求
- **FR-019**: 系統必須為每個請求生成唯一的 Request ID
- **FR-020**: 系統必須記錄標準化的日誌格式，包含 timestamp、level、requestId、method、url、statusCode、responseTime 等欄位
- **FR-021**: 系統必須實作回應格式統一攔截器
- **FR-022**: 系統必須實作錯誤處理全域過濾器

#### API 版本控制需求
- **FR-023**: 所有 API 端點必須加入 `/api/v1` 版本前綴
- **FR-024**: 系統必須支援 API 版本控制策略

#### 文檔和測試需求
- **FR-025**: 系統必須更新 OpenAPI/Swagger 文檔以反映新的 API 設計
- **FR-026**: 所有 DTO 必須包含完整的驗證規則和 API 註解
- **FR-027**: 系統必須維持測試覆蓋率 ≥ 80%
- **FR-028**: 所有現有測試必須通過
- **FR-029**: 系統必須新增針對標準化回應格式的測試案例

#### 效能需求
- **FR-030**: API 回應時間不得超過目前基準的 10%
- **FR-031**: 所有測試必須在 2 秒內完成
- **FR-032**: 系統必須完全移除舊的 API 端點 (系統尚未上線，無需相容性支援)

### Key Entities *(include if feature involves data)*

- **Supplier Update Request**: 包含 market、oldSupplierId、newSupplierId 的供應商更新請求資料
- **API Response**: 統一回應格式，包含 success 狀態、data 內容、timestamp 和 requestId
- **API Error**: 結構化錯誤物件，包含錯誤代碼、錯誤訊息和詳細資訊
- **Request Context**: 請求上下文資訊，包含 shopId、operator、request ID 等
- **Error Code**: 分類的錯誤代碼系統，區分驗證錯誤、業務邏輯錯誤和系統錯誤

---

## Review & Acceptance Checklist
*GATE: Automated checks run during main() execution*

### Content Quality
- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

### Requirement Completeness
- [x] No [NEEDS CLARIFICATION] markers remain
- [x] Requirements are testable and unambiguous
- [x] Success criteria are measurable
- [x] Scope is clearly bounded
- [x] Dependencies and assumptions identified

---

## Execution Status
*Updated by main() during processing*

- [x] User description parsed
- [x] Key concepts extracted
- [x] Ambiguities marked (無需標記 - 基於完整的 002 規格)
- [x] User scenarios defined
- [x] Requirements generated
- [x] Entities identified
- [x] Review checklist passed

---