# Feature Specification: 通知詳細資訊查詢 API

**Feature Branch**: `006-docs-notification-status`
**Created**: 2025-01-27
**Status**: Draft
**Input**: User description: "參考 @docs/notification-status-proxy-api.yaml @docs/notification-status-error-handling.md @docs/notification-status-config-simple.md 先實作 /api/v1/notification-status/detail/{shopId}/{ncId} 這支 api"

## Execution Flow (main)
```
1. Parse user description from Input
   → User wants to implement notification detail API endpoint
2. Extract key concepts from description
   → Actor: Operations team, Frontend developers
   → Action: Query notification details by shopId and ncId
   → Data: Notification details including NSId, Status, ChannelType, CreateDateTime, Report
   → Constraints: Must integrate with NC Detail API, handle null responses
3. For each unclear aspect:
   → Authentication/authorization requirements not specified
   → Rate limiting requirements not specified
   → Caching strategy not specified
4. Fill User Scenarios & Testing section
   → Primary flow: Query existing notification details
   → Edge cases: Non-existent notifications, invalid parameters
5. Generate Functional Requirements
   → API endpoint implementation, external service integration, error handling
6. Identify Key Entities
   → NotificationDetail, Report, Error responses
7. Run Review Checklist
   → WARN "Spec has uncertainties about auth and caching"
8. Return: SUCCESS (spec ready for planning)
```

---

## Clarifications

### Session 2025-01-27
- Q: 規格提到這個API是給「運營團隊」使用，但沒有指定身份驗證要求。這個API應該採用什麼等級的存取控制？ → A: 透過HTTP header中的 `ny-operator` 欄位來追蹤每次API呼叫的操作者
- Q: 這個API需要實施速率限制來防止濫用。您希望採用什麼樣的速率限制策略？ → A: 無速率限制（內部API，信任環境）
- Q: 這個API會整合外部NC Detail API，當外部服務回應超時時，應該等待多長時間？ → A: 10 秒
- Q: 當外部NC Detail API回應中的資料格式異常或不完整時，系統應該如何處理？ → A: 返回500錯誤並記錄完整錯誤資訊
- Q: 在日誌記錄中，除了基本的請求參數和回應狀態外，還需要包含哪些關鍵資訊用於運營分析？ → A: 目前應該還好，先不用考慮

---

## ⚡ Quick Guidelines
- ✅ Focus on WHAT users need and WHY
- ❌ Avoid HOW to implement (no tech stack, APIs, code structure)
- 👥 Written for business stakeholders, not developers

---

## User Scenarios & Testing *(mandatory)*

### Primary User Story
運營團隊需要查詢特定通知的詳細資訊，包括通知狀態、發送管道類型、建立時間以及詳細的發送報告，以便進行推播狀態分析和問題排查。

### Acceptance Scenarios
1. **Given** 有效的商店ID、通知中心ID和 `ny-operator` header，**When** 查詢通知詳細資訊，**Then** 系統返回完整的通知詳細資料，包含NSId、狀態、管道類型、建立時間和報告資訊
2. **Given** 有效的商店ID、通知中心ID和 `ny-operator` header但通知不存在，**When** 查詢通知詳細資訊，**Then** 系統返回成功回應但data為null
3. **Given** 無效的商店ID格式，**When** 查詢通知詳細資訊，**Then** 系統返回參數驗證錯誤
4. **Given** 無效的通知中心ID格式（非UUID），**When** 查詢通知詳細資訊，**Then** 系統返回參數驗證錯誤
5. **Given** 缺少 `ny-operator` header，**When** 查詢通知詳細資訊，**Then** 系統返回400驗證錯誤
6. **Given** 外部NC API服務異常，**When** 查詢通知詳細資訊，**Then** 系統返回外部服務錯誤並包含詳細錯誤資訊

### Edge Cases
- 當商店ID為0或負數時，系統應拒絕請求
- 當通知中心ID不是標準UUID格式時，系統應返回格式錯誤
- 當外部NC API回應超過10秒超時時，系統應返回超時錯誤
- 當外部NC API返回非預期格式資料時，系統應返回500錯誤並記錄完整錯誤資訊
- 當請求缺少 `ny-operator` header時，系統應返回400驗證錯誤

## Requirements *(mandatory)*

### Functional Requirements
- **FR-001**: 系統必須提供GET `/api/v1/notification-status/detail/{shopId}/{ncId}`端點來查詢通知詳細資訊
- **FR-002**: 系統必須驗證shopId參數為正整數且大於0
- **FR-003**: 系統必須驗證ncId參數為標準UUID格式
- **FR-004**: 系統必須整合NC Detail API來獲取通知詳細資訊，超時時間設定為10秒
- **FR-005**: 系統必須返回統一的回應格式，包含success、data、timestamp、requestId欄位
- **FR-006**: 當通知不存在時，系統必須返回success為true但data為null
- **FR-007**: 系統必須處理外部API調用失敗的情況並返回適當的錯誤訊息
- **FR-008**: 當外部NC Detail API回應資料格式異常或不完整時，系統必須返回500錯誤並記錄完整錯誤資訊用於故障排除
- **FR-009**: 系統必須為每個請求生成唯一的requestId用於追蹤
- **FR-010**: 系統必須記錄所有API調用的基本日誌，包含請求參數、回應狀態和操作者資訊，暫不包含額外的運營分析資訊
- **FR-011**: 系統必須在回應中包含正確的HTTP狀態碼（200成功，400參數錯誤，500內部錯誤）
- **FR-012**: 系統必須接受並驗證HTTP header中的 `ny-operator` 欄位來識別API呼叫的操作者
- **FR-013**: 系統必須在所有日誌記錄中包含操作者資訊（來自 `ny-operator` header）
- **FR-014**: 系統必須在 `ny-operator` header缺失或格式不正確時返回400錯誤
- **FR-015**: 作為內部信任環境的API，系統不需要實施速率限制

### Key Entities *(include if feature involves data)*
- **NotificationDetail**: 表示通知的詳細資訊，包含NCId（通知中心ID）、NSId（通知服務ID）、Status（狀態）、ChannelType（管道類型）、CreateDateTime（建立時間）、Report（報告資料）和ShortMessageReportLink（簡訊報告連結）
- **Report**: 表示通知發送報告，包含各種統計數據如總數、發送數、失敗數等，根據不同管道類型會有不同的統計欄位
- **ApiResponse**: 表示API的統一回應格式，包含success（成功狀態）、data（資料內容）、timestamp（時間戳）、requestId（請求追蹤ID）
- **ApiErrorResponse**: 表示API錯誤回應格式，包含success（固定為false）、error（錯誤詳情，含code和message）、timestamp、requestId

---

## Review & Acceptance Checklist

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

- [x] User description parsed
- [x] Key concepts extracted
- [x] Ambiguities marked
- [x] User scenarios defined
- [x] Requirements generated
- [x] Entities identified
- [x] Review checklist passed