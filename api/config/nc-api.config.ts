import { registerAs } from '@nestjs/config';

export interface NcApiConfig {
  baseUrl: string;
  timeout: number;
  retries: number;
}

export default registerAs('ncApi', (): NcApiConfig => ({
  baseUrl: process.env.NC_API_BASE_URL || 'http://nc-api.qa.91dev.tw',
  timeout: parseInt(process.env.NC_API_TIMEOUT || '10000'),
  retries: parseInt(process.env.NC_API_RETRIES || '3'),
}));