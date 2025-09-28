# Quickstart: 通知狀態報告查詢 API

**Feature**: POST /api/v1/notification-status/reports
**Date**: 2025-09-28
**Purpose**: 快速驗證 API 實作是否符合功能需求

## Prerequisites

### Development Environment
```bash
# 確認環境
node --version  # 需要 Node.js 18+
cd api
npm --version   # 確認 npm 可用

# 安裝依賴 (如果尚未安裝)
npm install

# 設定環境變數
export NS_REPORT_API_URL="https://api.nsreport.example.com"
export NS_REPORT_API_TIMEOUT="30000"
export NY_OPERATOR_HEADER="ny-operator"
```

### Test Environment Setup
```bash
# 啟動測試環境
npm run start:dev

# 或者使用 Docker
docker-compose up -d api

# 確認服務啟動
curl -f http://localhost:3000/health || echo "Service not ready"
```

## Core User Journey Validation

### Journey 1: 成功查詢報告 (Happy Path)

**Scenario**: 營運人員使用有效參數查詢通知狀態報告

```bash
# 發送請求
curl -X POST http://localhost:3000/api/v1/notification-status/reports \
  -H "Content-Type: application/json" \
  -H "ny-operator: internal-ops-team" \
  -d '{
    "nsId": "d68e720f-62ed-4955-802b-8e3f04c56a19",
    "notificationDate": "2024/01/15",
    "notificationType": "push"
  }'
```

**Expected Response** (200 OK):
```json
{
  "success": true,
  "data": {
    "downloadUrl": "https://s3.amazonaws.com/bucket/reports/report-123.tsv?signature=...",
    "expiredTime": 3600
  },
  "timestamp": "2024-01-15T10:35:00Z",
  "requestId": "req-reports-1705315000-abc123"
}
```

**Validation Checklist**:
- [ ] HTTP 狀態碼為 200
- [ ] `success` 欄位為 `true`
- [ ] `data.downloadUrl` 為有效的 URL
- [ ] `data.expiredTime` 為正整數
- [ ] `requestId` 符合 `req-reports-{timestamp}-{id}` 格式
- [ ] `timestamp` 為 ISO 8601 格式

### Journey 2: 參數驗證錯誤

**Scenario**: 提供無效的參數格式

```bash
# 無效的 nsId (非 UUID)
curl -X POST http://localhost:3000/api/v1/notification-status/reports \
  -H "Content-Type: application/json" \
  -H "ny-operator: internal-ops-team" \
  -d '{
    "nsId": "invalid-uuid",
    "notificationDate": "2024/01/15",
    "notificationType": "push"
  }'
```

**Expected Response** (400 Bad Request):
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "輸入參數驗證失敗",
    "details": [
      {
        "field": "nsId",
        "message": "nsId must be a valid UUID"
      }
    ]
  },
  "timestamp": "2024-01-15T10:35:00Z",
  "requestId": "req-reports-1705315000-def456"
}
```

**Validation Checklist**:
- [ ] HTTP 狀態碼為 400
- [ ] `success` 欄位為 `false`
- [ ] `error.code` 為 "VALIDATION_ERROR"
- [ ] `error.details` 包含具體的驗證錯誤資訊

### Journey 3: 認證失敗

**Scenario**: 缺少或無效的 ny-operator header

```bash
# 缺少認證 header
curl -X POST http://localhost:3000/api/v1/notification-status/reports \
  -H "Content-Type: application/json" \
  -d '{
    "nsId": "d68e720f-62ed-4955-802b-8e3f04c56a19",
    "notificationDate": "2024/01/15",
    "notificationType": "push"
  }'
```

**Expected Response** (401 Unauthorized):
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "認證失敗：缺少或無效的 ny-operator header",
    "details": {
      "header": "ny-operator",
      "provided": null
    }
  },
  "timestamp": "2024-01-15T10:35:00Z",
  "requestId": "req-reports-1705315000-ghi789"
}
```

