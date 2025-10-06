# Tasks: 系統稽核日誌

**Input**: Design documents from `/specs/011-011-audit-log/`
**Prerequisites**: plan.md (required), research.md, data-model.md, contracts/

## Execution Flow (main)
```
1. Load plan.md from feature directory
   → Extracted: TypeScript 5.x + NestJS 10.x, file-based storage, web backend
   → Structure: api/modules/audit-log/, common/constants/, common/utils/
2. Load optional design documents:
   → data-model.md: AuditLogData, QueryCriteria, Result entities
   → contracts/audit-log-api.yaml: GET /api/v1/audit-logs endpoint
   → research.md: NestJS Interceptor, JSON Lines format, sensitive masking
3. Generate tasks by category:
   → Setup: audit-log module, constants, dependencies
   → Tests: contract tests, integration tests
   → Core: interfaces, services, DTOs, interceptor, controller
   → Integration: module wiring, file management, cleanup
   → Polish: unit tests, performance validation, docs
4. Apply task rules:
   → Different files = mark [P] for parallel
   → Same file = sequential (no [P])
   → Tests before implementation (TDD)
5. Number tasks sequentially (T001, T002...)
6. Generate dependency graph
7. Create parallel execution examples
8. Validate task completeness:
   → audit-log-api.yaml has contract test ✓
   → AuditLogData, QueryCriteria have DTOs ✓
   → GET /api/v1/audit-logs endpoint implemented ✓
9. Return: SUCCESS (tasks ready for execution)
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions
- **Web backend**: `api/` for NestJS application code
- **Tests**: `test/` at repository root
- **Logs**: `logs/audit/` for audit log files

## Phase 3.1: Setup
- [x] T001 Create audit-log module structure: `api/modules/audit-log/` directory with module, controller, service files
- [x] T002 [P] Configure audit log constants in `api/common/constants/audit-log.constants.ts`
- [x] T003 [P] Configure file path constants in `api/common/constants/file-paths.constants.ts`

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3
**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**
- [x] T004 [P] Contract test GET /api/v1/audit-logs in `test/contract/audit-log.contract.spec.ts`
- [x] T005 [P] Integration test audit log interceptor flow in `test/integration/audit-log-flow.integration.spec.ts`
- [x] T006 [P] Integration test file cleanup mechanism in `api/modules/audit-log/integration/audit-cleanup.integration.spec.ts`
- [x] T007 [P] Integration test sensitive data masking in `api/modules/audit-log/integration/audit-masking.integration.spec.ts`

## Phase 3.3: Core Implementation (ONLY after tests are failing)
- [x] T008 [P] Create IAuditLogService interface in `api/modules/audit-log/interfaces/audit-log.interface.ts`
- [x] T009 [P] Create AuditLogQueryDto in `api/modules/audit-log/dto/audit-log-query.dto.ts`
- [x] T010 [P] Create AuditLogResponseDto in `api/modules/audit-log/dto/audit-log-response.dto.ts`
- [x] T011 [P] Create SensitiveDataMasker utility in `api/common/utils/sensitive-data-masker.ts`
- [x] T012 [P] Create AuditLogFileManager utility in `api/common/utils/audit-log-file-manager.ts`
- [x] T013 [P] Create AuditStorageException in `api/common/exceptions/audit-storage.exception.ts`
- [x] T013a [P] Create @AuditLog decorator in `api/common/decorators/audit-log.decorator.ts`
- [x] T014 FileSystemAuditLogService implementation in `api/modules/audit-log/services/file-system-audit-log.service.ts`
- [x] T015 AuditLogInterceptor implementation using decorator metadata in `api/modules/audit-log/interceptors/audit-log.interceptor.ts`
- [x] T016 AuditLogController implementation in `api/modules/audit-log/audit-log.controller.ts`
- [x] T017 AuditLogService main service in `api/modules/audit-log/audit-log.service.ts`
- [x] T018 Input validation for query parameters
- [x] T019 Error handling for storage failures and HTTP 503 responses

## Phase 3.4: Integration
- [x] T020 Wire AuditLogModule dependencies and exports in `api/modules/audit-log/audit-log.module.ts`
- [x] T021 Add @AuditLog decorators to existing suppliers API in `api/modules/suppliers/suppliers.controller.ts`
- [x] T021a Add @AuditLog decorators to existing notification-status APIs in `api/modules/notification-status/notification-status.controller.ts`
- [x] T022 Configure file cleanup scheduler (node-cron integration)
- [x] T023 Ensure logs directory creation and permissions

## Phase 3.5: Polish
- [x] T024 [P] Unit tests for SensitiveDataMasker in `api/common/utils/sensitive-data-masker.spec.ts`
- [x] T025 [P] Unit tests for AuditLogFileManager in `api/common/utils/audit-log-file-manager.spec.ts`
- [ ] T026 [P] Unit tests for FileSystemAuditLogService in `api/modules/audit-log/services/file-system-audit-log.service.spec.ts` (可選)
- [ ] T027 [P] Unit tests for AuditLogService in `api/modules/audit-log/audit-log.service.spec.ts` (可選)
- [ ] T028 [P] Unit tests for AuditLogController in `api/modules/audit-log/audit-log.controller.spec.ts` (可選)
- [ ] T028a [P] Unit tests for @AuditLog decorator in `api/common/decorators/audit-log.decorator.spec.ts` (可選)
- [ ] T029 Performance validation: verify ≤1 ops/sec write performance (整合後執行)
- [x] T030 [P] Update OpenAPI documentation with audit-logs endpoint (已在 Controller 中使用 Swagger 裝飾器)
- [ ] T031 Run quickstart.md validation scenarios (需要完成最終整合後執行)
- [x] T032 Code review and refactoring for duplication removal (已完成，無重複代碼)

## Dependencies
- Tests (T004-T007) before implementation (T008-T019)
- T008 (interface) blocks T014, T017
- T009, T010 (DTOs) block T016 (controller)
- T011, T012 (utilities) block T014, T015 (services using them)
- T013a (decorator) blocks T015 (interceptor), T021, T021a (API marking)
- T014, T015, T016, T017 block T020 (module integration)
- T020 blocks T021, T021a, T022 (app-level integration)
- Implementation before polish (T024-T032)

## Parallel Example
```bash
# Launch T002-T003 together (setup constants):
Task: "Configure audit log constants in api/common/constants/audit-log.constants.ts"
Task: "Configure file path constants in api/common/constants/file-paths.constants.ts"

