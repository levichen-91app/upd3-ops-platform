## 後端 API 開發指南 (整合版)

### **前言：必讀**

本開發指南是 **《專案憲章》** 在後端 API
開發中的具體實施細則。所有後端開發活動必須同時遵循憲章的**核心原則**與本指南的**技術實踐**。若有衝突，以專案憲章為最高準則。

---

### **1. 專案概述**

本專案是一個 Monorepo (單一程式碼庫) 結構，後端 API 服務位於 `api/`
目錄下。它基於 NestJS 框架，旨在為前端應用提供穩定、高效的資料服務。

#### **1.1 專案結構 (Monorepo)**

.
├── .specify/ # 規格驅動開發的相關文件
├── specs/{feature-id}/ # 各功能規格文件目錄
├── api/ # ✅ 所有後端程式碼 (NestJS 專案)
│ ├── src/
│ │ ├── modules/
│ │ ├── common/
│ │ ├── config/
│ │ └── ...
│ ├── test/ # E2E 測試
│ ├── package.json
│ └── tsconfig.json
└── src/ # 前端 React 專案

#### **1.2 技術棧 (Tech Stack)**

- **框架**: NestJS 10.x (基於 Node.js 18+)
- **語言**: TypeScript 5.x (啟用 `strict` 模式)
- **資料庫**: PostgreSQL + TypeORM
- **文檔**: Swagger/OpenAPI (Code-First)
- **測試**: Jest + Supertest
- **環境**: Docker
- **程式碼規範**: ESLint + Prettier

---

#### **2.2 環境變數**

後端的環境變數檔案位於 api/.env.development。

```ini
# api/.env.development

# ... (同原版設定)
DATABASE_HOST=postgres # 注意：在 Docker 環境中，主機名是服務名
DATABASE_PORT=5432
# ...
```

#### **2.3 啟動服務**

```bash
# 服務已在 docker-compose up -d 中以後台模式啟動
# 若要查看 API 文檔，請訪問：
open http://localhost:3000/api-docs
```

---

### **3. 開發流程 (憲章整合版)**

根據憲章，我們嚴格執行「規格驅動」與「測試優先 (TDD)」的開發流程。

**Step 0: 閱讀規格**\
一切開發始於規格。在撰寫任何程式碼前，請前往 specs/{feature-id}/
目錄，詳細閱讀 spec.md 文件，確保完全理解需求、驗收條件和技術約束。

**Step 1: 建立模組與測試檔案**\
使用 NestJS CLI 快速建立模組所需的所有檔案。

```bash
# 確保在 api 目錄下執行
cd api

# 建立一個名為 "order" 的資源模組
nest g resource modules/order

cd ..
```

**Step 2: 編寫第一個「失敗」的測試 (TDD)**\
假設我們要實作「建立訂單」的功能。首先進入測試檔案
api/src/modules/order/order.service.spec.ts，編寫一個預期會失敗的測試案例。

```ts
// api/src/modules/order/order.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { OrderService } from './order.service';

describe('OrderService', () => {
  let service: OrderService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OrderService /*, ...其他依賴的 Mocks */],
    }).compile();

    service = module.get<OrderService>(OrderService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // 📝 TDD 第一步：編寫失敗的測試
  describe('create', () => {
    it('should throw an error if the price is less than 0', async () => {
      const createOrderDto = { productId: 'abc', price: -10, quantity: 1 };

      // 預期這個操作會拋出一個錯誤
      await expect(service.create(createOrderDto)).rejects.toThrow();
    });
  });
});
```

此時執行測試，這個案例必定失敗，因為 create 方法甚至還不存在。

**Step 3: 實作業務邏輯**

```ts
// api/src/modules/order/order.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { Order } from './entities/order.entity'; // 假設 Order Entity 已定義

@Injectable()
export class OrderService {
  async create(createOrderDto: CreateOrderDto): Promise<Order> {
    if (createOrderDto.price < 0) {
      // 📝 TDD 第二步：撰寫讓測試通過的程式碼
      throw new BadRequestException('Price cannot be negative');
    }
    // ... 尚未實現的邏輯
    return Promise.resolve(new Order());
  }
}
```

再次執行測試，此時測試應該會通過。重複 Step 2 和 Step 3（紅燈 -\> 綠燈
-\> 重構）直到完成所有業務邏輯。

**Step 4: 定義 API 路由與 DTO**\
在 Controller 中定義 API 端點，並為 DTO (dto/create-order.dto.ts) 加上
class-validator 和 @ApiProperty 裝飾器。

**Step 5: 資料庫遷移 (若有)**

```bash
# 1. 產生遷移檔案
npm run migration:generate -- api/src/database/migrations/UpdateOrderSchema

# 2. 執行遷移
npm run migration:run
```

---

### **4. API 測試策略 (遵循 NestJS 慣例)**

根據憲章，測試是必要條件，且需滿足品質門檻。我們遵循 NestJS 的測試慣例。

#### **4.1 測試分層與規範**

**單元測試 (Unit Tests)**\

- 目標: 測試單一 Service、Pipe 或 Class 的內部邏輯，依賴項應全部被模擬
  (Mock)。\
- 命名: \*.spec.ts\
- 位置: 與被測試的檔案並列存放 (e.g., order.service.ts 和
  order.service.spec.ts)。

**整合測試 (Integration Tests)**\

- 目標: 測試從 Controller 到資料庫的完整模組流程，通常只模擬外部
  API，會實際操作測試資料庫。\
- 命名: \*.integration-spec.ts\
- 位置: 與被測試的 Controller 並列存放 (e.g.,
  order.controller.integration-spec.ts)。

**端到端測試 (E2E Tests)**\