**Validation Checklist**:
- [ ] HTTP 狀態碼為 401
- [ ] `error.code` 為 "UNAUTHORIZED"
- [ ] 錯誤訊息明確指出認證問題

### Journey 4: 外部 API 錯誤

**Scenario**: NS Report API 服務不可用

**Setup**: Mock 外部 API 回傳 500 錯誤
```bash
# 這個測試需要在整合測試環境中執行
# 因為需要 mock 外部服務回應
npm run test:integration -- --testNamePattern="external API error"
```

**Expected Response** (500 Internal Server Error):
```json
{
  "success": false,
  "error": {
    "code": "EXTERNAL_API_ERROR",
    "message": "外部服務調用失敗",
    "details": {
      "service": "NS Report API",
      "statusCode": 500,
      "error": "Internal Server Error"
    }
  },
  "timestamp": "2024-01-15T10:35:00Z",
  "requestId": "req-reports-1705315000-jkl012"
}
```

**Validation Checklist**:
- [ ] HTTP 狀態碼為 500
- [ ] `error.code` 為 "EXTERNAL_API_ERROR"
- [ ] 錯誤詳情包含外部服務資訊

## API Contract Validation

### OpenAPI Schema 驗證

```bash
# 安裝 OpenAPI 驗證工具
npm install -g swagger-codegen-cli

# 驗證 API 回應符合 OpenAPI 規範
swagger-codegen-cli validate \
  -i specs/010-api-post-api/contracts/notification-status-reports.openapi.yaml
```

**Expected**: No validation errors

### Response Schema 測試

```bash
# 執行合約測試
npm run test:contract -- --testNamePattern="notification-status-reports"
```

**Expected**: All contract tests pass
- [ ] Response format matches OpenAPI schema
- [ ] All required fields present
- [ ] Data types correct
- [ ] Enum values valid

## Performance Validation

### Response Time Test

```bash
# 測試回應時間 (應 <2 秒)
time curl -X POST http://localhost:3000/api/v1/notification-status/reports \
  -H "Content-Type: application/json" \
  -H "ny-operator: internal-ops-team" \
  -d '{
    "nsId": "d68e720f-62ed-4955-802b-8e3f04c56a19",
    "notificationDate": "2024/01/15",
    "notificationType": "push"
  }' \
  -w "@curl-format.txt"

# curl-format.txt 內容:
#      time_namelookup:  %{time_namelookup}\n
#         time_connect:  %{time_connect}\n
#      time_appconnect:  %{time_appconnect}\n
#     time_pretransfer:  %{time_pretransfer}\n
#        time_redirect:  %{time_redirect}\n
#   time_starttransfer:  %{time_starttransfer}\n
#                      ----------\n
#           time_total:  %{time_total}\n
```

**Validation Checklist**:
- [ ] `time_total` < 2.0 seconds
- [ ] No timeout errors
- [ ] Consistent response times across multiple requests

## End-to-End Workflow

### Complete User Workflow

