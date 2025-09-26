# Tasks: Whale API Proxy

**Input**: Design documents from `/Users/levichen/Project/91APP/upd3-ops-platform/specs/001-whale-api-proxy/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/, quickstart.md

## Execution Flow (main)
```
1. Load plan.md from feature directory
   → ✅ Found: tech stack (NestJS, TypeScript), structure (api/ directory)
2. Load optional design documents:
   → ✅ data-model.md: Extract entities (UpdateSupplierRequest, UpdateSupplierResponse)
   → ✅ contracts/: proxy-whale-api.yaml → contract test task
   → ✅ research.md: HTTP client (axios), logging, validation decisions
3. Generate tasks by category:
   → ✅ Setup: NestJS module structure, dependencies, linting
   → ✅ Tests: contract tests, integration tests (7 scenarios)
   → ✅ Core: DTOs, service, controller
   → ✅ Integration: HTTP client, error handling, logging
   → ✅ Polish: unit tests, performance, docs
4. Apply task rules:
   → ✅ Different files = mark [P] for parallel
   → ✅ Same file = sequential (no [P])
   → ✅ Tests before implementation (TDD)
5. Number tasks sequentially (T001, T002...)
6. Generate dependency graph
7. Create parallel execution examples
8. Validate task completeness:
   → ✅ All contracts have tests
   → ✅ All entities have DTOs
   → ✅ All endpoints implemented
9. Return: SUCCESS (tasks ready for execution)
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions
- **NestJS API**: `api/src/modules/`, `api/src/common/`, `test/` at repository root
- All paths adjusted for NestJS project structure

## Phase 3.1: Setup
- [x] T001 Create ProxyModule directory structure in `api/src/modules/proxy/`
- [x] T002 Install additional dependencies (@nestjs/axios, uuid) and update package.json
- [x] T003 [P] Configure HTTP module in `api/src/modules/proxy/proxy.module.ts`

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**
- [x] T004 [P] Contract test POST /proxy/whale/update-supplier-id in `test/proxy.controller.e2e-spec.ts`
- [x] T005 [P] Integration test successful supplier update in `test/proxy-success.integration-spec.ts`
- [x] T006 [P] Integration test missing ny-operator header in `test/proxy-validation.integration-spec.ts`
- [x] T007 [P] Integration test invalid payload validation in `test/proxy-invalid-payload.integration-spec.ts`
- [x] T008 [P] Integration test upstream API error handling in `test/proxy-upstream-error.integration-spec.ts`
- [x] T009 [P] Unit tests for ProxyService in `api/src/modules/proxy/proxy.service.spec.ts`

## Phase 3.3: Core Implementation (ONLY after tests are failing)
- [x] T010 [P] UpdateSupplierRequest DTO in `api/src/modules/proxy/dto/update-supplier-request.dto.ts`
- [x] T011 [P] UpdateSupplierResponse interface in `api/src/modules/proxy/interfaces/update-supplier-response.interface.ts`
- [x] T012 ProxyService with HTTP client integration in `api/src/modules/proxy/proxy.service.ts`
- [x] T013 ProxyController with Swagger decorators in `api/src/modules/proxy/proxy.controller.ts`
- [x] T014 Register ProxyModule in `api/src/app.module.ts`

## Phase 3.4: Integration
- [x] T015 Add global logging interceptor in `api/src/common/interceptors/logging.interceptor.ts`
- [x] T016 Add global exception filter in `api/src/common/filters/http-exception.filter.ts`
- [x] T017 Configure request ID generation middleware in `api/src/common/middleware/request-id.middleware.ts`
- [x] T018 Register global interceptors and filters in `api/src/main.ts`

## Phase 3.5: Polish
- [x] T019 [P] Unit tests for DTO validation in `test/unit/dto-validation.spec.ts`
- [x] T020 Performance test (<200ms response time) in `test/performance/proxy-performance.spec.ts`
- [x] T021 [P] Update API documentation generation in `api/src/main.ts`
- [x] T022 Code cleanup and remove any TODO comments
- [x] T023 Run manual testing scenarios from `specs/001-whale-api-proxy/quickstart.md`

