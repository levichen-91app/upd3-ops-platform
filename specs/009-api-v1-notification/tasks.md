# Tasks: 通知活動歷程查詢 API

**Input**: Design documents from `/specs/009-api-v1-notification/`
**Prerequisites**: plan.md, research.md, data-model.md, contracts/history-api.yaml, quickstart.md

## Execution Flow (main)
```
1. Load plan.md from feature directory
   → Tech stack: TypeScript 5.x with NestJS 10.x, @nestjs/axios, class-validator
   → Structure: Web app with api/ backend
2. Load design documents:
   → data-model.md: NotificationHistory, WhaleReport, Request/Response DTOs
   → contracts/history-api.yaml: GET /api/v1/notification-status/history/{notificationId}
   → quickstart.md: 5 integration test scenarios
3. Generate tasks by category following TDD approach
4. Apply task rules: Different files [P], same file sequential
5. SUCCESS: 20 tasks ready for execution
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Exact file paths included for each task

## Path Conventions
Based on existing project structure:
- Backend: `api/modules/notification-status/`
- Integration Tests: Within modules (e.g., `api/modules/notification-status/integration/*.spec.ts`)
- Config: `api/config/`

## Phase 3.1: Setup

- [x] T001 Create Whale API configuration in `api/config/whale-api.config.ts` following existing pattern (reference api/config/nc-api.config.ts)
- [x] T002 Create Whale API interface in `api/modules/notification-status/interfaces/whale-api.interface.ts` with getNotificationHistory method signature and injection token

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**

- [x] T003 [P] Contract test for GET /api/v1/notification-status/history/{notificationId} in `api/modules/notification-status/integration/history-contract.spec.ts` validating OpenAPI spec compliance
- [x] T004 [P] Integration test for successful history query scenario in `api/modules/notification-status/integration/history-success.spec.ts` with mocked Whale API responses
- [x] T005 [P] Integration test for authentication errors in `api/modules/notification-status/integration/history-auth.spec.ts` testing ny-operator header requirement
- [x] T006 [P] Integration test for validation errors in `api/modules/notification-status/integration/history-validation.spec.ts` testing notificationId parameter validation
- [x] T007 [P] Integration test for external API errors in `api/modules/notification-status/integration/history-external-errors.spec.ts` testing timeout and Whale API failures
- [x] T008 [P] Integration test for not found scenarios in `api/modules/notification-status/integration/history-notfound.spec.ts` testing empty Whale API responses

## Phase 3.3: Core Implementation (ONLY after tests are failing)

- [x] T009 [P] Create NotificationHistoryQuery DTO in `api/modules/notification-status/dto/notification-history-query.dto.ts` with notificationId validation and Swagger annotations
- [x] T010 [P] Create NotificationHistoryResponse DTO in `api/modules/notification-status/dto/notification-history-response.dto.ts` with standardized response format
- [x] T011 [P] Create NotificationHistory entity DTO in `api/modules/notification-status/dto/notification-history.dto.ts` with class-validator decorations and Swagger annotations
- [x] T012 [P] Create WhaleReport DTO in `api/modules/notification-status/dto/whale-report.dto.ts` with validation rules and business constraints
- [x] T013 Create WhaleApiService implementation in `api/modules/notification-status/services/whale-api.service.ts` with HttpService integration and 5-second timeout
- [x] T014 Extend NotificationStatusService in `api/modules/notification-status/services/notification-status.service.ts` with getNotificationHistory method
- [x] T015 Add getNotificationHistory method to NotificationStatusController in `api/modules/notification-status/controllers/notification-status.controller.ts` with proper routing and guards

## Phase 3.4: Integration

- [x] T016 Update NotificationStatusModule in `api/modules/notification-status/notification-status.module.ts` to register WhaleApiService and configure Whale API dependencies
- [x] T017 Verify ny-operator guard integration works with new history endpoint (reuse existing guard implementation)
- [x] T018 Verify request ID interceptor integration generates proper tracking IDs for history requests (reuse existing interceptor)

## Phase 3.5: Polish

- [x] T019 [P] Unit tests for WhaleApiService in `api/modules/notification-status/services/whale-api.service.spec.ts` with HttpService mocks and timeout scenarios
- [x] T020 [P] Unit tests for NotificationStatusService history method in `api/modules/notification-status/services/notification-status-history.service.spec.ts` with comprehensive mock scenarios

## Dependencies

**Sequential Dependencies**:
- Setup (T001-T002) before all others
- Tests (T003-T008) before implementation (T009-T015)
- T013 (WhaleApiService) before T014 (NotificationStatusService extension)
- T014 before T015 (Controller method)
- Integration (T016-T018) before polish (T019-T020)

**Parallel Groups**:
- T003-T008: All integration test files (different files, independent)
- T009-T012: All DTO files (different files, independent)
- T019-T020: All unit test files (different service files, independent)

## Parallel Execution Examples

### Phase 3.2 - All Tests Together:
```bash
Task: "Contract test for GET /api/v1/notification-status/history/{notificationId} in api/modules/notification-status/integration/history-contract.spec.ts"
Task: "Integration test for successful history query in api/modules/notification-status/integration/history-success.spec.ts"
Task: "Integration test for authentication errors in api/modules/notification-status/integration/history-auth.spec.ts"
Task: "Integration test for validation errors in api/modules/notification-status/integration/history-validation.spec.ts"
Task: "Integration test for external API errors in api/modules/notification-status/integration/history-external-errors.spec.ts"
Task: "Integration test for not found scenarios in api/modules/notification-status/integration/history-notfound.spec.ts"
```

### Phase 3.3 - DTOs in Parallel:
```bash
Task: "Create NotificationHistoryQuery DTO in api/modules/notification-status/dto/notification-history-query.dto.ts"
Task: "Create NotificationHistoryResponse DTO in api/modules/notification-status/dto/notification-history-response.dto.ts"
Task: "Create NotificationHistory entity DTO in api/modules/notification-status/dto/notification-history.dto.ts"
Task: "Create WhaleReport DTO in api/modules/notification-status/dto/whale-report.dto.ts"
```

## Task Generation Details

### From contracts/history-api.yaml:
- T003: Contract test for API specification compliance
- T009-T010: DTO creation for request/response models
- T015: Controller endpoint implementation

### From data-model.md:
- T011-T012: Entity DTOs with validation rules
- T014: Service layer for business logic

### From quickstart.md scenarios:
- T004: Success case integration test
- T005: Authentication error test
- T006: Validation error test
- T007: External API error test
- T008: Not found case test

### From constitutional requirements:
- T002: Interface abstraction for external dependency
- T013: External service implementation with proper error handling
- T017-T018: Reuse existing infrastructure (guards, interceptors)
- T019-T020: Comprehensive unit tests for all services

## Validation Checklist

- [x] All contracts have corresponding tests (T003)
- [x] All entities have model tasks (T009-T012)
- [x] All tests come before implementation (T003-T008 before T009-T015)
- [x] Parallel tasks truly independent (different files)
- [x] Each task specifies exact file path
- [x] No task modifies same file as another [P] task
- [x] TDD approach enforced (failing tests required)
- [x] Constitutional requirements covered (abstraction, testing, standards)

## Notes

- **TDD Critical**: Tests T003-T008 MUST fail before implementing T009-T015
- **[P] Independence**: Parallel tasks work on different files with no shared dependencies
- **File Paths**: All paths are exact and ready for implementation
- **Constitutional Compliance**: Follows dependency abstraction and testing-first principles
- **Reuse Strategy**: Leverages existing guards, interceptors, and filters
- **Error Handling**: Implements proper 500 vs 404 error classification
- **Performance**: 5-second timeout requirement built into service implementation