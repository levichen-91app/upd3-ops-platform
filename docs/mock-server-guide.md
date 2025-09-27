# UPD3 Operations Platform - Unified Mock Server 指南

## 🚀 快速開始

你的 UPD3 Operations Platform API 現在支援統一的 Mock 模式控制，讓 F2E 團隊可以直接串接而不需要實際的外部 API。

**支援的 API 服務：**
- 🎯 Marketing Cloud API - 會員裝置查詢
- 🐋 Whale API - 供應商資料更新

## ⚙️ 統一 Mock 模式控制

### 🌍 全域 Mock 模式（推薦）
```bash
# 啟用所有 API 的 mock 模式
MOCK_MODE=true npm run start:dev
```

### 🎯 個別服務 Mock 模式
```bash
# 只啟用 Marketing Cloud API mock
MARKETING_CLOUD_MOCK_MODE=true npm run start:dev

# 只啟用 Whale API mock
WHALE_API_MOCK_MODE=true npm run start:dev

# 同時啟用多個服務 mock
MARKETING_CLOUD_MOCK_MODE=true WHALE_API_MOCK_MODE=true npm run start:dev
```

### 🔧 持續性設定
```bash
# 設定環境變數（持續到終端關閉）
export MOCK_MODE=true
npm run start:dev

# 或設定個別服務
export MARKETING_CLOUD_MOCK_MODE=true
export WHALE_API_MOCK_MODE=true
npm run start:dev
```

## 🌍 Mock Server 端點

**基礎 URL:** `http://localhost:3000`

### 主要 API 端點
```
# Marketing Cloud API
GET /api/v1/shops/{shopId}/members/by-phone/{phone}/devices

# Whale API (Suppliers)
PATCH /api/v1/shops/{shopId}/suppliers
```

### 文件端點
```
GET /api-docs          # Swagger UI 介面（顯示 Mock 狀態）
GET /api-json          # OpenAPI JSON 規格
```

## 📱 Marketing Cloud API Mock 規則

### 正常情況
- **手機號碼末尾 1-9**: 會返回 1-3 個裝置 (基於末尾數字)
- **裝置類型**: iOS 和 Android 輪替
- **一致性**: 相同手機號碼總是返回相同的裝置數量

### 特殊測試場景
- **手機號碼末尾 `000`**: 返回空裝置列表 `[]`
- **手機號碼末尾 `404`**: 返回 404 Not Found 錯誤

## 🐋 Whale API Mock 規則

### 正常情況
- **shopId**: 基於 shopId 返回不同的更新筆數
- **一致性**: 相同 shopId 總是返回相同的更新結果

### 特殊測試場景
- **shopId = 404**: 返回 0 筆更新記錄
- **shopId 末尾為 0**: 返回 100-500 筆更新記錄（大量更新）
- **其他 shopId**: 返回 1-50 筆更新記錄（一般更新）

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

### Marketing Cloud API 測試

#### 成功情況（返回裝置列表）
```bash
curl -X GET "http://localhost:3000/api/v1/shops/12345/members/by-phone/0912345678/devices" \
  -H "ny-operator: frontend-dev" \
  -H "Content-Type: application/json"
```

#### 無裝置情況
```bash
curl -X GET "http://localhost:3000/api/v1/shops/12345/members/by-phone/0912345000/devices" \
  -H "ny-operator: frontend-dev"
```

#### 404 錯誤情況
```bash
curl -X GET "http://localhost:3000/api/v1/shops/12345/members/by-phone/0912345404/devices" \
  -H "ny-operator: frontend-dev"
```

#### 驗證錯誤 (缺少 header)
```bash
curl -X GET "http://localhost:3000/api/v1/shops/12345/members/by-phone/0912345678/devices"
# 返回 401 Unauthorized
```

### Whale API 測試

#### 成功更新情況（一般更新）
```bash
curl -X PATCH "http://localhost:3000/api/v1/shops/12345/suppliers" \
  -H "ny-operator: frontend-dev" \
  -H "Content-Type: application/json" \
  -d '{
    "market": "TW",
    "oldSupplierId": "OLD123",
    "newSupplierId": "NEW456"
  }'
```

#### 大量更新情況（shopId 末尾為 0）
```bash
curl -X PATCH "http://localhost:3000/api/v1/shops/12340/suppliers" \
  -H "ny-operator: frontend-dev" \
  -H "Content-Type: application/json" \
  -d '{
    "market": "TW",
    "oldSupplierId": "OLD123",
    "newSupplierId": "NEW456"
  }'
```

#### 無更新情況（shopId = 404）
```bash
curl -X PATCH "http://localhost:3000/api/v1/shops/404/suppliers" \
  -H "ny-operator: frontend-dev" \
  -H "Content-Type: application/json" \
  -d '{
    "market": "TW",
    "oldSupplierId": "OLD123",
    "newSupplierId": "NEW456"
  }'
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

### 關閉全域 Mock 模式
```bash
# 移除全域 mock 模式
unset MOCK_MODE

# 重新啟動服務器
npm run start:dev
```

### 關閉個別服務 Mock 模式
```bash
# 移除特定服務的 mock 模式
unset MARKETING_CLOUD_MOCK_MODE
unset WHALE_API_MOCK_MODE

# 或設為 false（效果相同）
export MARKETING_CLOUD_MOCK_MODE=false
export WHALE_API_MOCK_MODE=false

# 重新啟動服務器
npm run start:dev
```

## 🔍 Swagger UI 整合

你的 Swagger UI (`http://localhost:3000/api-docs`) 現在會自動顯示 Mock 狀態：

- **標題顯示**: `[MOCK: Marketing Cloud, Whale API]` 或類似指示
- **描述包含**: 完整的 Mock 測試場景說明
- **環境變數參考**: 各種 Mock 模式的啟用方法

這讓 F2E 團隊可以直接在 Swagger UI 中測試 Mock API！

## 🎯 適用場景

### ✅ 開發階段
- F2E 前端開發
- API 規格驗證
- 原型設計驗證

### ✅ 測試階段
- 錯誤情境測試
- 邊界條件測試
- 效能測試 (快速回應)

### ✅ 整合階段
- 離線開發
- CI/CD pipeline 測試
- Docker 環境隔離測試

統一的 Mock 系統提供了完整的 API 體驗，讓開發團隊可以獨立工作而不依賴外部服務的可用性。