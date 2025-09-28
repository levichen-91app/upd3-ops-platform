# 後端服務開發規範：依賴抽象化與測試優先設計 (完整細節版)

**版本**：1.0  
**發布日期**：2025-09-27

---

## 1. 前言 (必讀)

本規範是 **《專案憲章》** 在後端 API 開發中的具體實施細則。所有後端開發活動必須同時遵循憲章的**核心原則**與本指南的**技術實踐**。若有衝突，以專案憲章為最高準則。

核心目標：

- **高內聚、低耦合**
- **可測試、可維護**
- **一致性與協作性**
- **規格驅動、測試優先 (TDD)**

---

## 2. 適用範圍

本規範適用於所有新的 NestJS 後端服務開發，特別是當服務需要與以下類型的外部依賴 (External Dependencies) 互動時：

- 第三方 HTTP API (例如：金流、天氣、地圖服務)
- 資料庫 (Database)
- 快取系統 (Cache, e.g., Redis)
- 訊息佇列 (Message Queue, e.g., RabbitMQ, Kafka)

---

## 3. 系統架構與專案結構

### 3.1 Monorepo 架構

```
.
├── .specify/ # 規格驅動開發的相關文件
├── specs/{feature-id}/ # 各功能規格文件目錄
├── api/ # ✅ 所有後端程式碼 (NestJS 專案)
│ ├── modules/
│ ├── common/
│ ├── config/
│ ├── ...
│ ├── package.json
│ └── tsconfig.json
└── src/ # 前端 React 專案
```

### 3.2 技術棧 (Tech Stack)

- **框架**: NestJS 10.x (基於 Node.js 18+)
- **語言**: TypeScript 5.x (啟用 `strict` 模式)
- **資料庫**: PostgreSQL + TypeORM
- **文檔**: Swagger/OpenAPI (Code-First)
- **測試**: Jest + Supertest
- **環境**: Docker
- **程式碼規範**: ESLint + Prettier

---

## 4. 開發規範

### 4.1 規範一：依賴抽象，而非實作

#### 條文

所有對外部依賴的存取，都必須透過一層抽象介面 (Interface) 來進行。業務邏輯層 (Business Logic Layer) 不應直接依賴任何具體的實作 Class。

#### 實作步驟

**步驟一：定義介面與 Injection Token**

```typescript
// src/weather/weather.interface.ts

export interface IWeatherService {
  getWeatherByCity(city: string): Promise<WeatherData>;
}

export const WEATHER_SERVICE_TOKEN = 'IWeatherService';

export interface WeatherData {
  city: string;
  temperature: number;
}
```

**步驟二：實作具體的 Service**

```typescript
// src/weather/external-weather.service.ts
import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { IWeatherService, WeatherData } from './weather.interface';

@Injectable()
export class ExternalWeatherService implements IWeatherService {
  constructor(private readonly httpService: HttpService) {}

  async getWeatherByCity(city: string): Promise<WeatherData> {
    const url = `https://api.weather.com/v1/current?city=${city}`;
    const { data } = await firstValueFrom(this.httpService.get(url));
    return { city: data.name, temperature: data.main.temp };
  }
}
```

**步驟三：在 Module 中註冊 Provider**

```typescript
// src/weather/weather.module.ts
import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { WEATHER_SERVICE_TOKEN } from './weather.interface';
import { ExternalWeatherService } from './external-weather.service';

@Module({
  imports: [HttpModule],
  providers: [
    {
      provide: WEATHER_SERVICE_TOKEN,
      useClass: ExternalWeatherService,
    },
  ],
  exports: [WEATHER_SERVICE_TOKEN],
})
export class WeatherModule {}
```

**步驟四：在業務邏輯中注入抽象**

```typescript
// src/clothing/clothing.service.ts
import { Inject, Injectable } from '@nestjs/common';
import {
  IWeatherService,
  WEATHER_SERVICE_TOKEN,
} from '../weather/weather.interface';

@Injectable()
export class ClothingService {
  constructor(
    @Inject(WEATHER_SERVICE_TOKEN)
    private readonly weatherService: IWeatherService,
  ) {}

