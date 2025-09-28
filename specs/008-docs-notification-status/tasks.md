# Tasks: Notification Status Devices API

**Input**: Design documents from `/specs/008-docs-notification-status/`
**Prerequisites**: plan.md, research.md, data-model.md, contracts/devices-api.yaml, quickstart.md

## Execution Flow (main)
```
1. Load plan.md from feature directory
   → Tech stack: TypeScript 5.x with NestJS 10.x, Axios, class-validator, Swagger
   → Structure: Monorepo web app with api/ backend
2. Load design documents:
   → data-model.md: Device, Customer entities
   → contracts/devices-api.yaml: GET /api/v1/notification-status/devices endpoint
   → quickstart.md: Integration test scenarios
3. Generate tasks by category following TDD approach
4. Apply task rules: Different files [P], same file sequential
5. SUCCESS: 24 tasks ready for execution
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Exact file paths included for each task

## Path Conventions
Based on existing project structure:
- Backend: `api/modules/notification-status/`
- Unit Tests: Within modules (e.g., `api/modules/notification-status/services/*.spec.ts`)
- Integration Tests: Within modules (e.g., `api/modules/notification-status/integration/*.spec.ts`)
- Config: `api/config/`

## Phase 3.1: Setup

- [ ] T001 Create notification-status module structure in `api/modules/notification-status/` with dto/, interfaces/, services/, controllers/, integration/, and module file
- [ ] T002 Install required dependencies: @nestjs/axios, @nestjs/config, class-validator, class-transformer, and configure package.json
- [ ] T003 [P] Configure Marketing Cloud config in `api/config/marketing-cloud.config.ts` following existing pattern (reference api/config/nc-api.config.ts)

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**

- [X] T004 [P] Contract test for GET /api/v1/notification-status/devices in `api/modules/notification-status/integration/devices-contract.spec.ts` validating OpenAPI spec compliance
- [X] T005 [P] Integration test for successful device query scenario in `api/modules/notification-status/integration/devices-success.spec.ts` with mocked Marketing Cloud responses
- [X] T006 [P] Integration test for validation errors in `api/modules/notification-status/integration/devices-validation.spec.ts` testing shopId and phone validation
- [X] T007 [P] Integration test for authentication errors in `api/modules/notification-status/integration/devices-auth.spec.ts` testing ny-operator header requirement
- [X] T008 [P] Integration test for external API errors in `api/modules/notification-status/integration/devices-external-errors.spec.ts` testing timeout and Marketing Cloud failures
- [X] T009 [P] Integration test for not found scenarios in `api/modules/notification-status/integration/devices-notfound.spec.ts` testing empty device responses

## Phase 3.3: Core Implementation (ONLY after tests are failing)

- [ ] T010 [P] Create Device DTO in `api/modules/notification-status/dto/device.dto.ts` with class-validator decorations and Swagger annotations
- [ ] T011 [P] Create DeviceQueryRequest DTO in `api/modules/notification-status/dto/device-query-request.dto.ts` with shopId and phone validation
- [ ] T012 [P] Create standardized response DTOs in `api/modules/notification-status/dto/device-response.dto.ts` for success and error formats
- [ ] T013 [P] Create IMarketingCloudService interface in `api/modules/notification-status/interfaces/marketing-cloud.interface.ts` with getDevices method signature
- [ ] T014 Create MarketingCloudService implementation in `api/modules/notification-status/services/marketing-cloud.service.ts` with HttpService integration and 10-second timeout
- [ ] T015 Create NotificationStatusService business logic in `api/modules/notification-status/services/notification-status.service.ts` with device query orchestration
- [ ] T016 Create ny-operator authentication guard in `api/modules/notification-status/guards/ny-operator.guard.ts` validating header presence
- [ ] T017 Create NotificationStatusController in `api/modules/notification-status/controllers/notification-status.controller.ts` with GET /devices endpoint
- [ ] T018 Create request ID interceptor in `api/common/interceptors/request-id.interceptor.ts` for unique tracking IDs
- [ ] T019 Create standardized exception filter in `api/common/filters/api-exception.filter.ts` for error response formatting

## Phase 3.4: Integration

- [ ] T020 Wire up NotificationStatusModule in `api/modules/notification-status/notification-status.module.ts` with all providers and dependencies
- [ ] T021 Register module in main AppModule with proper imports and configuration
- [ ] T022 Add Swagger documentation setup with API versioning and security definitions for ny-operator header

## Phase 3.5: Polish

- [ ] T023 [P] Unit tests for MarketingCloudService in `api/modules/notification-status/services/marketing-cloud.service.spec.ts` with HttpService mocks and timeout scenarios
- [ ] T024 [P] Unit tests for NotificationStatusService in `api/modules/notification-status/services/notification-status.service.spec.ts` with comprehensive mock scenarios

## Dependencies

**Sequential Dependencies**:
- Setup (T001-T003) before all others
- Tests (T004-T009) before implementation (T010-T019)
- T014 (MarketingCloudService) before T015 (NotificationStatusService)
- T015 before T017 (Controller)
- T016 (Guard) and T018 (Interceptor) before T017 (Controller)
- T019 (Exception Filter) before T021 (Module registration)
- Integration (T020-T022) before polish (T023-T024)

**Parallel Groups**:
- T004-T009: All integration test files (different files, independent)
- T010-T013: All DTO files (different files, independent)
- T023-T024: All unit test files (different service files, independent)
- T003, T018, T019: Marketing Cloud config and common utilities (different modules)

## Parallel Execution Examples

### Phase 3.2 - All Tests Together:
```bash
Task: "Contract test for GET /api/v1/notification-status/devices in api/modules/notification-status/integration/devices-contract.spec.ts"
Task: "Integration test for successful device query in api/modules/notification-status/integration/devices-success.spec.ts"
Task: "Integration test for validation errors in api/modules/notification-status/integration/devices-validation.spec.ts"
Task: "Integration test for authentication errors in api/modules/notification-status/integration/devices-auth.spec.ts"
Task: "Integration test for external API errors in api/modules/notification-status/integration/devices-external-errors.spec.ts"
Task: "Integration test for not found scenarios in api/modules/notification-status/integration/devices-notfound.spec.ts"
```

### Phase 3.3 - DTOs in Parallel:
```bash
Task: "Create Device DTO in api/modules/notification-status/dto/device.dto.ts"
Task: "Create DeviceQueryRequest DTO in api/modules/notification-status/dto/device-query-request.dto.ts"
Task: "Create response DTOs in api/modules/notification-status/dto/device-response.dto.ts"
Task: "Create IMarketingCloudService interface in api/modules/notification-status/interfaces/marketing-cloud.interface.ts"
```

## Task Generation Details

### From contracts/devices-api.yaml:
- T004: Contract test for API specification compliance
- T010-T012: DTO creation for request/response models
- T017: Controller endpoint implementation

### From data-model.md:
- T010: Device entity DTO with validation rules
- T011: Customer query parameters DTO
- T015: Service layer for business logic

### From quickstart.md scenarios:
- T005: Success case integration test
- T006: Validation error test
- T007: Authentication error test
- T008: External API error test
- T009: Not found case test

### From constitutional requirements:
- T013: Interface abstraction for external dependency
- T016: Authentication guard implementation
- T018: Request tracking interceptor
- T019: Standardized error handling
- T023-T024: Comprehensive unit tests for all services

## Validation Checklist

- [x] All contracts have corresponding tests (T004)
- [x] All entities have model tasks (T010-T012)
- [x] All tests come before implementation (T004-T009 before T010-T019)
- [x] Parallel tasks truly independent (different files)
- [x] Each task specifies exact file path
- [x] No task modifies same file as another [P] task
- [x] TDD approach enforced (failing tests required)
- [x] Constitutional requirements covered (abstraction, testing, standards)

## Notes

- **TDD Critical**: Tests T004-T009 MUST fail before implementing T010-T019
- **[P] Independence**: Parallel tasks work on different files with no shared dependencies
- **File Paths**: All paths are exact and ready for implementation
- **Constitutional Compliance**: Follows dependency abstraction and testing-first principles
- **Commit Strategy**: Commit after each completed task for progress tracking