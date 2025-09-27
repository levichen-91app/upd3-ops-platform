
# Implementation Plan: Marketing Cloud 裝置 API 整合

**Branch**: `005-marketing-cloud-device` | **Date**: 2025-09-27 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/005-marketing-cloud-device/spec.md`

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path
   → If not found: ERROR "No feature spec at {path}"
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
   → Detect Project Type from context (web=frontend+backend, mobile=app+api)
   → Set Structure Decision based on project type
3. Fill the Constitution Check section based on the content of the constitution document.
4. Evaluate Constitution Check section below
   → If violations exist: Document in Complexity Tracking
   → If no justification possible: ERROR "Simplify approach first"
   → Update Progress Tracking: Initial Constitution Check
5. Execute Phase 0 → research.md
   → If NEEDS CLARIFICATION remain: ERROR "Resolve unknowns"
6. Execute Phase 1 → contracts, data-model.md, quickstart.md, agent-specific template file (e.g., `CLAUDE.md` for Claude Code, `.github/copilot-instructions.md` for GitHub Copilot, `GEMINI.md` for Gemini CLI, `QWEN.md` for Qwen Code or `AGENTS.md` for opencode).
7. Re-evaluate Constitution Check section
   → If new violations: Refactor design, return to Phase 1
   → Update Progress Tracking: Post-Design Constitution Check
8. Plan Phase 2 → Describe task generation approach (DO NOT create tasks.md)
9. STOP - Ready for /tasks command
```

**IMPORTANT**: The /plan command STOPS at step 7. Phases 2-4 are executed by other commands:
- Phase 2: /tasks command creates tasks.md
- Phase 3-4: Implementation execution (manual or via tools)

## Summary
內部營運團隊需要透過 RESTful API 查詢會員在 Marketing Cloud 系統中的裝置資訊。系統將作為透明代理，接收商店 ID 和手機號碼參數，呼叫外部 Marketing Cloud Device API，並回傳完整的裝置資料包括推播 Token、平台資訊等。重點要求包括 5 秒超時、< 10 並發支援、隱私資料日誌遮蔽，以及標準化錯誤處理。

## Technical Context
**Language/Version**: TypeScript 5.x with strict mode (NestJS 11.x)
**Primary Dependencies**: NestJS 11.x, @nestjs/common, @nestjs/axios, @nestjs/swagger, class-validator, class-transformer
**Storage**: N/A (透明代理，無資料儲存需求)
**Testing**: Jest + Supertest (單元測試、整合測試、E2E測試) - 用戶要求詳細說明測試目標、脈絡
**Target Platform**: Node.js 18+ server environment, Docker deployment
**Project Type**: API (NestJS 模組化架構)
**Performance Goals**: < 10 並發請求支援，回應時間依賴外部 API 表現
**Constraints**: 5 秒外部 API 超時，日誌隱私保護 (遮蔽手機號碼、Token)
**Scale/Scope**: 小規模內部使用，單一 API 端點，透明代理模式

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### 架構合規性檢查
- ✅ **單體應用優先**: 功能在現有 NestJS monorepo 內實作，無需引入新服務
- ✅ **避免過度優化**: 透明代理模式簡單直接，無引入 Redis/MQ 等複雜組件
- ✅ **TDD 開發流程**: 遵循「測試優先」原則，先寫失敗測試再實作
- ✅ **API 設計標準**: 遵循 RESTful 設計和統一回應格式標準
- ✅ **配置管理標準**: 使用 registerAs 模式管理外部 API 配置
- ✅ **測試覆蓋率**: 目標達到 ≥ 80% 的測試覆蓋率
- ✅ **統一回應格式**: 使用 ApiResponse/ApiErrorResponse 標準格式
- ✅ **錯誤處理標準**: 標準化 HTTP 狀態碼和錯誤代碼處理

### 複雜度評估
- 無違反憲章原則的設計決策
- 透明代理模式符合「保持簡單」原則
- 無需引入額外架構複雜度

## Project Structure

