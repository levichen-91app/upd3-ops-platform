import { registerAs } from '@nestjs/config';

/**
 * NS Report API 配置
 *
 * 提供外部 NS Report API 的連線設定，包括：
 * - 基礎 URL
 * - 請求超時設定
 * - API 版本
 */
export default registerAs('nsReport', () => ({
  baseUrl: process.env.NS_REPORT_API_URL || 'https://api.nsreport.example.com',
  timeout: parseInt(process.env.NS_REPORT_API_TIMEOUT || '30000'), // 30 seconds
  version: 'v3',
  endpoint: '/v3/GetNotificationStatusReport',
}));