# Data Model: 通知詳細資訊查詢 API

## 核心實體

### 1. NotificationDetailQuery (輸入DTO)
**用途**: API請求參數驗證
**欄位**:
- `shopId`: number (正整數，最小值1)
- `ncId`: string (UUID格式)
- `nyOperator`: string (從header提取，必填)

**驗證規則**:
- shopId: `@IsInt()`, `@Min(1)`
- ncId: `@IsUUID()`
- nyOperator: `@IsNotEmpty()`, `@IsString()`

### 2. NotificationDetail (回應實體)
**用途**: 通知詳細資訊的主要資料結構
**欄位**:
- `NCId`: string (通知中心ID)
- `NSId`: string (通知服務ID)
- `Status`: string (任務狀態，如"Completed")
- `ChannelType`: string (通知類型，如"Push", "Email", "SMS")
- `CreateDateTime`: string (建立時間，ISO格式)
- `Report`: Report (報告資料)
- `ShortMessageReportLink`: string | null (簡訊報告連結，可為空)

**狀態枚舉**:
- Status: "Scheduled" | "Processing" | "Completed" | "Failed" | "Cancelled"
- ChannelType: "Push" | "Email" | "SMS"

### 3. Report (報告實體)
**用途**: 通知發送統計報告
**基礎欄位** (所有類型共有):
- `Total`: number (總筆數)
- `NoUserData`: number (找不到使用者資料)
- `InBlackList`: number (被黑名單篩掉)
- `DontWantToReceiveThisMessageType`: number (不想收到這種訊息)
- `Sent`: number (已遞送)
- `Fail`: number (遞送失敗)
- `DidNotSend`: number (沒有遞送出去)
- `Cancel`: number (取消)

**Push專用欄位**:
- `NoTokenData`: number (沒有Token資料)
- `Received`: number (NS收到)

**Email專用欄位**:
- `EmailIsEmpty`: number (Email是空值)

**SMS專用欄位**:
- `CellPhoneIsEmpty`: number (手機是空值)
- `Success`: number (客戶確實收到)
- `Declined`: number (供應商取消遞送)
- `CellPhoneIsNotTW`: number (非TW電話)
- `CellPhoneIsNotMY`: number (非MY電話)

### 4. ApiResponse<T> (統一回應格式)
**用途**: 所有API的標準回應格式
**欄位**:
- `success`: boolean (固定為true)
- `data`: T | null (實際資料，可為null)
- `timestamp`: string (回應時間戳，ISO格式)
- `requestId`: string (請求追蹤ID)

### 5. ApiErrorResponse (錯誤回應格式)
**用途**: 錯誤情況的標準回應格式
**欄位**:
- `success`: boolean (固定為false)
- `error`: ErrorDetail (錯誤詳情)
- `timestamp`: string (錯誤時間戳)
- `requestId`: string (請求追蹤ID)

### 6. ErrorDetail (錯誤詳情)
**用途**: 結構化錯誤資訊
**欄位**:
- `code`: string (標準錯誤代碼)
- `message`: string (用戶友好錯誤訊息)
- `details`: any (可選，錯誤詳細資訊)

**錯誤代碼枚舉**:
- `VALIDATION_ERROR`: 參數驗證失敗
- `EXTERNAL_API_ERROR`: 外部API調用失敗
- `TIMEOUT_ERROR`: 請求超時
- `DATA_FORMAT_ERROR`: 資料格式異常
- `INTERNAL_SERVER_ERROR`: 內部服務錯誤

## 資料流向

```
Client Request (shopId, ncId, ny-operator header)
    ↓
NotificationDetailQuery (參數驗證)
    ↓
INcDetailService.getNotificationDetail()
    ↓
External NC Detail API Call
    ↓
Raw Response → NotificationDetail (資料轉換)
    ↓
ApiResponse<NotificationDetail> (統一回應格式)
    ↓
Client Response
```

## 狀態轉換

### NotificationDetail.Status
```
Scheduled → Processing → Completed
         → Processing → Failed
         → Cancelled (任何狀態都可取消)
```

### 特殊情況處理
- **通知不存在**: 回應 `{ success: true, data: null }`
- **外部API異常**: 回應 `{ success: false, error: {...} }`
- **參數驗證失敗**: 回應 `{ success: false, error: { code: "VALIDATION_ERROR" } }`

## 介面抽象設計

### INcDetailService
```typescript
interface INcDetailService {
  getNotificationDetail(shopId: number, ncId: string): Promise<NotificationDetail | null>;
}
```

### 配置介面
```typescript
interface NcDetailConfig {
  baseUrl: string;
  timeout: number;
  retries: number;
}
```

此資料模型設計完全遵循憲章的依賴抽象化原則，支援完整的測試和錯誤處理機制。