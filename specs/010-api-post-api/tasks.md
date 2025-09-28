# Tasks: 通知狀態報告查詢 API

**Input**: Design documents from `/specs/010-api-post-api/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/

## Execution Flow (main)
```
1. Load plan.md from feature directory
   → Tech stack: TypeScript 5.x + NestJS 10.x + Jest
   → Structure: api/ directory with modules architecture
2. Load optional design documents:
   → data-model.md: StatusReportRequest, StatusReportData entities
   → contracts/: notification-status-reports.openapi.yaml
   → research.md: Dependency abstraction, mock strategy decisions
3. Generate tasks by category:
   → Setup: NestJS module structure, dependencies, configuration
   → Tests: Contract tests, integration tests with mocked external APIs
   → Core: DTOs, services, controllers with dependency injection
   → Integration: Module registration, middleware, error handling
   → Polish: Unit tests, performance validation, documentation
4. Apply task rules:
   → Different files = mark [P] for parallel
   → Same file = sequential (no [P])
   → Tests before implementation (TDD)
5. Number tasks sequentially (T001, T002...)
6. Generate dependency graph with external API mocking emphasis
7. SUCCESS: 32 tasks ready for execution with TDD approach
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions
- **Special emphasis on mocking external NS Report API for integration tests**

## Phase 3.1: Setup & Configuration

- [x] T001 Create NS Report API configuration in `api/config/ns-report.config.ts`
- [x] T002 Add notification type enum constants in `api/constants/notification-types.constants.ts`
- [x] T003 [P] Update error codes constants in `api/constants/error-codes.constants.ts`
- [x] T004 [P] Extend RequestIdService to support 'reports' prefix (req-reports-{timestamp}-{randomId}) in `api/common/services/request-id.service.ts`

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**

### Contract Tests (OpenAPI Schema Validation)
- [ ] T005 [P] Contract test for POST /api/v1/notification-status/reports success response in `test/contract/notification-status-reports.contract.spec.ts`

### Integration Tests with Mocked External APIs
**特別注意: 所有外部 NS Report API 調用必須使用 Jest Mock，絕對禁止真實 HTTP 請求**

- [ ] T006 [P] Integration test: Reports success scenario with mocked NS Report API in `api/modules/notification-status/integration/reports-success.integration.spec.ts`
- [ ] T007 [P] Integration test: Authentication failure (missing ny-operator header) in `api/modules/notification-status/integration/reports-auth.integration.spec.ts`
- [ ] T008 [P] Integration test: Request validation errors (invalid UUID, date format, notification type) in `api/modules/notification-status/integration/reports-validation.integration.spec.ts`
- [ ] T009 [P] Integration test: External NS Report API errors (timeout, 500, connection failure) with mocked failures in `api/modules/notification-status/integration/reports-external-errors.integration.spec.ts`

### Unit Test Stubs (Will fail initially)
- [ ] T010 [P] Unit test stub for StatusReportRequestDto validation in `api/modules/notification-status/dto/status-report-request.dto.spec.ts`
- [ ] T011 [P] Unit test stub for ExternalNSReportService with mocked HttpService in `api/modules/notification-status/services/external-ns-report.service.spec.ts`
- [ ] T012 [P] Unit test stub for NotificationStatusService with mocked dependencies in `api/modules/notification-status/notification-status.service.spec.ts`
- [ ] T013 [P] Unit test stub for NotificationStatusController with mocked service in `api/modules/notification-status/notification-status.controller.spec.ts`

## Phase 3.3: Core Implementation (ONLY after tests are failing)

### Data Transfer Objects (DTOs)
- [ ] T014 [P] Create StatusReportRequestDto with validation decorators in `api/modules/notification-status/dto/status-report-request.dto.ts`
- [ ] T015 [P] Create StatusReportResponseDto with Swagger annotations in `api/modules/notification-status/dto/status-report-response.dto.ts`

### Service Layer (Dependency Abstraction)
- [ ] T016 [P] Create INSReportService interface and injection token in `api/modules/notification-status/services/ns-report.service.interface.ts`
- [ ] T017 ExternalNSReportService implementation with HttpService integration in `api/modules/notification-status/services/external-ns-report.service.ts`
- [ ] T018 NotificationStatusService with injected dependencies in `api/modules/notification-status/notification-status.service.ts`

### Controller Layer
- [ ] T019 NotificationStatusController with reports endpoint, authentication guard, and error handling in `api/modules/notification-status/notification-status.controller.ts`

## Phase 3.4: Integration & Module Configuration

- [ ] T020 Update NotificationStatusModule with new providers and exports in `api/modules/notification-status/notification-status.module.ts`
- [ ] T021 Add NS Report configuration to app module imports in `api/app.module.ts` (if needed)
- [ ] T022 Verify ny-operator authentication guard integration across reports endpoint

## Phase 3.5: Error Handling & Middleware

- [ ] T023 Implement comprehensive error mapping for external API failures in NotificationStatusService
- [ ] T024 Add request/response interceptor for Request ID injection on reports endpoint
- [ ] T025 Validate error response formats match OpenAPI specification

## Phase 3.6: Polish & Validation