## Dependencies
- Setup (T001-T003) before all other tasks
- Tests (T004-T009) before implementation (T010-T014)
- T010, T011 (DTOs) before T012 (Service)
- T012 (Service) before T013 (Controller)
- T013 (Controller) before T014 (Module registration)
- Integration tasks (T015-T018) after core implementation
- Polish tasks (T019-T023) after integration

## Parallel Example
```bash
# Setup Phase - Run sequentially
# T001 → T002 → T003

# TDD Phase - Launch T004-T009 together:
# These can run in parallel as they create different test files
Task: "Contract test POST /proxy/whale/update-supplier-id in test/proxy.controller.e2e-spec.ts"
Task: "Integration test successful supplier update in test/proxy-success.integration-spec.ts"
Task: "Integration test missing ny-operator header in test/proxy-validation.integration-spec.ts"
Task: "Integration test invalid payload validation in test/proxy-invalid-payload.integration-spec.ts"
Task: "Integration test upstream API error handling in test/proxy-upstream-error.integration-spec.ts"
Task: "Unit tests for ProxyService in api/src/modules/proxy/proxy.service.spec.ts"

# Core Implementation Phase - T010-T011 in parallel, then T012-T014 sequentially:
Task: "UpdateSupplierRequest DTO in api/src/modules/proxy/dto/update-supplier-request.dto.ts"
Task: "UpdateSupplierResponse interface in api/src/modules/proxy/interfaces/update-supplier-response.interface.ts"

# Integration Phase - T015-T017 in parallel, then T018:
Task: "Add global logging interceptor in api/src/common/interceptors/logging.interceptor.ts"
Task: "Add global exception filter in api/src/common/filters/http-exception.filter.ts"
Task: "Configure request ID generation middleware in api/src/common/middleware/request-id.middleware.ts"

# Polish Phase - T019, T021 in parallel:
Task: "Unit tests for DTO validation in test/unit/dto-validation.spec.ts"
Task: "Update API documentation generation in api/src/main.ts"
```

## Notes
- [P] tasks = different files, no dependencies
- Verify tests fail before implementing (critical for TDD)
- Commit after each task completion
- All HTTP client calls should be mocked in unit tests
- Integration tests can use real HTTP calls or test containers

## Task Generation Summary
*Applied during main() execution*

1. **From Contracts**:
   - ✅ proxy-whale-api.yaml → contract test T004
   - ✅ Single endpoint → implementation tasks T012-T013

2. **From Data Model**:
   - ✅ UpdateSupplierRequest → DTO creation task T010
   - ✅ UpdateSupplierResponse → interface creation task T011
   - ✅ ProxyLogEntry → logging infrastructure tasks T015-T017

3. **From Quickstart Scenarios**:
   - ✅ Scenario 1: Success → T005
   - ✅ Scenario 2: Missing header → T006
   - ✅ Scenario 3-4: Validation → T007
   - ✅ Scenario 6-7: Error handling → T008

4. **NestJS-Specific Requirements**:
   - ✅ Module structure → T001, T003, T014
   - ✅ HTTP client setup → T002, T012
   - ✅ Global interceptors/filters → T015-T018
   - ✅ Swagger documentation → T013, T021

## Validation Checklist
*GATE: Checked by main() before returning*

- [x] All contracts have corresponding tests (T004)
- [x] All entities have model/DTO tasks (T010, T011)
- [x] All tests come before implementation (T004-T009 before T010-T014)
- [x] Parallel tasks truly independent (different files)
- [x] Each task specifies exact file path
- [x] No task modifies same file as another [P] task
- [x] TDD workflow enforced (tests must fail before implementation)
- [x] All 7 quickstart scenarios covered in tests
- [x] Constitutional requirements addressed (validation, logging, error handling)