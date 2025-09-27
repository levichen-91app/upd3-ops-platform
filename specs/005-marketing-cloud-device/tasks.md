# Tasks: Marketing Cloud 裝置 API 整合

**Input**: Design documents from `/specs/005-marketing-cloud-device/`
**Prerequisites**: plan.md (✓), research.md (✓), data-model.md (✓), contracts/ (✓), quickstart.md (✓)

## Execution Flow (main)
```
1. Load plan.md from feature directory ✓
   → Tech stack: TypeScript 5.x, NestJS 11.x, @nestjs/axios
   → Structure: NestJS API 模組化架構
2. Load design documents: ✓
   → data-model.md: Device, QueryRequest, QueryResponse entities
   → contracts/: marketing-cloud-api.yaml OpenAPI contract
   → research.md: @nestjs/axios, external-apis.config.ts decisions
3. Generate tasks by category: ✓
   → Setup: 配置更新, 依賴項目, nock mock 工具
   → Tests: 契約測試, 單元測試, 整合測試, E2E 測試
   → Core: DTOs, Service, Controller, Module
   → Integration: 配置整合, 錯誤處理, 日誌隱私保護
   → Polish: 文件, Swagger, 最終驗證
4. Apply task rules: ✓
   → Different files = [P] parallel
   → Same file = sequential
   → Tests before implementation (TDD)
5. Number tasks sequentially (T001-T025)
6. Generate dependency graph and parallel examples
```

## Format: `[ID] [P?] Description`
- **[P]**: Can run in parallel (different files, no dependencies)
- Include exact file paths in descriptions

## Path Conventions
- **NestJS API**: `api/modules/marketing-cloud/`, `api/config/`, `test/` at repository root
- All paths are absolute from project root

---

## Phase 3.1: Setup & Dependencies

- [X] **T001** Update external APIs configuration in `api/config/external-apis.config.ts` - Add marketingCloudApi configuration with multi-environment support (development/staging/production/test)

- [X] **T002** [P] Install nock dependency for external API mocking - Add `npm install --save-dev nock @types/nock` and update package.json

- [X] **T003** [P] Create module directory structure - Create `api/modules/marketing-cloud/` and subdirectories: `dto/`, `entities/`

---

## Phase 3.2: Tests First (TDD) ⚠️ MUST COMPLETE BEFORE 3.3

**CRITICAL: These tests MUST be written and MUST FAIL before ANY implementation**

- [X] **T004** [P] Contract test for getMemberDevices endpoint in `test/marketing-cloud-contract.spec.ts` - Test OpenAPI contract compliance, request/response schemas, HTTP status codes (200/400/401/404/502)

- [X] **T005** [P] Unit test for MarketingCloudService in `api/modules/marketing-cloud/marketing-cloud.service.spec.ts` - Test external API calls, error handling, configuration injection, data transformation, timeout handling

- [X] **T006** [P] Integration test for complete API flow in `test/marketing-cloud-integration.spec.ts` - Test Controller → Service flow, DTO validation, header validation (ny-operator), mock external API responses

- [X] **T007** [P] E2E test with nock mocking in `test/marketing-cloud-e2e.spec.ts` - Test real HTTP requests with mocked external Marketing Cloud API, all error scenarios, timeout handling

- [X] **T008** [P] Privacy logging test in `test/marketing-cloud-privacy.spec.ts` - Test phone number masking (091****678), sensitive data not logged (tokens, UDIDs), request ID generation

---

## Phase 3.3: Core Implementation (ONLY after tests are failing)

- [X] **T009** [P] Device entity in `api/modules/marketing-cloud/entities/device.entity.ts` - Define Device interface with all properties, validation constraints, TypeScript types

- [X] **T010** [P] QueryRequest DTO in `api/modules/marketing-cloud/dto/get-member-devices-query.dto.ts` - Define path parameters, validation decorators (@IsNumber, @IsString), Swagger documentation (@ApiProperty)

- [X] **T011** [P] MemberDevicesResponse DTO in `api/modules/marketing-cloud/dto/member-devices-response.dto.ts` - Define response structure, ApiResponse wrapper, DeviceDto class with Swagger docs

- [X] **T012** MarketingCloudService implementation in `api/modules/marketing-cloud/marketing-cloud.service.ts` - Implement external API call logic, error mapping (400/404/502), configuration injection, timeout handling, privacy logging

- [X] **T013** MarketingCloudController implementation in `api/modules/marketing-cloud/marketing-cloud.controller.ts` - Implement GET endpoint, parameter validation, header validation (ny-operator), Swagger documentation

- [X] **T014** Privacy utility functions in `api/common/utils/privacy.util.ts` - Implement phone number masking function, sensitive data filtering for logs

- [X] **T015** MarketingCloudModule configuration in `api/modules/marketing-cloud/marketing-cloud.module.ts` - Configure module with HttpModule, external config injection, controller and service registration

---

## Phase 3.4: Integration

- [X] **T016** Update app.module.ts to import MarketingCloudModule - Add module to imports array, ensure proper dependency injection

- [X] **T017** Error handling integration in MarketingCloudService - Map external API errors to standard HTTP exceptions, use ApiErrorResponse format, include request tracking

- [X] **T018** Request/response interceptor integration - Add request ID generation, response timing, privacy-aware logging with masked sensitive data