### Documentation (this feature)
```
specs/[###-feature]/
├── plan.md              # This file (/plan command output)
├── research.md          # Phase 0 output (/plan command)
├── data-model.md        # Phase 1 output (/plan command)
├── quickstart.md        # Phase 1 output (/plan command)
├── contracts/           # Phase 1 output (/plan command)
└── tasks.md             # Phase 2 output (/tasks command - NOT created by /plan)
```

### Source Code (repository root)
```
# Option 1: Single project (DEFAULT)
src/
├── models/
├── services/
├── cli/
└── lib/

tests/
├── contract/
├── integration/
└── unit/

# Option 2: Web application (when "frontend" + "backend" detected)
backend/
├── src/
│   ├── models/
│   ├── services/
│   └── api/
└── tests/

frontend/
├── src/
│   ├── components/
│   ├── pages/
│   └── services/
└── tests/

# Option 3: NestJS API structure (when API-first design detected)
api/
├── modules/
│   ├── [feature]/
│   │   ├── dto/
│   │   ├── entities/
│   │   ├── [feature].controller.ts
│   │   ├── [feature].service.ts
│   │   └── [feature].module.ts
├── common/
│   ├── filters/
│   ├── interceptors/
│   └── exceptions/
├── config/
├── app.module.ts
└── main.ts

test/
├── unit/
├── integration/
└── e2e/

# Option 4: Mobile + API (when "iOS/Android" detected)
api/
└── [same as Option 3 above]

ios/ or android/
└── [platform-specific structure]
```

**Structure Decision**: Option 3 (NestJS API structure) - 專案為 NestJS API 服務，使用模組化架構

## Phase 0: Outline & Research
1. **Extract unknowns from Technical Context** above:
   - For each NEEDS CLARIFICATION → research task
   - For each dependency → best practices task
   - For each integration → patterns task

2. **Generate and dispatch research agents**:
   ```
   For each unknown in Technical Context:
     Task: "Research {unknown} for {feature context}"
   For each technology choice:
     Task: "Find best practices for {tech} in {domain}"
   ```

3. **Consolidate findings** in `research.md` using format:
   - Decision: [what was chosen]
   - Rationale: [why chosen]
   - Alternatives considered: [what else evaluated]

**Output**: research.md with all NEEDS CLARIFICATION resolved

## Phase 1: Design & Contracts
*Prerequisites: research.md complete*

1. **Extract entities from feature spec** → `data-model.md`:
   - Entity name, fields, relationships
   - Validation rules from requirements
   - State transitions if applicable

2. **Generate API contracts** from functional requirements:
   - For each user action → endpoint
   - Use standard REST/GraphQL patterns
   - Output OpenAPI/GraphQL schema to `/contracts/`

3. **Generate contract tests** from contracts:
   - One test file per endpoint
   - Assert request/response schemas
   - Tests must fail (no implementation yet)

4. **Extract test scenarios** from user stories:
   - Each story → integration test scenario
   - Quickstart test = story validation steps

5. **Update agent file incrementally** (O(1) operation):
   - Run `.specify/scripts/bash/update-agent-context.sh claude`
     **IMPORTANT**: Execute it exactly as specified above. Do not add or remove any arguments.
   - If exists: Add only NEW tech from current plan
   - Preserve manual additions between markers
   - Update recent changes (keep last 3)
   - Keep under 150 lines for token efficiency
   - Output to repository root