```bash
#!/bin/bash
# e2e-test.sh - 完整的使用者流程測試

echo "=== 通知狀態報告 API E2E 測試 ==="

# 1. 健康檢查
echo "1. 檢查服務狀態..."
curl -f http://localhost:3000/health || exit 1

# 2. 成功場景
echo "2. 測試成功場景..."
RESPONSE=$(curl -s -X POST http://localhost:3000/api/v1/notification-status/reports \
  -H "Content-Type: application/json" \
  -H "ny-operator: internal-ops-team" \
  -d '{
    "nsId": "d68e720f-62ed-4955-802b-8e3f04c56a19",
    "notificationDate": "2024/01/15",
    "notificationType": "push"
  }')

echo "Response: $RESPONSE"

# 驗證回應格式
SUCCESS=$(echo $RESPONSE | jq -r '.success')
REQUEST_ID=$(echo $RESPONSE | jq -r '.requestId')
DOWNLOAD_URL=$(echo $RESPONSE | jq -r '.data.downloadUrl')

[ "$SUCCESS" = "true" ] || { echo "❌ Success field not true"; exit 1; }
[ "$REQUEST_ID" != "null" ] || { echo "❌ Request ID missing"; exit 1; }
[ "$DOWNLOAD_URL" != "null" ] || { echo "❌ Download URL missing"; exit 1; }

echo "✅ 成功場景驗證通過"

# 3. 錯誤場景
echo "3. 測試參數驗證錯誤..."
ERROR_RESPONSE=$(curl -s -X POST http://localhost:3000/api/v1/notification-status/reports \
  -H "Content-Type: application/json" \
  -H "ny-operator: internal-ops-team" \
  -d '{
    "nsId": "invalid-uuid",
    "notificationDate": "2024/01/15",
    "notificationType": "push"
  }')

ERROR_SUCCESS=$(echo $ERROR_RESPONSE | jq -r '.success')
ERROR_CODE=$(echo $ERROR_RESPONSE | jq -r '.error.code')

[ "$ERROR_SUCCESS" = "false" ] || { echo "❌ Error success field not false"; exit 1; }
[ "$ERROR_CODE" = "VALIDATION_ERROR" ] || { echo "❌ Wrong error code: $ERROR_CODE"; exit 1; }

echo "✅ 錯誤場景驗證通過"

echo "🎉 E2E 測試完成 - 所有檢查通過"
```

**Execution**:
```bash
chmod +x e2e-test.sh
./e2e-test.sh
```

## Integration Test Suite

### Test Execution Commands

```bash
# 執行所有測試
npm run test

# 執行特定類型測試
npm run test:unit                    # 單元測試
npm run test:integration            # 整合測試
npm run test:contract               # 合約測試

# 檢查測試覆蓋率
npm run test:cov

# 執行特定功能測試
npm run test -- --testPathPattern="notification-status.*reports"
```

### Test Coverage Requirements

**Coverage Targets**:
- [ ] 整體覆蓋率 ≥ 80%
- [ ] Service 層單元測試 ≥ 95%
- [ ] Controller 層單元測試 ≥ 90%
- [ ] 整合測試覆蓋所有 API 端點
- [ ] 合約測試覆蓋 100% 公開 API

## Troubleshooting

### Common Issues

**問題 1**: 外部 API 連線失敗
```bash
# 檢查環境變數
echo $NS_REPORT_API_URL

# 測試外部 API 連線
curl -f $NS_REPORT_API_URL/health || echo "External API not reachable"
```

**問題 2**: 認證失敗
```bash
# 檢查 header 名稱
echo $NY_OPERATOR_HEADER

# 確認 header 設定正確
curl -v -H "ny-operator: test" http://localhost:3000/api/v1/notification-status/reports
```

**問題 3**: 測試環境問題
```bash
# 重新啟動服務
npm run start:dev

# 清除測試快取
npm run test:clear-cache

# 重新安裝依賴
rm -rf node_modules package-lock.json
npm install
```

## Success Criteria

### Functional Requirements Met
- [ ] POST /api/v1/notification-status/reports 端點可用
- [ ] ny-operator header 認證正常運作
- [ ] 參數驗證按照規範執行
- [ ] 外部 API 整合正常
- [ ] 錯誤處理分層正確
- [ ] Request ID 生成符合格式

### Non-Functional Requirements Met
- [ ] 回應時間 <2 秒
- [ ] API 文檔完整 (Swagger UI 可用)
- [ ] 測試覆蓋率達標
- [ ] 程式碼符合 ESLint/Prettier 規範
- [ ] Docker 容器化正常

### Constitutional Compliance
- [ ] 依賴抽象化實作完成
- [ ] TDD 流程遵循
- [ ] 常數集中化管理
- [ ] 繁體中文註解和文檔

**Ready for Production**: 所有檢查項目通過後，功能即可部署至生產環境。