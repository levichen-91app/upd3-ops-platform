# Implementation Plan: 系統稽核日誌

**Branch**: `011***Scale/Scope**: 單一 API service, 使用 @AuditLog decorator 標記需要稽核的端點，支援擴展至任何新 API  
**Design Pattern**: Decorator-based 標記 + Interceptor 實作，避免路徑硬編碼Scale/Scope**: 單一 API service, 使用 @AuditLog decorator 標記需要稽核的端點，支援擴展至任何新 API  
**Design Pattern**: Decorator-based 標記 + Interceptor 實作，避免路徑硬編碼011-audit-log` | **Date**: 2025-10-06 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/011-011-audit-log/spec.md`

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

實作系統稽核日誌功能，自動記錄 API 寫入操作並提供查詢功能。系統將攔截指定端點的寫入操作，記錄完整的操作上下文（操作者、時間、請求內容等），並自動遮罩敏感資料。採用檔案系統儲存方案，支援每日檔案分割和自動清理。同時提供查詢 API 供營運團隊進行安全稽核和問題排查。

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode) with NestJS 10.x (Node.js 18+)  
**Primary Dependencies**: NestJS, @nestjs/axios, class-validator, class-transformer, @nestjs/swagger, Node.js fs module  
**Storage**: 檔案系統 (JSON Lines format) - 位於 `./logs/audit/audit-YYYYMMDD.jsonl`  
**Testing**: Jest + Supertest (覆蓋率目標: 單元測試 ≥95%, 整合測試 ≥80%)  
**Target Platform**: Linux server / Docker container  
**Project Type**: web (backend API service)  
**Performance Goals**: 低容量同步寫入 (≤1 ops/sec), 查詢回應時間無特定 SLA 要求  
**Constraints**: 7 天查詢範圍限制, 30 天自動檔案清理, 敏感資料遮罩, HTTP 503 當儲存失敗  
**Scale/Scope**: 單一 API service, 監控 2 個端點群組 (/api/v1/shops/_, /api/v1/notification-status/_)

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

✅ **依賴抽象規範**: 將建立 IAuditLogService 介面，檔案系統實作透過 FileSystemAuditLogService，支援未來擴展至資料庫  
✅ **測試優先設計**: 將遵循 TDD 流程，包含單元測試 (≥95%)、整合測試 (≥80%)、合約測試 (100% API endpoints)  
✅ **常數集中化**: 錯誤代碼、標頭名稱、檔案路徑等將統一定義在 constants/ 目錄  
✅ **Request ID 統一追蹤**: 使用現有的 Request ID 機制進行日誌關聯  
✅ **Google Cloud API 風格錯誤處理**: 遵循現有的錯誤處理標準，使用 UPPER_SNAKE_CASE 錯誤代碼  
✅ **繁體中文文檔**: 所有文檔、註解、commit message 使用繁體中文  
✅ **Git 規範**: 遵循現有 commit message 格式和分支策略

**初始檢查結果**: PASS - 符合所有憲章要求

**Phase 1 後重新檢查**:
✅ **設計符合抽象原則**: IAuditLogService 介面設計完成，支援檔案系統和未來資料庫實作  
✅ **API 設計符合 RESTful 標準**: GET /api/v1/audit-logs 端點遵循專案 API 設計慣例  
✅ **錯誤處理一致性**: 使用 Google Cloud API 標準錯誤代碼 (INVALID_ARGUMENT, UNAUTHENTICATED 等)  
✅ **常數管理**: SENSITIVE_PATTERNS、ERROR_CODES、FILE_PATHS 等統一管理  
✅ **測試覆蓋計劃**: 合約測試、整合測試、單元測試策略明確定義

**設計後檢查結果**: PASS - 設計完全符合憲章要求

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
api/                     # 現有 NestJS 後端專案
├── modules/
│   └── audit-log/       # 新增稽核日誌模組
│       ├── audit-log.module.ts
│       ├── audit-log.controller.ts
│       ├── audit-log.service.ts
│       ├── interfaces/
│       │   └── audit-log.interface.ts
│       ├── services/
│       │   └── file-system-audit-log.service.ts
│       ├── dto/
│       │   ├── audit-log-query.dto.ts
│       │   └── audit-log-response.dto.ts
│       ├── interceptors/
│       │   └── audit-log.interceptor.ts
│       └── integration/
│           └── audit-log.integration.spec.ts
├── common/
│   ├── constants/
│   │   ├── audit-log.constants.ts  # 新增
│   │   └── file-paths.constants.ts # 新增
│   ├── decorators/
│   │   └── audit-log.decorator.ts  # 新增
│   ├── utils/
│   │   ├── sensitive-data-masker.ts # 新增
│   │   └── audit-log-file-manager.ts # 新增
│   └── exceptions/
│       └── audit-storage.exception.ts # 新增
└── logs/
    └── audit/           # 稽核日誌檔案目錄
        └── audit-YYYYMMDD.jsonl

test/
├── contract/
│   └── audit-log.contract.spec.ts
├── integration/
│   └── audit-log-flow.integration.spec.ts
└── unit/
    └── audit-log-service.spec.ts
```

