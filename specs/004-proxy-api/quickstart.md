# Quickstart: Proxy API 標準化重構

**Feature**: 004-proxy-api
**Date**: 2025-09-26

## Overview

此快速開始指南基於 004-proxy-api 規格中的使用者場景，提供逐步驗證標準化重構功能的測試流程。

## Prerequisites

- Node.js 18+ 環境
- NestJS 11.x 應用程式運行
- 測試資料庫可用
- Whale API 整合正常運作

## Test Scenario 1: RESTful API 設計驗證

**User Story**: 作為使用 Proxy API 的開發人員，我需要一個符合企業級標準的 RESTful API

### Steps

1. **驗證舊端點已移除**
   ```bash
   # 這個請求應該回傳 404 Not Found
   curl -X POST http://localhost:3000/proxy/whale/update-supplier-id \
     -H "Content-Type: application/json" \
     -H "ny-operator: test@91app.com" \
     -d '{"market":"TW","oldSupplierId":100,"newSupplierId":200}'
   ```
   **Expected**: 404 Not Found

2. **驗證新 RESTful 端點**
   ```bash
   # 新的標準化端點
   curl -X PATCH http://localhost:3000/api/v1/shops/12345/suppliers \
     -H "Content-Type: application/json" \
     -H "ny-operator: test@91app.com" \
     -d '{"market":"TW","oldSupplierId":100,"newSupplierId":200}'
   ```
   **Expected**: 200 OK 與統一回應格式

3. **驗證版本控制**
   ```bash
   # 檢查 /api/v1 版本前綴是否必要
   curl -X PATCH http://localhost:3000/shops/12345/suppliers \
     -H "Content-Type: application/json" \
     -H "ny-operator: test@91app.com" \
     -d '{"market":"TW","oldSupplierId":100,"newSupplierId":200}'
   ```
   **Expected**: 404 Not Found (證明版本控制是必須的)

## Test Scenario 2: 統一回應格式驗證

**User Story**: API 呼叫成功時必須回傳統一的結構格式

### Steps

1. **成功回應格式驗證**
   ```bash
   curl -X PATCH http://localhost:3000/api/v1/shops/12345/suppliers \
     -H "Content-Type: application/json" \
     -H "ny-operator: test@91app.com" \
     -d '{"market":"TW","oldSupplierId":100,"newSupplierId":200}' | jq .
   ```

   **Expected Response Structure**:
   ```json
   {
     "success": true,
     "data": {
       "updatedCount": 5,
       "shopId": 12345,
       "market": "TW",
       "supplierId": 200
     },
     "timestamp": "2025-09-26T14:30:52.123Z",
     "requestId": "req-20250926143052-a8b2c4d6e8f0-1234-5678-90ab-cdef12345678"
   }
   ```

2. **時間戳格式驗證**
   ```bash
   # 檢查時間戳是否為 ISO 8601 格式
   response=$(curl -s -X PATCH http://localhost:3000/api/v1/shops/12345/suppliers \
     -H "Content-Type: application/json" \
     -H "ny-operator: test@91app.com" \
     -d '{"market":"TW","oldSupplierId":100,"newSupplierId":200}')

   echo $response | jq -r '.timestamp' | grep -E '^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$'
   ```
   **Expected**: 匹配的 ISO 8601 時間戳

3. **Request ID 格式驗證**
   ```bash
   # 檢查 Request ID 格式
   echo $response | jq -r '.requestId' | grep -E '^req-\d{14}-[a-f0-9-]{36}$'
   ```
   **Expected**: 匹配的 Request ID 格式

## Test Scenario 3: 結構化錯誤處理驗證

**User Story**: API 呼叫失敗時必須回傳結構化的錯誤代碼和詳細訊息

### Steps

1. **驗證錯誤 - 相同供應商 ID**
   ```bash
   curl -X PATCH http://localhost:3000/api/v1/shops/12345/suppliers \
     -H "Content-Type: application/json" \
     -H "ny-operator: test@91app.com" \
     -d '{"market":"TW","oldSupplierId":100,"newSupplierId":100}' | jq .
   ```

   **Expected Response**:
   ```json
   {
     "success": false,
     "error": {
       "code": "SUPPLIER_IDS_IDENTICAL",
       "message": "Old and new supplier IDs must be different",
       "details": {
         "oldSupplierId": 100,
         "newSupplierId": 100
       }
     },
     "timestamp": "2025-09-26T14:30:52.123Z",
     "requestId": "req-20250926143052-a8b2c4d6e"
   }
   ```

2. **驗證錯誤 - 缺少必要欄位**
   ```bash
   curl -X PATCH http://localhost:3000/api/v1/shops/12345/suppliers \
     -H "Content-Type: application/json" \
     -H "ny-operator: test@91app.com" \
     -d '{"oldSupplierId":100,"newSupplierId":200}' | jq .
   ```

   **Expected**: 400 Bad Request 與 `MISSING_REQUIRED_FIELD` 錯誤代碼

3. **驗證錯誤 - 授權失敗**
   ```bash
   curl -X PATCH http://localhost:3000/api/v1/shops/12345/suppliers \
     -H "Content-Type: application/json" \
     -d '{"market":"TW","oldSupplierId":100,"newSupplierId":200}' | jq .
   ```

   **Expected**: 401 Unauthorized 與 `UNAUTHORIZED_ACCESS` 錯誤代碼

