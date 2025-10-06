# 稽核日誌功能快速開始指南

**版本**: 1.0  
**日期**: 2025-10-06  
**預計執行時間**: 15-20 分鐘  

## 概述

本指南將引導您完成稽核日誌功能的基本操作，包括：
1. 觸發稽核日誌記錄
2. 查詢稽核日誌
3. 驗證敏感資料遮罩
4. 測試錯誤場景

## 前置條件

### 環境要求
- Node.js 18+ 
- NestJS 10.x 應用已啟動
- 具備有效的 `ny-operator` 認證權限

### 檢查服務狀態
```bash
# 確認應用運行中
curl http://localhost:3000/health

# 確認稽核日誌目錄存在
ls -la ./logs/audit/
```

### 準備測試資料
```bash
# 建立測試操作者
export TEST_OPERATOR="test@91app.com"

# 準備測試用 Request ID
export TEST_REQUEST_ID="req-$(date +%Y%m%d%H%M%S)-$(uuidgen | tr '[:upper:]' '[:lower:]')"
```

## 步驟 1: 觸發稽核日誌記錄

### 1.1 測試 POST 操作 (建立資源)

**執行 API 呼叫**:
```bash
curl -X POST http://localhost:3000/api/v1/shops/12345/suppliers \
  -H "Content-Type: application/json" \
  -H "ny-operator: ${TEST_OPERATOR}" \
  -H "x-request-id: ${TEST_REQUEST_ID}" \
  -d '{
    "name": "測試供應商",
    "email": "supplier@test.com",
    "apiKey": "secret-api-key-12345",
    "contact": {
      "phone": "02-1234-5678",
      "address": "台北市信義區"
    }
  }'
```

**預期結果**:
- HTTP 狀態碼: 201 或 200
- 回應包含 `x-request-id` header
- 稽核日誌檔案已建立

**驗證稽核記錄**:
```bash
# 檢查今日稽核日誌檔案
TODAY=$(date +%Y%m%d)
cat "./logs/audit/audit-${TODAY}.jsonl" | tail -1 | jq '.'
```

**預期稽核記錄**:
```json
{
  "id": "uuid-generated",
  "timestamp": "2025-10-06T14:30:52.123Z",
  "operator": "test@91app.com",
  "method": "POST",
  "path": "/api/v1/shops/12345/suppliers",
  "requestBody": {
    "name": "測試供應商",
    "email": "supplier@test.com",
    "apiKey": "***",
    "contact": {
      "phone": "02-1234-5678",
      "address": "台北市信義區"
    }
  },
  "statusCode": 201,
  "ipAddress": "127.0.0.1",
  "userAgent": "curl/7.68.0",
  "requestId": "req-20251006143052-abc123"
}
```

### 1.2 測試 PUT 操作 (更新資源)

**執行 API 呼叫**:
```bash
curl -X PUT http://localhost:3000/api/v1/notification-status/devices/999 \
  -H "Content-Type: application/json" \
  -H "ny-operator: ${TEST_OPERATOR}" \
  -d '{
    "deviceId": "device-999",
    "status": "active",
    "credentials": {
      "username": "device_user",
      "password": "super-secret-password",
      "token": "bearer-token-xyz"
    },
    "lastUpdated": "2025-10-06T14:30:00.000Z"
  }'
```

**驗證敏感資料遮罩**:
```bash
# 檢查最新記錄的敏感資料遮罩
cat "./logs/audit/audit-${TODAY}.jsonl" | tail -1 | jq '.requestBody.credentials'
```

**預期結果**:
```json
{
  "username": "device_user",
  "password": "***",
  "token": "***"
}
```

### 1.3 測試 DELETE 操作

**執行 API 呼叫**:
```bash
curl -X DELETE http://localhost:3000/api/v1/shops/12345/suppliers/999 \
  -H "ny-operator: ${TEST_OPERATOR}" \
  -d ''
```

**驗證 DELETE 記錄**:
```bash
# 檢查 DELETE 操作記錄
cat "./logs/audit/audit-${TODAY}.jsonl" | grep '"method":"DELETE"' | tail -1 | jq '.'
```

## 步驟 2: 查詢稽核日誌

### 2.1 基本查詢 (無過濾條件)

**執行查詢**:
```bash
curl -X GET "http://localhost:3000/api/v1/audit-logs" \
  -H "ny-operator: ${TEST_OPERATOR}"
```

