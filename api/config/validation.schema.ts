import * as Joi from 'joi';

/**
 * Environment variables validation schema
 * This ensures all required environment variables are present and valid
 */
export const validationSchema = Joi.object({
  // Application Configuration
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test', 'staging')
    .default('development'),
  PORT: Joi.number().port().default(3000),
  MARKET: Joi.string().valid('TW', 'HK', 'MY', 'SG').default('TW'),

  // API Configuration
  API_PREFIX: Joi.string().default('api'),
  API_VERSION: Joi.string().default('v1'),
  CORS_ENABLED: Joi.boolean().default(true),

  // External API Configuration
  WHALE_API_URL_OVERRIDE: Joi.string().uri().optional(),
  WHALE_API_TIMEOUT: Joi.number().integer().min(1000).max(60000).default(10000),
  WHALE_API_RETRIES: Joi.number().integer().min(0).max(10).default(3),

  // Database Configuration (for future use)
  DATABASE_HOST: Joi.string().optional(),
  DATABASE_PORT: Joi.number().port().optional(),
  DATABASE_NAME: Joi.string().optional(),
  DATABASE_USER: Joi.string().optional(),
  DATABASE_PASSWORD: Joi.string().optional(),

  // Security Configuration (for future use)
  JWT_SECRET: Joi.string().optional(),
  JWT_EXPIRES_IN: Joi.string().default('1h'),

  // Logging Configuration
  LOG_LEVEL: Joi.string()
    .valid('error', 'warn', 'info', 'debug', 'verbose')
    .default('info'),
});
