# Quick Start: 通知詳細資訊查詢 API

## 功能驗證步驟

### 1. 準備測試環境
```bash
# 設定環境變數
export NC_API_BASE_URL=http://nc-api.qa.91dev.tw
export NC_API_TIMEOUT=10000

# 啟動開發服務器
cd api
npm run start:dev
```

### 2. 基本功能測試

#### 測試案例 1: 成功查詢存在的通知
```bash
curl -X GET "http://localhost:3000/api/v1/notification-status/detail/12345/a4070188-050d-47f7-ab24-2523145408cf" \
  -H "ny-operator: test.operator" \
  -H "Content-Type: application/json"

# 預期回應:
# {
#   "success": true,
#   "data": {
#     "NCId": "a4070188-050d-47f7-ab24-2523145408cf",
#     "NSId": "d68e720f-62ed-4955-802b-8e3f04c56a19",
#     "Status": "Completed",
#     "ChannelType": "Push",
#     "CreateDateTime": "2025-09-15T01:58:31.117",
#     "Report": { ... }
#   },
#   "timestamp": "2025-01-27T...",
#   "requestId": "req-detail-..."
# }
```

#### 測試案例 2: 查詢不存在的通知
```bash
curl -X GET "http://localhost:3000/api/v1/notification-status/detail/12345/00000000-0000-0000-0000-000000000000" \
  -H "ny-operator: test.operator"

# 預期回應:
# {
#   "success": true,
#   "data": null,
#   "timestamp": "2025-01-27T...",
#   "requestId": "req-detail-..."
# }
```

#### 測試案例 3: 參數驗證錯誤
```bash
# 無效的shopId
curl -X GET "http://localhost:3000/api/v1/notification-status/detail/0/a4070188-050d-47f7-ab24-2523145408cf" \
  -H "ny-operator: test.operator"

# 預期回應: 400錯誤

# 無效的ncId格式
curl -X GET "http://localhost:3000/api/v1/notification-status/detail/12345/invalid-uuid" \
  -H "ny-operator: test.operator"

# 預期回應: 400錯誤

# 缺少ny-operator header
curl -X GET "http://localhost:3000/api/v1/notification-status/detail/12345/a4070188-050d-47f7-ab24-2523145408cf"

# 預期回應: 400錯誤
```

### 3. 錯誤處理測試

#### 測試案例 4: 外部API超時
```bash
# 使用不存在的外部API端點測試超時
export NC_API_BASE_URL=http://timeout-test.invalid

curl -X GET "http://localhost:3000/api/v1/notification-status/detail/12345/a4070188-050d-47f7-ab24-2523145408cf" \
  -H "ny-operator: test.operator"

# 預期回應: 500錯誤，TIMEOUT_ERROR
```

### 4. 日誌驗證

檢查應用程式日誌是否包含以下資訊：
- 請求追蹤ID (requestId)
- 操作者資訊 (ny-operator)
- 外部API調用狀態
- 錯誤詳細資訊（如有）

```bash
# 查看日誌
tail -f logs/application.log | grep "notification-detail"
```

## 驗收標準

### 功能正確性
- [ ] 成功查詢返回完整通知詳細資訊
- [ ] 不存在的通知返回data: null
- [ ] 參數驗證正確攔截無效輸入
- [ ] ny-operator header驗證正常運作

### 錯誤處理
- [ ] 外部API異常時返回500錯誤並記錄詳細資訊
- [ ] 超時錯誤正確處理並記錄
- [ ] 資料格式異常正確處理
- [ ] 錯誤回應格式符合標準

### 非功能需求
- [ ] API回應時間合理（<10秒）
- [ ] 日誌記錄完整且結構化
- [ ] Swagger文檔正確生成
- [ ] 單元測試覆蓋率 ≥ 80%

### 憲章合規性
- [ ] 使用依賴抽象化設計
- [ ] 遵循TDD開發流程
- [ ] 配置採用registerAs模式
- [ ] API設計符合RESTful標準

## 故障排除

### 常見問題
1. **404錯誤**: 檢查路由設定和模組匯入
2. **外部API連接失敗**: 驗證NC_API_BASE_URL設定
3. **參數驗證失敗**: 檢查DTO定義和class-validator規則
4. **Missing header錯誤**: 確認ny-operator header正確傳遞

### 偵錯步驟
1. 檢查環境變數設定
2. 驗證外部API可達性
3. 查看應用程式日誌
4. 執行單元測試
5. 驗證Swagger文檔生成