**預期回應**:
```json
{
  "success": true,
  "data": [
    {
      "id": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
      "operator": "test@91app.com",
      "page": "supplier-management",
      "action": "create-supplier",
      "fields": {
        "shopId": 12345,
        "name": "測試供應商"
      },
      "metadata": {
        "method": "POST",
        "path": "/api/v1/shops/12345/suppliers",
        "statusCode": 201
      },
      "ipAddress": "127.0.0.1",
      "userAgent": "curl/7.68.0",
      "createdAt": "2025-10-06T14:30:52.123Z",
      "requestId": "req-20251006143052-abc123"
    }
  ],
  "pagination": {
    "total": 3,
    "limit": 50,
    "offset": 0
  },
  "timestamp": "2025-10-06T14:35:00.000Z",
  "requestId": "req-20251006143500-query1"
}
```

### 2.2 帶過濾條件的查詢

**按操作者過濾**:
```bash
curl -X GET "http://localhost:3000/api/v1/audit-logs?operatorFilter=${TEST_OPERATOR}&limit=10" \
  -H "ny-operator: ${TEST_OPERATOR}"
```

**按操作方法過濾**:
```bash
curl -X GET "http://localhost:3000/api/v1/audit-logs?action=POST&limit=5" \
  -H "ny-operator: ${TEST_OPERATOR}"
```

**按時間範圍過濾**:
```bash
# 查詢今天的記錄
START_DATE=$(date -u +%Y-%m-%dT00:00:00.000Z)
END_DATE=$(date -u +%Y-%m-%dT23:59:59.999Z)

curl -X GET "http://localhost:3000/api/v1/audit-logs?startDate=${START_DATE}&endDate=${END_DATE}" \
  -H "ny-operator: ${TEST_OPERATOR}"
```

### 2.3 分頁查詢

**第一頁**:
```bash
curl -X GET "http://localhost:3000/api/v1/audit-logs?limit=2&offset=0" \
  -H "ny-operator: ${TEST_OPERATOR}"
```

**第二頁**:
```bash
curl -X GET "http://localhost:3000/api/v1/audit-logs?limit=2&offset=2" \
  -H "ny-operator: ${TEST_OPERATOR}"
```

## 步驟 3: 錯誤場景測試

### 3.1 測試認證失敗

**缺少 ny-operator header**:
```bash
curl -X GET "http://localhost:3000/api/v1/audit-logs"
```

**預期結果**:
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHENTICATED",
    "message": "Missing or invalid ny-operator header",
    "details": [
      {
        "@type": "type.upd3ops.com/AuthError",
        "reason": "MISSING_OPERATOR_HEADER"
      }
    ]
  },
  "timestamp": "2025-10-06T14:35:00.000Z",
  "requestId": "req-20251006143500-error1"
}
```

### 3.2 測試查詢範圍限制

**查詢超過 7 天前的資料**:
```bash
# 8 天前的日期
OLD_DATE=$(date -u -d '8 days ago' +%Y-%m-%dT00:00:00.000Z)
TODAY_DATE=$(date -u +%Y-%m-%dT23:59:59.999Z)

curl -X GET "http://localhost:3000/api/v1/audit-logs?startDate=${OLD_DATE}&endDate=${TODAY_DATE}" \
  -H "ny-operator: ${TEST_OPERATOR}"
```

**預期結果**:
```json
{
  "success": false,
  "error": {
    "code": "INVALID_ARGUMENT",
    "message": "Query date range exceeds 7-day limit",
    "details": [
      {
        "@type": "type.upd3ops.com/ValidationError",
        "field": "startDate",
        "reason": "DATE_RANGE_EXCEEDED",
        "maxDays": 7
      }
    ]
  },
  "timestamp": "2025-10-06T14:35:00.000Z",
  "requestId": "req-20251006143500-error2"
}
```

### 3.3 測試分頁參數驗證

**超過每頁筆數限制**:
```bash
curl -X GET "http://localhost:3000/api/v1/audit-logs?limit=150" \
  -H "ny-operator: ${TEST_OPERATOR}"
```

**預期結果**:
```json
{
  "success": false,
  "error": {
    "code": "INVALID_ARGUMENT",
    "message": "Invalid pagination parameters",
    "details": [
      {
        "@type": "type.upd3ops.com/ValidationError",
        "field": "limit",
        "reason": "PARAMETER_OUT_OF_RANGE",
        "maxValue": 100
      }
    ]
  },
  "timestamp": "2025-10-06T14:35:00.000Z",
  "requestId": "req-20251006143500-error3"
}
```

## 步驟 4: 檔案清理測試

### 4.1 建立過期檔案 (模擬)

```bash
# 建立 31 天前的模擬檔案
OLD_FILE_DATE=$(date -d '31 days ago' +%Y%m%d)
touch "./logs/audit/audit-${OLD_FILE_DATE}.jsonl"
echo '{"test":"old_file"}' > "./logs/audit/audit-${OLD_FILE_DATE}.jsonl"

