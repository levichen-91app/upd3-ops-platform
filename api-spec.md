# 🎯 企業級 API 設計規範

## 目錄

1. [API 架構原則](#api-架構原則)
2. [URL 設計標準](#url-設計標準)
3. [版本控制策略](#版本控制策略)
4. [請求與回應格式](#請求與回應格式)
5. [錯誤處理標準](#錯誤處理標準)
6. [分頁與篩選](#分頁與篩選)
7. [安全標準](#安全標準)
8. [效能與快取](#效能與快取)
9. [監控與日誌](#監控與日誌)
10. [文件標準](#文件標準)
11. [測試標準](#測試標準)
12. [部署與環境](#部署與環境)
13. [API 設計檢查清單](#api-設計檢查清單)

---

## 1. API 架構原則

### RESTful 設計原則

```
✅ 資源導向
- 使用名詞，而非動詞
- 範例：GET /users/123 而非 GET /getUser/123

✅ 無狀態
- 每個請求都必須包含所有必要資訊
- 不依賴伺服器端狀態

✅ 統一介面
- 一致的 HTTP 方法使用
- 標準化資源識別
```

### HTTP 方法語意

```
GET    - 檢索資源 (安全且冪等)
POST   - 建立新資源
PUT    - 完整資源更新 (冪等)
PATCH  - 部分資源更新
DELETE - 刪除資源 (冪等)
HEAD   - 檢索資源中繼資料
OPTIONS - 取得允許的操作
```

---

## 2. URL 設計標準

### 路由結構

```typescript
// ✅ 良好的 URL 設計
GET    /api/v1/users                    // 取得使用者清單
GET    /api/v1/users/123               // 取得特定使用者
POST   /api/v1/users                   // 建立新使用者
PUT    /api/v1/users/123               // 完整更新使用者
PATCH  /api/v1/users/123               // 部分更新使用者
DELETE /api/v1/users/123               // 刪除使用者

// 巢狀資源
GET    /api/v1/users/123/orders        // 取得使用者訂單
POST   /api/v1/users/123/orders        // 為使用者建立訂單

// ❌ 避免這些設計
GET    /api/getUserById?id=123         // URL 中不要有動詞
POST   /api/user/create                // 路徑中不要有動作
```

### 命名慣例

```
✅ 使用 kebab-case: /api/user-profiles
✅ 複數名詞: /users, /orders, /products
✅ 小寫: /users 而非 /Users
✅ 有意義的名稱: /users 而非 /u
```

---

## 3. 版本控制策略

```typescript
// 方法 1: URL 路徑版本控制 (建議)
GET /api/v1/users
GET /api/v2/users

// 方法 2: 標頭版本控制
GET /api/users
Headers: Accept: application/vnd.api+json;version=1

// 方法 3: 查詢參數版本控制
GET /api/users?version=1
```

### 版本生命週期

```
v1.0.0 - 初始發布
v1.1.0 - 小版本更新 (向後相容)
v2.0.0 - 主要變更 (破壞性變更)

棄用時間表:
- 在移除前 6 個月宣告棄用
- 支援舊版本至少 12 個月
- 提供遷移指南
```

---

## 4. 請求與回應格式

### 統一回應格式

```typescript
// 成功回應
interface ApiResponse<T> {
  success: true;
  data: T;
  timestamp: string;
  requestId: string;
}

// 錯誤回應
interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
  requestId: string;
}

// 分頁回應
interface PaginatedResponse<T> {
  success: true;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
  timestamp: string;
  requestId: string;
}
```

### 請求驗證標準

```typescript
// 使用 DTO 和驗證裝飾器
export class CreateUserDto {
  @IsString({ message: '姓名必須是字串' })
  @IsNotEmpty({ message: '姓名為必填欄位' })
  @Length(2, 50, { message: '姓名長度必須為 2-50 字元' })
  name: string;

  @IsEmail({}, { message: '無效的電子郵件格式' })
  email: string;

  @IsOptional()
  @IsInt({ message: '年齡必須是整數' })
  @Min(0, { message: '年齡必須為正數' })
  @Max(120, { message: '年齡必須在合理範圍內' })
  age?: number;

  @ValidateNested()
  @Type(() => AddressDto)
  address: AddressDto;
}
```

### 內容類型標準

```
請求內容類型: application/json
回應內容類型: application/json
檔案上傳: multipart/form-data
```

---

## 5. 錯誤處理標準

### HTTP 狀態碼

```typescript
// 2xx 成功
200 OK          - 請求成功
201 Created     - 資源建立成功
202 Accepted    - 請求已接受，處理中
204 No Content  - 成功但無內容

// 3xx 重新導向
301 Moved Permanently  - 永久重新導向
302 Found             - 暫時重新導向
304 Not Modified      - 資源未修改

// 4xx 客戶端錯誤
400 Bad Request       - 格式錯誤的請求
401 Unauthorized      - 需要身份驗證
403 Forbidden         - 存取被拒絕
404 Not Found         - 找不到資源
405 Method Not Allowed - 不支援的方法
409 Conflict          - 資源衝突
422 Unprocessable Entity - 語義錯誤
429 Too Many Requests    - 超過速率限制

// 5xx 伺服器錯誤
500 Internal Server Error - 伺服器錯誤
502 Bad Gateway          - 閘道錯誤
503 Service Unavailable  - 服務不可用
504 Gateway Timeout      - 閘道逾時
```

### 錯誤代碼設計

```typescript
export enum ApiErrorCode {
  // 驗證錯誤 (1000-1999)
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  INVALID_FORMAT = 'INVALID_FORMAT',

  // 身份驗證錯誤 (2000-2999)
  UNAUTHORIZED = 'UNAUTHORIZED',
  INVALID_TOKEN = 'INVALID_TOKEN',
  EXPIRED_TOKEN = 'EXPIRED_TOKEN',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',

  // 資源錯誤 (3000-3999)
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  RESOURCE_ALREADY_EXISTS = 'RESOURCE_ALREADY_EXISTS',
  RESOURCE_CONFLICT = 'RESOURCE_CONFLICT',

  // 業務邏輯錯誤 (4000-4999)
  BUSINESS_RULE_VIOLATION = 'BUSINESS_RULE_VIOLATION',
  INSUFFICIENT_BALANCE = 'INSUFFICIENT_BALANCE',
  OPERATION_NOT_ALLOWED = 'OPERATION_NOT_ALLOWED',

  // 系統錯誤 (5000-5999)
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',

  // 速率限制錯誤 (6000-6999)
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
}
```

### 錯誤回應範例

```json
// 驗證錯誤
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "請求驗證失敗",
    "details": [
      {
        "field": "email",
        "message": "無效的電子郵件格式"
      }
    ]
  },
  "timestamp": "2025-01-15T10:30:00Z",
  "requestId": "req_123456789"
}

// 找不到錯誤
{
  "success": false,
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "找不到使用者"
  },
  "timestamp": "2025-01-15T10:30:00Z",
  "requestId": "req_123456789"
}
```

---

## 6. 分頁與篩選

### 分頁參數

```typescript
interface PaginationQuery {
  page?: number = 1;
  limit?: number = 20;
  sort?: string = 'createdAt';
  order?: 'asc' | 'desc' = 'desc';
}

// 使用範例
GET /api/v1/users?page=2&limit=10&sort=name&order=asc
```

### 篩選標準

```typescript
interface FilterQuery {
  // 精確匹配
  status?: string; // ?status=active

  // 多個值
  categories?: string[]; // ?categories=tech,business

  // 範圍查詢
  ageMin?: number; // ?ageMin=18
  ageMax?: number; // ?ageMax=65

  // 日期範圍
  createdAfter?: Date; // ?createdAfter=2025-01-01
  createdBefore?: Date; // ?createdBefore=2025-12-31

  // 文字搜尋
  search?: string; // ?search=john (模糊搜尋)
  name?: string; // ?name=john (精確匹配)
}
```

### 搜尋實作

```typescript
// 全文搜尋
GET /api/v1/users?search=john+doe

// 特定欄位搜尋
GET /api/v1/users?name=john&email=*@company.com

// 進階篩選
GET /api/v1/orders?status=pending,processing&totalMin=100&createdAfter=2025-01-01
```

---

## 7. 安全標準

### 身份驗證方法

```typescript
// JWT Token 結構
interface JWTPayload {
  sub: string;      // 使用者 ID
  iat: number;      // 發行時間
  exp: number;      // 到期時間
  roles: string[];  // 使用者角色
  permissions: string[]; // 權限
  sessionId: string;     // 會話識別符
}

// API 金鑰認證
Headers: {
  'X-API-Key': 'your-api-key',
  'X-API-Secret': 'your-api-secret'
}

// Bearer Token 認證
Headers: {
  'Authorization': 'Bearer your-access-token'
}

// 基本認證 (僅供內部服務使用)
Headers: {
  'Authorization': 'Basic base64(username:password)'
}
```

### 輸入安全

```typescript
export class SecurityPipe implements PipeTransform {
  transform(value: any) {
    // 防止 XSS 攻擊
    if (typeof value === 'string') {
      value = this.sanitizeHtml(value);
    }

    // 防止 SQL 注入
    value = this.escapeSqlInjection(value);

    // 限制輸入長度
    if (typeof value === 'string' && value.length > 10000) {
      throw new BadRequestException('輸入過長');
    }

    // 移除危險字元
    value = this.removeDangerousChars(value);

    return value;
  }
}
```

### 安全標頭

```typescript
// 必要的安全標頭
Headers: {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'Content-Security-Policy': "default-src 'self'",
  'Referrer-Policy': 'strict-origin-when-cross-origin'
}
```

### 速率限制

```typescript
// 實作範例
@UseGuards(ThrottlerGuard)
@Throttle(100, 3600) // 每小時 100 次請求
@Controller('api/v1/users')
export class UsersController {
  @Throttle(10, 60) // 敏感操作每分鐘 10 次請求
  @Post('password-reset')
  resetPassword() {}
}
```

---

## 8. 效能與快取

### HTTP 快取

```typescript
// 快取控制標頭
Headers: {
  'Cache-Control': 'public, max-age=3600',      // 1 小時快取
  'ETag': '"33a64df551425fcc55e4d42a148795d9f25f89d4"',
  'Last-Modified': 'Wed, 21 Oct 2015 07:28:00 GMT',
  'Vary': 'Accept-Encoding, Accept-Language'
}

// 條件請求
Headers: {
  'If-None-Match': '"33a64df551425fcc55e4d42a148795d9f25f89d4"',
  'If-Modified-Since': 'Wed, 21 Oct 2015 07:28:00 GMT'
}
```

### 快取策略

```typescript
// 依端點的快取類型
GET /users          - 快取 5 分鐘
GET /users/:id      - 快取 1 小時
GET /static-config  - 快取 24 小時
POST /users         - 不快取
PUT /users/:id      - 失效快取
DELETE /users/:id   - 失效快取
```

### 效能標準

```
回應時間目標:
- GET 請求: < 200ms (95th percentile)
- POST 請求: < 500ms (95th percentile)
- PUT/PATCH 請求: < 300ms (95th percentile)
- DELETE 請求: < 200ms (95th percentile)

吞吐量目標:
- 每個實例最少 1000 requests/second
- 99.9% 正常運作時間可用性
```

---

## 9. 監控與日誌

### 請求追蹤

```typescript
// 追蹤用的請求標頭
Headers: {
  'X-Request-ID': 'req_123456789_abcdef',      // 每個請求唯一
  'X-Correlation-ID': 'corr_987654321_fedcba', // 跨服務追蹤
  'X-User-ID': 'user_123',                     // 使用者識別符
  'X-Client-Version': 'web-2.1.0'             // 客戶端版本
}
```

### 日誌標準

```typescript
interface ApiLog {
  requestId: string;
  correlationId?: string;
  method: string;
  url: string;
  statusCode: number;
  responseTime: number;
  userAgent: string;
  ip: string;
  userId?: string;
  timestamp: string;
  error?: {
    name: string;
    message: string;
    stack: string;
  };
  additionalContext?: Record<string, any>;
}

// 日誌層級
enum LogLevel {
  ERROR = 'error', // 系統錯誤、例外
  WARN = 'warn',   // 警告、已棄用功能
  INFO = 'info',   // 一般資訊、請求日誌
  DEBUG = 'debug', // 除錯資訊
}
```

### 指標收集

```typescript
// 要追蹤的關鍵指標
interface ApiMetrics {
  requestCount: number;
  responseTime: {
    avg: number;
    p50: number;
    p95: number;
    p99: number;
  };
  errorRate: number;
  throughput: number;
  activeUsers: number;
  endpointUsage: Record<string, number>;
}
```

---

## 10. 文件標準

### OpenAPI/Swagger 規格

```typescript
@ApiOperation({
  summary: '建立新使用者',
  description: `
    使用提供的資訊建立新的使用者帳戶。

    **業務規則:**
    - 電子郵件必須是唯一的
    - 密碼必須符合安全要求
    - 特定功能需要年滿 18 歲

    **速率限制:**
    - 每個 IP 每分鐘 5 次請求
  `
})
@ApiResponse({
  status: 201,
  description: '使用者建立成功',
  type: CreateUserResponseDto,
  examples: {
    success: {
      value: {
        success: true,
        data: {
          id: 123,
          name: 'John Doe',
          email: 'john@example.com',
          createdAt: '2025-01-15T10:30:00Z'
        }
      }
    }
  }
})
@ApiResponse({
  status: 400,
  description: '驗證錯誤',
  type: ApiErrorResponse,
  examples: {
    validationError: {
      value: {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: '無效的輸入資料'
        }
      }
    }
  }
})
@ApiHeader({
  name: 'Authorization',
  description: '身份驗證用的 Bearer token',
  required: true,
  example: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
})
@ApiTags('Users')
```

### API 文件要求

```markdown
每個 API 端點都必須包含:

- 清楚的摘要和描述
- 請求/回應範例
- 錯誤場景和代碼
- 身份驗證要求
- 速率限制資訊
- 業務規則和限制
- 欄位驗證規則
- 棄用通知 (如果適用)
```

---

## 11. 測試標準

### 測試覆蓋率要求

```typescript
// API 測試應涵蓋
describe('POST /api/v1/users', () => {
  // 正常路徑
  it('應該使用有效資料建立使用者');
  it('應該回傳建立的使用者資料');

  // 驗證測試
  it('應該對無效電子郵件回傳 400');
  it('應該對缺少必填欄位回傳 400');
  it('應該對無效資料類型回傳 400');

  // 業務邏輯測試
  it('應該對重複電子郵件回傳 409');
  it('應該強制執行年齡限制');

  // 安全測試
  it('應該對缺少身份驗證回傳 401');
  it('應該對權限不足回傳 403');
  it('應該清理惡意輸入');

  // 邊界情況
  it('應該優雅地處理大型載荷');
  it('應該處理輸入中的特殊字元');
  it('應該遵守速率限制');

  // 效能測試
  it('應該在 500ms 內回應');
  it('應該處理並發請求');
});
```

### 必需的測試類型

```
✅ 單元測試 (80%+ 覆蓋率)
- 個別函數/方法測試
- Mock 外部相依性

✅ 整合測試
- 元件互動測試
- 資料庫整合測試

✅ E2E 測試
- 完整使用者工作流程測試
- 真實環境模擬

✅ 契約測試
- API 契約驗證
- 向後相容性測試

✅ 效能測試
- 負載測試
- 壓力測試
- 回應時間驗證

✅ 安全測試
- 輸入驗證測試
- 身份驗證/授權測試
- XSS/SQL 注入防護
```

---

## 12. 部署與環境

### 環境設定

```typescript
interface ApiConfig {
  // 環境
  NODE_ENV: 'development' | 'staging' | 'production';
  PORT: number;

  // API 設定
  API_VERSION: string;
  API_PREFIX: string;

  // 資料庫
  DATABASE_URL: string;
  DATABASE_POOL_SIZE: number;

  // 快取
  REDIS_URL: string;
  CACHE_TTL: number;

  // 安全
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  BCRYPT_ROUNDS: number;

  // 速率限制
  RATE_LIMIT_WINDOW: number;
  RATE_LIMIT_MAX: number;

  // 監控
  LOG_LEVEL: 'debug' | 'info' | 'warn' | 'error';
  ENABLE_SWAGGER: boolean;

  // 外部服務
  EXTERNAL_API_URL: string;
  EXTERNAL_API_KEY: string;
  EXTERNAL_API_TIMEOUT: number;
}
```

### 健康檢查端點

```typescript
@Controller('health')
export class HealthController {
  @Get()
  @ApiOperation({ summary: '基本健康檢查' })
  healthCheck() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: process.env.API_VERSION,
    };
  }

  @Get('detailed')
  @ApiOperation({ summary: '詳細健康檢查' })
  detailedHealthCheck() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        redis: 'connected',
        externalApi: 'available',
      },
      metrics: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
      },
    };
  }
}
```

---

## 13. API 設計檢查清單

### 設計階段

- [ ] 遵循 RESTful 原則
- [ ] 一致的命名慣例
- [ ] 清楚的版本控制策略
- [ ] 全面的錯誤處理
- [ ] 正確的 HTTP 狀態碼使用
- [ ] 資源導向的 URL 設計

### 開發階段

- [ ] 輸入驗證和清理
- [ ] 統一回應格式
- [ ] 全面的單元測試
- [ ] 整合測試覆蓋率
- [ ] 實作安全措施
- [ ] 效能最佳化

### 安全階段

- [ ] 身份驗證機制
- [ ] 授權控制
- [ ] 輸入安全驗證
- [ ] 實作速率限制
- [ ] 設定安全標頭
- [ ] 敏感資料保護

### 文件階段

- [ ] 完整的 API 文件
- [ ] 請求/回應範例
- [ ] 錯誤代碼文件
- [ ] 身份驗證指南
- [ ] 速率限制資訊
- [ ] 遷移指南 (新版本用)

### 測試階段

- [ ] 單元測試 (>80% 覆蓋率)
- [ ] 整合測試
- [ ] E2E 測試
- [ ] 效能測試
- [ ] 安全測試
- [ ] 契約測試

### 部署階段

- [ ] 環境設定
- [ ] 健康檢查端點
- [ ] 監控設定
- [ ] 日誌設定
- [ ] 錯誤追蹤
- [ ] 效能監控

### 部署後

- [ ] API 使用分析
- [ ] 效能監控
- [ ] 錯誤率監控
- [ ] 使用者回饋收集
- [ ] 持續改進
- [ ] 定期安全稽核

---

## 結論

這個 API 設計規範提供了建構企業級 API 的全面框架，確保 API 是安全、高效能、可維護且使用者友善的。遵循這些標準能確保所有 API 實作的一致性，並為可擴展的系統架構提供堅實的基礎。

**要記住的關鍵原則:**

- 一致性是所有 API 的關鍵
- 安全性應該內建，而非後來添加
- 文件與程式碼同樣重要
- 測試確保可靠性
- 監控提供可見性
- 效能從第一天就很重要

對於這個規範的問題或建議，請聯繫開發團隊或在專案儲存庫中建立 issue。

---

_最後更新: 2025-01-15_
_版本: 1.0.0_