import { registerAs } from '@nestjs/config';

/**
 * Unified mock mode detection utility
 * Supports both global MOCK_MODE and service-specific mock modes
 */
export const isMockModeEnabled = (serviceName?: string): boolean => {
  // Check global mock mode
  const globalMockMode = process.env.MOCK_MODE === 'true';

  // Check service-specific mock mode (e.g., WHALE_API_MOCK_MODE, MARKETING_CLOUD_MOCK_MODE)
  const specificMockMode = serviceName
    ? process.env[`${serviceName.toUpperCase()}_MOCK_MODE`] === 'true'
    : false;

  return globalMockMode || specificMockMode;
};

/**
 * External API endpoint configuration interface
 */
export interface ApiEndpoint {
  url: string;
  timeout?: number;
  retries?: number;
}

/**
 * Market-specific API endpoints configuration
 */
export interface MarketApiEndpoints {
  TW: ApiEndpoint;
  HK: ApiEndpoint;
  MY: ApiEndpoint;
  SG?: ApiEndpoint; // Optional market support
}

/**
 * Environment-specific configuration for external APIs
 */
export interface EnvironmentApiConfig {
  development: MarketApiEndpoints;
  staging: MarketApiEndpoints;
  production: MarketApiEndpoints;
  test: MarketApiEndpoints;
}

/**
 * Complete external APIs configuration
 */
export interface ExternalApisConfig {
  whaleApi: EnvironmentApiConfig;
  marketingCloudApi: EnvironmentApiConfig;
  // Future external APIs can be added here
  // paymentApi?: EnvironmentApiConfig;
  // notificationApi?: EnvironmentApiConfig;
}

/**
 * Marketing Cloud API endpoints configuration
 */
const marketingCloudApiEndpoints: EnvironmentApiConfig = {
  development: {
    TW: {
      url: 'http://marketing-cloud-service.qa.91dev.tw',
      timeout: 5000,
      retries: 0, // Transparent proxy - no retries
    },
    HK: {
      url: 'http://marketing-cloud-service.qa1.hk.91dev.tw',
      timeout: 5000,
      retries: 0,
    },
    MY: {
      url: 'http://marketing-cloud-service.qa1.my.91dev.tw',
      timeout: 5000,
      retries: 0,
    },
  },
  staging: {
    TW: {
      url: 'http://marketing-cloud-service.qa.91dev.tw',
      timeout: 5000,
      retries: 0,
    },
    HK: {
      url: 'http://marketing-cloud-service.qa1.hk.91dev.tw',
      timeout: 5000,
      retries: 0,
    },
    MY: {
      url: 'http://marketing-cloud-service.qa1.my.91dev.tw',
      timeout: 5000,
      retries: 0,
    },
  },
  production: {
    TW: {
      url: 'http://marketing-cloud-service.91app.io',
      timeout: 5000,
      retries: 0,
    },
    HK: {
      url: 'http://marketing-cloud-service.hk.91app.io',
      timeout: 5000,
      retries: 0,
    },
    MY: {
      url: 'http://marketing-cloud-service.my.91app.io',
      timeout: 5000,
      retries: 0,
    },
  },
  test: {
    TW: {
      url: 'http://marketing-cloud-service.qa.91dev.tw',
      timeout: 5000,
      retries: 0,
    },
    HK: {
      url: 'http://marketing-cloud-service.qa1.hk.91dev.tw',
      timeout: 5000,
      retries: 0,
    },
    MY: {
      url: 'http://marketing-cloud-service.qa1.my.91dev.tw',
      timeout: 5000,
      retries: 0,
    },
  },
};

/**
 * Whale API endpoints configuration based on docs/external-whale-api.yaml
 */
const whaleApiEndpoints: EnvironmentApiConfig = {
  development: {
    TW: {
      url: 'http://whale-api-internal.qa.91dev.tw/admin',
      timeout: 10000,
      retries: 3,
    },
    HK: {
      url: 'http://whale-api-internal.qa1.hk.91dev.tw/admin',
      timeout: 10000,
      retries: 3,
    },
    MY: {
      url: 'http://whale-api-internal.qa1.my.91dev.tw/admin',
      timeout: 10000,
      retries: 3,
    },
  },
  staging: {
    // Staging environment uses same QA endpoints for now
    TW: {
      url: 'http://whale-api-internal.qa.91dev.tw/admin',
      timeout: 10000,
      retries: 3,
    },
    HK: {
      url: 'http://whale-api-internal.qa1.hk.91dev.tw/admin',
      timeout: 10000,
      retries: 3,
    },
    MY: {
      url: 'http://whale-api-internal.qa1.my.91dev.tw/admin',
      timeout: 10000,
      retries: 3,
    },
  },
  production: {
    TW: {
      url: 'http://whale-api-internal.91app.io/admin',
      timeout: 15000, // Higher timeout for production
      retries: 5, // More retries for production
    },
    HK: {
      url: 'http://whale-api-internal.hk.91app.io/admin',
      timeout: 15000,
      retries: 5,
    },
    MY: {
      url: 'http://whale-api-internal.my.91app.io/admin',
      timeout: 15000,
      retries: 5,
    },
  },
  test: {
    // Test environment uses development configuration
    TW: {
      url: 'http://whale-api-internal.qa.91dev.tw/admin',
      timeout: 5000, // Shorter timeout for tests
      retries: 1,
    },
    HK: {
      url: 'http://whale-api-internal.qa1.hk.91dev.tw/admin',
      timeout: 5000,
      retries: 1,
    },
    MY: {
      url: 'http://whale-api-internal.qa1.my.91dev.tw/admin',
      timeout: 5000,
      retries: 1,
    },
  },
};

