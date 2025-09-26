# Tasks: Proxy API 標準化重構

**Input**: Design documents from `/specs/004-proxy-api/`
**Prerequisites**: plan.md, research.md, data-model.md, contracts/, quickstart.md

## Execution Flow (main)
```
1. Load plan.md from feature directory ✓
   → Extract: TypeScript 5.x, NestJS 11.x, Jest + Supertest
   → Structure: NestJS API project with code in api/ directory
2. Load design documents ✓
   → data-model.md: 6 entities → model tasks
   → contracts/: 1 PATCH endpoint + contract tests → contract test task
   → quickstart.md: 7 test scenarios → integration test tasks
3. Generate tasks by category ✓
   → Setup: NestJS dependencies, TypeScript config, linting
   → Tests: contract tests, integration tests (TDD)
   → Core: DTOs, interceptors, filters, controller
   → Integration: middleware, error handling, logging
   → Polish: unit tests, performance validation, docs
4. Apply task rules ✓
   → Different files = mark [P] for parallel
   → Same file = sequential (no [P])
   → Tests before implementation (TDD)
5. Number tasks sequentially (T001, T002...) ✓
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions
- **NestJS API**: `api/modules/`, `api/common/`, `test/` at repository root
- Code structure follows existing NestJS project layout

## Phase 3.1: Setup
- [x] T001 Verify NestJS 11.x dependencies and TypeScript 5.x strict mode in package.json
- [x] T002 [P] Configure ESLint rules for enterprise API standards in eslint.config.mjs
- [x] T003 [P] Update tsconfig.json to ensure strict mode enabled and proper module resolution

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**
- [x] T004 [P] Contract test PATCH `/api/v1/shops/{shopId}/suppliers` in `test/contract/supplier-update-api.contract.spec.ts`
- [x] T005 [P] Integration test RESTful API design validation in `test/integration/restful-design.integration.spec.ts`
- [x] T006 [P] Integration test unified response format in `test/integration/response-format.integration.spec.ts`
- [x] T007 [P] Integration test structured error handling in `test/integration/error-handling.integration.spec.ts`
- [x] T008 [P] Integration test HTTP status code standardization in `test/integration/http-status.integration.spec.ts`
- [x] T009 [P] Integration test performance requirements in `test/integration/performance.integration.spec.ts`
- [x] T010 [P] Integration test API documentation validation in `test/integration/api-docs.integration.spec.ts`

## Phase 3.3: Core Implementation (ONLY after tests are failing)
- [x] T011 [P] SupplierUpdateRequest DTO in `api/modules/suppliers/dto/supplier-update-request.dto.ts`
- [x] T012 [P] ApiResponse generic interface in `api/common/interfaces/api-response.interface.ts`
- [x] T013 [P] ApiErrorResponse interface in `api/common/interfaces/api-error-response.interface.ts`
- [x] T014 [P] ErrorCode enum in `api/common/enums/error-code.enum.ts`
- [x] T015 [P] RequestContext interface in `api/common/interfaces/request-context.interface.ts`
- [x] T016 [P] LogEntry interface in `api/common/interfaces/log-entry.interface.ts`
- [x] T017 Request ID generation middleware in `api/common/middleware/request-id.middleware.ts`
- [x] T018 Response format interceptor in `api/common/interceptors/response-format.interceptor.ts`
- [x] T019 Global exception filter in `api/common/filters/http-exception.filter.ts`
- [x] T020 Logging middleware in `api/common/middleware/logging.middleware.ts`
- [x] T021 SuppliersController PATCH endpoint in `api/modules/suppliers/suppliers.controller.ts`
- [x] T022 SuppliersService business logic in `api/modules/suppliers/suppliers.service.ts`
- [x] T023 SuppliersModule configuration in `api/modules/suppliers/suppliers.module.ts`

## Phase 3.4: Integration
- [x] T024 Integrate middleware in AppModule in `api/app.module.ts`
- [ ] T025 Configure global interceptors and filters in `api/main.ts`
- [ ] T026 Update OpenAPI documentation in `api/modules/suppliers/suppliers.controller.ts` with @ApiProperty decorators
- [ ] T027 Remove old proxy endpoint from existing codebase
- [ ] T028 Update Whale API integration to work with new service structure

## Phase 3.5: Polish
- [ ] T029 [P] Unit tests for DTO validation in `test/unit/dto/supplier-update-request.dto.spec.ts`
- [ ] T030 [P] Unit tests for response interceptor in `test/unit/interceptors/response-format.interceptor.spec.ts`
- [ ] T031 [P] Unit tests for exception filter in `test/unit/filters/http-exception.filter.spec.ts`
- [ ] T032 [P] Unit tests for request ID middleware in `test/unit/middleware/request-id.middleware.spec.ts`
- [ ] T033 Performance validation against 10% baseline in `test/performance/api-performance.spec.ts`
- [ ] T034 Test coverage verification ≥ 80% using `npm run test:cov`
- [ ] T035 [P] Update API documentation in `openapi/` directory
- [ ] T036 Execute quickstart.md validation scenarios manually

## Dependencies
- Setup (T001-T003) before all other phases
- Tests (T004-T010) before implementation (T011-T023)
- DTOs and interfaces (T011-T016) before middleware/services (T017-T023)
- T017 blocks T018 (request ID needed for response format)
- T018, T019 block T024 (interceptors/filters needed for module integration)
- T021 blocks T022 (controller needs service)
- T022, T023 block T024 (service and module needed for app integration)
- Implementation (T011-T028) before polish (T029-T036)

## Parallel Execution Examples

### Phase 3.2 - All Tests Together (TDD)
```bash
# Launch T004-T010 in parallel:
Task: "Contract test PATCH /api/v1/shops/{shopId}/suppliers in test/contract/supplier-update-api.contract.spec.ts"
Task: "Integration test RESTful API design validation in test/integration/restful-design.integration.spec.ts"
Task: "Integration test unified response format in test/integration/response-format.integration.spec.ts"
Task: "Integration test structured error handling in test/integration/error-handling.integration.spec.ts"
Task: "Integration test HTTP status code standardization in test/integration/http-status.integration.spec.ts"
Task: "Integration test performance requirements in test/integration/performance.integration.spec.ts"
Task: "Integration test API documentation validation in test/integration/api-docs.integration.spec.ts"
```

### Phase 3.3 - Independent Models/Interfaces
```bash
# Launch T011-T016 in parallel (independent files):
Task: "SupplierUpdateRequest DTO in api/modules/suppliers/dto/supplier-update-request.dto.ts"
Task: "ApiResponse generic interface in api/common/interfaces/api-response.interface.ts"
Task: "ApiErrorResponse interface in api/common/interfaces/api-error-response.interface.ts"
Task: "ErrorCode enum in api/common/enums/error-code.enum.ts"
Task: "RequestContext interface in api/common/interfaces/request-context.interface.ts"
Task: "LogEntry interface in api/common/interfaces/log-entry.interface.ts"
```

### Phase 3.5 - Independent Unit Tests
```bash
# Launch T029-T032 in parallel:
Task: "Unit tests for DTO validation in test/unit/dto/supplier-update-request.dto.spec.ts"
Task: "Unit tests for response interceptor in test/unit/interceptors/response-format.interceptor.spec.ts"
Task: "Unit tests for exception filter in test/unit/filters/http-exception.filter.spec.ts"
Task: "Unit tests for request ID middleware in test/unit/middleware/request-id.middleware.spec.ts"
```

## Task Generation Rules Applied

1. **From Contracts**:
   - supplier-update-api.yaml → T004 contract test [P]
   - PATCH endpoint → T021 controller implementation

2. **From Data Model**:
   - SupplierUpdateRequest → T011 DTO [P]
   - ApiResponse<T> → T012 interface [P]
   - ApiErrorResponse → T013 interface [P]
   - ErrorCode → T014 enum [P]
   - RequestContext → T015 interface [P]
   - LogEntry → T016 interface [P]

3. **From User Stories (quickstart.md)**:
   - Test Scenario 1 → T005 RESTful design test [P]
   - Test Scenario 2 → T006 response format test [P]
   - Test Scenario 3 → T007 error handling test [P]
   - Test Scenario 4 → T008 HTTP status test [P]
   - Test Scenario 5 → T009 performance test [P]
   - Test Scenario 7 → T010 API docs test [P]

4. **From Technical Requirements**:
   - Middleware chain → T017-T020 sequential
   - NestJS integration → T021-T028 with dependencies
   - Testing requirements → T029-T034 with coverage

## Notes
- [P] tasks operate on different files with no dependencies
- Verify tests fail before implementing (TDD requirement)
- Maintain ≥ 80% test coverage throughout development
- Performance baseline: response time ≤ 110% of current baseline
- All tests must complete in < 2 seconds
- Commit after each completed task
- Remove old `/proxy/whale/update-supplier-id` endpoint completely

## Validation Checklist
*GATE: Checked before task execution*

- [x] All contracts have corresponding tests (T004 for supplier-update-api.yaml)
- [x] All entities have model tasks (T011-T016 for 6 entities)
- [x] All tests come before implementation (T004-T010 before T011-T023)
- [x] Parallel tasks truly independent (different files, no shared dependencies)
- [x] Each task specifies exact file path
- [x] No task modifies same file as another [P] task
- [x] TDD workflow enforced (failing tests required before implementation)
- [x] NestJS project structure followed
- [x] Enterprise API standards addressed