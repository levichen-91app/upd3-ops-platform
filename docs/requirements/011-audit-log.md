# 產品需求文件：系統操作稽核日誌 (Audit Log)

**功能編號**：`011-audit-log`  
**文件版本**：v1.0  
**建立日期**：2025-10-06  
**負責 PM**：UPD3 Ops Platform Team  
**狀態**：待開發  
**優先級**：中  

---

## 1. 概述 (Overview)

### 1.1 背景 (Background)
為了提升系統安全性與可追溯性，營運團隊需要記錄系統內關鍵操作的執行日誌。當發生安全事件或需要稽核時，能夠快速定位操作者、操作時間、操作內容等關鍵資訊，確保系統操作的透明度與問責制。

### 1.2 目標 (Goals)
- **安全性稽核**：記錄所有寫入操作，提供完整的操作軌跡
- **問題追蹤**：當系統發生異常時，能快速定位相關操作
- **合規性支援**：滿足內部安全稽核要求
- **可擴展架構**：建立抽象層，支援未來儲存方式升級

### 1.3 非目標 (Non-Goals)
- 不記錄查詢類操作（GET 請求）
- 不提供即時監控或告警功能
- 不處理大量資料分析或報表生成

### 1.4 成功指標 (Success Metrics)
- 所有寫入操作 100% 被記錄
- 查詢功能能在 7 天內的資料中正常運作
- 敏感資料正確遮罩，無資料洩露風險

---

## 2. 用戶研究

### 2.1 目標用戶 (Target Users)
**主要用戶：營運團隊**
- 需要追蹤系統操作記錄
- 進行安全性稽核調查
- 處理系統異常問題排查

### 2.2 用戶痛點 (Pain Points)
- 目前無法追蹤誰執行了哪些系統操作
- 發生問題時難以快速定位責任歸屬
- 缺乏完整的操作歷程記錄

### 2.3 使用場景 (Use Cases)
**場景一：安全事件調查**
- 當發現異常資料變更時，營運團隊需要查詢特定時間範圍內的所有操作記錄
- 找出可疑的操作者和操作內容

**場景二：問題排查**
- 系統出現異常時，需要查看近期的相關操作
- 確認是否因為某個操作導致的問題

**場景三：定期稽核**
- 定期檢視系統操作記錄，確保符合安全規範
- 識別異常操作模式

---

## 3. 功能需求 (Functional Requirements)

### 3.1 稽核日誌記錄

**REQ-001 [P0] 自動記錄寫入操作**
- **描述**：系統自動記錄所有寫入操作（POST、PUT、PATCH、DELETE）的詳細資訊
- **適用範圍**：
  - `/api/v1/shops/*` 路徑下的所有 API
  - `/api/v1/notification-status/*` 路徑下的所有 API
- **驗收標準**：
  - Given 用戶執行寫入操作
  - When API 請求完成（無論成功或失敗）
  - Then 系統自動產生一筆 audit log 記錄
  - And 記錄包含完整的請求資訊

**REQ-002 [P0] 日誌資料完整性**
- **描述**：每筆 audit log 必須包含完整的操作資訊
- **必要欄位**：
  - `id`：唯一識別碼（UUID）
  - `timestamp`：執行時間（ISO 8601 格式）
  - `operator`：執行人員（ny-operator header 值）
  - `method`：HTTP 方法（POST/PUT/PATCH/DELETE）
  - `path`：API 路徑
  - `queryParams`：查詢參數（JSON 物件）
  - `requestBody`：請求內容（已遮罩敏感資料）
  - `statusCode`：HTTP 回應狀態碼
  - `ipAddress`：操作者 IP 位址
  - `userAgent`：瀏覽器/用戶端資訊
  - `requestId`：關聯的請求 ID
- **驗收標準**：
  - Given 任何寫入操作被執行
  - When audit log 被建立
  - Then 所有必要欄位都有正確的值
  - And 資料格式符合規範

**REQ-003 [P0] 敏感資料遮罩**
- **描述**：自動識別並遮罩敏感資料欄位
- **遮罩規則**：
  - 欄位名稱包含 `password`、`token`、`secret`、`key` → 替換為 `***`
  - 支援巢狀物件的遮罩處理
- **驗收標準**：
  - Given request body 包含敏感資料欄位
  - When audit log 記錄 requestBody
  - Then 敏感欄位值被替換為 `***`
  - And 非敏感欄位保持原始值

### 3.2 檔案儲存系統

**REQ-004 [P0] 檔案系統儲存**
- **描述**：實作檔案系統儲存的 audit log service
- **儲存規格**：
  - 路徑：`./logs/audit/`
  - 檔案命名：`audit-YYYYMMDD.jsonl`
  - 格式：JSON Lines（每行一個 JSON 物件）
