
# Implementation Plan: 通知活動歷程查詢 API

**Branch**: `009-api-v1-notification` | **Date**: 2025-09-28 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/009-api-v1-notification/spec.md`

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
實作 `/api/v1/notification-status/history/{notificationId}` API 端點，提供運維人員查詢特定通知活動的執行歷程資料。該端點需要整合外部 Whale API，支援 ny-operator 認證，並在5秒內回應查詢請求。系統將處理各種錯誤情況並提供統一的回應格式。

## Technical Context
**Language/Version**: TypeScript 5.x (strict mode)
**Primary Dependencies**: NestJS 10.x, @nestjs/axios, class-validator, class-transformer
**Storage**: N/A (API proxy service, no persistence required)
**Testing**: Jest + Supertest (integration tests), Jest Mock + overrideProvider pattern
**Target Platform**: Node.js 18+ server environment
**Project Type**: web (monorepo with api/ backend)
**Performance Goals**: < 5 seconds response time (batch/background processing acceptable)
**Constraints**: External Whale API dependency, ny-operator authentication required
**Scale/Scope**: Single API endpoint, no specific concurrency limits, proxy for external service

### Environment Configuration

Based on Whale API documentation (docs/external-api/whale-api-notification.yaml):

```env
# Whale API Configuration
WHALE_API_BASE_URL=http://whale-api-internal.qa.91dev.tw  # QA environment
WHALE_API_TIMEOUT=10000  # 10 seconds timeout (as specified)
# Note: No API key required based on documentation
```

**Configuration Implementation Pattern**:
```typescript
// api/config/whale-api.config.ts
export default registerAs('whaleApi', () => ({
  baseUrl: process.env.WHALE_API_BASE_URL || 'http://whale-api-internal.qa.91dev.tw',
  timeout: parseInt(process.env.WHALE_API_TIMEOUT || '10000'),
  // No API key configuration needed per documentation
}));
```

## Constitution Check
*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Core Principles Compliance:**
- ✅ **依賴抽象**: Must create Whale API interface (IWhaleService) with injection token
- ✅ **測試優先**: Integration tests must be written before implementation (TDD)
- ✅ **規格驅動**: Feature spec exists with clear requirements
- ✅ **高內聚低耦合**: Single responsibility API endpoint with external dependency abstraction

**Technical Standards:**
- ✅ **NestJS 10.x**: Aligns with tech stack
- ✅ **TypeScript strict mode**: Required for type safety
- ✅ **統一回應格式**: Must implement ApiResponse/ApiErrorResponse patterns
- ✅ **錯誤處理分層**: External API errors (500) vs business logic errors (404)
- ✅ **Request ID 統一生成**: Must use RequestIdService pattern
- ✅ **認證機制**: ny-operator guard implementation required

**No Constitution Violations Detected** - Proceed to Phase 0

## Project Structure

### Documentation (this feature)
```
specs/009-api-v1-notification/
├── spec.md              # Feature specification
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
│       ├── controllers/
│       │   └── notification-status.controller.ts
│       ├── services/
│       │   ├── notification-status.service.ts
│       │   └── whale-api.service.ts
│       ├── interfaces/
│       │   └── whale-api.interface.ts
│       ├── dto/
│       │   ├── notification-history-query.dto.ts
│       │   └── notification-history-response.dto.ts
│       ├── guards/
│       │   └── ny-operator.guard.ts (reuse existing)
│       ├── integration/
│       │   ├── history-success.integration.spec.ts
│       │   ├── history-auth.integration.spec.ts
│       │   ├── history-validation.integration.spec.ts
│       │   ├── history-external-errors.integration.spec.ts
│       │   └── history-notfound.integration.spec.ts
│       └── notification-status.module.ts
├── common/
│   ├── interceptors/
│   │   └── request-id.interceptor.ts (reuse existing)
│   └── filters/
│       └── notification-status-exception.filter.ts (reuse existing)
└── config/
    └── whale-api.config.ts
```

**Structure Decision**: Web application structure using existing api/ backend. The notification history API will extend the existing notification-status module with new controller methods and Whale API integration service. Existing common infrastructure (guards, interceptors, filters) will be reused.

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
- Generate tasks from contracts (history-api.yaml), data model, and quickstart scenarios
- API contract validation → contract test task [P]
- Integration test scenarios → test tasks [P] (5 scenarios from quickstart)
- DTO creation tasks → model implementation [P] (NotificationHistoryQuery, NotificationHistoryResponse)
- Service implementation → WhaleApiService with interface abstraction
- Controller extension → add history endpoint to existing NotificationStatusController
- Configuration → Whale API config setup

**Ordering Strategy (TDD Approach)**:
1. **Phase 1**: Test-First (All [P] - parallel execution)
   - Contract test for API specification compliance
   - Integration tests for all scenarios (success, auth, validation, external errors, not found)

2. **Phase 2**: Model & Interface Creation [P]
   - DTO classes with validation
   - Whale API interface definition
   - Response model classes

3. **Phase 3**: Service Implementation (Sequential)
   - WhaleApiService implementation
   - NotificationStatusService extension
   - Controller method addition

4. **Phase 4**: Integration & Configuration
   - Whale API configuration
   - Module wiring
   - Error handling integration

**Estimated Output**: 18-22 numbered, ordered tasks following constitutional TDD principles

**Key Characteristics**:
- Tests written before implementation (red-green-refactor cycle)
- External dependencies properly abstracted with interfaces
- Integration tests using overrideProvider mocking pattern
- Reuse of existing infrastructure (guards, interceptors, filters)

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
- [x] Complexity deviations documented (none required)

---
*Based on Constitution v2.1.1 - See `/memory/constitution.md`*
