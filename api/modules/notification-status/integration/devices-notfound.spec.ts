import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../../app.module';
import { MARKETING_CLOUD_SERVICE_TOKEN } from '../interfaces/marketing-cloud.interface';
import { NC_DETAIL_SERVICE_TOKEN } from '../interfaces/nc-detail.interface';

describe('Devices Not Found Scenarios (e2e)', () => {
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

  it('should return 404 when Marketing Cloud returns empty array', async () => {
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
        code: 'DEVICE_NOT_FOUND',
        message: '找不到指定客戶的設備',
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

  it('should return 500 when Marketing Cloud API returns 404 not found', async () => {
    // Mock the service to throw an external API error
    mockMarketingCloudService.getDevices.mockImplementation(() => {
      throw new Error(
        'EXTERNAL_API_ERROR: Marketing Cloud API returned status 404',
      );
    });

    const response = await request(app.getHttpServer())
      .get('/api/v1/notification-status/devices')
      .set('ny-operator', 'operations-team')
      .query({
        shopId: '99999',
        phone: '0987654321',
      })
      .expect(500);

    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('EXTERNAL_API_ERROR');
  });

  it('should return 404 for valid but non-existent customer', async () => {
    mockMarketingCloudService.getDevices.mockResolvedValue([]);

    const response = await request(app.getHttpServer())
      .get('/api/v1/notification-status/devices')
      .set('ny-operator', 'operations-team')
      .query({
        shopId: '12345',
        phone: '0999999999',
      })
      .expect(404);

    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('DEVICE_NOT_FOUND');
    expect(response.body.error.details).toMatchObject({
      shopId: 12345,
      phone: '0999999999',
    });
  });

  it('should return 404 for non-existent shop', async () => {
    mockMarketingCloudService.getDevices.mockResolvedValue([]);

    const response = await request(app.getHttpServer())
      .get('/api/v1/notification-status/devices')
      .set('ny-operator', 'operations-team')
      .query({
        shopId: '99999',
        phone: '0912345678',
      })
      .expect(404);

    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('DEVICE_NOT_FOUND');
    expect(response.body.error.details.shopId).toBe(99999);
  });

  it('should include request tracking in 404 responses', async () => {
    mockMarketingCloudService.getDevices.mockResolvedValue([]);

    const response = await request(app.getHttpServer())
      .get('/api/v1/notification-status/devices')
      .set('ny-operator', 'operations-team')
      .query({
        shopId: '99999',
        phone: '0987654321',
      })
      .expect(404);

    expect(response.body.requestId).toBeDefined();
    expect(response.body.requestId).toMatch(
      /^req-\d{14}-[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/,
    );
    expect(response.body.timestamp).toBeDefined();
    expect(new Date(response.body.timestamp)).toBeInstanceOf(Date);
  });

  it('should handle Marketing Cloud null response as not found', async () => {
    mockMarketingCloudService.getDevices.mockResolvedValue(null);

    const response = await request(app.getHttpServer())
      .get('/api/v1/notification-status/devices')
      .set('ny-operator', 'operations-team')
      .query({
        shopId: '12345',
        phone: '0912345678',
      })
      .expect(404);

    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('DEVICE_NOT_FOUND');
  });

  it('should handle Marketing Cloud undefined response as not found', async () => {
    mockMarketingCloudService.getDevices.mockResolvedValue(undefined);

    const response = await request(app.getHttpServer())
      .get('/api/v1/notification-status/devices')
      .set('ny-operator', 'operations-team')
      .query({
        shopId: '12345',
        phone: '0912345678',
      })
      .expect(404);

    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('DEVICE_NOT_FOUND');
  });
});
