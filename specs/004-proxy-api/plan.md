
# Implementation Plan: Proxy API 標準化重構

**Branch**: `004-proxy-api` | **Date**: 2025-09-26 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/004-proxy-api/spec.md`

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
重構現有 Proxy API 以符合企業級 API 設計標準，包括：將 `POST /proxy/whale/update-supplier-id` 改為 `PATCH /api/v1/shops/{shopId}/suppliers`、統一回應格式 (success/data/timestamp/requestId)、標準化錯誤處理、HTTP 狀態碼正確使用、版本控制策略、中間件整合等。保持與 Whale API 整合不變，完全移除舊端點 (系統尚未上線)。

## Technical Context
**Language/Version**: TypeScript 5.x (strict mode enabled)
**Primary Dependencies**: NestJS 11.x, @nestjs/common, @nestjs/swagger, class-validator, class-transformer, @nestjs/axios
**Storage**: 繼續使用現有 PostgreSQL + TypeORM (不變)
**Testing**: Jest + Supertest (現有測試框架)
**Target Platform**: Node.js 18+ server environment
**Project Type**: web (NestJS API project - existing)
**Performance Goals**: 回應時間不超過目前基準的 10%，測試執行 < 2 秒
**Constraints**: 保持與 Whale API 整合，不改變核心業務邏輯，測試覆蓋率 ≥ 80%
**Scale/Scope**: 單一 Proxy API 端點重構，32 個功能需求，移除舊端點

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**規格驅動開發原則**: ✅ PASS - 基於完整的規格文件 (004-proxy-api/spec.md) 和澄清記錄
**測試優先 (TDD)**: ✅ PASS - 維持現有測試覆蓋率 ≥ 80%，遵循 TDD 流程
**API 設計標準**: ✅ PASS - 此重構的核心目標就是符合 Constitution 中的 API 設計標準
**單體應用優先**: ✅ PASS - 在現有 NestJS 專案內重構，無新增架構複雜度
**禁止過度工程**: ✅ PASS - 專注於標準化重構，使用現有技術棧 (NestJS, TypeScript)
**程式碼品質**: ✅ PASS - 維持 TypeScript strict mode，測試覆蓋率 ≥ 80%
**文件維護**: ✅ PASS - 更新 OpenAPI 文檔，保持規格文件同步

**初步評估**: 無憲章違反項目，符合所有核心原則，可進行 Phase 0 研究

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

**Structure Decision**: Option 3 (NestJS API structure) - 現有的 NestJS API 專案，程式碼位於 api/ 目錄

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
- [x] Phase 0: Research complete (/plan command) - research.md created
- [x] Phase 1: Design complete (/plan command) - data-model.md, contracts/, quickstart.md, CLAUDE.md updated
- [x] Phase 2: Task planning approach described (/plan command - ready for /tasks)
- [ ] Phase 3: Tasks generated (/tasks command)
- [ ] Phase 4: Implementation complete
- [ ] Phase 5: Validation passed

**Gate Status**:
- [x] Initial Constitution Check: PASS
- [x] Post-Design Constitution Check: PASS (no new violations)
- [x] All NEEDS CLARIFICATION resolved (澄清記錄完整)
- [x] Complexity deviations documented (無違反項目)

---
*Based on Constitution v2.1.1 - See `/memory/constitution.md`*
