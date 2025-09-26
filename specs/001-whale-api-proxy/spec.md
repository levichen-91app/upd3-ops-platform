# 功能規格：Whale API 代理服務

**功能分支**: `001-whale-api-proxy`
**建立日期**: 2025-09-25
**狀態**: 草稿
**輸入**: 使用者描述: "實作 Whale API Proxy，需求如下：

api spec：openapi/proxy-whale.yaml
Proxy API 路徑：/proxy/whale/update-supplier-id（POST）
只串 Whale API TW QA server（http://whale-api-internal.qa.91dev.tw/）
ny-operator header 由前端帶入
不需 rate limit 或權限控管
請求與回應錯誤皆以 log（JSON 格式）記錄
不需特別處理 timeout"

## 執行流程 (主要)
```
1. 解析輸入中的使用者描述
   → ✅ 已提供功能描述 - Whale API 代理服務實作
2. 從描述中提取關鍵概念
   → ✅ 已識別：API 代理、供應商 ID 更新、日誌記錄、標頭轉發
3. 針對每個不明確的方面：
   → 無歧義 - 需求明確且具體
4. 填寫使用者情境與測試章節
   → ✅ 明確的使用者流程：管理員透過代理更新供應商 ID
5. 產生功能需求
   → ✅ 所有需求皆可測試且具體
6. 識別關鍵實體（如涉及資料）
   → ✅ 已識別 UpdateSupplierRequest 實體
7. 執行審查檢查表
   → ✅ 無實作細節，專注於業務需求
8. 回傳：成功（規格已準備好進行規劃）
```

---

## ⚡ 快速指南
- ✅ 專注於使用者需要什麼以及為什麼
- ❌ 避免如何實作（無技術堆疊、API、程式碼結構）
- 👥 為業務利害關係人撰寫，非開發人員

### Section Requirements
- **Mandatory sections**: Must be completed for every feature
- **Optional sections**: Include only when relevant to the feature
- When a section doesn't apply, remove it entirely (don't leave as "N/A")

### For AI Generation
When creating this spec from a user prompt:
1. **Mark all ambiguities**: Use [NEEDS CLARIFICATION: specific question] for any assumption you'd need to make
2. **Don't guess**: If the prompt doesn't specify something (e.g., "login system" without auth method), mark it
3. **Think like a tester**: Every vague requirement should fail the "testable and unambiguous" checklist item
4. **Common underspecified areas**:
   - User types and permissions
   - Data retention/deletion policies  
   - Performance targets and scale
   - Error handling behaviors
   - Integration requirements
   - Security/compliance needs

---

## 使用者情境與測試 *(必填)*

### 主要使用者故事
身為管理員使用者，我需要透過代理 API 批次更新多個商品的供應商 ID，這樣我就能有效管理供應商資料，而無需直接存取 Whale API 系統。

### 驗收情境
1. **假設** 有一個有效的供應商更新請求，包含商店 ID、市場、舊供應商 ID 和新供應商 ID，**當** 我透過代理 API 提交請求並帶有有效的 ny-operator 標頭，**那麼** 系統應該將請求轉發到 Whale API 並回傳更新的商品數量
2. **假設** 有一個無效的請求內容（缺少必填欄位），**當** 我提交請求，**那麼** 系統應該回傳 400 錯誤並附上描述性訊息，同時記錄錯誤
3. **假設** Whale API 無法使用或回傳錯誤，**當** 我提交一個有效的請求，**那麼** 系統應該回傳 502 錯誤，並記錄請求和錯誤回應

### 邊界情況
- 當 ny-operator 標頭遺失時，系統應回傳 400 錯誤
- 當 Whale API 回傳意外的回應格式時，系統應記錄錯誤並回傳 502 錯誤
- 當請求包含超出必要欄位的額外屬性時，系統應拒絕請求並回傳 400 錯誤

## 需求 *(必填)*

### 功能需求
- **FR-001**: 系統必須提供 POST 端點 `/proxy/whale/update-supplier-id` 來接受供應商更新請求
- **FR-002**: 系統必須將所有請求轉發到 Whale API TW QA 伺服器的 `/admin/update-supplier-id` 端點 (`http://whale-api-internal.qa.91dev.tw/admin/update-supplier-id`)
- **FR-003**: 系統必須檢查客戶端請求中是否存在 `ny-operator` 標頭並將其轉發（僅驗證存在性，不驗證格式）
- **FR-004**: 系統必須驗證包含 shopId、market、oldSupplierId 和 newSupplierId 的請求內容
- **FR-005**: 系統必須以 JSON 格式記錄所有傳入請求和傳出回應，包含時間戳 (timestamp) 和請求 ID (requestId)
- **FR-006**: 系統必須以 JSON 格式記錄所有錯誤（客戶端錯誤和上游 API 錯誤），包含時間戳和請求 ID
- **FR-007**: 系統必須回傳適當的 HTTP 狀態碼（成功為 200、錯誤請求為 400、上游錯誤為 502、內部錯誤為 500）
- **FR-008**: 系統在成功時必須不加修改地回傳 Whale API 的回應
- **FR-009**: 系統必須優雅地處理 Whale API 錯誤並回傳適當的錯誤回應
- **FR-010**: 系統必須僅接受指定的請求屬性（shopId、market、oldSupplierId、newSupplierId）並拒絕其他額外屬性
- **FR-011**: 當 Whale API 回傳成功但格式與預期不符時，系統必須記錄錯誤並回傳 502 錯誤

### 關鍵實體
- **UpdateSupplierRequest**: 包含 shopId（整數）、market（字串）、oldSupplierId（整數）、newSupplierId（整數）和 ny-operator 標頭，用於批次更新供應商資訊
- **UpdateSupplierResponse**: 包含成功狀態、更新數量、商店資訊和從 Whale API 回傳的新供應商 ID

---

## 審查與驗收檢查表
*關卡：在主要執行過程中運行的自動檢查*

### 內容品質
- [x] 無實作細節（語言、框架、API）
- [x] 專注於使用者價值和業務需求
- [x] 為非技術利害關係人撰寫
- [x] 所有必填章節已完成

### 需求完整性
- [x] 無 [需要澄清] 標記遺留
- [x] 需求可測試且明確
- [x] 成功標準可衡量
- [x] 範圍界定清楚
- [x] 依賴性和假設已識別

---

## 執行狀態
*在處理過程中由主要程序更新*

- [x] 使用者描述已解析
- [x] 關鍵概念已提取
- [x] 歧義已標記
- [x] 使用者情境已定義
- [x] 需求已產生
- [x] 實體已識別
- [x] 審查檢查表已通過

---