- **驗收標準**：
  - Given audit log 需要被儲存
  - When 呼叫 AuditLogService.log()
  - Then 資料被寫入當日對應的檔案
  - And 檔案格式為有效的 JSON Lines

**REQ-005 [P1] 抽象層設計**
- **描述**：建立可擴展的 audit log service 抽象層
- **介面規格**：
  ```typescript
  interface AuditLogService {
    log(auditData: AuditLogData): Promise<void>
    query(criteria: QueryCriteria): Promise<AuditLogResult>
  }
  ```
- **驗收標準**：
  - Given 抽象介面已定義
  - When 需要更換儲存方式
  - Then 只需實作新的 service class
  - And 不影響現有的呼叫程式碼

### 3.3 查詢功能

**REQ-006 [P0] Audit Log 查詢 API**
- **描述**：提供 audit log 查詢功能，參考現有 `/api/v1/audit-logs` 規格
- **API 規格**：`GET /api/v1/audit-logs`
- **查詢參數**：
  - `operatorFilter` (optional): 篩選特定操作者
  - `page` (optional): 篩選特定頁面/路徑
  - `action` (optional): 篩選特定動作/方法
  - `startDate` (optional): 查詢起始時間
  - `endDate` (optional): 查詢結束時間
  - `limit` (optional): 每頁筆數（預設 50，最大 100）
  - `offset` (optional): 分頁偏移量
- **驗收標準**：
  - Given 營運團隊需要查詢操作記錄
  - When 呼叫查詢 API 並提供篩選條件
  - Then 回傳符合條件的 audit log 清單
  - And 支援分頁功能

**REQ-007 [P0] 查詢時間範圍限制**
- **描述**：限制查詢範圍為 7 天內的資料
- **驗收標準**：
  - Given 用戶查詢超過 7 天前的資料
  - When 呼叫查詢 API
  - Then 回傳參數驗證錯誤
  - And 提示查詢範圍限制

**REQ-008 [P1] 查詢權限控制**
- **描述**：查詢 API 需要有效的 ny-operator header
- **驗收標準**：
  - Given 用戶呼叫查詢 API
  - When 缺少或提供無效的 ny-operator header
  - Then 回傳 401 UNAUTHENTICATED 錯誤
  - And 有效 header 時允許查詢所有操作者的記錄

---

## 4. 非功能需求 (Non-Functional Requirements)

### 4.1 效能要求
- **寫入效能**：支援同步寫入，預期 RPS ≤ 1
- **查詢效能**：7 天內資料查詢回應時間無特定 SLA 要求
- **檔案 I/O**：單檔案大小無限制，依日期自然分割

### 4.2 安全性
- **資料保護**：敏感資料必須完全遮罩
- **檔案權限**：audit log 檔案僅系統帳號可讀寫
- **認證授權**：查詢功能需要有效的 ny-operator header

### 4.3 可靠性
- **資料完整性**：確保所有寫入操作都被記錄
- **錯誤處理**：audit log 記錄失敗不應影響主要業務流程
- **檔案管理**：自動建立目錄結構

### 4.4 可擴展性
- **儲存擴展**：抽象層設計支援未來遷移至資料庫
- **查詢擴展**：預留進階查詢功能的擴展空間

---

## 5. 技術規格 (Technical Specifications)

### 5.1 系統架構

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   NestJS API    │───▶│  Audit Interceptor│───▶│ AuditLogService │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                                          │
                                                          ▼
                                               ┌─────────────────┐
                                               │ FileSystemImpl  │
                                               └─────────────────┘
                                                          │
                                                          ▼
                                               ┌─────────────────┐
                                               │  ./logs/audit/  │
                                               │ audit-YYYYMMDD  │
                                               │     .jsonl      │
                                               └─────────────────┘