  async getClothingSuggestion(city: string): Promise<string> {
    const weather = await this.weatherService.getWeatherByCity(city);
    if (weather.temperature >= 28) return '建議穿 T-shirt';
    if (weather.temperature <= 15) return '建議穿外套';
    return '建議穿長袖';
  }
}
```

#### 理由

- **可替換性**：更換供應商只需替換 Service，不影響業務邏輯。
- **可測試性**：可輕易用 Mock 取代依賴。

---

### 4.2 規範二：為你的邏輯編寫可預測的單元測試

#### 條文

所有 Service 層的業務邏輯都必須有對應的單元測試 (.spec.ts)。

#### 實作步驟

```typescript
// src/clothing/clothing.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { ClothingService } from './clothing.service';
import {
  IWeatherService,
  WEATHER_SERVICE_TOKEN,
} from '../weather/weather.interface';

describe('ClothingService', () => {
  let service: ClothingService;
  let mockWeatherService: IWeatherService;

  beforeEach(async () => {
    const mockService = { getWeatherByCity: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClothingService,
        { provide: WEATHER_SERVICE_TOKEN, useValue: mockService },
      ],
    }).compile();

    service = module.get<ClothingService>(ClothingService);
    mockWeatherService = module.get<IWeatherService>(WEATHER_SERVICE_TOKEN);
  });

  it('當天氣炎熱時，應建議穿 T-shirt', async () => {
    const city = 'Taipei';
    (mockWeatherService.getWeatherByCity as jest.Mock).mockResolvedValue({
      city,
      temperature: 30,
    });
    const result = await service.getClothingSuggestion(city);
    expect(result).toBe('建議穿 T-shirt');
    expect(mockWeatherService.getWeatherByCity).toHaveBeenCalledWith(city);
  });
});
```

#### 測試最佳實踐

- 保持獨立 (`beforeEach`, `afterEach`)
- 一個測試案例只驗證一件事
- 覆蓋正常、邊界、錯誤情境
- 命名清晰

### 4.3 規範三：常數與配置集中化

#### 條文

所有常數、配置項目、錯誤代碼都必須集中定義，避免散落在各處造成維護困難。

#### 實作步驟

**步驟一：建立統一常數目錄**

```typescript
// api/constants/headers.constants.ts
export const NY_OPERATOR_HEADER = 'ny-operator';
export const REQUEST_ID_HEADER = 'x-request-id';

// api/constants/error-codes.constants.ts
export const ERROR_CODES = {
  EXTERNAL_API_ERROR: 'EXTERNAL_API_ERROR',
  DEVICE_NOT_FOUND: 'DEVICE_NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
} as const;

