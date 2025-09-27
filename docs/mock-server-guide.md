# Marketing Cloud API Mock Server 指南

## 🚀 快速開始

你的 Marketing Cloud API 現在支援 Mock 模式，讓 F2E 團隊可以直接串接而不需要實際的外部 API。

## ⚙️ Mock 模式設定

### 方法 1: 環境變數啟動
```bash
# 設定 mock 模式
export MARKETING_CLOUD_MOCK_MODE=true

# 啟動開發服務器
npm run start:dev
```

### 方法 2: 一行指令啟動
```bash
MARKETING_CLOUD_MOCK_MODE=true npm run start:dev
```

## 🌍 Mock Server 端點

**基礎 URL:** `http://localhost:3000`

### 主要 API 端點
```
GET /api/v1/shops/{shopId}/members/by-phone/{phone}/devices
```

### 文件端點
```
GET /api-docs          # Swagger UI 介面
GET /api-json          # OpenAPI JSON 規格
```

## 📱 Mock 資料規則

### 正常情況
- **手機號碼末尾 1-9**: 會返回 1-3 個裝置 (基於末尾數字)
- **裝置類型**: iOS 和 Android 輪替
- **一致性**: 相同手機號碼總是返回相同的裝置數量

### 特殊測試場景
- **手機號碼末尾 `000`**: 返回空裝置列表 `[]`
- **手機號碼末尾 `404`**: 返回 404 Not Found 錯誤

### 範例資料結構
```json
{
  "success": true,
  "data": {
    "shopId": 12345,
    "phone": "0912345678",
    "devices": [
      {
        "guid": "mock-12345-0912345678-device-1-1698765432000",
        "udid": "MOCKIOS18",
        "token": "mock_push_token_iOS_1_8_ab123def",
        "shopId": 12345,
        "platformDef": "iOS",
        "memberId": 108000,
        "advertiseId": "mock-ad-80-1234-5678-9012-ab123def4567",
        "appVersion": "2.8.0",
        "updatedDateTime": "2025-09-27T04:00:00.000Z",
        "createdDateTime": "2025-08-28T04:00:00.000Z"
      }
    ],
    "totalCount": 1
  },
  "timestamp": "2025-09-27T04:30:00.000Z",
  "requestId": "mc-abc123-def456"
}
```

## 🧪 F2E 測試範例

### 成功情況
```bash
curl -X GET "http://localhost:3000/api/v1/shops/12345/members/by-phone/0912345678/devices" \
  -H "ny-operator: frontend-dev" \
  -H "Content-Type: application/json"
```

### 無裝置情況
```bash
curl -X GET "http://localhost:3000/api/v1/shops/12345/members/by-phone/0912345000/devices" \
  -H "ny-operator: frontend-dev"
```

### 404 錯誤情況
```bash
curl -X GET "http://localhost:3000/api/v1/shops/12345/members/by-phone/0912345404/devices" \
  -H "ny-operator: frontend-dev"
```

### 驗證錯誤 (缺少 header)
```bash
curl -X GET "http://localhost:3000/api/v1/shops/12345/members/by-phone/0912345678/devices"
# 返回 401 Unauthorized
```

## 📊 Mock 資料特性

### 動態生成
- **GUID**: 包含 shopId、phone、裝置序號和時間戳記
- **會員 ID**: 基於手機號碼末尾數字計算 (100000 + 末尾數字*1000 + 裝置序號)
- **應用版本**: 基於裝置序號和手機號碼動態生成
- **時間戳記**: 模擬不同的建立/更新時間

### 隱私保護
- 所有日誌中的手機號碼都會遮蔽 (`091****678`)
- 敏感資料 (token, udid, advertiseId) 在日誌中不會顯示

## 🔄 從 Mock 模式切換到真實模式

```bash
# 移除環境變數或設為 false
export MARKETING_CLOUD_MOCK_MODE=false
# 或完全移除
unset MARKETING_CLOUD_MOCK_MODE

# 重新啟動服務器
npm run start:dev
```

## 🎯 適用場景

- ✅ F2E 開發階段
- ✅ API 規格驗證
- ✅ 錯誤情境測試
- ✅ 效能測試 (快速回應)
- ✅ 離線開發

Mock 模式提供了完整的 API 體驗，讓 F2E 團隊可以獨立開發而不依賴外部服務的可用性。