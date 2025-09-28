import { registerAs } from '@nestjs/config';

export interface MarketingCloudConfig {
  baseUrl: string;
  timeout: number;
  retries: number;
}

export default registerAs(
  'marketingCloud',
  (): MarketingCloudConfig => ({
    baseUrl:
      process.env.MARKETING_CLOUD_BASE_URL || 'https://api.marketing-cloud.com',
    timeout: parseInt(process.env.MARKETING_CLOUD_TIMEOUT || '10000'),
    retries: parseInt(process.env.MARKETING_CLOUD_RETRIES || '0'),
  }),
);