```

### 5.2 資料模型

**AuditLogData Interface**
```typescript
interface AuditLogData {
  id: string              // UUID
  timestamp: string       // ISO 8601
  operator: string        // ny-operator header
  method: string          // HTTP method
  path: string           // API path
  queryParams?: object   // Query parameters
  requestBody?: object   // Request body (masked)
  statusCode: number     // HTTP status code
  ipAddress?: string     // Client IP
  userAgent?: string     // User agent
  requestId: string      // Request tracking ID
}
```

**QueryCriteria Interface**
```typescript
interface QueryCriteria {
  operatorFilter?: string
  page?: string
  action?: string
  startDate?: string
  endDate?: string
  limit?: number
  offset?: number
}
```

### 5.3 API 規格

**查詢 API 回應格式**
```json
{
  "success": true,
  "data": [
    {
      "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
      "operator": "admin@91app.com",
      "page": "supplier-management",
      "action": "update-supplier",
      "fields": {
        "shopId": 12345,
        "market": "TW",
        "oldSupplierId": 100,
        "newSupplierId": 200
      },
      "metadata": {
        "method": "PATCH",
        "path": "/api/v1/shops/12345/suppliers",
        "statusCode": 200
      },
      "ipAddress": "192.168.1.100",
      "userAgent": "Mozilla/5.0...",
      "createdAt": "2025-10-06T14:30:52.123Z",
      "requestId": "req-20251006143052-abc123"
    }
  ],
  "pagination": {
    "total": 150,
    "limit": 50,
    "offset": 0
  },
  "timestamp": "2025-10-06T14:30:52.123Z",
  "requestId": "req-20251006143052-def456"
}
```

### 5.4 第三方整合
- 無外部服務依賴
- 使用 Node.js 內建的檔案系統 API

---

## 6. UI/UX 設計

### 6.1 頁面流程圖 (User Flow)
本功能為純 API 服務，無前端介面。營運團隊可透過：
- API 測試工具（Postman、curl）
- 內部管理工具串接

### 6.2 互動說明
- 查詢 API 支援多種篩選條件組合
- 分頁機制避免大量資料回傳
- 錯誤訊息提供明確的問題描述

---

## 7. 例外處理與邊界情況

### 7.1 錯誤情境

**檔案系統錯誤**
- 磁碟空間不足：記錄錯誤日誌，但不中斷主要流程
- 權限不足：啟動時檢查並提示設定問題
- 目錄不存在：自動建立 `./logs/audit/` 目錄

**查詢錯誤**
- 無效日期格式：回傳 400 參數驗證錯誤
- 超出 7 天限制：回傳錯誤訊息說明限制
- 檔案讀取失敗：回傳 503 服務不可用

### 7.2 邊界條件

**資料量限制**
- 單日 audit log 筆數：無硬性限制
- 查詢結果筆數：最大 100 筆/頁
- 檔案大小：依日期自然分割，無額外限制

**時間處理**
- 使用 UTC 時間儲存
- 查詢時支援時區轉換
- 跨日查詢需讀取多個檔案

### 7.3 回退機制

**主要流程保護**
- audit log 寫入失敗時，記錄 application log
- 不因 audit log 問題影響正常 API 回應
- 提供降級模式（關閉 audit log 功能）

---

## 8. 實作考量

### 8.1 技術風險
- **檔案 I/O 阻塞**：同步寫入可能影響效能，但目前 RPS 低可接受
- **檔案格式損壞**：JSON Lines 格式簡單，風險低
- **磁碟空間管理**：需要定期清理舊檔案

### 8.2 依賴項目
- NestJS Interceptor 功能
- Node.js 檔案系統 API
- UUID 生成函式庫

### 8.3 時程規劃

**Phase 1（預估 2 週）**
- 抽象層介面設計
- FileSystemAuditLogService 實作
- 基本 NestJS Interceptor

**Phase 2（預估 1 週）**
- 查詢 API 實作
- 敏感資料遮罩功能
- 單元測試

**Phase 3（預估 1 週）**
- 整合測試
- 文件撰寫
- 部署驗證

---

## 9. 測試策略

### 9.1 單元測試
- AuditLogService 介面測試
- 敏感資料遮罩邏輯測試
- 檔案讀寫功能測試

### 9.2 整合測試
- Interceptor 與 API 整合測試
- 多個 API 同時觸發 audit log
- 查詢功能端到端測試

### 9.3 效能測試
- 同步寫入效能驗證
- 7 天資料查詢效能測試

---

## 10. 附錄

### 10.1 名詞解釋
- **Audit Log**：稽核日誌，記錄系統操作的詳細資訊
- **JSON Lines**：每行一個 JSON 物件的文字格式
- **ny-operator**：營運平台的操作者識別 header

### 10.2 參考資料
- 現有 `/api/v1/audit-logs` API 規格（swagger.yaml）
- NestJS Interceptor 官方文件

### 10.3 變更記錄
- v1.0 (2025-10-06)：初版 PRD 建立

---

## 驗收清單

### 功能驗收
- [ ] 所有指定 API 的寫入操作都會產生 audit log
- [ ] 日誌格式符合 JSON Lines 規範
- [ ] 敏感資料正確遮罩（password、token、secret、key）
- [ ] 查詢 API 能正確回傳過濾後的結果
- [ ] 分頁功能正常運作
- [ ] 7 天時間範圍限制正確執行

### 技術驗收
- [ ] AuditLogService 抽象層介面完整
- [ ] FileSystemAuditLogService 實作正確
- [ ] NestJS Interceptor 正確攔截目標 API
- [ ] 同步處理不影響主要 API 效能（RPS ≤ 1）
- [ ] 錯誤處理不影響主要業務流程

### 安全驗收
- [ ] ny-operator header 驗證正確
- [ ] 敏感資料無洩露風險
- [ ] 檔案權限設定適當
- [ ] 無法存取其他系統檔案