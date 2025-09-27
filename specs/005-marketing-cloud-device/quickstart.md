# 快速開始：Marketing Cloud 裝置 API 整合

## 功能概述

此 API 提供查詢會員在 Marketing Cloud 系統中註冊裝置資訊的功能。作為透明代理，系統接收商店 ID 和手機號碼，呼叫外部 Marketing Cloud Device API，並回傳標準化的裝置資料。

## 先決條件

- Node.js 18+
- NestJS 11.x 開發環境
- Marketing Cloud API 存取權限
- 有效的商店 ID 和測試會員手機號碼

## API 端點

```
GET /api/v1/shops/{shopId}/members/by-phone/{phone}/devices
```

**必需 Headers:**
- `ny-operator`: 操作者識別

## 快速測試步驟

### 1. 環境設定

確認環境變數配置：

```bash
# 在 api/.env.development 中加入
MARKETING_CLOUD_API_URL_OVERRIDE=http://marketing-cloud-service.qa.91dev.tw
MARKETING_CLOUD_API_TIMEOUT=5000
```

### 2. 基本功能測試

使用 curl 測試基本功能：

```bash
# 成功案例
curl -X GET \
  "http://localhost:3000/api/v1/shops/12345/members/by-phone/0912345678/devices" \
  -H "ny-operator: system-admin" \
  -H "Content-Type: application/json"

# 預期回應格式
{
  "success": true,
  "data": {
    "shopId": 12345,
    "phone": "0912345678",
    "devices": [
      {
        "guid": "550e8400-e29b-41d4-a716-446655440000",
        "udid": "A1B2C3D4E5F6",
        "token": "abc123def456...",
        "shopId": 12345,
        "platformDef": "iOS",
        "memberId": 67890,
        "advertiseId": "12345678-1234-5678-9012-123456789012",
        "appVersion": "1.2.3",
        "updatedDateTime": "2025-09-27T10:30:00.000Z",
        "createdDateTime": "2025-09-01T08:15:00.000Z"
      }
    ],
    "totalCount": 1
  },
  "timestamp": "2025-09-27T10:45:00.000Z",
  "requestId": "req-20250927104500-uuid"
}
```

### 3. 錯誤處理測試

#### 3.1 缺少操作者識別 (401)

```bash
curl -X GET \
  "http://localhost:3000/api/v1/shops/12345/members/by-phone/0912345678/devices"

# 預期回應
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Missing ny-operator header"
  },
  "timestamp": "2025-09-27T10:45:00.000Z",
  "requestId": "req-20250927104500-uuid"
}
```

#### 3.2 無效的商店 ID (400)

```bash
curl -X GET \
  "http://localhost:3000/api/v1/shops/invalid/members/by-phone/0912345678/devices" \
  -H "ny-operator: system-admin"

# 預期回應
{
  "success": false,
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Invalid shop ID format"
  },
  "timestamp": "2025-09-27T10:45:00.000Z",
  "requestId": "req-20250927104500-uuid"
}
```

#### 3.3 會員不存在 (404)

```bash
curl -X GET \
  "http://localhost:3000/api/v1/shops/12345/members/by-phone/0900000000/devices" \
  -H "ny-operator: system-admin"

# 預期回應
{
  "success": false,
  "error": {
    "code": "MEMBER_NOT_FOUND",
    "message": "Member not found or has no registered devices"
  },
  "timestamp": "2025-09-27T10:45:00.000Z",
  "requestId": "req-20250927104500-uuid"
}
```

### 4. 測試執行

#### 4.1 單元測試

```bash
# 執行 Marketing Cloud 模組單元測試
npm test -- --testPathPattern=marketing-cloud.*\.spec\.ts

# 測試涵蓋範圍檢查
npm run test:cov -- --testPathPattern=marketing-cloud
```

**測試目標與脈絡**:
- **Service 層測試**: 驗證業務邏輯、錯誤處理、配置注入機制
- **隔離依賴**: 所有外部依賴 (HttpService) 使用 Mock
- **邊界條件**: 測試各種錯誤狀況和資料轉換