- 目標: 模擬真實使用者，對運行的應用程式發起 HTTP
  請求，驗證完整的請求-回應週期。\
- 命名: \*.e2e-spec.ts\
- 位置: 統一存放於 api/test/ 目錄下。

#### **4.2 品質門檻 (來自憲章)**

- 測試優先: 所有新功能或錯誤修復，都應遵循 TDD 流程。\
- 覆蓋率: Statements / Lines / Functions / Branches
  的測試覆蓋率必須全部 ≥ 80%。提交 PR 前，請在本地執行
  `npm run test:cov` 進行檢查。

#### **4.3 執行測試**

```bash
# 在專案根目錄執行

# 執行單元與整合測試
npm run test

# 執行 E2E 測試
npm run test:e2e

# 產出覆蓋率報告
npm run test:cov
```

---

### **5. API 設計標準**

本專案遵循企業級 API 設計標準，完整規範請參考：[API 設計規範](../../api-spec.md)

#### **5.1 核心設計原則**

- **RESTful 設計**: 使用資源導向的 URL 設計，遵循 HTTP 方法語意
- **統一回應格式**: 所有 API 回應必須遵循統一的格式結構
- **錯誤處理標準**: 使用標準化的錯誤代碼和 HTTP 狀態碼
- **版本控制**: 採用 URL 路徑版本控制策略 (`/api/v1/...`)

#### **5.2 必須遵循的實作標準**

**URL 設計:**
```typescript
// ✅ 正確的 URL 設計
GET    /api/v1/orders           // 取得訂單清單
GET    /api/v1/orders/123       // 取得特定訂單
POST   /api/v1/orders           // 建立新訂單
PUT    /api/v1/orders/123       // 更新訂單
DELETE /api/v1/orders/123       // 刪除訂單

// ❌ 避免的設計
GET    /api/getOrderById?id=123
POST   /api/order/create
```

**統一回應格式:**
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
```

**驗證和安全:**
- 所有 DTO 必須使用 `class-validator` 裝飾器
- 實作適當的身份驗證和授權機制
- 使用速率限制防止 API 濫用
- 輸入驗證和清理以防止安全攻擊

#### **5.3 OpenAPI/Swagger 文件要求**

所有 API 端點都必須包含完整的 Swagger 註解：

```typescript
@ApiOperation({
  summary: '建立新訂單',
  description: '使用提供的資訊建立新的訂單...'
})
@ApiResponse({
  status: 201,
  description: '訂單建立成功',
  type: CreateOrderResponseDto
})
@ApiResponse({
  status: 400,
  description: '請求驗證失敗',
  type: ApiErrorResponse
})
```

---

### **6. 最佳實踐**

- 架構一致性: 遵循本指南的統一回應與錯誤處理機制，保持全棧 TypeScript strict 模式。\
- 範圍控制: 嚴格遵守憲章的「單體應用優先」原則。禁止過度優化（如引入Redis、MQ），任何架構變更需提交 exceptions.md 審核。\
- Service 層設計: 保持方法職責單一，所有業務邏輯、驗證和資料庫操作都封裝在 Service 中。\
- 資料庫遷移: 所有資料庫 Schema 的變更都必須透過 TypeORM Migrations 進行版本控制。\
- 日誌記錄: 使用 nestjs-pino 進行結構化 (JSON) 日誌記錄，確保包含 requestId 以便追蹤。\
- API 標準: 嚴格遵循 [API 設計規範](../../api-spec.md) 中的所有標準和最佳實踐。

---

### **7. 開發檢查清單**

在您提交 Pull Request 之前，請逐一確認以下所有項目：

#### **7.1 基本開發要求**
- [ ] 我已詳細閱讀並理解本功能的規格文件 (specs/{feature-id}/spec.md)。\
- [ ] 我的 PR 標題和描述已引用對應的規格 ID (feature-id)。\
- [ ] 所有程式碼皆遵循 TDD 流程開發。\

#### **7.2 API 設計標準檢查**
- [ ] API URL 設計遵循 RESTful 原則，使用資源導向的設計。\
- [ ] 所有 API 回應都使用統一的回應格式 (ApiResponse/ApiErrorResponse)。\
- [ ] HTTP 狀態碼的使用正確且一致。\
- [ ] 所有 DTO 都已加上 class-validator 驗證規則和 @ApiProperty Swagger 說明。\
- [ ] API 端點都包含完整的 @ApiOperation、@ApiResponse 註解。\
- [ ] 錯誤處理遵循標準化的錯誤代碼設計。\
- [ ] 實作了適當的輸入驗證和安全措施。\

#### **7.3 程式碼品質檢查**
- [ ] Service 層已包含適當的錯誤處理，優先拋出 HttpException 或自定義的 BaseApiException。\
- [ ] 若有變更 Entity，已產生並包含對應的資料庫遷移檔案。\
- [ ] 所有測試案例皆已通過 (npm run test & npm run test:e2e)。\
- [ ] 測試覆蓋率已達標 (≥ 80%) (npm run test:cov)。\
- [ ] 程式碼已通過 Lint 檢查 (npm run lint)。\
- [ ] 若有新增環境變數，已同步更新 api/.env.example 檔案。\

#### **7.4 文件與規範檢查**
- [ ] 新增的 API 已更新到 Swagger 文件中。\
- [ ] 遵循 [API 設計規範](../../api-spec.md) 的所有相關標準。\
- [ ] 如有涉及安全敏感操作，已實作適當的安全控制措施。\

---

### **附錄：關於憲章的說明**

請注意：為最大化開發效率並與 NestJS 框架生態保持一致，本指南採用的測試檔案規範 (\*.spec.ts 及就近存放) 已成為團隊正式標準。
