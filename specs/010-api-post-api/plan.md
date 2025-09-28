
# Implementation Plan: 通知狀態報告查詢 API

**Branch**: `010-api-post-api` | **Date**: 2025-09-28 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/010-api-post-api/spec.md`

## Execution Flow (/plan command scope)
```
1. Load feature spec from Input path
   → If not found: ERROR "No feature spec at {path}"
2. Fill Technical Context (scan for NEEDS CLARIFICATION)
   → Detect Project Type from file system structure or context (web=frontend+backend, mobile=app+api)
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
實作 POST /api/v1/notification-status/reports 端點，提供營運團隊查詢通知狀態詳細報告的功能。系統接受 nsId、通知日期和通知類型參數，透過 ny-operator header 進行認證，調用外部 NS Report API，立即回傳包含 TSV 報告下載連結的 presigned URL。符合 NestJS 依賴抽象化規範，採用 TDD 開發模式，包含完整的單元測試、整合測試和合約測試。

## Technical Context
**Language/Version**: TypeScript 5.x (strict mode enabled)
**Primary Dependencies**: NestJS 10.x, @nestjs/axios, class-validator, class-transformer, @nestjs/swagger
**Storage**: N/A (純 API proxy，不涉及資料持久化)
**Testing**: Jest + Supertest (單元測試、整合測試、合約測試)
**Target Platform**: Node.js 18+ server environment, Docker
**Project Type**: web (後端 API 服務，位於 api/ 目錄)
**Performance Goals**: 端對端回應時間 <2 秒 (包含外部 NS Report API 調用時間)，本地處理時間 <200ms
**Constraints**: 必須立即回傳 presigned URL，不重試外部 API 失敗，使用 ny-operator header 認證
**Scale/Scope**: 營運團隊內部工具，預期低並發量 (<100 req/min)

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

✅ **依賴抽象化**: 外部 NS Report API 調用將透過介面抽象 (INSReportService)
✅ **測試優先 (TDD)**: 所有業務邏輯將有 ≥95% 單元測試覆蓋率
✅ **常數集中化**: 錯誤代碼、Header 常數將定義在 api/constants/ 目錄
✅ **Request ID 統一**: 使用既有 RequestIdService 生成 req-reports-{timestamp} 格式
✅ **錯誤處理分層**: 外部 API 錯誤回傳 500，參數驗證錯誤回傳 400
✅ **配置外部化**: NS Report API URL、超時等配置透過環境變數管理
✅ **Swagger 文檔**: 所有 DTO 包含 @ApiProperty 註解，符合 OpenAPI 規範
✅ **繁體中文**: 所有註解、commit message、文檔使用繁體中文
✅ **Monorepo 結構**: 程式碼置於 api/ 目錄，遵循既有 NestJS 專案結構

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
api/
├── modules/
│   └── notification-status/
│       ├── notification-status.controller.ts
│       ├── notification-status.service.ts
│       ├── notification-status.module.ts
│       ├── dto/
│       │   ├── status-report-request.dto.ts
│       │   └── status-report-response.dto.ts
│       ├── services/
│       │   ├── ns-report.service.interface.ts
│       │   ├── external-ns-report.service.ts
│       │   └── ns-report.service.spec.ts
│       ├── integration/
│       │   ├── reports-success.integration.spec.ts
│       │   ├── reports-auth.integration.spec.ts
│       │   ├── reports-validation.integration.spec.ts
│       │   └── reports-external-errors.integration.spec.ts
│       ├── notification-status.controller.spec.ts
│       └── notification-status.service.spec.ts
├── common/
│   ├── exceptions/
│   │   └── external-api.exception.ts (existing)
│   └── services/
│       └── request-id.service.ts (existing)
├── constants/
│   ├── error-codes.constants.ts (existing)
│   └── headers.constants.ts (existing)
└── config/
    └── ns-report.config.ts

test/
└── contract/
    └── notification-status-reports.contract.spec.ts
```

**Structure Decision**: Web application backend structure - NestJS monorepo 架構，程式碼統一放在 api/ 目錄下。採用模組化設計，每個功能模組包含 controller、service、DTO、測試檔案。依賴抽象化透過 services/ 子目錄中的介面和實作分離。測試分為三層：單元測試、整合測試、合約測試。

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
   - Run `.specify/scripts/bash/update-agent-context.sh copilot`
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
- Load `.specify/templates/tasks-template.md` as base
- Generate tasks from Phase 1 design docs (contracts, data model, quickstart)
- Each contract → contract test task [P]
- Each entity → model creation task [P] 
- Each user story → integration test task
- Implementation tasks to make tests pass

**Ordering Strategy**:
- TDD order: Tests before implementation 
- Dependency order: Models before services before UI
- Mark [P] for parallel execution (independent files)

**Estimated Output**: 25-30 numbered, ordered tasks in tasks.md

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
- [x] Phase 0: Research complete (/plan command)
- [x] Phase 1: Design complete (/plan command)
- [x] Phase 2: Task planning complete (/plan command - describe approach only)
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS
- [x] All NEEDS CLARIFICATION resolved
- [x] Complexity deviations documented (N/A - no violations)

---
*Based on Constitution v2.1.1 - See `/memory/constitution.md`*
