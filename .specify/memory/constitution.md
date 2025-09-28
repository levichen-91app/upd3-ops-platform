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

- **單元測試** → Mock 所有依賴，與業務邏輯並列存放
- **整合測試** → 測試模組流程，實際操作測試 DB

```bash
npm run test       # 單元 + 整合測試
npm run test:cov   # 覆蓋率報告
```

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

## 9. 開發檢查清單

- [ ] 已閱讀規格文件
- [ ] PR 標題與描述包含 feature-id
- [ ] 程式碼遵循 TDD
- [ ] 覆蓋率 ≥ 80% (`npm run test:cov`)
- [ ] API URL 設計符合 RESTful
- [ ] DTO 已加上 class-validator 驗證與 Swagger 註解
- [ ] 錯誤處理符合標準化設計
- [ ] 若修改 DB Schema，已產生 migration
- [ ] 新增 API 已更新到 Swagger 文件

---

## 附錄：核心設計哲學

- **依賴注入**：面向介面程式設計，隔離外部依賴
- **測試優先**：所有功能必須有測試覆蓋，TDD 流程不可省略
- **規格驅動**：所有開發以 spec.md 文件為單一真實來源 (SSOT)