# Launch T004-T007 together (all tests):
Task: "Contract test GET /api/v1/audit-logs in test/contract/audit-log.contract.spec.ts"
Task: "Integration test audit flow in test/integration/audit-log-flow.integration.spec.ts"
Task: "Integration test cleanup in api/modules/audit-log/integration/audit-cleanup.integration.spec.ts"
Task: "Integration test masking in api/modules/audit-log/integration/audit-masking.integration.spec.ts"

# Launch T008-T013a together (independent core components):
Task: "Create IAuditLogService interface in api/modules/audit-log/interfaces/audit-log.interface.ts"
Task: "Create AuditLogQueryDto in api/modules/audit-log/dto/audit-log-query.dto.ts"
Task: "Create AuditLogResponseDto in api/modules/audit-log/dto/audit-log-response.dto.ts"
Task: "Create SensitiveDataMasker utility in api/common/utils/sensitive-data-masker.ts"
Task: "Create AuditLogFileManager utility in api/common/utils/audit-log-file-manager.ts"
Task: "Create AuditStorageException in api/common/exceptions/audit-storage.exception.ts"
Task: "Create @AuditLog decorator in api/common/decorators/audit-log.decorator.ts"

# Launch T024-T028a together (unit tests):
Task: "Unit tests for SensitiveDataMasker in api/common/utils/sensitive-data-masker.spec.ts"
Task: "Unit tests for AuditLogFileManager in api/common/utils/audit-log-file-manager.spec.ts"
Task: "Unit tests for FileSystemAuditLogService in api/modules/audit-log/services/file-system-audit-log.service.spec.ts"
Task: "Unit tests for AuditLogService in api/modules/audit-log/audit-log.service.spec.ts"
Task: "Unit tests for AuditLogController in api/modules/audit-log/audit-log.controller.spec.ts"
Task: "Unit tests for @AuditLog decorator in api/common/decorators/audit-log.decorator.spec.ts"
```

## Notes
- [P] tasks = different files, no dependencies
- Verify tests fail before implementing
- Commit after each task
- Follow NestJS module structure and dependency injection patterns
- Ensure all sensitive data masking patterns from research.md are implemented
- File storage must use JSON Lines format (.jsonl)
- Query API must enforce 7-day limit and pagination
- **IMPORTANT**: Use @AuditLog decorator approach instead of global path-based interception
- Each API endpoint must be explicitly marked with @AuditLog({ page, action }) to be audited
- Interceptor should only process endpoints with @AuditLog decorator metadata

## Task Generation Rules
*Applied during main() execution*

1. **From Contracts**:
   - audit-log-api.yaml → contract test task T004 [P]
   - GET /api/v1/audit-logs → implementation tasks T016, T017
   
2. **From Data Model**:
   - AuditLogData → DTOs and interface tasks T008, T009, T010 [P]
   - QueryCriteria → validation and controller integration T016, T018
   - Result → response formatting T010, T016
   
3. **From Research**:
   - NestJS Interceptor → T015 implementation
   - JSON Lines storage → T014 file system service
   - Sensitive masking → T011 utility and T007 test
   - File cleanup → T022 scheduler integration

4. **From Quickstart**:
   - Validation scenarios → T031 quickstart execution
   - Performance tests → T029 validation task

5. **Ordering**:
   - Setup → Tests → Interfaces/DTOs → Utilities → Services → Controller → Module → Integration → Polish
   - Dependencies block parallel execution

## Validation Checklist
*GATE: Checked by main() before returning*

- [x] All contracts have corresponding tests (audit-log-api.yaml → T004)
- [x] All entities have model tasks (AuditLogData → T008, T009, T010)
- [x] All tests come before implementation (T004-T007 before T008-T019)
- [x] Parallel tasks truly independent (different files, no shared dependencies)
- [x] Each task specifies exact file path
- [x] No task modifies same file as another [P] task
- [x] Core architectural decisions from research.md reflected in tasks
- [x] Constitution requirements covered (TDD, abstraction, constants, error handling)