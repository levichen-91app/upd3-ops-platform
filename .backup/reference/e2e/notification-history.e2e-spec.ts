import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import * as nock from 'nock';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import externalApisConfig from '../../api/config/external-apis.config';
import { NotificationHistoryModule } from '../../api/modules/notification-history/notification-history.module';
import { ResponseFormatInterceptor } from '../../api/common/interceptors/response-format.interceptor';
import { HttpExceptionFilter } from '../../api/common/filters/http-exception.filter';
import { APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';

/**
 * E2E Tests for Notification History API with Nock Mocking
 *
 * 測試目標：模擬真實使用場景的完整系統測試
 * 測試脈絡：
 * - 真實 HTTP 請求使用 Supertest 和 app.listen()
 * - Mock 外部 Whale API 使用 nock
 * - 測試完整的用戶使用流程
 * - 驗證所有錯誤情境和成功場景
 * - 支援 Mock 模式和實際 API 調用模式的自動化測試
 *
 * Mock 測試場景：
 * - notificationId 末尾 404: 返回 404 Not Found 錯誤
 * - notificationId 末尾 000: 返回最小資料集
 * - 其他 notificationId: 返回基於 ID 的一致性資料
 */

describe('Notification History E2E Tests (FAILING - TDD)', () => {
  let app: INestApplication;
  let server: any;
  const PORT = 3001; // Use different port to avoid conflicts

  // Base URL for Whale API in test environment
  const WHALE_API_BASE_URL = 'http://whale-api-internal.qa.91dev.tw/admin';

  // Mock data templates
  const mockNotificationHistoryResponse = {
    shopId: 12345,
    notificationId: 67890,
    ncId: 'a4070188-050d-47f7-ab24-2523145408cf',
    bookDateTime: '2024-01-15T10:30:00Z',
    status: 'Success',
    channel: 'Email',
    sentDateTime: '2024-01-15T10:35:00Z',
    isSettled: true,
    originalAudienceCount: 1000,
    sentAudienceCount: 900,
    receivedAudienceCount: 850,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:35:00Z',
  };

  const mockMinimalDataResponse = {
    shopId: 12345,
    notificationId: 111000,
    ncId: 'minimal-nc-id-000',
    bookDateTime: '2024-01-01T00:00:00Z',
    status: 'Scheduled',
    channel: 'Email',
    sentDateTime: null,
    isSettled: false,
    originalAudienceCount: 0,
    sentAudienceCount: 0,
    receivedAudienceCount: 0,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        HttpModule,
        ConfigModule.forRoot({
          load: [externalApisConfig],
          isGlobal: true,
        }),
        NotificationHistoryModule,
      ],
      providers: [
        {
          provide: APP_INTERCEPTOR,
          useClass: ResponseFormatInterceptor,
        },
        {
          provide: APP_FILTER,
          useClass: HttpExceptionFilter,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Configure global validation pipe to match main.ts
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );

    await app.init();

    // Start the HTTP server for real HTTP requests
    server = app.getHttpServer();
    await new Promise<void>((resolve) => {
      server.listen(PORT, resolve);
    });
  });

  afterAll(async () => {
    if (server) {
      await new Promise<void>((resolve) => {
        server.close(resolve);
      });
    }
    await app.close();
  });

  beforeEach(() => {
    // 清理所有 nock mocks
    nock.cleanAll();
  });

  afterEach(() => {
    // 確保所有 mock 都被呼叫
    expect(nock.isDone()).toBe(true);
  });

  describe('Successful Scenarios with Nock Mock', () => {
    it('should return notification history successfully with complete data', async () => {
      // Mock successful Whale API response
      nock(WHALE_API_BASE_URL)
        .get('/api/v1/notifications/67890')
        .reply(200, mockNotificationHistoryResponse);

      const response = await request(`http://localhost:${PORT}`)
        .get('/api/v1/shops/12345/notifications/67890/history')
        .set('ny-operator', 'system-admin')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          shopId: 12345,
          notificationId: 67890,
          ncId: 'a4070188-050d-47f7-ab24-2523145408cf',
          bookDateTime: '2024-01-15T10:30:00Z',
          status: 'Success',
          channel: 'Email',
          sentDateTime: '2024-01-15T10:35:00Z',
          isSettled: true,
          originalAudienceCount: 1000,
          sentAudienceCount: 900,
          receivedAudienceCount: 850,
          createdAt: '2024-01-15T10:00:00Z',
          updatedAt: '2024-01-15T10:35:00Z',
        },
        timestamp: expect.any(String),
        requestId: expect.stringMatching(/^req-\d{14}-[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/),
      });

      // Verify timestamp is valid ISO format
      expect(new Date(response.body.timestamp)).toBeInstanceOf(Date);
    });

    it('should return minimal data for notificationId ending with 000', async () => {
      // Mock minimal data response from Whale API
      nock(WHALE_API_BASE_URL)
        .get('/api/v1/notifications/111000')
        .reply(200, mockMinimalDataResponse);

      const response = await request(`http://localhost:${PORT}`)
        .get('/api/v1/shops/12345/notifications/111000/history')
        .set('ny-operator', 'system-admin')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          shopId: 12345,
          notificationId: 111000,
          ncId: 'minimal-nc-id-000',
          bookDateTime: '2024-01-01T00:00:00Z',
          status: 'Scheduled',
          channel: 'Email',
          sentDateTime: null,
          isSettled: false,
          originalAudienceCount: 0,
          sentAudienceCount: 0,
          receivedAudienceCount: 0,
        },
        timestamp: expect.any(String),
        requestId: expect.stringMatching(/^req-\d{14}-[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/),
      });
    });

    it('should handle different shopId values correctly', async () => {
      const customResponse = { ...mockNotificationHistoryResponse, shopId: 99999 };

      nock(WHALE_API_BASE_URL)
        .get('/api/v1/notifications/55555')
        .reply(200, customResponse);

      const response = await request(`http://localhost:${PORT}`)
        .get('/api/v1/shops/99999/notifications/55555/history')
        .set('ny-operator', 'test-user')
        .expect(200);

      expect(response.body.data.shopId).toBe(99999);
      expect(response.body.data.notificationId).toBe(55555);
    });

    it('should handle different status types', async () => {
      const statusTestCases = ['Scheduled', 'Booked', 'Sent', 'Error', 'Fail', 'PartialFail', 'NoUser'];

      for (const status of statusTestCases) {
        const notificationId = 10000 + statusTestCases.indexOf(status);
        const customResponse = { ...mockNotificationHistoryResponse, notificationId, status };

        nock(WHALE_API_BASE_URL)
          .get(`/api/v1/notifications/${notificationId}`)
          .reply(200, customResponse);

        const response = await request(`http://localhost:${PORT}`)
          .get(`/api/v1/shops/12345/notifications/${notificationId}/history`)
          .set('ny-operator', 'system-admin')
          .expect(200);

        expect(response.body.data.status).toBe(status);
      }
    });
  });

  describe('Error Scenarios with Nock Mock', () => {
    it('should return 404 when notificationId ends with 404', async () => {
      // Mock 404 response from Whale API
      nock(WHALE_API_BASE_URL)
        .get('/api/v1/notifications/999404')
        .reply(404, { error: 'Notification not found' });

      const response = await request(`http://localhost:${PORT}`)
        .get('/api/v1/shops/12345/notifications/999404/history')
        .set('ny-operator', 'system-admin')
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'NOTIFICATION_NOT_FOUND',
          message: expect.stringContaining('找不到指定的通知記錄'),
          details: {
            notificationId: 999404,
            shopId: 12345,
            whale_api_status: 404,
          },
        },
        timestamp: expect.any(String),
        requestId: expect.stringMatching(/^req-\d{14}-[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/),
      });
    });

    it('should return 400 for invalid shopId', async () => {
      const response = await request(`http://localhost:${PORT}`)
        .get('/api/v1/shops/-1/notifications/67890/history')
        .set('ny-operator', 'system-admin')
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: expect.stringContaining('商店 ID 必須為正整數'),
          details: expect.objectContaining({
            field: 'shopId',
          }),
        },
        timestamp: expect.any(String),
        requestId: expect.stringMatching(/^req-\d{14}-[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/),
      });
    });

    it('should return 400 for invalid notificationId', async () => {
      const response = await request(`http://localhost:${PORT}`)
        .get('/api/v1/shops/12345/notifications/invalid/history')
        .set('ny-operator', 'system-admin')
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: expect.stringContaining('通知 ID 必須為正整數'),
          details: expect.objectContaining({
            field: 'notificationId',
          }),
        },
        timestamp: expect.any(String),
        requestId: expect.stringMatching(/^req-\d{14}-[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/),
      });
    });

    it('should return 401 when ny-operator header is missing', async () => {
      const response = await request(`http://localhost:${PORT}`)
        .get('/api/v1/shops/12345/notifications/67890/history')
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'UNAUTHORIZED_ACCESS',
          message: expect.stringContaining('ny-operator'),
          details: {
            required_header: 'ny-operator',
            provided: null,
          },
        },
        timestamp: expect.any(String),
        requestId: expect.stringMatching(/^req-\d{14}-[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/),
      });
    });

    it('should return 401 when ny-operator header is empty', async () => {
      const response = await request(`http://localhost:${PORT}`)
        .get('/api/v1/shops/12345/notifications/67890/history')
        .set('ny-operator', '')
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'UNAUTHORIZED_ACCESS',
          message: expect.stringContaining('不能為空'),
          details: {
            required_header: 'ny-operator',
            provided: '',
          },
        },
        timestamp: expect.any(String),
        requestId: expect.stringMatching(/^req-\d{14}-[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/),
      });
    });

    it('should return 502 when Whale API is unreachable (timeout)', async () => {
      // Mock timeout scenario
      nock(WHALE_API_BASE_URL)
        .get('/api/v1/notifications/12345')
        .delayConnection(11000) // Delay longer than timeout
        .reply(200, {});

      const response = await request(`http://localhost:${PORT}`)
        .get('/api/v1/shops/12345/notifications/12345/history')
        .set('ny-operator', 'system-admin')
        .expect(502);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'WHALE_API_UNAVAILABLE',
          message: expect.stringContaining('外部 Whale API 服務暫時無法存取'),
          details: {
            service: 'whale-notification-api',
            error_type: 'timeout',
            timeout: 10000,
            retry_count: expect.any(Number),
          },
        },
        timestamp: expect.any(String),
        requestId: expect.stringMatching(/^req-\d{14}-[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/),
      });
    });

    it('should return 502 when Whale API returns server error', async () => {
      // Mock 500 response from Whale API
      nock(WHALE_API_BASE_URL)
        .get('/api/v1/notifications/12345')
        .reply(500, { error: 'Internal Server Error' });

      const response = await request(`http://localhost:${PORT}`)
        .get('/api/v1/shops/12345/notifications/12345/history')
        .set('ny-operator', 'system-admin')
        .expect(502);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'WHALE_API_ERROR',
          message: expect.stringContaining('Whale API 伺服器發生錯誤'),
          details: {
            service: 'whale-notification-api',
            whale_api_status: 500,
            whale_api_message: expect.any(String),
          },
        },
        timestamp: expect.any(String),
        requestId: expect.stringMatching(/^req-\d{14}-[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/),
      });
    });

    it('should handle connection refused error', async () => {
      // Mock connection refused
      nock(WHALE_API_BASE_URL)
        .get('/api/v1/notifications/12345')
        .replyWithError({ code: 'ECONNREFUSED', message: 'Connection refused' });

      const response = await request(`http://localhost:${PORT}`)
        .get('/api/v1/shops/12345/notifications/12345/history')
        .set('ny-operator', 'system-admin')
        .expect(502);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'WHALE_API_UNAVAILABLE',
          message: expect.stringContaining('無法連線到 Whale API 服務'),
          details: {
            service: 'whale-notification-api',
            error_type: 'connection_refused',
            base_url: expect.stringContaining('whale-api-internal'),
          },
        },
        timestamp: expect.any(String),
        requestId: expect.stringMatching(/^req-\d{14}-[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/),
      });
    });
  });

  describe('Mock Mode vs Real API Mode Tests', () => {
    it('should detect mock mode when WHALE_NOTIFICATION_MOCK_MODE is true', async () => {
      // Set environment variable for mock mode
      const originalEnv = process.env.WHALE_NOTIFICATION_MOCK_MODE;
      process.env.WHALE_NOTIFICATION_MOCK_MODE = 'true';

      // In mock mode, no nock setup needed as it uses internal mocks
      const response = await request(`http://localhost:${PORT}`)
        .get('/api/v1/shops/12345/notifications/67890/history')
        .set('ny-operator', 'system-admin')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('ncId');
      expect(response.body.data).toHaveProperty('bookDateTime');

      // Restore environment
      process.env.WHALE_NOTIFICATION_MOCK_MODE = originalEnv;
    });

    it('should detect global mock mode when MOCK_MODE is true', async () => {
      // Set global mock mode
      const originalEnv = process.env.MOCK_MODE;
      process.env.MOCK_MODE = 'true';

      const response = await request(`http://localhost:${PORT}`)
        .get('/api/v1/shops/12345/notifications/67890/history')
        .set('ny-operator', 'system-admin')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('ncId');
      expect(response.body.data).toHaveProperty('bookDateTime');

      // Restore environment
      process.env.MOCK_MODE = originalEnv;
    });
  });

  describe('Application Startup and HTTP Server Tests', () => {
    it('should start the application and HTTP server successfully', async () => {
      // Test that server is listening on the expected port
      const response = await request(`http://localhost:${PORT}`)
        .get('/api/v1/shops/12345/notifications/67890/history')
        .set('ny-operator', 'system-admin');

      // We expect this to fail with 500 since no implementation yet, but server should respond
      expect([200, 400, 401, 404, 500, 502]).toContain(response.status);
    });

    it('should handle CORS headers correctly', async () => {
      nock(WHALE_API_BASE_URL)
        .get('/api/v1/notifications/67890')
        .reply(200, mockNotificationHistoryResponse);

      const response = await request(`http://localhost:${PORT}`)
        .options('/api/v1/shops/12345/notifications/67890/history')
        .set('Origin', 'http://localhost:3000')
        .set('Access-Control-Request-Method', 'GET')
        .set('Access-Control-Request-Headers', 'ny-operator');

      expect(response.headers['access-control-allow-origin']).toBeDefined();
      expect(response.headers['access-control-allow-methods']).toContain('GET');
      expect(response.headers['access-control-allow-headers']).toContain('ny-operator');
    });

    it('should validate request parameters through the complete stack', async () => {
      // Test validation pipeline with invalid parameters
      const response = await request(`http://localhost:${PORT}`)
        .get('/api/v1/shops/0/notifications/0/history')
        .set('ny-operator', 'system-admin')
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: expect.any(String),
        },
      });
    });
  });

  describe('Request ID Generation and Tracking', () => {
    it('should generate unique request IDs for concurrent requests', async () => {
      const responses = await Promise.all([
        // Setup multiple nock mocks for concurrent requests
        ...Array.from({ length: 5 }, (_, i) => {
          const notificationId = 70000 + i;
          nock(WHALE_API_BASE_URL)
            .get(`/api/v1/notifications/${notificationId}`)
            .reply(200, { ...mockNotificationHistoryResponse, notificationId });

          return request(`http://localhost:${PORT}`)
            .get(`/api/v1/shops/12345/notifications/${notificationId}/history`)
            .set('ny-operator', 'system-admin');
        }),
      ]);

      const requestIds = responses.map(res => res.body.requestId);
      const uniqueRequestIds = [...new Set(requestIds)];

      expect(uniqueRequestIds).toHaveLength(requestIds.length);
      requestIds.forEach(id => {
        expect(id).toMatch(/^req-\d{14}-[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/);
      });
    });
  });

  describe('Performance and Timing Tests', () => {
    it('should handle requests within acceptable time limits', async () => {
      nock(WHALE_API_BASE_URL)
        .get('/api/v1/notifications/67890')
        .reply(200, mockNotificationHistoryResponse);

      const startTime = Date.now();

      await request(`http://localhost:${PORT}`)
        .get('/api/v1/shops/12345/notifications/67890/history')
        .set('ny-operator', 'system-admin')
        .expect(200);

      const duration = Date.now() - startTime;

      // Should complete well within timeout (10s), expect under 1s for local test
      expect(duration).toBeLessThan(1000);
    });

    it('should respect timeout configuration from external APIs config', async () => {
      // Mock a slow response that should timeout
      nock(WHALE_API_BASE_URL)
        .get('/api/v1/notifications/67890')
        .delay(11000) // Longer than 10s timeout
        .reply(200, mockNotificationHistoryResponse);

      const startTime = Date.now();

      const response = await request(`http://localhost:${PORT}`)
        .get('/api/v1/shops/12345/notifications/67890/history')
        .set('ny-operator', 'system-admin')
        .expect(502);

      const duration = Date.now() - startTime;

      expect(response.body.error.code).toBe('WHALE_API_UNAVAILABLE');
      expect(response.body.error.details.timeout).toBe(10000);
      // Should timeout around 10s, allow some margin
      expect(duration).toBeGreaterThan(9000);
      expect(duration).toBeLessThan(12000);
    });
  });
});