import { registerAs } from '@nestjs/config';

export interface AppConfig {
  port: number;
  environment: string;
  market: string;
  corsEnabled: boolean;
  apiPrefix: string;
  apiVersion: string;
}

/**
 * Application basic configuration
 */
export default registerAs('app', (): AppConfig => ({
  port: process.env.PORT ? parseInt(process.env.PORT, 10) : 3000,
  environment: process.env.NODE_ENV || 'development',
  market: process.env.MARKET || 'TW',
  corsEnabled: process.env.CORS_ENABLED !== 'false', // Default to true
  apiPrefix: process.env.API_PREFIX || 'api',
  apiVersion: process.env.API_VERSION || 'v1',
}));