- [X] **T019** Configuration validation - Test multi-environment config loading, environment variable overrides, timeout and URL validation

---

## Phase 3.5: Polish & Documentation

- [ ] **T020** [P] Unit tests for DTOs and validation in `test/unit/marketing-cloud-dto.spec.ts` - Test all validation rules, error messages, data transformation

- [ ] **T021** [P] Performance tests in `test/performance/marketing-cloud-performance.spec.ts` - Test < 10 concurrent requests, 5-second timeout verification, memory usage validation

- [ ] **T022** [P] Update Swagger documentation verification - Ensure OpenAPI spec matches implementation, test examples work, all error responses documented

- [ ] **T023** [P] Linting and formatting - Run `npm run lint` and `npm run test:cov`, ensure ≥80% test coverage, fix any ESLint errors

- [ ] **T024** Manual testing with quickstart.md scenarios - Execute all curl commands from quickstart guide, verify responses match expected formats

- [ ] **T025** Final integration verification - Run all test suites (unit, integration, e2e), verify external API mock scenarios work correctly

---

## Dependencies

**Sequential Dependencies:**
- T001 (config) → T012 (service implementation)
- T009-T011 (DTOs/entities) → T012 (service)
- T012 (service) → T013 (controller)
- T013 (controller) → T015 (module)
- T015 (module) → T016 (app integration)
- Tests (T004-T008) must complete before implementation (T009-T025)

**Parallel Groups:**
- **Setup**: T002, T003 can run together
- **Tests**: T004, T005, T006, T007, T008 can run together (different files)
- **DTOs/Entities**: T009, T010, T011 can run together (different files)
- **Polish**: T020, T021, T022, T023 can run together (different files)

---

## Parallel Execution Examples

### Phase 3.2 - All Tests Together:
```bash
# Launch T004-T008 in parallel:
Task: "Contract test getMemberDevices in test/marketing-cloud-contract.spec.ts"
Task: "Unit test MarketingCloudService in api/modules/marketing-cloud/marketing-cloud.service.spec.ts"
Task: "Integration test complete flow in test/marketing-cloud-integration.spec.ts"
Task: "E2E test with nock in test/marketing-cloud-e2e.spec.ts"
Task: "Privacy logging test in test/marketing-cloud-privacy.spec.ts"
```

### Phase 3.3 - Core DTOs/Entities:
```bash
# Launch T009-T011 in parallel:
Task: "Device entity in api/modules/marketing-cloud/entities/device.entity.ts"
Task: "QueryRequest DTO in api/modules/marketing-cloud/dto/get-member-devices-query.dto.ts"
Task: "MemberDevicesResponse DTO in api/modules/marketing-cloud/dto/member-devices-response.dto.ts"
```

### Phase 3.5 - Polish Tasks:
```bash
# Launch T020-T023 in parallel:
Task: "Unit tests DTOs in test/unit/marketing-cloud-dto.spec.ts"
Task: "Performance tests in test/performance/marketing-cloud-performance.spec.ts"
Task: "Update Swagger documentation verification"
Task: "Linting and formatting checks"
```

---

## Mock Strategy Implementation

### T007 E2E Test Mock Setup:
```typescript
// test/marketing-cloud-e2e.spec.ts setup example
import * as nock from 'nock';

beforeEach(() => {
  // Success scenario
  nock('http://marketing-cloud-service.qa.91dev.tw')
    .get('/v1/shops/12345/phones/0912345678/devices')
    .reply(200, [/* mock device data */]);

  // 404 scenario
  nock('http://marketing-cloud-service.qa.91dev.tw')
    .get('/v1/shops/12345/phones/0900000000/devices')
    .reply(404);

  // Timeout scenario
  nock('http://marketing-cloud-service.qa.91dev.tw')
    .get('/v1/shops/12345/phones/0911111111/devices')
    .delay(6000)
    .reply(200, []);
});
```

---

## Validation Checklist
*GATE: Checked before task execution*

- [x] All contracts have corresponding tests (T004 for marketing-cloud-api.yaml)
- [x] All entities have model tasks (T009-T011 for Device, QueryRequest, Response)
- [x] All tests come before implementation (T004-T008 before T009-T025)
- [x] Parallel tasks truly independent (different files, no shared dependencies)
- [x] Each task specifies exact file path (all paths specified)
- [x] No task modifies same file as another [P] task (verified)

---

## Testing Context & Goals Summary

根據用戶要求的詳細測試說明：

**單元測試 (T005, T020):**
- **目標**: 驗證 Service 業務邏輯隔離性
- **脈絡**: Mock 所有外部依賴，專注核心邏輯測試

**整合測試 (T006):**
- **目標**: 驗證模組間協作正確性
- **脈絡**: Controller → Service 完整流程，包含 DTO 驗證

**E2E 測試 (T007):**
- **目標**: 模擬真實用戶使用場景
- **脈絡**: 完整 HTTP 請求週期，使用 nock mock 外部 API

**契約測試 (T004):**
- **目標**: 確保 API 符合 OpenAPI 規格
- **脈絡**: 驗證請求/回應結構一致性

**隱私測試 (T008):**
- **目標**: 驗證敏感資料保護機制
- **脈絡**: 日誌遮蔽、資料不洩漏驗證