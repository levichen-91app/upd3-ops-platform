import { registerAs } from '@nestjs/config';

export default registerAs('whaleApi', () => ({
  baseUrl:
    process.env.WHALE_API_BASE_URL || 'http://whale-api-internal.qa.91dev.tw',
  timeout: parseInt(process.env.WHALE_API_TIMEOUT || '10000'),
}));
