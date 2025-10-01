import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../../app.module';
import { MARKETING_CLOUD_SERVICE_TOKEN } from '../interfaces/marketing-cloud.interface';
import { NC_DETAIL_SERVICE_TOKEN } from '../interfaces/nc-detail.interface';
import { ExternalApiException } from '../../../common/exceptions/external-api.exception';
import { ERROR_CODES } from '../../../constants/error-codes.constants';

describe('Devices External API Errors (e2e)', () => {
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

  it('should return 503 when Marketing Cloud API is unavailable', async () => {
    mockMarketingCloudService.getDevices.mockRejectedValue(
      new ExternalApiException(
        ERROR_CODES.UNAVAILABLE,
        'Marketing Cloud API returned status 503',
        {
          '@type': 'type.upd3ops.com/ErrorInfo',
          reason: 'HTTP_ERROR',
          domain: 'marketing-cloud',
          metadata: { httpStatus: 503 },
        },
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

    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('UNAVAILABLE');
  });

  it('should return 503 when Marketing Cloud API returns 500 error', async () => {
    mockMarketingCloudService.getDevices.mockRejectedValue(
      new ExternalApiException(
        ERROR_CODES.UNAVAILABLE,
        'Marketing Cloud API returned status 500',
        {
          '@type': 'type.upd3ops.com/ErrorInfo',
          reason: 'HTTP_ERROR',
          domain: 'marketing-cloud',
          metadata: { httpStatus: 500 },
        },
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

    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('UNAVAILABLE');
  });

  it('should return 504 with timeout error when Marketing Cloud API exceeds 10-second timeout', async () => {
    mockMarketingCloudService.getDevices.mockRejectedValue(
      new ExternalApiException(
        ERROR_CODES.DEADLINE_EXCEEDED,
        'Marketing Cloud API request timed out',
        {
          '@type': 'type.upd3ops.com/ErrorInfo',
          reason: 'TIMEOUT',
          domain: 'marketing-cloud',
          metadata: { timeout: 10000 },
        },
      ),
    );

    const response = await request(app.getHttpServer())
      .get('/api/v1/notification-status/devices')
      .set('ny-operator', 'operations-team')
      .query({
        shopId: '12345',
        phone: '0912345678',
      })
      .expect(504);

    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('DEADLINE_EXCEEDED');
  });

  it('should return 503 when Marketing Cloud API returns invalid JSON', async () => {
    mockMarketingCloudService.getDevices.mockRejectedValue(
      new ExternalApiException(
        ERROR_CODES.UNAVAILABLE,
        'Invalid JSON response',
        {
          '@type': 'type.upd3ops.com/ErrorInfo',
          reason: 'INVALID_RESPONSE',
          domain: 'marketing-cloud',
          metadata: {},
        },
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

    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('UNAVAILABLE');
  });

  it('should return 503 when Marketing Cloud API connection fails', async () => {
    mockMarketingCloudService.getDevices.mockRejectedValue(
      new ExternalApiException(
        ERROR_CODES.UNAVAILABLE,
        'Unable to connect to Marketing Cloud API',
        {
          '@type': 'type.upd3ops.com/ErrorInfo',
          reason: 'CONNECTION_FAILED',
          domain: 'marketing-cloud',
          metadata: {},
        },
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

    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('UNAVAILABLE');
  });

  it('should return 503 when Marketing Cloud API returns 400 bad request', async () => {
    mockMarketingCloudService.getDevices.mockRejectedValue(
      new ExternalApiException(
        ERROR_CODES.UNAVAILABLE,
        'Marketing Cloud API returned status 400',
        {
          '@type': 'type.upd3ops.com/ErrorInfo',
          reason: 'HTTP_ERROR',
          domain: 'marketing-cloud',
          metadata: { httpStatus: 400 },
        },
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

    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('UNAVAILABLE');
  });

  it('should not retry failed requests according to no-retry policy', async () => {
    mockMarketingCloudService.getDevices.mockRejectedValue(
      new ExternalApiException(
        ERROR_CODES.UNAVAILABLE,
        'Marketing Cloud API returned status 500',
        {
          '@type': 'type.upd3ops.com/ErrorInfo',
          reason: 'HTTP_ERROR',
          domain: 'marketing-cloud',
          metadata: { httpStatus: 500 },
        },
      ),
    );

    await request(app.getHttpServer())
      .get('/api/v1/notification-status/devices')
      .set('ny-operator', 'operations-team')
      .query({
        shopId: '12345',
        phone: '0912345678',
      })
      .expect(503);

    // Should only make one request (no retries)
    expect(mockMarketingCloudService.getDevices).toHaveBeenCalledTimes(1);
  });
});
