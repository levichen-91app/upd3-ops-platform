# Tasks: 通知詳細資訊查詢 API

**Input**: Design documents from `/specs/006-docs-notification-status/`
**Prerequisites**: plan.md, research.md, data-model.md, contracts/, quickstart.md

## Execution Flow (main)
```
1. Load plan.md from feature directory ✅
   → Tech stack: NestJS 10.x + TypeScript 5.x
   → Structure: NestJS API (api/modules/, test/)
2. Load design documents ✅
   → data-model.md: 6 entities identified
   → contracts/: notification-detail-api.yaml
   → research.md: dependency abstraction decisions
3. Generate tasks by category ✅
   → Setup: module structure, dependencies, config
   → Tests: contract tests, unit tests (TDD)
   → Core: interfaces, DTOs, services, controller
   → Integration: external API, error handling
   → Polish: Swagger docs, validation
4. Apply task rules ✅
   → [P] for independent files
   → Tests before implementation (TDD)
5. Number tasks sequentially ✅
6. Generate dependency graph ✅
7. Create parallel execution examples ✅
8. Return: SUCCESS (tasks ready for execution)
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- File paths use NestJS API structure (api/src/modules/, test/)

## Phase 3.1: Setup & Configuration
- [x] T001 Create notification-status module structure in `api/src/modules/notification-status/`
- [x] T002 [P] Add NC Detail API configuration to `api/src/config/external-apis.config.ts`
- [ ] T003 [P] Configure HttpModule and external API client in module

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**
- [x] T004 [P] Contract test for notification detail endpoint in `test/contract/notification-detail.contract.spec.ts`
- [x] T005 [P] Unit test for NotificationStatusService in `api/src/modules/notification-status/notification-status.service.spec.ts`
- [x] T006 [P] Unit test for ExternalNcDetailService in `api/src/modules/notification-status/services/external-nc-detail.service.spec.ts`
- [x] T007 [P] Integration test for complete notification detail flow in `test/integration/notification-detail.integration.spec.ts`

## Phase 3.3: Core Implementation (ONLY after tests are failing)

### Interfaces & DTOs (可並行)
- [x] T008 [P] Create NC Detail service interface in `api/src/modules/notification-status/interfaces/nc-detail.interface.ts`
- [x] T009 [P] Create request DTO with validation in `api/src/modules/notification-status/dto/notification-detail-query.dto.ts`
- [x] T010 [P] Create response DTOs in `api/src/modules/notification-status/dto/notification-detail-response.dto.ts`

### Services Implementation (依賴順序)
- [x] T011 External NC Detail service implementation in `api/src/modules/notification-status/services/external-nc-detail.service.ts`
- [x] T012 Business logic service implementation in `api/src/modules/notification-status/notification-status.service.ts`
- [x] T013 Error handling and logging middleware in `api/src/common/filters/notification-status-exception.filter.ts`

### Controller & Module (最後整合)
- [x] T014 Controller implementation with Swagger annotations in `api/src/modules/notification-status/notification-status.controller.ts`
- [x] T015 Module configuration and dependency injection in `api/src/modules/notification-status/notification-status.module.ts`
- [x] T016 Register module in main app module `api/src/app.module.ts`

## Phase 3.4: Integration & Validation
- [x] T017 Operator header validation middleware in `api/src/common/decorators/operator-header.decorator.ts`
- [x] T018 Request ID generation interceptor in `api/src/common/interceptors/request-id.interceptor.ts`
- [x] T019 External API retry mechanism in `api/src/common/services/http-retry.service.ts`

## Phase 3.5: Polish & Documentation
- [x] T020 [P] Update Swagger documentation and API examples
- [x] T021 [P] Add comprehensive error logging and monitoring
- [x] T022 Run quickstart.md validation and performance testing
- [x] T023 Code review and refactoring for constitution compliance

## Dependencies
```
Setup (T001-T003) → Tests (T004-T007) → Implementation (T008-T016) → Integration (T017-T019) → Polish (T020-T023)

Detailed dependencies:
- T008, T009, T010 can run in parallel (different files)
- T011 requires T008 (interface dependency)
- T012 requires T008, T011 (service dependencies)
- T014 requires T009, T010, T012 (DTO and service dependencies)
- T015 requires T014 (module assembly)
- T016 requires T015 (app integration)
```

## Parallel Execution Examples

### Phase 3.2: Tests (可同時執行)
```bash
# 並行執行所有測試任務
Task: "Contract test for notification detail endpoint in test/contract/notification-detail.contract.spec.ts"
Task: "Unit test for NotificationStatusService in api/src/modules/notification-status/notification-status.service.spec.ts"
Task: "Unit test for ExternalNcDetailService in api/src/modules/notification-status/services/external-nc-detail.service.spec.ts"
Task: "Integration test for complete notification detail flow in test/integration/notification-detail.integration.spec.ts"
```

### Phase 3.3: DTOs & Interfaces (可同時執行)
```bash
# 並行執行介面和DTO任務
Task: "Create NC Detail service interface in api/src/modules/notification-status/interfaces/nc-detail.interface.ts"
Task: "Create request DTO with validation in api/src/modules/notification-status/dto/notification-detail-query.dto.ts"
Task: "Create response DTOs in api/src/modules/notification-status/dto/notification-detail-response.dto.ts"
```

### Phase 3.5: Polish (可同時執行)
```bash
# 並行執行最終完善任務 (排除e2e測試)
Task: "Update Swagger documentation and API examples"
Task: "Add comprehensive error logging and monitoring"
```

## Notes
- 遵循憲章TDD原則：紅燈(失敗測試) → 綠燈(實作) → 重構
- 依賴抽象化：先建立介面，再實作具體Service
- 所有外部依賴透過註入令牌管理
- 統一回應格式和錯誤處理
- 完整的操作者追蹤和日誌記錄
- **排除 e2e 測試**：僅實作合約測試、單元測試和整合測試

## Validation Checklist
*GATE: Checked before execution*

- [x] All contracts have corresponding tests (T004 covers notification-detail-api.yaml)
- [x] All entities have model/DTO tasks (T009, T010 cover data model entities)
- [x] All tests come before implementation (T004-T007 before T008-T016)
- [x] Parallel tasks truly independent (different files, no shared dependencies)
- [x] Each task specifies exact file path (NestJS API structure)
- [x] No task modifies same file as another [P] task (verified)