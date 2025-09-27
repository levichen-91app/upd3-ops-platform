# Notification Status Proxy API - 簡單配置機制

## 1. 設計原則

- **遵循憲章**：使用 `registerAs` 強型別注入
- **Joi 驗證**：確保環境變數正確性
- **統一存放**：配置存放於 `api/config/`
- **最小化配置**：只包含必要的外部API設定

## 2. 配置架構

```
api/config/
├── index.ts                 # 配置入口
└── external-apis.config.ts  # 外部API配置
```

## 3. 外部API配置

### 3.1 external-apis.config.ts

```typescript
import { registerAs } from '@nestjs/config';
import * as Joi from 'joi';

export interface ExternalApisConfig {
  marketingCloud: {
    baseUrl: string;
    timeout: number;
    retries: number;
  };
  whaleApi: {
    baseUrl: string;
    timeout: number;
    retries: number;
  };
  ncApi: {
    baseUrl: string;
    timeout: number;
    retries: number;
  };
  nsApi: {
    baseUrl: string;
    timeout: number;
    retries: number;
  };
}

export const externalApisConfigSchema = Joi.object({
  MARKETING_CLOUD_BASE_URL: Joi.string().uri().required(),
  MARKETING_CLOUD_TIMEOUT: Joi.number().default(10000),
  MARKETING_CLOUD_RETRIES: Joi.number().default(3),

  WHALE_API_BASE_URL: Joi.string().uri().required(),
  WHALE_API_TIMEOUT: Joi.number().default(15000),
  WHALE_API_RETRIES: Joi.number().default(3),

  NC_API_BASE_URL: Joi.string().uri().required(),
  NC_API_TIMEOUT: Joi.number().default(10000),
  NC_API_RETRIES: Joi.number().default(3),

  NS_API_BASE_URL: Joi.string().uri().required(),
  NS_API_TIMEOUT: Joi.number().default(30000),
  NS_API_RETRIES: Joi.number().default(2),
});

export default registerAs('externalApis', (): ExternalApisConfig => ({
  marketingCloud: {
    baseUrl: process.env.MARKETING_CLOUD_BASE_URL!,
    timeout: parseInt(process.env.MARKETING_CLOUD_TIMEOUT || '10000'),
    retries: parseInt(process.env.MARKETING_CLOUD_RETRIES || '3'),
  },
  whaleApi: {
    baseUrl: process.env.WHALE_API_BASE_URL!,
    timeout: parseInt(process.env.WHALE_API_TIMEOUT || '15000'),
    retries: parseInt(process.env.WHALE_API_RETRIES || '3'),
  },
  ncApi: {
    baseUrl: process.env.NC_API_BASE_URL!,
    timeout: parseInt(process.env.NC_API_TIMEOUT || '10000'),
    retries: parseInt(process.env.NC_API_RETRIES || '3'),
  },
  nsApi: {
    baseUrl: process.env.NS_API_BASE_URL!,
    timeout: parseInt(process.env.NS_API_TIMEOUT || '30000'),
    retries: parseInt(process.env.NS_API_RETRIES || '2'),
  },
}));
```

## 4. 配置入口

### 4.1 index.ts

```typescript
import { ConfigModule } from '@nestjs/config';

import externalApisConfig, { externalApisConfigSchema } from './external-apis.config';

export const configModule = ConfigModule.forRoot({
  isGlobal: true,
  cache: true,
  validationSchema: externalApisConfigSchema,
  validationOptions: {
    allowUnknown: true,
    abortEarly: false,
  },
  load: [externalApisConfig],
});
```

## 5. 環境變數範例

### 5.1 .env

```bash
# Marketing Cloud
MARKETING_CLOUD_BASE_URL=http://marketing-cloud-service.qa.91dev.tw
MARKETING_CLOUD_TIMEOUT=10000
MARKETING_CLOUD_RETRIES=3

# Whale API
WHALE_API_BASE_URL=http://whale-api-internal.qa.91dev.tw
WHALE_API_TIMEOUT=15000
WHALE_API_RETRIES=3

# NC API
NC_API_BASE_URL=http://nc-api.qa.91dev.tw
NC_API_TIMEOUT=10000
NC_API_RETRIES=3

# NS API
NS_API_BASE_URL=https://notify.qa.91dev.tw
NS_API_TIMEOUT=30000
NS_API_RETRIES=2
```

## 6. 使用範例

### 6.1 在Service中使用配置

```typescript
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';

@Injectable()
export class MarketingCloudService {
  private readonly config: any;

  constructor(
    private configService: ConfigService,
    private httpService: HttpService,
  ) {
    this.config = this.configService.get('externalApis.marketingCloud');
  }

  async getDevices(shopId: number, phone: string) {
    const url = `${this.config.baseUrl}/v1/shops/${shopId}/phones/${phone}/devices`;

    const response = await this.httpService.axiosRef.get(url, {
      timeout: this.config.timeout,
    });

    return response.data;
  }
}
```

這是最簡單、最直接的配置方式，後續需要時再擴展。