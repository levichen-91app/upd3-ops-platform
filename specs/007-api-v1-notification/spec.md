# 功能規格說明：/api/v1/notification-status/devices API

**功能分支**：`007-api-v1-notification`  
**建立日期**：2025-09-28  
**狀態**：草稿  
**輸入**：我要開發 /api/v1/notification-status/devices 這支 API

---

## 目標與背景

本 API 旨在提供依據商店 ID（shopId）與手機號碼（phone）查詢會員所有推播裝置的能力，統一代理外部 Marketing Cloud Device API，並符合平台標準回應格式與錯誤處理策略。

## Clarifications

### Session 2025-09-28
- Q: 請明確定義外部 Marketing Cloud Device API 的流量限制門檻與重試策略。 → A: 不限流量、不重試

---

## 用戶情境與驗收標準

### 主要用戶故事

作為系統管理員或開發者，我希望能查詢特定會員（以 shopId 與手機號碼識別）的推播裝置清單，以便了解該會員的裝置狀態並進行精準推播。

### 驗收情境

1. **當** 提供有效的 shopId 與手機號碼且該會員有綁定裝置時，**查詢** API，**則** 回傳裝置清單（含 guid、token、platform、時間戳等欄位）。
2. **當** 查無裝置時，**查詢** API，**則** 回傳空陣列。
3. **當** shopId 或手機號碼格式不正確時，**查詢** API，**則** 回傳標準化參數驗證錯誤。
4. **當** 外部 Marketing Cloud API 無法連線或逾時時，**查詢** API，**則** 回傳標準化外部 API 錯誤。

### 邊界情境

- 手機號碼含非數字字元時如何處理？
- 同一會員有多台裝置時如何呈現？
- 外部 API 頻率限制或逾時時如何回應？

---

## 功能需求

- **FR-001**：API 必須接受 shopId（整數，最小值 1）與 phone（字串，8-15 字元，允許數字及特定符號）作為查詢參數。
- **FR-002**：API 必須驗證參數格式，錯誤時回傳 `VALIDATION_ERROR`。
- **FR-003**：API 必須串接 Marketing Cloud Device API 取得裝置資料，並支援 timeout 與重試（依 config 設定）。
- **FR-004**：查詢成功時，回傳標準格式：
  ```json

  _不明確需求標記範例：_

  **FR-006**：系統必須處理外部 API 的流量限制（本案不限流量、不重試）。

        "token": "string",
        "platformDef": "iOS|Android",
        "shopId": 12345,
        "memberId": 67890,
        "appVersion": "1.2.3",
        "createdDateTime": "2024-01-15T10:35:00Z",
        "updatedDateTime": "2024-01-15T10:35:00Z"
      }
    ],
    "timestamp": "2024-01-15T10:35:00Z",
    "requestId": "req-devices-123456"
  }
  ```
- **FR-005**：查無裝置時，`data` 為空陣列。
- **FR-006**：外部 API 失敗時，回傳 `EXTERNAL_API_ERROR`，並於 `details` 帶出 service、endpoint、statusCode、originalError、retryable、retryAfter 等資訊。
- **FR-007**：API 所有回應皆需帶有 `timestamp`（ISO 8601）與 `requestId`（req-devices-<timestamp>）。
- **FR-008**：API 必須依據 config（`api/config/external-apis.config.ts`）取得外部 API 連線資訊。

---

## 資料結構

### Device

| 欄位            | 型別    | 說明           |
| --------------- | ------- | -------------- |
| guid            | string  | 裝置唯一識別碼 |
| token           | string  | 推播 Token     |
| platformDef     | string  | 平台定義       |
| shopId          | integer | 商店 ID        |
| memberId        | integer | 會員 ID        |
| appVersion      | string  | App 版本       |
| createdDateTime | string  | 建立時間       |
| updatedDateTime | string  | 更新時間       |

---

## 標準回應格式

### 成功

```json
{
   "success": true,
   "data": [Device, ...],
   "timestamp": "2024-01-15T10:35:00Z",
   "requestId": "req-devices-123456"
}
```