## Test Scenario 4: HTTP 狀態碼標準化驗證

**User Story**: 系統必須使用正確的 HTTP 狀態碼

### Steps

1. **成功更新 - 200 OK**
   ```bash
   curl -w "%{http_code}" -o /dev/null -s -X PATCH \
     http://localhost:3000/api/v1/shops/12345/suppliers \
     -H "Content-Type: application/json" \
     -H "ny-operator: test@91app.com" \
     -d '{"market":"TW","oldSupplierId":100,"newSupplierId":200}'
   ```
   **Expected**: 200

2. **驗證錯誤 - 400 Bad Request**
   ```bash
   curl -w "%{http_code}" -o /dev/null -s -X PATCH \
     http://localhost:3000/api/v1/shops/12345/suppliers \
     -H "Content-Type: application/json" \
     -H "ny-operator: test@91app.com" \
     -d '{"market":"","oldSupplierId":100,"newSupplierId":200}'
   ```
   **Expected**: 400

3. **授權錯誤 - 401 Unauthorized**
   ```bash
   curl -w "%{http_code}" -o /dev/null -s -X PATCH \
     http://localhost:3000/api/v1/shops/12345/suppliers \
     -H "Content-Type: application/json" \
     -d '{"market":"TW","oldSupplierId":100,"newSupplierId":200}'
   ```
   **Expected**: 401

## Test Scenario 5: 效能需求驗證

**User Story**: 重構後的 API 效能不得劣化超過 10%

### Steps

1. **基準測試 - 測量當前回應時間**
   ```bash
   # 執行 10 次請求並計算平均回應時間
   for i in {1..10}; do
     curl -w "%{time_total}\n" -o /dev/null -s -X PATCH \
       http://localhost:3000/api/v1/shops/12345/suppliers \
       -H "Content-Type: application/json" \
       -H "ny-operator: test@91app.com" \
       -d '{"market":"TW","oldSupplierId":100,"newSupplierId":200}'
   done
   ```

2. **負載測試 (使用 Apache Bench)**
   ```bash
   ab -n 100 -c 10 -H "Content-Type: application/json" \
      -H "ny-operator: test@91app.com" \
      -p payload.json \
      http://localhost:3000/api/v1/shops/12345/suppliers
   ```

   payload.json 內容:
   ```json
   {"market":"TW","oldSupplierId":100,"newSupplierId":200}
   ```

## Test Scenario 6: 測試覆蓋率驗證

**User Story**: 系統必須維持測試覆蓋率 ≥ 80% 且所有測試通過

### Steps

1. **執行所有測試**
   ```bash
   npm test
   ```
   **Expected**: 所有測試通過，執行時間 < 2 秒

2. **檢查測試覆蓋率**
   ```bash
   npm run test:cov
   ```
   **Expected**: 覆蓋率 ≥ 80%

3. **執行契約測試**
   ```bash
   npm test -- --testPathPattern=supplier-update-api.test.ts
   ```
   **Expected**: 所有契約測試通過

## Test Scenario 7: API 文檔驗證

**User Story**: OpenAPI 規格必須完整且準確

### Steps

1. **檢查 Swagger UI 可用性**
   ```bash
   curl -I http://localhost:3000/api/docs
   ```
   **Expected**: 200 OK

2. **驗證 OpenAPI 規格**
   ```bash
   curl http://localhost:3000/api-json | jq '.paths."/api/v1/shops/{shopId}/suppliers".patch'
   ```
   **Expected**: 完整的 PATCH 端點定義

## Validation Checklist

完成快速開始測試後，檢查以下項目：

- [ ] 舊端點已完全移除 (404 Not Found)
- [ ] 新 RESTful 端點正常運作 (200 OK)
- [ ] 統一回應格式正確實作 (包含 success、data、timestamp、requestId)
- [ ] 錯誤回應使用結構化錯誤代碼
- [ ] HTTP 狀態碼使用正確 (200、400、401、502)
- [ ] Request ID 格式符合規格 (`req-{timestamp}-{uuid}`)
- [ ] 時間戳使用 ISO 8601 格式
- [ ] 英文錯誤訊息正確顯示
- [ ] API 效能未劣化超過 10%
- [ ] 測試覆蓋率維持 ≥ 80%
- [ ] 所有測試在 2 秒內完成
- [ ] OpenAPI 文檔完整更新
- [ ] 與 Whale API 整合正常

## Troubleshooting

**問題**: API 回應時間過長
**解決**: 檢查中間件執行順序，確保攔截器效能最佳化

**問題**: Request ID 格式不正確
**解決**: 驗證 UUID v4 + timestamp 組合生成邏輯

**問題**: 測試覆蓋率不足
**解決**: 檢查新增的中間件和攔截器是否有對應測試

**問題**: 契約測試失敗
**解決**: 確認實際 API 回應格式與 OpenAPI 規格一致

## Next Steps

完成快速開始驗證後：

1. 執行完整的整合測試套件
2. 進行端到端效能測試
3. 更新相關文檔和部署指南
4. 通知相關團隊 API 變更內容

---

**重要**: 此快速開始指南基於規格需求設計，實際執行前請確保測試環境已正確設定。