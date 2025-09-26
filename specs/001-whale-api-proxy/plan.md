
# 實作計劃：Whale API 代理服務

**分支**: `001-whale-api-proxy` | **日期**: 2025-09-25 | **規格**: [spec.md](./spec.md)
**輸入**: 功能規格來自 `/Users/levichen/Project/91APP/upd3-ops-platform/specs/001-whale-api-proxy/spec.md`

## 執行流程 (/plan 指令範圍)
```
1. 從輸入路徑載入功能規格
   → 如果找不到：錯誤 "No feature spec at {path}"
2. 填寫技術背景（掃描 NEEDS CLARIFICATION）
   → 從背景檢測專案類型 (web=前端+後端, mobile=應用+API)
   → 根據專案類型設定結構決策
3. 根據憲法文件內容填寫憲法檢查章節
4. 評估下方憲法檢查章節
   → 如果存在違規：記錄在複雜性追蹤中
   → 如果無法辯護：錯誤 "Simplify approach first"
   → 更新進度追蹤：初始憲法檢查
5. 執行階段 0 → research.md
   → 如果仍有 NEEDS CLARIFICATION：錯誤 "Resolve unknowns"
6. 執行階段 1 → contracts, data-model.md, quickstart.md, agent-specific template file
7. 重新評估憲法檢查章節
   → 如果有新違規：重構設計，返回階段 1
   → 更新進度追蹤：設計後憲法檢查
8. 規劃階段 2 → 描述任務產生方法（不要建立 tasks.md）
9. 停止 - 準備執行 /tasks 指令
```

**重要**：/plan 指令在步驟 7 停止。階段 2-4 由其他指令執行：
- 階段 2：/tasks 指令建立 tasks.md
- 階段 3-4：實作執行（手動或透過工具）

## 概要
實作基於 NestJS 的代理 API 服務，將前端客戶端的供應商 ID 更新請求轉發到 Whale API TW QA 伺服器。代理服務提供請求驗證、包含時間戳和請求 ID 的完整 JSON 日誌記錄、錯誤處理，以及不需要身份驗證或速率限制的回應轉發。

## 技術背景
**語言/版本**: TypeScript 5.x 啟用嚴格模式
**主要依賴**: NestJS 11.x, @nestjs/common, @nestjs/swagger, class-validator, class-transformer
**儲存**: 不適用（代理服務，不需要資料持久化）
**測試**: Jest + Supertest 用於單元測試和 E2E 測試
**目標平台**: Node.js 18+ 伺服器環境
**專案類型**: NestJS API - 決定原始碼結構（選項 3）
**效能目標**: API 回應時間 <200ms（典型請求）
**限制**: 不需要身份驗證/授權，JSON 日誌記錄為必需，不需要處理超時
**規模/範圍**: 單一端點代理服務，最小複雜度

## 憲法檢查
*關卡：必須在階段 0 研究之前通過。在階段 1 設計後重新檢查。*

### API 優先設計 ✅
- 在 `openapi/proxy-whale.yaml` 和 `docs/external-whale-api.yaml` 中提供 OpenAPI 規格
- 單一端點遵循 RESTful 慣例，使用適當的 HTTP 方法和狀態碼
- 在實作前定義明確的 API 合約

### 型別安全 ✅
- 專案中已啟用 TypeScript 嚴格模式
- DTO 將使用 class-validator 裝飾器進行執行時驗證
- 所有請求/回應結構都有明確的型別定義

### 測試驅動開發 ✅
- 根據憲法要求，必須在實作前撰寫測試
- 服務邏輯的單元測試，API 合約的整合測試
- 完整請求-回應週期的 E2E 測試

### 依賴注入模式 ✅
- 根據憲法要求使用 NestJS DI 容器
- 服務將在現有的 api/modules/ 結構中組織
- HTTP 客戶端依賴將被適當抽象化

### 配置管理 ✅
- 此功能不需要新的環境變數
- Whale API URL 根據要求硬編碼（僅 QA 環境）
- 日誌配置已就位

### 程式碼品質要求 ✅
- ESLint 和 Prettier 已為 api/ 目錄配置
- 公用 API 需要 JSDoc 註釋
- 單模組代理服務預期不會有循環依賴

### 效能標準 ✅
- <200ms 回應時間要求符合憲法標準
- 簡單代理操作應能滿足效能標準
- 不涉及資料庫查詢或複雜處理

### 安全要求 ✅
- 根據憲法要求使用 class-validator 進行輸入驗證
- 根據功能規格不需要身份驗證/授權
- 錯誤回應不會暴露內部系統細節
- 結構化日誌將包含關聯 ID（requestId）

**初始憲法檢查：通過** - 未識別出違規或複雜度偏差

**設計後憲法檢查：通過** - 設計製品維持憲法合規性：
- API 合約遵循 OpenAPI 標準，具有適當的驗證規則
- 資料模型使用 TypeScript 嚴格型別和 class-validator 裝飾器
- 測試情境涵蓋 TDD 要求，包含單元、整合和 E2E 測試計劃
- 日誌設計包含必需的時間戳和 requestId 欄位
- 設計決策未引入新的憲法違規