### Complete Unit Tests (Make them pass)
- [ ] T026 [P] Complete StatusReportRequestDto validation unit tests with edge cases
- [ ] T027 [P] Complete ExternalNSReportService unit tests with all HTTP error scenarios
- [ ] T028 [P] Complete NotificationStatusService unit tests with mocked dependencies
- [ ] T029 [P] Complete NotificationStatusController unit tests with mocked service

### Performance & Documentation
- [ ] T030 Performance test: Verify reports endpoint responds within 2 seconds under normal load
- [ ] T031 [P] Update Swagger documentation and verify OpenAPI spec generation includes reports endpoint
- [ ] T032 [P] Verify standard API access logging policy compliance for reports endpoint

## Dependencies

**Critical Dependencies**:
- Setup (T001-T004) before all other tasks
- ALL tests (T005-T013) MUST COMPLETE and FAIL before any implementation (T014-T025)
- DTOs (T014-T015) before services (T016-T018)
- Services (T016-T018) before controller (T019)
- Core implementation (T014-T019) before module integration (T020-T022)
- Integration (T020-T025) before polish (T026-T032)

**Parallel Dependencies**:
- Contract test (T005) independent of integration tests (T006-T009)
- All integration tests (T006-T009) can run in parallel - different test files
- Unit test stubs (T010-T013) can run in parallel - different files
- DTOs (T014-T015) can be created in parallel - different files
- Final unit tests (T026-T029) can run in parallel - different files
- Documentation and compliance tasks (T031-T032) can run in parallel - different verification areas

## Integration Test Mocking Strategy

### External API Mocking Requirements (特別注意)
```typescript
// ✅ 正確的 Mock 模式 (T006-T009, T011, T027)
const mockNSReportService = {
  getStatusReport: jest.fn()
};

const moduleFixture = await Test.createTestingModule({
  imports: [NotificationStatusModule]
})
.overrideProvider(NS_REPORT_SERVICE_TOKEN)
.useValue(mockNSReportService)
.compile();
```

### 禁止的測試模式
```typescript
// ❌ 嚴格禁止：真實 HTTP 請求
// nock('https://api.nsreport.com').post('/v3/GetNotificationStatusReport').reply(200, data);

// ❌ 嚴格禁止：使用真實 URL
// const response = await axios.post('https://api.nsreport.com/...');
```

## Parallel Execution Examples

### Phase 3.2: Launch all test creation in parallel
```bash
# Integration tests (T006-T009)
Task: "Integration test: Reports success scenario with mocked NS Report API"
Task: "Integration test: Authentication failure (missing ny-operator header)"
Task: "Integration test: Request validation errors (invalid UUID, date format)"
Task: "Integration test: External NS Report API errors with mocked failures"

# Unit test stubs (T010-T013)
Task: "Unit test stub for StatusReportRequestDto validation"
Task: "Unit test stub for ExternalNSReportService with mocked HttpService"
Task: "Unit test stub for NotificationStatusService with mocked dependencies"
Task: "Unit test stub for NotificationStatusController with mocked service"
```

### Phase 3.3: Launch DTO creation in parallel
```bash
Task: "Create StatusReportRequestDto with validation decorators"
Task: "Create StatusReportResponseDto with Swagger annotations"
```

### Phase 3.6: Launch final unit tests in parallel
```bash
Task: "Complete StatusReportRequestDto validation unit tests"
Task: "Complete ExternalNSReportService unit tests with HTTP error scenarios"
Task: "Complete NotificationStatusService unit tests with mocked dependencies"
Task: "Complete NotificationStatusController unit tests with mocked service"
```

## Validation Checklist
*GATE: Checked during execution*

- [x] All contracts have corresponding tests (T005)
- [x] All entities have DTO tasks (T014, T015)
- [x] All tests come before implementation (T005-T013 before T014-T025)
- [x] Parallel tasks truly independent (different files, no shared dependencies)
- [x] Each task specifies exact file path
- [x] No task modifies same file as another [P] task
- [x] Integration tests emphasize mocked external APIs (T006-T009, T011, T027)
- [x] Constitutional compliance: dependency abstraction (T016-T017), TDD approach, error handling layers

## Special Notes on External API Mocking

### Required Mock Scenarios (T006-T009)
1. **Success Response**: Mock NS Report API returning valid downloadUrl and expiredTime
2. **Authentication Failure**: Test missing/invalid ny-operator header (401)
3. **Validation Errors**: Test invalid request parameters (400)
4. **External API Failures**: Mock NS Report API returning 4xx, 5xx, timeout errors (500)

### Mock Implementation Pattern
All integration tests MUST use NestJS's `overrideProvider()` to replace the real `ExternalNSReportService` with a Jest mock. This ensures:
- No real HTTP requests during testing
- Controlled test scenarios for all error cases
- Fast and reliable test execution
- Constitutional compliance with testing guidelines

### Test Coverage Requirements
- Unit tests: ≥95% coverage for service and controller logic
- Integration tests: All HTTP endpoints with authentication, validation, and error scenarios
- Contract tests: 100% OpenAPI schema compliance verification

This task list follows TDD principles with special emphasis on mocking external APIs for reliable integration testing.