**Output**: data-model.md, /contracts/*, failing tests, quickstart.md, agent-specific file

## Phase 2: Task Planning Approach
*This section describes what the /tasks command will do - DO NOT execute during /plan*

**Task Generation Strategy**:
根據 TDD 原則和 NestJS 最佳實踐，任務生成將遵循以下策略：

1. **測試優先**: 每個功能都先建立失敗的測試案例
2. **模組化結構**: 按照 NestJS 模組架構組織任務
3. **依賴順序**: DTO → Service → Controller → Module → 整合測試

**具體任務分類**:
- **配置任務**: 更新 external-apis.config.ts，新增 Marketing Cloud API 配置
- **DTO 任務**: 建立 GetMemberDevicesQueryDto、MemberDevicesResponseDto、DeviceDto
- **Entity 任務**: 建立 Device entity 定義 (如需要)
- **Service 任務**: 實作 MarketingCloudService，包含外部 API 呼叫邏輯
- **Controller 任務**: 實作 MarketingCloudController，定義 REST API 端點
- **Module 任務**: 建立 MarketingCloudModule，整合所有組件
- **測試任務**:
  - 單元測試 (Service 層)
  - 契約測試 (API 格式驗證)
  - 整合測試 (完整流程)
  - E2E 測試 (真實 HTTP 請求)

**測試重點 (用戶要求詳細說明測試目標、脈絡)**:
- **單元測試目標**: 驗證 Service 業務邏輯、錯誤處理、配置注入
- **整合測試目標**: 驗證 Controller 到 Service 完整流程，DTO 驗證機制
- **E2E 測試目標**: 模擬真實使用場景，驗證 HTTP 請求-回應週期
- **契約測試目標**: 確保 API 回應格式符合 OpenAPI 契約規格

**Ordering Strategy**:
1. 配置管理更新 (external-apis.config.ts)
2. DTO 定義 (資料結構)
3. Service 單元測試 (TDD - 先寫失敗測試)
4. Service 實作 (讓測試通過)
5. Controller 契約測試
6. Controller 實作
7. Module 整合
8. 整合測試
9. E2E 測試
10. Swagger 文件驗證

**並行執行標記**:
- DTO 建立任務 [P] - 相互獨立
- 各種測試檔案建立 [P] - 可同時進行
- 文件更新任務 [P] - 獨立於程式碼實作

**Estimated Output**: 約 20-25 個有序任務，涵蓋完整的 TDD 開發週期

**特殊考慮**:
- 隱私保護邏輯 (日誌遮蔽) 需要專門的測試任務
- 外部 API Mock 設定需要獨立任務，使用 nock 攔截 HTTP 請求
- 多環境配置測試需要專門驗證任務

**外部 API Mock 策略**:
- **單元測試**: 使用 Jest Mock 模擬 HttpService
- **整合測試**: 使用 Jest Mock 或測試模組設定 Mock HttpService
- **E2E 測試**: 使用 nock 攔截真實 HTTP 請求到外部 Marketing Cloud API
- **契約測試**: 同樣使用 nock 設定各種回應情境

**Mock 涵蓋情境**:
- 成功回應 (200) - 單一和多個裝置
- 會員不存在 (404)
- 請求參數錯誤 (400)
- 外部服務超時 (5 秒以上延遲)
- 外部服務連線失敗 (ECONNREFUSED)
- 外部服務其他錯誤 (5xx 狀態碼)

**IMPORTANT**: This phase is executed by the /tasks command, NOT by /plan

## Phase 3+: Future Implementation
*These phases are beyond the scope of the /plan command*

**Phase 3**: Task execution (/tasks command creates tasks.md)  
**Phase 4**: Implementation (execute tasks.md following constitutional principles)  
**Phase 5**: Validation (run tests, execute quickstart.md, performance validation)

## Complexity Tracking
*Fill ONLY if Constitution Check has violations that must be justified*

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |


## Progress Tracking
*This checklist is updated during execution flow*

**Phase Status**:
- [x] Phase 0: Research complete (/plan command) - research.md 已建立
- [x] Phase 1: Design complete (/plan command) - data-model.md, contracts/, quickstart.md 已建立，CLAUDE.md 已更新
- [x] Phase 2: Task planning complete (/plan command - describe approach only) - 任務生成策略已描述
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS - 無架構違規
- [x] Post-Design Constitution Check: PASS - 透明代理模式符合憲章原則
- [x] All NEEDS CLARIFICATION resolved - Technical Context 中無未解決項目
- [x] Complexity deviations documented - 無複雜度偏差需要記錄

---
*Based on Constitution v2.1.1 - See `/memory/constitution.md`*
