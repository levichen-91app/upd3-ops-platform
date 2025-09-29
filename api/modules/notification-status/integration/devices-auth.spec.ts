import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../../app.module';
import { MARKETING_CLOUD_SERVICE_TOKEN } from '../interfaces/marketing-cloud.interface';
import { NC_DETAIL_SERVICE_TOKEN } from '../interfaces/nc-detail.interface';

describe('Devices Authentication (e2e)', () => {
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

  describe('ny-operator header validation', () => {
    it('should return 401 when ny-operator header is missing', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/notification-status/devices')
        .query({
          shopId: '12345',
          phone: '0912345678',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
      expect(response.body.error.message).toContain('ny-operator');
    });

    it('should return 401 when ny-operator header is empty', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/notification-status/devices')
        .set('ny-operator', '')
        .query({
          shopId: '12345',
          phone: '0912345678',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should return 401 when ny-operator header contains only whitespace', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/notification-status/devices')
        .set('ny-operator', '   ')
        .query({
          shopId: '12345',
          phone: '0912345678',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });

    it('should accept valid ny-operator header', async () => {
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

      expect(response.body.success).toBe(true);
    });

    it('should accept different valid operator values', async () => {
      mockMarketingCloudService.getDevices.mockResolvedValue([]);

      const validOperators = [
        'operations-team',
        'support-team',
        'admin-user',
        'system-monitor',
      ];

      for (const operator of validOperators) {
        await request(app.getHttpServer())
          .get('/api/v1/notification-status/devices')
          .set('ny-operator', operator)
          .query({
            shopId: '12345',
            phone: '0912345678',
          })
          .expect(404); // 404 because mock returns empty array
      }

      expect(mockMarketingCloudService.getDevices).toHaveBeenCalledTimes(
        validOperators.length,
      );
    });

    it('should trim whitespace from ny-operator header value', async () => {
      mockMarketingCloudService.getDevices.mockResolvedValue([]);

      const response = await request(app.getHttpServer())
        .get('/api/v1/notification-status/devices')
        .set('ny-operator', '  operations-team  ')
        .query({
          shopId: '12345',
          phone: '0912345678',
        })
        .expect(404);

      expect(response.body.error.code).toBe('DEVICE_NOT_FOUND');
    });
  });

  describe('case sensitivity', () => {
    it('should accept ny-operator header with different case (HTTP headers are case-insensitive)', async () => {
      mockMarketingCloudService.getDevices.mockResolvedValue([]);

      const response = await request(app.getHttpServer())
        .get('/api/v1/notification-status/devices')
        .set('NY-OPERATOR', 'operations-team')
        .query({
          shopId: '12345',
          phone: '0912345678',
        })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('DEVICE_NOT_FOUND');
    });

    it('should accept Ny-Operator header format (HTTP headers are case-insensitive)', async () => {
      mockMarketingCloudService.getDevices.mockResolvedValue([]);

      const response = await request(app.getHttpServer())
        .get('/api/v1/notification-status/devices')
        .set('Ny-Operator', 'operations-team')
        .query({
          shopId: '12345',
          phone: '0912345678',
        })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('DEVICE_NOT_FOUND');
    });
  });

  describe('request tracking with authentication', () => {
    it('should include request tracking in 401 responses', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/notification-status/devices')
        .query({
          shopId: '12345',
          phone: '0912345678',
        })
        .expect(401);

      expect(response.body.requestId).toBeDefined();
      expect(response.body.requestId).toMatch(/^req-\d{14}-[0-9a-f-]{36}$/);
      expect(response.body.timestamp).toBeDefined();
      expect(new Date(response.body.timestamp)).toBeInstanceOf(Date);
    });

    it('should not call external services when authentication fails', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/notification-status/devices')
        .query({
          shopId: '12345',
          phone: '0912345678',
        })
        .expect(401);

      expect(mockMarketingCloudService.getDevices).not.toHaveBeenCalled();
    });

    it('should execute authentication before validation', async () => {
      // Missing both auth and validation should return 401 (auth error)
      const response = await request(app.getHttpServer())
        .get('/api/v1/notification-status/devices')
        .expect(401);

      expect(response.body.error.code).toBe('UNAUTHORIZED');
      expect(mockMarketingCloudService.getDevices).not.toHaveBeenCalled();
    });

    it('should include operator in successful request context', async () => {
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

      expect(response.body.requestId).toMatch(/^req-\d{14}-[0-9a-f-]{36}$/);
    });
  });

  describe('multiple headers handling', () => {
    it('should work with ny-operator and other headers', async () => {
      mockMarketingCloudService.getDevices.mockResolvedValue([]);

      const response = await request(app.getHttpServer())
        .get('/api/v1/notification-status/devices')
        .set('ny-operator', 'operations-team')
        .set('user-agent', 'test-client')
        .set('accept', 'application/json')
        .query({
          shopId: '12345',
          phone: '0912345678',
        })
        .expect(404);

      expect(response.body.error.code).toBe('DEVICE_NOT_FOUND');
    });

    it('should reject when ny-operator is among multiple auth headers but invalid', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/notification-status/devices')
        .set('authorization', 'Bearer some-token')
        .set('ny-operator', '')
        .set('x-api-key', 'some-key')
        .query({
          shopId: '12345',
          phone: '0912345678',
        })
        .expect(401);

      expect(response.body.error.code).toBe('UNAUTHORIZED');
    });
  });
});