# 檢查檔案是否建立
ls -la "./logs/audit/audit-${OLD_FILE_DATE}.jsonl"
```

### 4.2 觸發清理機制

**手動觸發清理** (如果有管理 API):
```bash
curl -X POST "http://localhost:3000/api/v1/audit-logs/cleanup" \
  -H "ny-operator: ${TEST_OPERATOR}"
```

**檢查清理結果**:
```bash
# 確認過期檔案已被清理
ls -la "./logs/audit/audit-${OLD_FILE_DATE}.jsonl" 2>/dev/null || echo "檔案已清理"
```

## 步驟 5: 效能驗證

### 5.1 批量操作測試

**連續執行多個操作**:
```bash
# 執行 10 個連續操作
for i in {1..10}; do
  curl -X POST "http://localhost:3000/api/v1/shops/12345/suppliers" \
    -H "Content-Type: application/json" \
    -H "ny-operator: test-batch@91app.com" \
    -d "{\"name\":\"批量測試-${i}\",\"apiKey\":\"secret-key-${i}\"}" \
    -w "第 ${i} 次操作: %{time_total}s\n" \
    -s -o /dev/null
  sleep 0.1
done
```

**檢查記錄數量**:
```bash
# 統計今日記錄總數
cat "./logs/audit/audit-${TODAY}.jsonl" | wc -l
```

### 5.2 查詢效能測試

**測量查詢回應時間**:
```bash
curl -X GET "http://localhost:3000/api/v1/audit-logs?limit=50" \
  -H "ny-operator: ${TEST_OPERATOR}" \
  -w "查詢回應時間: %{time_total}s\n" \
  -s -o /dev/null
```

## 驗收清單

### 功能驗收
- [ ] POST 操作成功記錄稽核日誌
- [ ] PUT 操作成功記錄稽核日誌  
- [ ] PATCH 操作成功記錄稽核日誌
- [ ] DELETE 操作成功記錄稽核日誌
- [ ] 敏感資料正確遮罩 (password, token, secret, key)
- [ ] 查詢 API 返回正確格式的資料
- [ ] 分頁功能正常運作
- [ ] 過濾條件生效 (operator, action, date range)
- [ ] 7 天查詢範圍限制正確執行

### 錯誤處理驗收
- [ ] 缺少 ny-operator header 返回 401 錯誤
- [ ] 查詢超過 7 天返回 400 錯誤
- [ ] 無效分頁參數返回 400 錯誤
- [ ] 儲存失敗時 API 返回 503 錯誤

### 效能驗收
- [ ] 單次稽核記錄寫入時間 < 10ms
- [ ] 查詢 API 回應時間 < 200ms (7天內資料)
- [ ] 批量操作不影響系統穩定性

### 資料完整性驗收
- [ ] 每筆記錄包含所有必要欄位
- [ ] 檔案格式符合 JSON Lines 規範
- [ ] Request ID 正確關聯
- [ ] 時間戳記格式正確 (ISO 8601)

## 問題排除

### 常見問題

**問題**: 稽核日誌檔案未建立
**解決方案**: 
```bash
# 檢查目錄權限
ls -la ./logs/
mkdir -p ./logs/audit
chmod 755 ./logs/audit
```

**問題**: 查詢返回空結果
**解決方案**:
```bash
# 檢查檔案內容
cat "./logs/audit/audit-$(date +%Y%m%d).jsonl"
# 確認查詢參數是否正確
```

**問題**: 敏感資料未遮罩
**解決方案**:
```bash
# 檢查欄位名稱是否包含敏感關鍵字
grep -i "password\|token\|secret\|key" "./logs/audit/audit-$(date +%Y%m%d).jsonl"
```

### 日誌檢查

**應用日誌**:
```bash
# 查看稽核相關日誌
tail -f ./logs/application.log | grep -i audit
```

**檔案系統檢查**:
```bash
# 檢查磁碟空間
df -h ./logs/
# 檢查檔案權限
ls -la ./logs/audit/
```

## 下一步

完成快速開始後，您可以：

1. **整合前端**: 使用查詢 API 建立稽核日誌管理介面
2. **設定監控**: 建立稽核日誌的監控和告警機制
3. **效能調優**: 根據實際使用情況調整查詢和儲存策略
4. **安全加固**: 實施更嚴格的認證和授權機制
5. **資料分析**: 建立稽核日誌的分析和報表功能

**相關文件**:
- [API 規格文件](./contracts/audit-log-api.yaml)
- [資料模型文件](./data-model.md)
- [技術研究報告](./research.md)