**Structure Decision**: 採用現有的 NestJS 後端架構，在 api/modules/ 下新增 audit-log 模組。遵循專案既有的目錄結構和命名慣例，將相關工具類別放在 common/ 目錄下以便重用。

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

_Prerequisites: research.md complete_

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

**Output**: data-model.md, /contracts/\*, failing tests, quickstart.md, agent-specific file

## Phase 2: Task Planning Approach

_This section describes what the /tasks command will do - DO NOT execute during /plan_

**Task Generation Strategy**:

- 載入 `.specify/templates/tasks-template.md` 作為基礎模板
- 從 Phase 1 設計文件生成任務 (contracts, data model, quickstart)
- 每個 API 端點 → 合約測試任務 [P]
- 每個實體 (AuditLogData, QueryCriteria) → 模型建立任務 [P]
- 每個使用者情境 → 整合測試任務
- 使測試通過的實作任務

**具體任務分解**:

1. **常數定義任務** [P]: audit-log.constants.ts, file-paths.constants.ts
2. **介面定義任務** [P]: IAuditLogService 抽象介面
3. **DTO 建立任務** [P]: AuditLogQueryDto, AuditLogResponseDto
4. **工具類別任務** [P]: SensitiveDataMasker, AuditLogFileManager
5. **Decorator 定義任務** [P]: @AuditLog() decorator 實作業務資訊標記
6. **服務實作任務**: FileSystemAuditLogService 實作 IAuditLogService
7. **攔截器任務**: AuditLogInterceptor 讀取 decorator metadata 並記錄
8. **控制器任務**: AuditLogController 實作查詢 API
9. **現有 API 標記任務**: 為現有的 shops 和 notification-status API 加上 @AuditLog
10. **模組整合任務**: AuditLogModule 統合所有元件
11. **合約測試任務**: 驗證 API 回應格式符合 OpenAPI 規範
12. **整合測試任務**: 端到端流程測試 (記錄 → 查詢)

**排序策略**:

- TDD 順序: 測試優先於實作
- 依賴順序: 常數/介面 → 工具 → 服務 → 控制器 → 模組
- 並行標記 [P]: 獨立檔案可平行開發

**預估產出**: 20-25 個編號任務，順序明確的 tasks.md 檔案

**重要提醒**: 此階段由 /tasks 命令執行，非 /plan 命令範圍

## Phase 3+: Future Implementation

_These phases are beyond the scope of the /plan command_

**Phase 3**: Task execution (/tasks command creates tasks.md)  
**Phase 4**: Implementation (execute tasks.md following constitutional principles)  
**Phase 5**: Validation (run tests, execute quickstart.md, performance validation)

## Complexity Tracking

_Fill ONLY if Constitution Check has violations that must be justified_

| Violation                  | Why Needed         | Simpler Alternative Rejected Because |
| -------------------------- | ------------------ | ------------------------------------ |
| [e.g., 4th project]        | [current need]     | [why 3 projects insufficient]        |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient]  |

## Progress Tracking

_This checklist is updated during execution flow_

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
- [x] Complexity deviations documented (none required)

**Generated Artifacts**:

- [x] research.md - 技術選型和風險評估完成
- [x] data-model.md - 完整資料模型定義
- [x] contracts/audit-log-api.yaml - OpenAPI 規範
- [x] quickstart.md - 功能驗證指南
- [x] .github/copilot-instructions.md - Agent 上下文更新

---

_Based on Constitution v2.1.1 - See `/memory/constitution.md`_
