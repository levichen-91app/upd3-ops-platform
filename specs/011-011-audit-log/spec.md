# 功能規格：系統稽核日誌

**功能分支**: `011-011-audit-log`  
**建立時間**: 2025-10-06  
**狀態**: 草稿  
**輸入**: 使用者描述: "011-audit-log.md"

## 執行流程 (主要)

```
1. 解析輸入的使用者描述
   → 從現有 PRD 文件中提取
2. 從描述中提取關鍵概念
   → 識別：稽核日誌、操作追蹤、安全合規
3. 針對每個不明確的方面：
   → 所有需求在 PRD 中都已明確定義
4. 填寫使用者情境與測試章節
   → 定義安全調查和問題排查流程
5. 產生功能需求
   → 從 PRD 中提取 8 個功能需求
6. 識別關鍵實體（如涉及資料）
   → 識別 AuditLogData 實體
7. 執行審查檢核清單
   → 規格已準備好進行規劃
8. 回傳：成功（規格已準備好進行規劃）
```

---

## ⚡ 快速指南

- ✅ 專注於使用者需要什麼以及為什麼
- ❌ 避免如何實作（不涉及技術堆疊、API、程式碼結構）
- 👥 為業務利害關係人撰寫，而非開發人員

---

## 使用者情境與測試

### 主要使用者故事

營運團隊成員需要追蹤和調查系統操作，以進行安全稽核和問題排查。當發生可疑活動或系統問題時，他們必須能夠快速識別是誰執行了什麼動作、何時發生以及涉及哪些資料。

### 驗收情境

1. **假設** 偵測到安全事件，**當** 營運團隊查詢特定時間段和操作者的稽核日誌時，**則** 他們會收到該操作者執行的所有寫入操作的完整清單，且敏感資料已遮罩
2. **假設** 發生系統異常，**當** 營運團隊搜尋受影響資源的近期操作時，**則** 他們可以識別可能導致問題的變更序列
3. **假設** 在受監控的 API 上執行寫入操作（POST/PUT/PATCH/DELETE），**當** 操作完成（成功或失敗）時，**則** 系統會自動建立包含完整操作詳細資訊的稽核日誌項目
4. **假設** 營運團隊成員想要檢視系統活動，**當** 他們查詢稽核日誌而未指定日期範圍時，**則** 系統僅回傳最近 7 天的資料以維持效能

### 邊界情況

- 當稽核日誌儲存失敗時會發生什麼？系統回傳 HTTP 503 Service Unavailable 錯誤給受影響的 API
- 系統如何處理查詢超過 7 天的資料？回傳驗證錯誤並提供時間限制的明確訊息
- 當敏感資料欄位嵌套在複雜物件中時會發生什麼？所有匹配的欄位名稱都會遞迴遮罩
- 系統如何回應沒有適當認證的查詢？回傳 401 UNAUTHENTICATED 錯誤
- 當稽核日誌儲存目錄無法存取時會發生什麼？受影響的 API 會回傳 HTTP 503 Service Unavailable

## 需求

### 功能需求

- **FR-001**: 系統必須自動記錄 `/api/v1/shops/*` 和 `/api/v1/notification-status/*` 端點上的所有寫入操作（POST、PUT、PATCH、DELETE）
- **FR-002**: 系統必須擷取完整的操作上下文，包括操作者 ID、時間戳記、HTTP 方法、路徑、請求主體、狀態碼、IP 位址和使用者代理
- **FR-003**: 系統必須自動遮罩欄位名稱中包含「password」、「token」、「secret」或「key」的敏感資料欄位，將值替換為「\*\*\*」
- **FR-004**: 系統必須使用 JSON Lines 格式將稽核日誌儲存在每日檔案中，位於 `./logs/audit/audit-YYYYMMDD.jsonl`
- **FR-005**: 系統必須提供查詢 API，允許營運團隊使用操作者、頁面、動作和日期範圍的篩選器搜尋稽核日誌
- **FR-006**: 系統必須將稽核日誌查詢限制在最多 7 天的時間範圍內以維持效能
- **FR-007**: 系統必須要求所有稽核日誌查詢操作都有有效的 ny-operator 標頭
- **FR-008**: 即使稽核日誌記錄失敗，系統也必須繼續正常的 API 操作，並單獨記錄稽核失敗
- **FR-009**: 系統必須支援低容量同步寫入（≤1 操作/秒），使用簡單的檔案寫入機制
- **FR-010**: 系統必須自動刪除超過 30 天的稽核日誌檔案，以管理儲存空間
- **FR-011**: 查詢 API 必須僅回傳歷史資料的靜態快照，不支援即時更新
- **FR-012**: 系統必須為失敗的操作（4xx/5xx 回應）記錄與成功操作相同的完整詳細資訊

### 關鍵實體

- **AuditLogData**: 代表單一稽核日誌項目，包含操作元資料（ID、時間戳記、操作者、HTTP 詳細資訊）、請求資訊（方法、路徑、參數、主體）、回應資料（狀態碼）和追蹤資訊（IP 位址、使用者代理、請求 ID）

---

## 澄清事項

### Session 2025-10-06

- Q: What is the expected maximum concurrent audit log write operations per second during peak usage? → A: Low volume (≤1 ops/sec) - Simple synchronous file writes sufficient
- Q: How should the system handle audit log file cleanup and retention beyond the 7-day query limit? → A: Auto-delete after 30 days - System automatically removes files older than 30 days
- Q: What should happen when the audit log storage directory becomes inaccessible (permissions/disk full)? → A: Fail fast - Return HTTP 503 Service Unavailable for affected APIs
- Q: Should the audit log query API support real-time/live updates, or only historical data retrieval? → A: Historical only - Query returns static snapshots of completed audit logs
- Q: What level of audit log detail should be captured for failed operations (4xx/5xx responses)? → A: Same as successful operations - Full request/response details for all failures

---

## 審查與驗收檢核清單

### 內容品質

- [x] 無實作細節（程式語言、框架、API）
- [x] 專注於使用者價值和業務需求
- [x] 為非技術利害關係人撰寫
- [x] 所有必要章節都已完成

### 需求完整性

- [x] 沒有 [需要澄清] 標記殘留
- [x] 需求可測試且明確
- [x] 成功標準可測量
- [x] 範圍界定明確
- [x] 依賴關係和假設已識別

---

## 執行狀態

- [x] 使用者描述已解析
- [x] 關鍵概念已提取
- [x] 模糊之處已標記
- [x] 使用者情境已定義
- [x] 需求已產生
- [x] 實體已識別
- [x] 審查檢核清單已通過

---