// api/constants/request-patterns.constants.ts
export const REQUEST_ID_PATTERN = /^req-(devices|error)-[0-9]+-?[a-zA-Z0-9]*$/;
```

**步驟二：統一配置管理**

```typescript
// api/config/api.config.ts
export default registerAs('api', () => ({
  timeout: parseInt(process.env.API_TIMEOUT || '10000'),
  retries: parseInt(process.env.API_RETRIES || '0'),
  headers: {
    operator: process.env.OPERATOR_HEADER || 'ny-operator',
  },
}));
```

#### 理由

- **維護性**：修改常數只需要改一個地方
- **一致性**：所有地方使用相同的定義
- **可測試性**：常數可以被輕易 mock

---

### 4.4 規範四：Request ID 統一追蹤機制

#### 條文

所有 HTTP 請求必須使用統一的 Request ID 進行追蹤，確保格式一致、全域唯一且便於日誌分析和問題排查。

#### 實作原則

**4.4.1 統一使用 HTTP 層級 Request ID**

採用單一 Request ID 機制，避免多層 ID 造成的複雜性和混淆。每個 HTTP 請求對應一個唯一的 Request ID，涵蓋整個請求-回應生命週期。

**4.4.2 彈性的 Request ID 來源**

支援雙向 Request ID 機制：
- **Client 提供優先**：支援微服務間追蹤和調試場景
- **Server 自動生成**：確保每個請求都有唯一標識

#### 技術實作規範

**步驟一：Middleware 層統一處理**

```typescript
// api/common/middleware/request-id.middleware.ts
@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
  private static readonly REQUEST_ID_HEADER = 'x-request-id';

  public use(req: Request, res: Response, next: NextFunction): void {
    // 優先使用 client 提供的 Request ID
    let requestId = req.headers['x-request-id'] as string;

    // 驗證格式，無效則重新生成
    if (!requestId || !this.isValidRequestId(requestId)) {
      requestId = this.generateRequestId();
    }

    // 存儲到 request 對象供後續使用
    req.requestId = requestId;

    // 添加到 response header 供 client 追蹤
    res.set('x-request-id', requestId);

    next();
  }

  private generateRequestId(): string {
    const timestamp = this.generateTimestamp(); // yyyymmddhhmmss
    const uuid = uuidv4();
    return `req-${timestamp}-${uuid}`;
  }

  private isValidRequestId(requestId: string): boolean {
    const pattern = /^req-\d{14}-[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;
    return pattern.test(requestId);
  }
}
```

**步驟二：Controller 層標準用法**

```typescript
@Controller('example')
export class ExampleController {
  @Get('items')
  async getItems(
    @Query() query: QueryDto,
    @Headers('ny-operator') operator: string,
    @Req() request: Request, // 注入 request 對象
  ) {
    // 取得統一的 Request ID
    const requestId = RequestIdMiddleware.getRequestId(request);

    // 傳遞給 Service 層進行業務處理
    return this.exampleService.getItems(query, requestId);
  }
}
```

**步驟三：Service 層使用 Request ID**

```typescript
@Injectable()
export class ExampleService {
  private readonly logger = new Logger(ExampleService.name);

  async getItems(query: QueryDto, requestId: string) {
    // 使用 Request ID 進行日誌追蹤
    this.logger.log(`Processing items query - requestId: ${requestId}`, {
      query,
      requestId,
    });

    // 業務處理邏輯...
    const result = await this.processItems(query);

    this.logger.log(`Items query completed - requestId: ${requestId}`, {
      resultCount: result.length,
      requestId,
    });

    // Request ID 會由 ResponseFormatInterceptor 自動加入回應
    return result;
  }
}
```

#### Request ID 格式規範

**標準格式**
```
req-{yyyymmddhhmmss}-{uuid-v4}
```

**格式說明**
- **前綴**: `req-` (固定)
- **時間戳**: `yyyymmddhhmmss` (14位數字，精確到秒)
- **分隔符**: `-` (連接符)
- **唯一標識**: UUID v4 格式 (36字符)

**格式範例**
```
req-20250928143052-a8b2c4d6-dd70-4edd-9f86-a2cfc0e8be22
```

#### 使用場景

**場景一：外部 Client 調用 (Server 生成)**
```bash
# Client 請求 (無 x-request-id)
curl -H "ny-operator: test" /api/v1/items

# Server 回應
{
  "success": true,
  "data": [...],
  "timestamp": "2025-09-28T14:30:52.123Z",
  "requestId": "req-20250928143052-a8b2c4d6-dd70-4edd-9f86-a2cfc0e8be22"
}
```

**場景二：微服務間調用 (Client 提供)**
```typescript
// Service A 調用 Service B
const upstreamRequestId = RequestIdMiddleware.getRequestId(request);

