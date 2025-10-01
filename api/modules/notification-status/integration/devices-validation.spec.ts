import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../../app.module';
import { MARKETING_CLOUD_SERVICE_TOKEN } from '../interfaces/marketing-cloud.interface';
import { NC_DETAIL_SERVICE_TOKEN } from '../interfaces/nc-detail.interface';

describe('Devices Validation (e2e)', () => {
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

  describe('shopId validation', () => {
    it('should return 400 when shopId is missing', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/notification-status/devices')
        .set('ny-operator', 'operations-team')
        .query({
          phone: '0912345678',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_ARGUMENT');
      expect(response.body.error.message).toContain('輸入參數驗證失敗');
    });

    it('should return 400 when shopId is not a number', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/notification-status/devices')
        .set('ny-operator', 'operations-team')
        .query({
          shopId: 'invalid',
          phone: '0912345678',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_ARGUMENT');
    });

    it('should return 400 when shopId is negative', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/notification-status/devices')
        .set('ny-operator', 'operations-team')
        .query({
          shopId: '-1',
          phone: '0912345678',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_ARGUMENT');
    });

    it('should return 400 when shopId is zero', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/notification-status/devices')
        .set('ny-operator', 'operations-team')
        .query({
          shopId: '0',
          phone: '0912345678',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_ARGUMENT');
    });
  });

  describe('phone validation', () => {
    it('should return 400 when phone is missing', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/notification-status/devices')
        .set('ny-operator', 'operations-team')
        .query({
          shopId: '12345',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_ARGUMENT');
      expect(response.body.error.message).toContain('輸入參數驗證失敗');
    });

    it('should return 400 when phone format is invalid', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/notification-status/devices')
        .set('ny-operator', 'operations-team')
        .query({
          shopId: '12345',
          phone: '123',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_ARGUMENT');
      expect(response.body.error.message).toContain('輸入參數驗證失敗');
    });

    it('should return 400 when phone contains invalid characters', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/notification-status/devices')
        .set('ny-operator', 'operations-team')
        .query({
          shopId: '12345',
          phone: '091abc5678',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_ARGUMENT');
    });

    it('should accept valid Taiwan mobile phone numbers', async () => {
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

      const validPhones = [
        '0912345678',
        '0987654321',
        '091-234-5678',
        '+886912345678',
        '(02)12345678',
      ];

      for (const phone of validPhones) {
        await request(app.getHttpServer())
          .get('/api/v1/notification-status/devices')
          .set('ny-operator', 'operations-team')
          .query({
            shopId: '12345',
            phone,
          })
          .expect(200);
      }
    });
  });

  describe('query parameter edge cases', () => {
    it('should return 400 when both parameters are missing', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/notification-status/devices')
        .set('ny-operator', 'operations-team')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_ARGUMENT');
    });

    it('should ignore extra query parameters', async () => {
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
          extra: 'ignored',
          another: 'also-ignored',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should handle URL-encoded query parameters', async () => {
      mockMarketingCloudService.getDevices.mockResolvedValue([]);

      const response = await request(app.getHttpServer())
        .get('/api/v1/notification-status/devices')
        .set('ny-operator', 'operations-team')
        .query({
          shopId: '12345',
          phone: encodeURIComponent('0912345678'),
        })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('input sanitization', () => {
    it('should sanitize shopId input', async () => {
      mockMarketingCloudService.getDevices.mockResolvedValue([]);

      await request(app.getHttpServer())
        .get('/api/v1/notification-status/devices')
        .set('ny-operator', 'operations-team')
        .query({
          shopId: ' 12345 ',
          phone: '0912345678',
        })
        .expect(404);

      expect(mockMarketingCloudService.getDevices).toHaveBeenCalledWith(
        12345,
        '0912345678',
      );
    });

    it('should sanitize phone input', async () => {
      mockMarketingCloudService.getDevices.mockResolvedValue([]);

      await request(app.getHttpServer())
        .get('/api/v1/notification-status/devices')
        .set('ny-operator', 'operations-team')
        .query({
          shopId: '12345',
          phone: ' 0912345678 ',
        })
        .expect(404);

      expect(mockMarketingCloudService.getDevices).toHaveBeenCalledWith(
        12345,
        ' 0912345678 ',
      );
    });
  });
});
