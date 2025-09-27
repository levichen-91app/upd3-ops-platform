import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import * as nock from 'nock';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import externalApisConfig from '../api/config/external-apis.config';
import { MarketingCloudModule } from '../api/modules/marketing-cloud/marketing-cloud.module';

/**
 * E2E Tests for Marketing Cloud API with Nock Mocking
 *
 * 測試目標：模擬真實使用場景的完整系統測試
 * 測試脈絡：
 * - 真實 HTTP 請求使用 Supertest
 * - Mock 外部 Marketing Cloud API 使用 nock
 * - 測試完整的用戶使用流程
 * - 驗證所有錯誤情境
 */

describe('Marketing Cloud E2E Tests (FAILING - TDD)', () => {
  let app: INestApplication;

  const mockDevice = {
    guid: '550e8400-e29b-41d4-a716-446655440000',
    udid: 'A1B2C3D4E5F6',
    token: 'abc123def456...',
    shopId: 12345,
    platformDef: 'iOS',
    memberId: 67890,
    advertiseId: '12345678-1234-5678-9012-123456789012',
    appVersion: '1.2.3',
    updatedDateTime: '2025-09-27T10:30:00.000Z',
    createdDateTime: '2025-09-01T08:15:00.000Z',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        HttpModule,
        ConfigModule.forRoot({
          load: [externalApisConfig],
        }),
        MarketingCloudModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();
  });

  afterAll(async () => {
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

  describe('Successful Scenarios with Nock', () => {
    it('should handle single device response successfully', async () => {
      // Mock successful external API response
      nock('http://marketing-cloud-service.qa.91dev.tw')
        .get('/v1/shops/12345/phones/0912345678/devices')
        .reply(200, [mockDevice]);

      const response = await request(app.getHttpServer())
        .get('/api/v1/shops/12345/members/by-phone/0912345678/devices')
        .set('ny-operator', 'system-admin')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          shopId: 12345,
          phone: '0912345678',
          devices: [
            expect.objectContaining({
              guid: mockDevice.guid,
              shopId: mockDevice.shopId,
              platformDef: mockDevice.platformDef,
            }),
          ],
          totalCount: 1,
        },
        timestamp: expect.any(String),
        requestId: expect.any(String),
      });

      // Test temporarily skipped - module is implemented
    });

    it('should handle multiple devices response', async () => {
      const mockDevices = [
        mockDevice,
        {
          ...mockDevice,
          guid: 'device-2-guid',
          platformDef: 'Android',
          token: 'android-token-456',
        },
      ];

      nock('http://marketing-cloud-service.qa.91dev.tw')
        .get('/v1/shops/12345/phones/0912345678/devices')
        .reply(200, mockDevices);

      const response = await request(app.getHttpServer())
        .get('/api/v1/shops/12345/members/by-phone/0912345678/devices')
        .set('ny-operator', 'system-admin')
        .expect(200);

      expect(response.body.data.totalCount).toBe(2);
      expect(response.body.data.devices).toHaveLength(2);

      // Test temporarily skipped - module is implemented
    });

    it('should handle empty devices array', async () => {
      nock('http://marketing-cloud-service.qa.91dev.tw')
        .get('/v1/shops/12345/phones/0912345678/devices')
        .reply(200, []);

      const response = await request(app.getHttpServer())
        .get('/api/v1/shops/12345/members/by-phone/0912345678/devices')
        .set('ny-operator', 'system-admin')
        .expect(200);

      expect(response.body.data.totalCount).toBe(0);
      expect(response.body.data.devices).toEqual([]);

      // Test temporarily skipped - module is implemented
    });
  });

  describe('Error Scenarios with Nock', () => {
    it('should handle member not found (404) from external API', async () => {
      nock('http://marketing-cloud-service.qa.91dev.tw')
        .get('/v1/shops/12345/phones/0900000000/devices')
        .reply(404);

      const response = await request(app.getHttpServer())
        .get('/api/v1/shops/12345/members/by-phone/0900000000/devices')
        .set('ny-operator', 'system-admin')
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: expect.stringMatching(/MEMBER_NOT_FOUND|NOT_FOUND/),
          message: expect.stringContaining('not found'),
        },
      });

      // Test temporarily skipped - module is implemented
    });

    it('should handle external service timeout and return 502', async () => {
      // Mock timeout scenario - delay > 5 seconds
      nock('http://marketing-cloud-service.qa.91dev.tw')
        .get('/v1/shops/12345/phones/0911111111/devices')
        .delay(6000) // 超過 5 秒超時設定
        .reply(200, []);

      const response = await request(app.getHttpServer())
        .get('/api/v1/shops/12345/members/by-phone/0911111111/devices')
        .set('ny-operator', 'test-operator')
        .expect(502);

      expect(response.body.error.code).toMatch(
        /TIMEOUT|EXTERNAL_SERVICE_TIMEOUT/,
      );
      expect(response.body.error.message).toMatch(/timeout/i);

      // Test temporarily skipped - module is implemented
    });

    it('should handle external service connection error and return 502', async () => {
      // Mock connection refused error
      nock('http://marketing-cloud-service.qa.91dev.tw')
        .get('/v1/shops/12345/phones/0922222222/devices')
        .replyWithError('ECONNREFUSED');

      const response = await request(app.getHttpServer())
        .get('/api/v1/shops/12345/members/by-phone/0922222222/devices')
        .set('ny-operator', 'test-operator')
        .expect(502);

      expect(response.body.error.code).toMatch(
        /UNAVAILABLE|EXTERNAL_SERVICE_UNAVAILABLE/,
      );

      // Test temporarily skipped - module is implemented
    });

    it('should handle external service 500 error', async () => {
      nock('http://marketing-cloud-service.qa.91dev.tw')
        .get('/v1/shops/12345/phones/0933333333/devices')
        .reply(500, { error: 'Internal Server Error' });

      const response = await request(app.getHttpServer())
        .get('/api/v1/shops/12345/members/by-phone/0933333333/devices')
        .set('ny-operator', 'test-operator')
        .expect(502);

      expect(response.body.error.code).toMatch(/EXTERNAL_SERVICE/);

      // Test temporarily skipped - module is implemented
    });
  });

  describe('Concurrent Requests Performance', () => {
    it('should handle concurrent requests < 10 successfully', async () => {
      // Setup multiple nock mocks for concurrent requests
      for (let i = 0; i < 5; i++) {
        nock('http://marketing-cloud-service.qa.91dev.tw')
          .get(`/v1/shops/12345/phones/091234567${i}/devices`)
          .reply(200, [{ ...mockDevice, memberId: 67890 + i }]);
      }

      // Make concurrent requests
      const promises = [];
      for (let i = 0; i < 5; i++) {
        promises.push(
          request(app.getHttpServer())
            .get(`/api/v1/shops/12345/members/by-phone/091234567${i}/devices`)
            .set('ny-operator', 'concurrent-test')
            .expect(200),
        );
      }

      const responses = await Promise.all(promises);

      responses.forEach((response, index) => {
        expect(response.body.success).toBe(true);
        expect(response.body.data.devices[0].memberId).toBe(67890 + index);
      });

      // Test temporarily skipped - module is implemented
    });

    it('should maintain response time within acceptable limits', async () => {
      nock('http://marketing-cloud-service.qa.91dev.tw')
        .get('/v1/shops/12345/phones/0912345678/devices')
        .reply(200, [mockDevice]);

      const startTime = Date.now();

      await request(app.getHttpServer())
        .get('/api/v1/shops/12345/members/by-phone/0912345678/devices')
        .set('ny-operator', 'performance-test')
        .expect(200);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      // 回應時間應該小於 5 秒超時時間（實際應該更快）
      expect(responseTime).toBeLessThan(5000);

      // Test temporarily skipped - module is implemented
    });
  });

  describe('Request ID and Logging Verification', () => {
    it('should generate unique request IDs for different requests', async () => {
      nock('http://marketing-cloud-service.qa.91dev.tw')
        .get('/v1/shops/12345/phones/0912345678/devices')
        .reply(200, [mockDevice])
        .persist(); // 允許多次使用同一個 mock

      const response1 = await request(app.getHttpServer())
        .get('/api/v1/shops/12345/members/by-phone/0912345678/devices')
        .set('ny-operator', 'test1');

      const response2 = await request(app.getHttpServer())
        .get('/api/v1/shops/12345/members/by-phone/0912345678/devices')
        .set('ny-operator', 'test2');

      expect(response1.body.requestId).toBeDefined();
      expect(response2.body.requestId).toBeDefined();
      expect(response1.body.requestId).not.toBe(response2.body.requestId);

      // Clean up persistent mock
      nock.cleanAll();

      // Test temporarily skipped - module is implemented
    });

    it('should include proper timestamp in all responses', async () => {
      nock('http://marketing-cloud-service.qa.91dev.tw')
        .get('/v1/shops/12345/phones/0912345678/devices')
        .reply(200, [mockDevice]);

      const beforeRequest = new Date();

      const response = await request(app.getHttpServer())
        .get('/api/v1/shops/12345/members/by-phone/0912345678/devices')
        .set('ny-operator', 'timestamp-test')
        .expect(200);

      const afterRequest = new Date();
      const responseTimestamp = new Date(response.body.timestamp);

      expect(responseTimestamp.getTime()).toBeGreaterThanOrEqual(
        beforeRequest.getTime(),
      );
      expect(responseTimestamp.getTime()).toBeLessThanOrEqual(
        afterRequest.getTime(),
      );

      // Test temporarily skipped - module is implemented
    });
  });

  describe('Environment Variable Override Testing', () => {
    it('should use custom URL when environment variable is set', async () => {
      // Set environment variable override
      process.env.MARKETING_CLOUD_API_URL_OVERRIDE =
        'http://custom-marketing-cloud.com';

      // Mock the custom URL instead of default
      nock('http://custom-marketing-cloud.com')
        .get('/v1/shops/12345/phones/0912345678/devices')
        .reply(200, [mockDevice]);

      const response = await request(app.getHttpServer())
        .get('/api/v1/shops/12345/members/by-phone/0912345678/devices')
        .set('ny-operator', 'env-override-test')
        .expect(200);

      expect(response.body.success).toBe(true);

      // Cleanup
      delete process.env.MARKETING_CLOUD_API_URL_OVERRIDE;

      // Test temporarily skipped - module is implemented
    });

    it('should use custom timeout when environment variable is set', async () => {
      // Set custom timeout - 2 seconds
      process.env.MARKETING_CLOUD_API_TIMEOUT = '2000';

      // Mock delayed response > 2 seconds but < 5 seconds
      nock('http://marketing-cloud-service.qa.91dev.tw')
        .get('/v1/shops/12345/phones/0912345678/devices')
        .delay(3000)
        .reply(200, [mockDevice]);

      const response = await request(app.getHttpServer())
        .get('/api/v1/shops/12345/members/by-phone/0912345678/devices')
        .set('ny-operator', 'timeout-override-test')
        .expect(502);

      expect(response.body.error.code).toMatch(/TIMEOUT/);

      // Cleanup
      delete process.env.MARKETING_CLOUD_API_TIMEOUT;

      // Test temporarily skipped - module is implemented
    });
  });

  describe('Nock Configuration Validation', () => {
    it('should ensure nock is properly configured for tests', () => {
      // Verify nock is working correctly
      expect(nock).toBeDefined();
      expect(typeof nock.cleanAll).toBe('function');
      expect(typeof nock.isDone).toBe('function');
    });

    it('should handle nock mock cleanup properly', () => {
      // Create a mock
      const scope = nock('http://test-cleanup.com')
        .get('/test')
        .reply(200, { test: 'data' });

      // Verify mock exists
      expect(scope.isDone()).toBe(false);

      // Clean up
      nock.cleanAll();

      // Verify cleanup
      expect(nock.pendingMocks()).toHaveLength(0);
    });
  });
});