const response = await this.httpService.get('/api/v1/downstream', {
  headers: {
    'x-request-id': upstreamRequestId, // 傳遞上游 Request ID
    'ny-operator': operator,
  }
});
```

#### 常數管理

```typescript
// api/constants/request-id.constants.ts
export const REQUEST_ID_CONSTANTS = {
  HEADER_NAME: 'x-request-id',
  PROPERTY_NAME: 'requestId',
  PATTERN: /^req-\d{14}-[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/,
  PREFIX: 'req-',
} as const;
```

#### 禁止事項

**❌ 嚴禁的做法**
- **禁止自行生成 Request ID**：不得在 Service 層手動產生 Request ID
- **禁止格式不一致**：所有 Request ID 必須符合統一格式規範
- **禁止重複 ID 邏輯**：不得存在多套 Request ID 生成機制
- **禁止硬編碼常數**：Header 名稱、格式等必須使用統一常數

#### 理由

**技術優勢**
- **架構簡化**：單一追蹤機制，避免多層 ID 複雜性
- **全域一致**：所有模組使用相同的 Request ID 格式
- **自動化處理**：Middleware 和 Interceptor 自動處理，減少手動操作
- **標準兼容**：符合 HTTP `x-request-id` 標準慣例

**業務價值**
- **問題排查**：統一 ID 便於跨服務日誌關聯和錯誤追蹤
- **性能監控**：清晰的請求生命週期追蹤
- **調試友好**：支援自定義 Request ID 進行特定追蹤
- **合規需求**：滿足審計和監控要求

---

### 4.5 規範五：錯誤處理分層

#### 條文

必須明確區分外部 API 錯誤（500）與業務邏輯錯誤（404），使用不同的 Exception 類別。

#### 實作步驟

**步驟一：建立外部 API 異常**

```typescript
// api/common/exceptions/external-api.exception.ts
import { HttpException } from '@nestjs/common';
import { ERROR_CODES } from '../../constants/error-codes.constants';

export class ExternalApiException extends HttpException {
  constructor(message: string, statusCode?: number) {
    super({
      code: ERROR_CODES.EXTERNAL_API_ERROR,
      message: '外部API調用失敗',
      details: { originalMessage: message, statusCode }
    }, 500);
  }
}
```

**步驟二：建立業務邏輯異常**

```typescript
// api/common/exceptions/business-logic.exception.ts
import { HttpException } from '@nestjs/common';

export class BusinessNotFoundException extends HttpException {
  constructor(code: string, message: string, details?: any) {
    super({ code, message, details }, 404);
  }
}
```

**步驟三：在服務中正確使用**

```typescript
// 外部 API 錯誤（500）
if (error.response) {
  throw new ExternalApiException(`Marketing Cloud API returned status ${error.response.status}`);
}

// 業務邏輯錯誤（404）
if (!devices || devices.length === 0) {
  throw new BusinessNotFoundException(
    ERROR_CODES.DEVICE_NOT_FOUND,
    'No devices found for the specified customer',
    { shopId, phone }
  );
}
```

#### 理由

- **明確性**：錯誤類型一目了然
- **一致性**：相同類型錯誤有統一處理
- **可維護性**：錯誤處理邏輯集中管理

---

## 5. 開發流程 (TDD)

1. **閱讀規格** → specs/{feature-id}/spec.md
2. **建立模組與測試檔案**
   ```bash
   cd api
   nest g resource modules/order
   ```
3. **撰寫失敗的測試** (紅燈)
   ```typescript
   describe('create', () => {
     it('should throw if price < 0', async () => {
       await expect(
         service.create({ productId: 'abc', price: -10, quantity: 1 }),
       ).rejects.toThrow();
     });
   });
   ```
4. **實作業務邏輯** (綠燈)
   ```typescript
   async create(dto: CreateOrderDto): Promise<Order> {
     if (dto.price < 0) throw new BadRequestException('Price cannot be negative');
     return new Order();
   }
   ```
5. **重構** (Refactor)

---

## 6. API 設計標準

### RESTful URL 設計

```typescript
GET / api / v1 / orders;
GET / api / v1 / orders / 123;
POST / api / v1 / orders;
PUT / api / v1 / orders / 123;
DELETE / api / v1 / orders / 123;
```

### 統一回應格式

```typescript
interface ApiResponse<T> {
  success: true;
  data: T;
  timestamp: string;
  requestId: string;
}

interface ApiErrorResponse {
  success: false;
  error: { code: string; message: string; details?: any };
  timestamp: string;
  requestId: string;
}
```

### Swagger 文件範例

```typescript
@ApiOperation({ summary: '建立新訂單', description: '使用提供的資訊建立新的訂單' })
@ApiResponse({ status: 201, description: '成功', type: CreateOrderResponseDto })
@ApiResponse({ status: 400, description: '驗證失敗', type: ApiErrorResponse })
```

---

## 7. 測試策略

### 7.1 測試分層架構 (三層測試金字塔)

本專案採用三層測試架構，**不包含 E2E 測試**：

#### 單元測試 (.spec.ts)
- **目的**：測試單一 Service/Controller 方法的業務邏輯
- **Mock 策略**：Mock 所有外部依賴 (使用 Jest Mock + overrideProvider)
- **文件位置**：與被測試文件並列存放
- **覆蓋率要求**：≥ 95%
- **測試重點**：邏輯分支、邊界條件、錯誤處理

#### 整合測試 (.integration.spec.ts)
- **目的**：測試完整 API 端點，包含認證、驗證、業務流程
- **Mock 策略**：Mock 外部服務 (Marketing Cloud、第三方 API)，使用真實 NestJS 應用
- **文件位置**：`{module}/integration/` 目錄
- **覆蓋率要求**：≥ 80%
- **測試重點**：HTTP 請求/回應、錯誤狀態碼、認證流程

#### 合約測試 (.contract.spec.ts)
- **目的**：驗證 API 回應格式完全符合 OpenAPI 規範
- **Mock 策略**：Mock 所有依賴，專注於回應格式驗證
- **文件位置**：`test/contract/` 目錄
- **覆蓋率要求**：100% API endpoints
- **測試重點**：Response Schema、HTTP Status Code、Header 格式

### 7.2 Mock 策略規範

## ❌ 整合測試禁止事項
- 禁止使用真實 API URL
- 禁止使用 nock/superagent-mock 等 HTTP 攔截
- 禁止連接真實外部服務
- 禁止依賴網路連線進行測試

#### 外部 API Mock (必須遵循)
```typescript
// ✅ 正確：使用 Jest Mock + overrideProvider
const mockMarketingCloudService = {
  getDevices: jest.fn(),
};

const moduleFixture = await Test.createTestingModule({
  imports: [NotificationStatusModule],
})
  .overrideProvider(MARKETING_CLOUD_SERVICE_TOKEN)
  .useValue(mockMarketingCloudService)
  .compile();

// ❌ 錯誤：禁止使用 HTTP 攔截器
// nock('https://api.example.com').get('/devices').reply(200, data);
```

#### 依賴注入 Mock
- 使用 `overrideProvider` 替換服務依賴
- 測試所有成功和失敗場景
- 驗證服務間的調用參數

#### 資料庫 Mock
- **單元測試**：完全 Mock Repository
- **整合測試**：使用真實 NestJS 應用 (不連接真實 DB)
- **合約測試**：Mock 所有資料來源

### 7.3 測試文件組織結構

```
api/modules/notification-status/
├── notification-status.service.spec.ts           # 單元測試
├── notification-status.controller.spec.ts        # 單元測試
├── integration/                                   # 整合測試目錄
│   ├── devices-success.integration.spec.ts       # 成功場景
│   ├── devices-auth.integration.spec.ts          # 認證測試
│   ├── devices-validation.integration.spec.ts    # 驗證測試
│   ├── devices-external-errors.integration.spec.ts # 外部錯誤
│   └── devices-notfound.integration.spec.ts      # Not Found 場景
└── services/
    └── marketing-cloud.service.spec.ts           # 單元測試

test/
└── contract/                                      # 合約測試目錄
    └── notification-status.contract.spec.ts      # API 合約驗證
```

### 7.4 測試命名規範

#### 測試檔案命名
- 單元測試：`{class-name}.spec.ts`
- 整合測試：`{feature-scenario}.integration.spec.ts`
- 合約測試：`{api-name}.contract.spec.ts`

#### 測試案例命名
```typescript
// ✅ 好的命名：描述業務場景
describe('NotificationStatusService', () => {
  describe('getDevices', () => {
    it('should return devices when Marketing Cloud API responds successfully', () => {});
    it('should throw NotFoundException when no devices found', () => {});
    it('should throw ExternalApiException when Marketing Cloud API fails', () => {});
  });
});

// ❌ 不好的命名：只描述技術細節
describe('NotificationStatusService', () => {
  it('should call getDevices method', () => {});
  it('should return array', () => {});
});
```

### 7.5 測試覆蓋率要求

#### 覆蓋率目標
- **整體專案**：≥ 80%
- **單元測試**：≥ 95% (業務邏輯類別)
- **整合測試**：≥ 80% (API 端點)
- **合約測試**：100% (所有公開 API)

#### 關鍵路徑 100% 覆蓋
- 錯誤處理邏輯
- 外部 API 調用
- 認證和授權流程
- 資料驗證邏輯

```bash
npm run test       # 執行所有測試
npm run test:cov   # 生成覆蓋率報告
npm run test:unit  # 只執行單元測試
npm run test:integration  # 只執行整合測試
```

### 7.6 測試最佳實踐

#### 測試隔離原則
- 每個測試案例必須獨立 (`beforeEach`, `afterEach`)
- 一個測試案例只驗證一個業務場景
- 測試間不能有順序依賴

#### 錯誤場景測試
- 必須測試所有 Exception 分支
- 外部 API 錯誤場景 (timeout, 4xx, 5xx)
- 輸入驗證失敗場景

#### Mock 驗證
- 驗證 Mock 方法被正確調用
- 驗證調用參數的正確性
- 驗證調用次數 (`toHaveBeenCalledTimes`)

---

## 8. 配置管理

- 採用 `registerAs` 強型別注入
- 統一存放於 `api/config/`
- Joi 驗證環境變數

```typescript
export default registerAs('externalApis', () => ({
  whaleApi: {
    baseUrl: process.env.WHALE_API_URL,
    timeout: parseInt(process.env.WHALE_API_TIMEOUT || '10000'),
    retries: parseInt(process.env.WHALE_API_RETRIES || '3'),
  },
}));
```

---

## 9. Git 規範與版本控制

### 9.1 Commit Message 格式

#### 條文

所有 commit message 必須遵循統一格式，使用中文描述，便於追蹤和理解變更歷史。

#### 格式規範

```
<類型>(<範圍>): <簡短描述>

<詳細描述>（可選）

相關議題: #123（可選）
```

#### 類型定義

- **feat**: 新功能
- **fix**: 錯誤修復
- **docs**: 文檔更新
- **style**: 代碼格式調整（不影響功能）
- **refactor**: 重構（既不是新功能也不是錯誤修復）
- **test**: 測試相關
- **chore**: 建置工具、依賴更新等維護性工作

#### 範圍定義

- **notification-status**: 通知狀態模組
- **marketing-cloud**: Marketing Cloud 整合
- **config**: 配置相關
- **common**: 共用工具
- **test**: 測試相關

#### 範例

```bash
# 新功能
feat(notification-status): 新增設備查詢 API 端點

實作 GET /api/v1/notification-status/devices 端點
- 支援依 shopId 和 phone 查詢設備
- 包含 ny-operator 認證機制
- 整合 Marketing Cloud API

相關議題: #007

# 錯誤修復
fix(marketing-cloud): 修正 API 超時處理邏輯

將超時從 5 秒調整為 10 秒，並增加重試機制

# 測試
test(notification-status): 補充設備查詢整合測試

增加認證失敗和驗證錯誤場景的測試覆蓋
```

#### 禁止事項

- ❌ 使用英文描述：`fix: update API timeout`
- ❌ 描述不清：`update code`
- ❌ 缺少類型：`修正錯誤`
- ❌ 過長標題：`feat(notification-status): 新增設備查詢API端點並且包含完整的認證機制和錯誤處理邏輯以及Marketing Cloud整合`

---

## 10. 開發檢查清單

### 基本開發要求
- [ ] 已閱讀規格文件
- [ ] PR 標題與描述包含 feature-id
- [ ] 程式碼遵循 TDD
- [ ] 覆蓋率 ≥ 80% (`npm run test:cov`)
- [ ] API URL 設計符合 RESTful
- [ ] DTO 已加上 class-validator 驗證與 Swagger 註解
- [ ] 錯誤處理符合標準化設計
- [ ] 若修改 DB Schema，已產生 migration
- [ ] 新增 API 已更新到 Swagger 文件
- [ ] Commit message 遵循格式規範並使用中文描述
- [ ] 所有文檔、註解、commit message 使用繁體中文撰寫

### 代碼品質要求
- [ ] 所有常數已定義在 `api/constants/` 目錄
- [ ] Request ID 使用統一生成器 (`RequestIdService`)
- [ ] 錯誤處理正確區分外部 API 錯誤（500）和業務邏輯錯誤（404）
- [ ] 沒有重複的驗證邏輯或常數定義
- [ ] 配置項目集中在 `api/config/` 目錄
- [ ] Header 名稱使用統一常數定義
- [ ] Exception 類別按照錯誤類型正確分類

### 測試品質要求（新增）
- [ ] 單元測試覆蓋率 ≥ 95% (業務邏輯類別)
- [ ] 整合測試覆蓋所有 API 端點的主要場景
- [ ] 合約測試驗證所有公開 API 的回應格式
- [ ] **❌ 外部 API 使用 Jest Mock + overrideProvider（嚴禁使用真實 URL、nock 或網路連線）**
- [ ] 測試案例命名描述業務場景而非技術實作
- [ ] 所有錯誤分支都有對應測試案例
- [ ] 測試文件按規範放置在正確目錄結構中

---

### 9.2 文檔規範

#### 條文

所有專案文檔必須使用**繁體中文**撰寫，包括但不限於規格文件、API 文檔、README、註解等。

#### 適用文件類型

- **規格文檔**: `specs/` 目錄下所有 `.md` 文件
- **API 文檔**: Swagger 註解、OpenAPI 規範
- **README 文件**: 專案說明、使用指南
- **代碼註解**: TypeScript/JavaScript 註解
- **Commit message**: Git 提交訊息
- **Pull Request**: PR 標題與描述

#### 範例

```typescript
/**
 * 設備查詢服務
 *
 * 負責處理設備相關的業務邏輯，包括：
 * - 從 Marketing Cloud 獲取設備清單
 * - 驗證查詢參數
 * - 統一錯誤處理
 */
@Injectable()
export class DeviceService {
  /**
   * 根據店家 ID 和電話號碼查詢設備
   *
   * @param shopId - 店家 ID
   * @param phone - 客戶電話號碼
   * @returns 設備清單
   * @throws {BusinessNotFoundException} 當找不到設備時
   * @throws {ExternalApiException} 當外部 API 調用失敗時
   */
  async getDevices(shopId: number, phone: string): Promise<Device[]> {
    // 實作邏輯...
  }
}
```

#### 禁止事項

- ❌ 使用英文文檔：`Get devices by shop ID and phone`
- ❌ 混用語言：`取得 devices 清單`
- ❌ 使用簡體中文：`获取设备列表`

---

## 11. 代碼品質原則

### 11.1 DRY 原則 (Don't Repeat Yourself)
- 任何邏輯、常數、配置不得重複定義
- 相似功能必須抽取為共用 service 或 utility
- 驗證邏輯必須可重用，避免在多處重複實作

### 11.2 單一職責原則
- 每個 service 只負責一個明確的業務領域
- Exception 類別按照錯誤類型分類（外部 API 錯誤 vs 業務邏輯錯誤）
- 常數按照功能領域分檔管理

### 11.3 可追蹤性原則
- 所有 API 請求必須有統一格式的 Request ID
- 錯誤日誌必須包含足夠的上下文資訊
- Request ID 格式必須便於日誌分析和問題排查

### 11.4 配置外部化
- 所有環境相關配置必須透過環境變數管理
- 超時、重試等參數必須可配置
- Header 名稱、錯誤代碼等必須統一定義

### 11.5 錯誤處理一致性
- 外部 API 錯誤統一返回 500 狀態碼
- 業務邏輯錯誤（如資源不存在）統一返回 404 狀態碼
- 所有錯誤必須包含明確的錯誤代碼和描述

---

## 附錄：核心設計哲學

- **依賴注入**：面向介面程式設計，隔離外部依賴
- **測試優先**：所有功能必須有測試覆蓋，TDD 流程不可省略
- **規格驅動**：所有開發以 spec.md 文件為單一真實來源 (SSOT)
- **代碼整潔**：遵循 DRY、SOLID 原則，確保代碼可讀、可維護
- **錯誤透明**：錯誤處理明確、可追蹤，便於問題診斷