## 專案結構

### 文件（此功能）
```
specs/[###-feature]/
├── plan.md              # 此檔案（/plan 指令輸出）
├── research.md          # 階段 0 輸出（/plan 指令）
├── data-model.md        # 階段 1 輸出（/plan 指令）
├── quickstart.md        # 階段 1 輸出（/plan 指令）
├── contracts/           # 階段 1 輸出（/plan 指令）
└── tasks.md             # 階段 2 輸出（/tasks 指令 - 不由 /plan 建立）
```

### 原始碼（儲存庫根目錄）
```
# 選項 1：單一專案（預設）
src/
├── models/
├── services/
├── cli/
└── lib/

tests/
├── contract/
├── integration/
└── unit/

# 選項 2：Web 應用程式（當檢測到「前端」+「後端」時）
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

# 選項 3：NestJS API 結構（當檢測到 API 優先設計時）
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

# 選項 4：行動裝置 + API（當檢測到「iOS/Android」時）
api/
└── [與選項 3 相同]

ios/ 或 android/
└── [平台特定結構]
```

**結構決策**：選項 3（NestJS API 結構）- 使用現有 api/ 目錄結構的 API 優先設計

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

## 階段 2：任務規劃方法
*此章節描述 /tasks 指令將執行的內容 - 請勿在 /plan 期間執行*

**任務產生策略**：
- 載入 `.specify/templates/tasks-template.md` 作為基礎
- 從階段 1 設計文件（合約、資料模型、快速入門）產生任務
- 單一 API 合約 → 合約測試任務 [P]
- DTO 和驗證 → 模型建立任務 [P]
- 每個快速入門情境 → 整合測試任務 [P]
- 遵循 TDD 順序的實作任務
- 基於使用者驗收標準的 E2E 測試

**排序策略**：
- **設定階段**：NestJS 模組結構、依賴項
- **TDD 階段**：合約測試、單元測試（最初必須失敗）
- **實作階段**：DTO、服務、控制器按依賴順序
- **整合階段**：HTTP 客戶端設定、錯誤處理、日誌記錄
- **驗證階段**：E2E 測試、效能驗證

**NestJS 特定任務**：
1. 在 `api/src/modules/proxy/` 中建立 ProxyModule
2. 產生帶有 class-validator 裝飾器的 DTO 類別
3. 實作帶有 HTTP 客戶端整合的 ProxyService
4. 建立帶有 Swagger 裝飾器的 ProxyController
5. 新增全域錯誤處理和日誌攔截器
6. 配置具有適當超時和重試設定的 HttpModule

**並行執行機會** [P]：
- DTO 建立（獨立檔案）
- 單元測試檔案（不同測試範圍）
- 合約測試產生
- 文件更新

**預估輸出**：tasks.md 中 18-22 個編號、有序的任務，涵蓋：
- 3-4 個設定任務
- 6-8 個 TDD/測試任務
- 5-6 個實作任務
- 3-4 個整合/最佳化任務

**憲法合規任務**：
- 所有測試必須在實作前撰寫（TDD 要求）
- DTO 必須包含 @ApiProperty 裝飾器用於 Swagger
- 服務必須包含完整的錯誤處理
- 日誌記錄必須包含時間戳和 requestId
- 程式碼必須通過 ESLint 驗證

**重要**：此階段由 /tasks 指令執行，不是 /plan

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


## 進度追蹤
*此檢查表在執行流程中更新*

**階段狀態**：
- [x] 階段 0：研究完成（/plan 指令）- ✅ 已產生 research.md
- [x] 階段 1：設計完成（/plan 指令）- ✅ 已建立 data-model.md、contracts/、quickstart.md、CLAUDE.md
- [x] 階段 2：任務規劃完成（/plan 指令 - 僅描述方法）- ✅ 詳細任務策略已記錄
- [ ] 階段 3：任務已產生（/tasks 指令）
- [ ] 階段 4：實作完成
- [ ] 階段 5：驗證通過

**關卡狀態**：
- [x] 初始憲法檢查：通過 - 未識別出違規
- [x] 設計後憲法檢查：通過 - 設計維持合規性
- [x] 所有 NEEDS CLARIFICATION 已解決 - 技術背景中無未知項
- [x] 複雜度偏差已記錄 - 不需要（簡單代理服務）

**已產生的製品**：
- [x] `/specs/001-whale-api-proxy/plan.md` - 此實作計劃
- [x] `/specs/001-whale-api-proxy/research.md` - 技術研究和決策
- [x] `/specs/001-whale-api-proxy/data-model.md` - 實體定義和驗證規則
- [x] `/specs/001-whale-api-proxy/contracts/proxy-whale-api.yaml` - OpenAPI 合約
- [x] `/specs/001-whale-api-proxy/quickstart.md` - 測試情境和手動測試指南
- [x] `/CLAUDE.md` - 已更新的代理程式背景檔案

**準備進行**：`/tasks` 指令以產生詳細的實作任務

---
*基於憲法 v2.1.1 - 參見 `/memory/constitution.md`*