#### 4.2 契約測試

```bash
# 執行 API 契約測試
npm test -- contracts/marketing-cloud.contract.spec.ts
```

**測試目標與脈絡**:
- **API 契約驗證**: 確保回應格式符合 OpenAPI 規格
- **HTTP 狀態碼**: 驗證各種情境的正確回應碼
- **欄位完整性**: 檢查必需欄位和資料型別

#### 4.3 整合測試

```bash
# 執行整合測試
npm test -- --testPathPattern=marketing-cloud.*\.integration\.spec\.ts
```

**測試目標與脈絡**:
- **端到端流程**: Controller → Service → External API 完整流程
- **配置整合**: 驗證多環境配置機制
- **Mock 外部 API**: 模擬各種外部服務回應情境

#### 4.4 E2E 測試

```bash
# 執行 E2E 測試
npm run test:e2e -- --testNamePattern="Marketing Cloud"
```

**測試目標與脈絡**:
- **真實 HTTP 請求**: 使用 Supertest 發送完整 HTTP 請求
- **完整應用**: 測試完整啟動的 NestJS 應用程式
- **Mock 外部 API**: 使用 nock 攔截和模擬外部 Marketing Cloud API 請求
- **併發性能**: 驗證小規模並發請求處理能力

**外部 API Mock 設定範例**:

```typescript
// test/marketing-cloud-e2e.spec.ts
import * as nock from 'nock';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';

describe('Marketing Cloud E2E Tests', () => {
  let app: INestApplication;

  beforeEach(async () => {
    // Mock 成功回應
    nock('http://marketing-cloud-service.qa.91dev.tw')
      .get('/v1/shops/12345/phones/0912345678/devices')
      .reply(200, [
        {
          guid: '550e8400-e29b-41d4-a716-446655440000',
          token: 'mock-push-token-123',
          shopId: 12345,
          platformDef: 'iOS',
          memberId: 67890,
          createdDateTime: '2025-09-01T08:15:00.000Z',
          updatedDateTime: '2025-09-27T10:30:00.000Z'
        }
      ]);

    // Mock 404 回應 - 會員不存在
    nock('http://marketing-cloud-service.qa.91dev.tw')
      .get('/v1/shops/12345/phones/0900000000/devices')
      .reply(404);

    // Mock 超時情況 - 延遲超過 5 秒
    nock('http://marketing-cloud-service.qa.91dev.tw')
      .get('/v1/shops/12345/phones/0911111111/devices')
      .delay(6000) // 超過 5 秒超時設定
      .reply(200, []);

    // Mock 服務異常 - 連線失敗
    nock('http://marketing-cloud-service.qa.91dev.tw')
      .get('/v1/shops/12345/phones/0922222222/devices')
      .replyWithError('ECONNREFUSED');
  });

  afterEach(() => {
    nock.cleanAll();
  });

  it('should handle external API timeout and return 502', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/shops/12345/members/by-phone/0911111111/devices')
      .set('ny-operator', 'test-operator')
      .expect(502);

    expect(response.body.error.code).toMatch(/TIMEOUT|EXTERNAL_SERVICE_TIMEOUT/);
  });

  it('should handle external API connection error and return 502', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/shops/12345/members/by-phone/0922222222/devices')
      .set('ny-operator', 'test-operator')
      .expect(502);

    expect(response.body.error.code).toMatch(/UNAVAILABLE|EXTERNAL_SERVICE_UNAVAILABLE/);
  });
});
```

**Mock 策略說明**:
- **nock 攔截**: 攔截所有對外部 Marketing Cloud API 的 HTTP 請求
- **多種情境**: 模擬成功、404、超時、連線失敗等各種情況
- **真實測試**: E2E 測試中不需要實際呼叫外部服務
- **可重複性**: 每次測試結果一致，不受外部服務影響

### 5. API 文件確認

#### 5.1 Swagger 文件

訪問自動生成的 API 文件：

```
http://localhost:3000/api-docs
```

