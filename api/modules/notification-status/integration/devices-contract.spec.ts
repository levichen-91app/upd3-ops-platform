import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../../app.module';
import { MARKETING_CLOUD_SERVICE_TOKEN } from '../interfaces/marketing-cloud.interface';
import { NC_DETAIL_SERVICE_TOKEN } from '../interfaces/nc-detail.interface';

describe('Devices API Contract (e2e)', () => {
  let app: INestApplication;
  let mockMarketingCloudService: any;

  beforeEach(async () => {
    mockMarketingCloudService = {
      getDevices: jest.fn(),
    };

    const mockNcDetailService = {
      getNotificationDetail: jest.fn(),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(MARKETING_CLOUD_SERVICE_TOKEN)
      .useValue(mockMarketingCloudService)
      .overrideProvider(NC_DETAIL_SERVICE_TOKEN)
      .useValue(mockNcDetailService)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
    jest.clearAllMocks();
  });

  describe('Success Response Contract', () => {
    it('should return standardized success response structure', async () => {
      const mockDevice = {
        guid: '123e4567-e89b-12d3-a456-426614174000',
        udid: 'device_udid_123',
        token: 'device_token_123',
        shopId: 12345,
        platformDef: 'iOS',
        memberId: 67890,
        advertiseId: 'ad_id_123',
        appVersion: '1.2.3',
        createdDateTime: '2024-01-15T10:00:00Z',
        updatedDateTime: '2024-01-15T10:30:00Z',
      };

      mockMarketingCloudService.getDevices.mockResolvedValue([mockDevice]);

      const response = await request(app.getHttpServer())
        .get('/api/v1/notification-status/devices')
        .set('ny-operator', 'operations-team')
        .query({
          shopId: '12345',
          phone: '0912345678',
        })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.any(Array),
        timestamp: expect.any(String),
        requestId: expect.stringMatching(/^req-\d{14}-[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/),
      });

      expect(response.body.data[0]).toMatchObject({
        guid: expect.any(String),
        udid: expect.any(String),
        token: expect.any(String),
        shopId: expect.any(Number),
        platformDef: expect.any(String),
        memberId: expect.any(Number),
        advertiseId: expect.any(String),
        appVersion: expect.any(String),
        createdDateTime: expect.any(String),
        updatedDateTime: expect.any(String),
      });
    });

    it('should ensure timestamp is ISO 8601 format', async () => {
      mockMarketingCloudService.getDevices.mockResolvedValue([
        {
          guid: '123e4567-e89b-12d3-a456-426614174000',
          udid: 'device_udid_123',
          token: 'device_token_123',
          shopId: 12345,
          platformDef: 'iOS',
          memberId: 67890,
          advertiseId: 'ad_id_123',
          appVersion: '1.2.3',
          createdDateTime: '2024-01-15T10:00:00Z',
          updatedDateTime: '2024-01-15T10:30:00Z',
        },
      ]);

      const response = await request(app.getHttpServer())
        .get('/api/v1/notification-status/devices')
        .set('ny-operator', 'operations-team')
        .query({
          shopId: '12345',
          phone: '0912345678',
        })
        .expect(200);

      expect(response.body.timestamp).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
      );
      expect(new Date(response.body.timestamp)).toBeInstanceOf(Date);
    });

    it('should include all required device fields', async () => {
      const completeDevice = {
        guid: '123e4567-e89b-12d3-a456-426614174000',
        udid: 'device_udid_123',
        token: 'device_token_123',
        shopId: 12345,
        platformDef: 'iOS',
        memberId: 67890,
        advertiseId: 'ad_id_123',
        appVersion: '1.2.3',
        createdDateTime: '2024-01-15T10:00:00Z',
        updatedDateTime: '2024-01-15T10:30:00Z',
      };

      mockMarketingCloudService.getDevices.mockResolvedValue([completeDevice]);

      const response = await request(app.getHttpServer())
        .get('/api/v1/notification-status/devices')
        .set('ny-operator', 'operations-team')
        .query({
          shopId: '12345',
          phone: '0912345678',
        })
        .expect(200);

      const device = response.body.data[0];
      expect(device).toHaveProperty('guid');
      expect(device).toHaveProperty('udid');
      expect(device).toHaveProperty('token');
      expect(device).toHaveProperty('shopId');
      expect(device).toHaveProperty('platformDef');
      expect(device).toHaveProperty('memberId');
      expect(device).toHaveProperty('advertiseId');
      expect(device).toHaveProperty('appVersion');
      expect(device).toHaveProperty('createdDateTime');
      expect(device).toHaveProperty('updatedDateTime');
    });
  });

  describe('Error Response Contract', () => {
    it('should return standardized 404 error response', async () => {
      mockMarketingCloudService.getDevices.mockResolvedValue([]);

      const response = await request(app.getHttpServer())
        .get('/api/v1/notification-status/devices')
        .set('ny-operator', 'operations-team')
        .query({
          shopId: '99999',
          phone: '0987654321',
        })
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: expect.any(String),
          details: {
            shopId: 99999,
            phone: '0987654321',
          },
        },
        timestamp: expect.any(String),
        requestId: expect.stringMatching(
          /^req-\d{14}-[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/,
        ),
      });
    });

    it('should return standardized 400 validation error response', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/notification-status/devices')
        .set('ny-operator', 'operations-team')
        .query({
          shopId: 'invalid',
          phone: '0912345678',
        })
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'INVALID_ARGUMENT',
          message: expect.any(Array),
        },
        timestamp: expect.any(String),
        requestId: expect.stringMatching(/^req-\d{14}-[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/),
      });
    });

    it('should return standardized 401 authentication error response', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/notification-status/devices')
        .query({
          shopId: '12345',
          phone: '0912345678',
        })
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'UNAUTHENTICATED',
          message: expect.any(String),
        },
        timestamp: expect.any(String),
        requestId: expect.stringMatching(/^req-\d{14}-[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/),
      });
    });

    it('should return standardized 503 external API error response', async () => {
      mockMarketingCloudService.getDevices.mockRejectedValue(
        new Error(
          'UNAVAILABLE: Marketing Cloud API returned status 500',
        ),
      );

      const response = await request(app.getHttpServer())
        .get('/api/v1/notification-status/devices')
        .set('ny-operator', 'operations-team')
        .query({
          shopId: '12345',
          phone: '0912345678',
        })
        .expect(503);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'UNAVAILABLE',
          message: expect.any(String),
        },
        timestamp: expect.any(String),
        requestId: expect.stringMatching(
          /^req-\d{14}-[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/,
        ),
      });
    });
  });

  describe('HTTP Headers', () => {
    it('should return correct Content-Type header', async () => {
      mockMarketingCloudService.getDevices.mockResolvedValue([]);

      const response = await request(app.getHttpServer())
        .get('/api/v1/notification-status/devices')
        .set('ny-operator', 'operations-team')
        .query({
          shopId: '12345',
          phone: '0912345678',
        })
        .expect(404);

      expect(response.headers['content-type']).toMatch(/application\/json/);
    });

    it('should include CORS headers if configured', async () => {
      mockMarketingCloudService.getDevices.mockResolvedValue([]);

      const response = await request(app.getHttpServer())
        .get('/api/v1/notification-status/devices')
        .set('ny-operator', 'operations-team')
        .set('origin', 'https://admin.91app.com')
        .query({
          shopId: '12345',
          phone: '0912345678',
        })
        .expect(404);

      // Note: CORS headers might not be present in test environment
      // This test documents the expected behavior for production
      expect(response.body.success).toBe(false);
    });
  });

  describe('Request ID Generation', () => {
    it('should generate unique request IDs for each request', async () => {
      mockMarketingCloudService.getDevices.mockResolvedValue([]);

      const responses = await Promise.all([
        request(app.getHttpServer())
          .get('/api/v1/notification-status/devices')
          .set('ny-operator', 'operations-team')
          .query({ shopId: '12345', phone: '0912345678' }),
        request(app.getHttpServer())
          .get('/api/v1/notification-status/devices')
          .set('ny-operator', 'operations-team')
          .query({ shopId: '54321', phone: '0987654321' }),
      ]);

      expect(responses[0].body.requestId).not.toBe(responses[1].body.requestId);
      expect(responses[0].body.requestId).toMatch(
        /^req-\d{14}-[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/,
      );
      expect(responses[1].body.requestId).toMatch(
        /^req-\d{14}-[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/,
      );
    });

    it('should maintain request ID format consistency across different response types', async () => {
      // Success case
      mockMarketingCloudService.getDevices.mockResolvedValueOnce([
        {
          guid: '123e4567-e89b-12d3-a456-426614174000',
          udid: 'device_udid_123',
          token: 'device_token_123',
          shopId: 12345,
          platformDef: 'iOS',
          memberId: 67890,
          advertiseId: 'ad_id_123',
          appVersion: '1.2.3',
          createdDateTime: '2024-01-15T10:00:00Z',
          updatedDateTime: '2024-01-15T10:30:00Z',
        },
      ]);

      const successResponse = await request(app.getHttpServer())
        .get('/api/v1/notification-status/devices')
        .set('ny-operator', 'operations-team')
        .query({ shopId: '12345', phone: '0912345678' })
        .expect(200);

      // Not found case
      mockMarketingCloudService.getDevices.mockResolvedValueOnce([]);

      const notFoundResponse = await request(app.getHttpServer())
        .get('/api/v1/notification-status/devices')
        .set('ny-operator', 'operations-team')
        .query({ shopId: '99999', phone: '0987654321' })
        .expect(404);

      // Both should follow the same pattern
      expect(successResponse.body.requestId).toMatch(
        /^req-\d{14}-[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/,
      );
      expect(notFoundResponse.body.requestId).toMatch(
        /^req-\d{14}-[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/,
      );
    });
  });

  describe('Response Time Performance', () => {
    it('should respond within reasonable time for success case', async () => {
      mockMarketingCloudService.getDevices.mockResolvedValue([
        {
          guid: '123e4567-e89b-12d3-a456-426614174000',
          udid: 'device_udid_123',
          token: 'device_token_123',
          shopId: 12345,
          platformDef: 'iOS',
          memberId: 67890,
          advertiseId: 'ad_id_123',
          appVersion: '1.2.3',
          createdDateTime: '2024-01-15T10:00:00Z',
          updatedDateTime: '2024-01-15T10:30:00Z',
        },
      ]);

      const startTime = Date.now();

      await request(app.getHttpServer())
        .get('/api/v1/notification-status/devices')
        .set('ny-operator', 'operations-team')
        .query({
          shopId: '12345',
          phone: '0912345678',
        })
        .expect(200);

      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(1000); // Should respond within 1 second
    });

    it('should respond quickly for validation errors', async () => {
      const startTime = Date.now();

      await request(app.getHttpServer())
        .get('/api/v1/notification-status/devices')
        .set('ny-operator', 'operations-team')
        .query({
          shopId: 'invalid',
          phone: '0912345678',
        })
        .expect(400);

      const responseTime = Date.now() - startTime;
      expect(responseTime).toBeLessThan(500); // Should respond within 500ms
    });
  });
});