### 參數驗證錯誤

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "輸入參數驗證失敗",
    "details": [
      { "field": "shopId", "message": "must be greater than 0", "value": -1 },
      {
        "field": "phone",
        "message": "must be a valid phone number",
        "value": "invalid_phone"
      }
    ]
  },
  "timestamp": "2024-01-15T10:35:00Z",
  "requestId": "req-devices-123456"
}
```

### 查無裝置

```json
{
  "success": true,
  "data": [],
  "timestamp": "2024-01-15T10:35:00Z",
  "requestId": "req-devices-123456"
}
```

### 外部 API 失敗

```json
{
  "success": false,
  "error": {
    "code": "EXTERNAL_API_ERROR",
    "message": "Marketing Cloud 服務暫時無法使用",
    "details": {
      "service": "Marketing Cloud Device API",
      "endpoint": "/v1/shops/12345/phones/0912345678/devices",
      "statusCode": 500,
      "originalError": "Internal Server Error",
      "retryable": true,
      "retryAfter": 60
    }
  },
  "timestamp": "2024-01-15T10:35:00Z",
  "requestId": "req-devices-123456"
}
```

---

## 配置與環境需求

- 外部 API 連線資訊、timeout、retries 皆由 `api/config/external-apis.config.ts` 管理，並以 Joi 驗證。
- 需於 .env 設定對應環境變數（參考 config-simple.md 範例）。

---

## 審查與驗收清單

- [ ] 需求皆以用戶價值為核心，無實作細節
- [ ] 所有回應格式、錯誤碼、欄位皆與平台標準一致
- [ ] 參數驗證、外部 API 錯誤、逾時等情境皆有明確規格
- [ ] 配置與環境需求明確，便於部署與維運
- [ ] 無 [NEEDS CLARIFICATION] 標記

## ⚡ 快速指引

- ✅ 聚焦於用戶需求與商業目的（WHAT 與 WHY）
- ❌ 避免實作細節（不寫技術、API、程式結構）
- 👥 以商業利害關係人為對象撰寫，非給開發者

### 區塊要求

- **必填區塊**：每個功能都必須完成
- **選填區塊**：僅在相關時納入
- 若不適用，請直接移除該區塊（不要留「N/A」）

### AI 產生規格注意事項

根據用戶輸入產生規格時：

1. **所有不明確處都要標記**：用 [NEEDS CLARIFICATION: 具體問題] 標示
2. **不要猜測**：若描述未明確（如「登入系統」沒說驗證方式），就標記
3. **像測試人員一樣思考**：模糊需求應無法通過「可測試且明確」檢查
4. **常見未明確處**：
   - 用戶類型與權限
   - 資料保存/刪除政策
   - 效能目標與規模
   - 錯誤處理行為
   - 整合需求
   - 資安/法遵需求

---

## 用戶情境與測試（必填）

### 主要用戶故事

作為系統管理員或開發者，我希望能查詢特定用戶（以 shopId 與手機號碼識別）的推播裝置清單，以便了解該用戶的裝置狀態並進行精準推播。

### 驗收情境

1. **當** 提供有效的 shopId 與手機號碼且該用戶有綁定裝置時，**查詢** devices API，**則** 回傳包含 guid、token、platform、時間戳等資訊的裝置清單。
2. **當** 提供的 shopId 與手機號碼查無裝置時，**查詢** devices API，**則** 回傳空陣列或適當的查無資料回應。
3. **當** shopId 或手機號碼格式不正確時，**查詢** devices API，**則** 回傳參數驗證錯誤訊息。

### 邊界情境

- 手機號碼格式錯誤（如含非數字字元）時如何處理？
- 同一用戶有多台裝置時如何呈現？
- 若外部 Marketing Cloud API 無法連線時如何處理？

## 需求（必填）

### 功能需求

- **FR-001**：系統必須接受 shopId（整數，最小值 1）與 phone（字串，8-15 字元，允許數字及特定符號）作為查詢參數。
- **FR-002**：查詢到裝置時，系統必須以標準化格式回傳裝置清單。
- **FR-003**：輸入參數錯誤或查無裝置時，系統必須回傳適當錯誤訊息。
- **FR-004**：系統必須串接外部 Marketing Cloud Device API 取得裝置資料。
- **FR-005**：所有回應必須包含 requestId 與 timestamp 以利追蹤。

_不明確需求標記範例：_

- **FR-006**：系統必須處理外部 API 的流量限制 [NEEDS CLARIFICATION: 請明確流量限制門檻與重試策略？]

### 關鍵實體（如涉及資料）

- **Device**：代表用戶推播裝置，屬性包含 guid（唯一識別碼）、token（推播 token）、platform（iOS/Android）、shopId、memberId、appVersion、時間戳等。

---

## 審查與驗收清單

_GATE：main() 執行時自動檢查_

### 內容品質

- [ ] 無實作細節（語言、框架、API）
- [ ] 聚焦用戶價值與商業需求
- [ ] 以非技術利害關係人為對象撰寫
- [ ] 所有必填區塊皆已完成

### 需求完整性

- [ ] 無 [NEEDS CLARIFICATION] 標記
- [ ] 需求可測試且明確
- [ ] 成功標準可衡量
- [ ] 範圍明確界定
- [ ] 依賴與假設已標示

---

## 執行狀態

_main() 執行時自動更新_

- [ ] 用戶描述已解析
- [ ] 關鍵概念已萃取
- [ ] 不明確處已標記
- [ ] 用戶情境已定義
- [ ] 需求已產生
- [ ] 實體已辨識
- [ ] 審查清單已通過

---