確認文件包含：
- 完整的 endpoint 描述
- 請求/回應 schema 定義
- 錯誤狀態碼說明
- 範例資料

#### 5.2 OpenAPI 契約

驗證實際 API 回應符合契約定義：

```bash
# 使用 OpenAPI 契約驗證工具 (如 Prism)
npx @stoplight/prism mock specs/005-marketing-cloud-device/contracts/marketing-cloud-api.yaml
```

### 6. 效能驗證

#### 6.1 回應時間測試

```bash
# 使用 Apache Bench 進行簡單效能測試
ab -n 10 -c 2 \
  -H "ny-operator: system-admin" \
  "http://localhost:3000/api/v1/shops/12345/members/by-phone/0912345678/devices"
```

**預期結果**:
- 回應時間依賴外部 API (無內部 SLA)
- 支援 < 10 並發請求
- 5 秒超時機制正常運作

#### 6.2 超時測試

測試外部 API 超時處理：

```bash
# 需要 Mock 外部 API 延遲回應超過 5 秒
# 預期收到 502 錯誤回應
```

### 7. 日誌驗證

#### 7.1 成功請求日誌

確認日誌包含：
- ✅ 操作者資訊 (ny-operator)
- ✅ 請求時間和回應時間
- ✅ shopId 和回應狀態
- ✅ 裝置數量

#### 7.2 隱私保護確認

確認日誌遮蔽敏感資訊：
- ❌ 手機號碼 → `091****678` 格式
- ❌ 不記錄 Token 等敏感裝置資訊
- ❌ 不記錄完整的 UDID 或廣告 ID

```bash
# 檢查日誌輸出
tail -f logs/app.log | grep "marketing-cloud"
```

### 8. 設定驗證

#### 8.1 多環境配置

確認配置在不同環境下正確載入：

```bash
# Development
NODE_ENV=development npm run start:dev

# Production (模擬)
NODE_ENV=production npm run start:prod
```

#### 8.2 環境變數覆蓋

測試環境變數覆蓋機制：

```bash
export MARKETING_CLOUD_API_TIMEOUT=3000
npm run start:dev
# 確認超時設定為 3 秒而非預設的 5 秒
```

## 故障排除

### 常見問題

1. **外部 API 連線失敗**
   - 檢查 Marketing Cloud API 服務狀態
   - 確認網路連線和防火牆設定
   - 驗證 API URL 配置正確

2. **超時錯誤**
   - 檢查外部 API 回應時間
   - 考慮調整超時設定 (開發期間)

3. **測試失敗**
   - 確認 Mock 設定正確
   - 檢查測試資料一致性
   - 驗證測試環境配置

### 除錯命令

```bash
# 查看詳細錯誤日誌
DEBUG=* npm run start:dev

# 檢查配置載入
node -e "console.log(require('./api/config/external-apis.config').default())"

# 測試外部 API 連線
curl -v http://marketing-cloud-service.qa.91dev.tw/health
```

## 驗證清單

功能實作完成後，確認以下項目：

### 基本功能
- [ ] API 端點正確回應成功請求
- [ ] 所有錯誤情境回應正確的 HTTP 狀態碼
- [ ] 回應格式符合 ApiResponse/ApiErrorResponse 標準
- [ ] ny-operator header 驗證機制運作
- [ ] 外部 API 透明代理功能正常

### 測試覆蓋
- [ ] 單元測試覆蓋率 ≥ 80%
- [ ] 契約測試通過，符合 OpenAPI 規格
- [ ] 整合測試涵蓋完整流程
- [ ] E2E 測試驗證真實使用場景

### 非功能需求
- [ ] 5 秒超時機制正常運作
- [ ] 日誌隱私保護實作正確
- [ ] 多環境配置機制正常
- [ ] 併發請求處理能力確認

### 文件與規範
- [ ] Swagger 文件完整且正確
- [ ] API 回應格式統一
- [ ] 錯誤處理標準化
- [ ] 程式碼通過 Lint 檢查

完成上述驗證後，功能即可視為開發完成並準備部署。