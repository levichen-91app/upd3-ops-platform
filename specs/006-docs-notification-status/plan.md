
# Implementation Plan: 通知詳細資訊查詢 API

**Branch**: `006-docs-notification-status` | **Date**: 2025-01-27 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/006-docs-notification-status/spec.md`

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
實作通知詳細資訊查詢API (`/api/v1/notification-status/detail/{shopId}/{ncId}`)，提供運營團隊查詢特定通知的詳細資訊。此API需要整合NC Detail外部API，支援操作者追蹤(`ny-operator` header)，並提供統一的回應格式包含完整的錯誤處理機制。

## Technical Context
**Language/Version**: TypeScript 5.x (NestJS專案，基於憲章技術棧)
**Primary Dependencies**: NestJS 10.x, @nestjs/axios, class-validator, class-transformer, @nestjs/swagger
**Storage**: N/A (此API為代理服務，不直接存取資料庫)
**Testing**: Jest + Supertest (遵循憲章測試策略)
**Target Platform**: Node.js 18+ server (Docker容器化)
**Project Type**: NestJS API (選項3 - 與憲章架構一致)
**Performance Goals**: 10秒外部API超時，基本HTTP回應性能
**Constraints**: 必須整合NC Detail API，處理null回應，記錄操作者追蹤
**Scale/Scope**: 單一API端點，內部運營工具使用

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

✅ **依賴抽象化規範**: 必須為NC Detail API建立介面抽象層，業務邏輯不直接依賴具體實作
✅ **測試優先設計**: 所有Service層業務邏輯必須有對應的單元測試(.spec.ts)
✅ **規格驅動開發**: 以spec.md文件為單一真實來源，遵循TDD流程
✅ **NestJS架構標準**: 使用憲章定義的模組結構(modules/, common/, config/)
✅ **配置管理**: 採用registerAs強型別注入，統一存放於api/config/
✅ **API設計標準**: 符合RESTful URL設計和統一回應格式
✅ **Swagger文檔**: 使用Code-First方式生成API文檔

**無憲章違反事項** - 此功能完全符合憲章的依賴抽象化和測試優先原則

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

**Structure Decision**: Option 3 (NestJS API結構) - 符合憲章架構和專案現有結構

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
- Load `.specify/templates/tasks-template.md` as base
- Generate tasks from Phase 1 design docs (contracts, data model, quickstart)
- 遵循憲章TDD流程：先寫測試，再寫實作
- 依賴抽象化優先：先建立介面，再實作具體Service

**預計任務順序**:
1. 建立模組結構和介面定義 [P]
2. 撰寫單元測試 (失敗的測試) [P]
3. 建立DTO和驗證規則 [P]
4. 實作具體外部API Service
5. 實作業務邏輯Service
6. 建立Controller和路由
7. 整合測試和端到端測試
8. Swagger文檔生成和驗證

**Ordering Strategy**:
- TDD order: Tests before implementation (憲章要求)
- Dependency order: Interfaces → Tests → DTOs → Services → Controller
- Mark [P] for parallel execution (independent files)

**Estimated Output**: 20-25 numbered, ordered tasks in tasks.md

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
- [x] Phase 0: Research complete (/plan command) ✅
- [x] Phase 1: Design complete (/plan command) ✅
- [x] Phase 2: Task planning complete (/plan command - describe approach only) ✅
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS ✅
- [x] Post-Design Constitution Check: PASS ✅
- [x] All NEEDS CLARIFICATION resolved ✅
- [x] Complexity deviations documented ✅ (無違反事項)

**Generated Artifacts**:
- [x] research.md - 技術決策和風險評估
- [x] data-model.md - 完整資料模型和介面定義
- [x] contracts/notification-detail-api.yaml - OpenAPI合約規格
- [x] quickstart.md - 功能驗證和測試指南
- [x] CLAUDE.md updated - Agent context更新完成

---
*Based on Constitution v2.1.1 - See `/memory/constitution.md`*