/**
 * Get Whale API URL based on environment and market
 */
function getWhaleApiUrl(): string {
  const environment = (process.env.NODE_ENV ||
    'development') as keyof EnvironmentApiConfig;
  const market = (process.env.MARKET || 'TW') as keyof MarketApiEndpoints;

  // Allow environment variable override
  if (process.env.WHALE_API_URL_OVERRIDE) {
    return process.env.WHALE_API_URL_OVERRIDE;
  }

  const config = whaleApiEndpoints[environment];
  if (!config) {
    throw new Error(`Unknown environment: ${environment}`);
  }

  const marketConfig = config[market];
  if (!marketConfig) {
    throw new Error(
      `Unknown market: ${market} for environment: ${environment}`,
    );
  }

  return marketConfig.url;
}

/**
 * Get Whale API timeout based on environment and market
 */
function getWhaleApiTimeout(): number {
  const environment = (process.env.NODE_ENV ||
    'development') as keyof EnvironmentApiConfig;
  const market = (process.env.MARKET || 'TW') as keyof MarketApiEndpoints;

  // Allow environment variable override
  if (process.env.WHALE_API_TIMEOUT) {
    return parseInt(process.env.WHALE_API_TIMEOUT, 10);
  }

  return whaleApiEndpoints[environment]?.[market]?.timeout || 10000;
}

/**
 * Get Whale API retries based on environment and market
 */
function getWhaleApiRetries(): number {
  const environment = (process.env.NODE_ENV ||
    'development') as keyof EnvironmentApiConfig;
  const market = (process.env.MARKET || 'TW') as keyof MarketApiEndpoints;

  // Allow environment variable override
  if (process.env.WHALE_API_RETRIES) {
    return parseInt(process.env.WHALE_API_RETRIES, 10);
  }

  return whaleApiEndpoints[environment]?.[market]?.retries || 3;
}

/**
 * Get Marketing Cloud API URL based on environment and market
 */
function getMarketingCloudApiUrl(): string {
  const environment = (process.env.NODE_ENV ||
    'development') as keyof EnvironmentApiConfig;
  const market = (process.env.MARKET || 'TW') as keyof MarketApiEndpoints;

  // Allow environment variable override
  if (process.env.MARKETING_CLOUD_API_URL_OVERRIDE) {
    return process.env.MARKETING_CLOUD_API_URL_OVERRIDE;
  }

  const config = marketingCloudApiEndpoints[environment];
  if (!config) {
    throw new Error(`Unknown environment: ${environment}`);
  }

  const marketConfig = config[market];
  if (!marketConfig) {
    throw new Error(
      `Unknown market: ${market} for environment: ${environment}`,
    );
  }

  return marketConfig.url;
}

/**
 * Get Marketing Cloud API timeout based on environment and market
 */
function getMarketingCloudApiTimeout(): number {
  const environment = (process.env.NODE_ENV ||
    'development') as keyof EnvironmentApiConfig;
  const market = (process.env.MARKET || 'TW') as keyof MarketApiEndpoints;

  // Allow environment variable override
  if (process.env.MARKETING_CLOUD_API_TIMEOUT) {
    return parseInt(process.env.MARKETING_CLOUD_API_TIMEOUT, 10);
  }

  return marketingCloudApiEndpoints[environment]?.[market]?.timeout || 5000;
}

/**
 * External APIs configuration using NestJS registerAs pattern
 */
export default registerAs(
  'externalApis',
  (): ExternalApisConfig => ({
    whaleApi: {
      development: whaleApiEndpoints.development,
      staging: whaleApiEndpoints.staging,
      production: whaleApiEndpoints.production,
      test: whaleApiEndpoints.test,
    },
    marketingCloudApi: {
      development: marketingCloudApiEndpoints.development,
      staging: marketingCloudApiEndpoints.staging,
      production: marketingCloudApiEndpoints.production,
      test: marketingCloudApiEndpoints.test,
    },
  }),
);

/**
 * Current environment whale API configuration
 */
export const currentWhaleApiConfig = {
  baseUrl: getWhaleApiUrl(),
  timeout: getWhaleApiTimeout(),
  retries: getWhaleApiRetries(),
};

/**
 * Current environment Marketing Cloud API configuration
 */
export const currentMarketingCloudApiConfig = {
  baseUrl: getMarketingCloudApiUrl(),
  timeout: getMarketingCloudApiTimeout(),
  retries: 0, // Transparent proxy - no retries
};

/**
 * Whale Notification API specific configuration
 * Based on requirement clarifications from spec.md
 */
export const whaleNotificationApiConfig = {
  baseUrl: getWhaleApiUrl(),
  timeout: 10000, // 10 seconds as per NFR-001
  retries: 0, // No retry on network errors as per FR-011
  isMockEnabled: () => isMockModeEnabled('WHALE_NOTIFICATION'),
};
