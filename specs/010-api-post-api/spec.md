# Feature Specification: 通知狀態報告查詢 API

**Feature Branch**: `010-api-post-api`
**Created**: 2025-09-28
**Status**: Draft
**Input**: User description: "實作 /api/v1/notification-status/reports API Spec： @docs/notification-status-proxy-api.yaml"

## Execution Flow (main)
```
1. Parse user description from Input
   → Feature: Implement POST /api/v1/notification-status/reports endpoint
2. Extract key concepts from description
   → Actors: Operations team, developers monitoring push notifications
   → Actions: Query detailed notification status reports
   → Data: nsId, notification date, notification type, TSV report files
   → Constraints: Requires presigned URL for download, no retry on external API failure
3. For each unclear aspect:
   → All requirements are clearly specified in API documentation
4. Fill User Scenarios & Testing section
   → Primary flow: Operations team needs detailed status report for specific notification
5. Generate Functional Requirements
   → Each requirement is testable and based on API specification
6. Identify Key Entities
   → StatusReport, PresignedURL, NotificationDate
7. Run Review Checklist
   → Spec focuses on user needs without implementation details
8. Return: SUCCESS (spec ready for planning)
```

---

## ⚡ Quick Guidelines
- ✅ Focus on WHAT users need and WHY
- ❌ Avoid HOW to implement (no tech stack, APIs, code structure)
- 👥 Written for business stakeholders, not developers

---

## Clarifications

### Session 2025-09-28
- Q: How should user authentication and authorization be handled for this API? → A: Require existing internal authentication (ny-operator header like other notification APIs)
- Q: What should the API behavior be during report generation waiting period? → A: Return immediate response with presigned URL that may not be ready yet
- Q: What should be the baseline for the 180-day limit calculation? → A: 不用處理 (validation not needed for current implementation)
- Q: Should there be any retry mechanism when external NS Report API calls fail? → A: No retries - fail immediately and return error to user
- Q: Should there be any data privacy or access logging requirements for downloading reports? → A: No special logging - treat as standard API access

---

## User Scenarios & Testing *(mandatory)*

### Primary User Story
營運團隊需要查詢特定推播通知的詳細狀態報告，以便分析推播效果、排查問題，或產生業務報表。團隊成員提供通知的 nsId、發送日期和通知類型，系統回傳可下載的 TSV 格式報告檔案連結。

### Acceptance Scenarios
1. **Given** 營運人員有有效的 ny-operator header 和查詢參數，**When** 使用正確格式請求狀態報告，**Then** 系統立即回傳包含下載連結和有效期限的回應
2. **Given** 營運人員提供查詢參數，**When** 請求成功處理，**Then** 下載連結指向 TSV 格式的詳細狀態報告檔案
3. **Given** 系統產生報告下載連結，**When** 連結建立，**Then** 連結必須有明確的有效期限（通常 1 小時）

### Edge Cases
- 當缺少或無效的 ny-operator header 時，系統回傳認證失敗錯誤
- 當 nsId 格式不正確（非 UUID）時，系統回傳驗證錯誤
- 當通知類型不在支援清單中時，系統回傳支援類型清單
- 當外部 NS Report API 無法回應時，系統立即回傳服務不可用錯誤（不重試）
- 當報告檔案生成超過 10 分鐘時，使用者需要聯絡 Notification Service 團隊
- 當回傳 presigned URL 但報告尚未準備完成時，使用者需要稍後再次嘗試下載

## Requirements *(mandatory)*

### Functional Requirements
- **FR-001**: 系統必須接受 POST 請求到 /api/v1/notification-status/reports 端點
- **FR-002**: 系統必須驗證 ny-operator header 進行身份認證（與其他通知 API 相同模式）
- **FR-003**: 系統必須驗證 nsId 為有效的 UUID 格式
- **FR-004**: 系統必須驗證 notificationDate 為 YYYY/MM/DD 格式
- **FR-005**: 系統必須驗證 notificationType 為支援的類型（sms, push, line, email）
- **FR-006**: 系統必須呼叫外部 NS Report API 的 /v3/GetNotificationStatusReport 端點
- **FR-007**: 系統必須立即回傳包含 downloadUrl 和 expiredTime 的成功回應（即使報告尚未準備完成）
- **FR-008**: 系統必須在參數驗證失敗時回傳 VALIDATION_ERROR 錯誤
- **FR-009**: 系統必須在外部 API 調用失敗時立即回傳 EXTERNAL_API_ERROR 錯誤（不進行重試）
- **FR-010**: 系統必須產生唯一的 requestId 用於請求追蹤
- **FR-011**: 系統必須回傳標準化的 API 回應格式（包含 success, data, timestamp, requestId）
- **FR-012**: 下載連結必須指向 TSV 格式的狀態報告檔案
- **FR-013**: 系統必須提供 presigned URL 的有效期限資訊
- **FR-014**: 系統不需要特殊的資料隱私記錄或存取日誌（視為標準 API 存取）

### Key Entities *(include if feature involves data)*
- **StatusReportRequest**: 包含 nsId（UUID）、notificationDate（YYYY/MM/DD 格式）、notificationType（列舉值）
- **StatusReportData**: 包含 downloadUrl（S3 presigned URL）和 expiredTime（有效秒數）
- **ApiResponse**: 標準化回應格式，包含成功狀態、資料、時間戳和請求 ID

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
- [x] Ambiguities marked
- [x] User scenarios defined
- [x] Requirements generated
- [x] Entities identified
- [x] Review checklist passed

---