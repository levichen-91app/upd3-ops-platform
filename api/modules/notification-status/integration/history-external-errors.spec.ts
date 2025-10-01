import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../../app.module';
import { WHALE_API_SERVICE_TOKEN } from '../interfaces/whale-api.interface';
import { ExternalApiException } from '../../../common/exceptions/external-api.exception';
import { ERROR_CODES } from '../../../constants/error-codes.constants';

describe('Notification History External API Error Tests', () => {
  let app: INestApplication;
  let mockWhaleApiService: any;

  beforeEach(async () => {
    mockWhaleApiService = {
      getNotificationHistory: jest.fn(),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(WHALE_API_SERVICE_TOKEN)
      .useValue(mockWhaleApiService)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('should return 503 when Whale API is unavailable', async () => {
    const notificationId = 12345;
    mockWhaleApiService.getNotificationHistory.mockRejectedValue(
      new ExternalApiException(
        ERROR_CODES.UNAVAILABLE,
        'Connection refused',
        {
          '@type': 'type.upd3ops.com/ErrorInfo',
          reason: 'CONNECTION_FAILED',
          domain: 'whale-api',
          metadata: {},
        },
      ),
    );

    const response = await request(app.getHttpServer())
      .get(`/api/v1/notification-status/history/${notificationId}`)
      .set('ny-operator', 'operations-team')
      .expect(503);

    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('UNAVAILABLE');
    expect(response.body.error.message).toBeDefined();
    expect(response.body.error.details).toHaveLength(1);
    expect(response.body.error.details[0]).toMatchObject({
      '@type': 'type.upd3ops.com/ErrorInfo',
      reason: 'CONNECTION_FAILED',
      domain: 'whale-api',
    });
    expect(response.body.requestId).toMatch(/^req-\d{14}-[0-9a-f-]{36}/);
  });

  it('should return 504 when Whale API times out', async () => {
    const notificationId = 12345;
    mockWhaleApiService.getNotificationHistory.mockRejectedValue(
      new ExternalApiException(
        ERROR_CODES.DEADLINE_EXCEEDED,
        'Request took longer than 10000ms',
        {
          '@type': 'type.upd3ops.com/ErrorInfo',
          reason: 'TIMEOUT',
          domain: 'whale-api',
          metadata: { timeout: 10000 },
        },
      ),
    );

    const response = await request(app.getHttpServer())
      .get(`/api/v1/notification-status/history/${notificationId}`)
      .set('ny-operator', 'operations-team')
      .expect(504);

    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('DEADLINE_EXCEEDED');
    expect(response.body.error.message).toBeDefined();
    expect(response.body.error.details).toHaveLength(1);
    expect(response.body.error.details[0]).toMatchObject({
      '@type': 'type.upd3ops.com/ErrorInfo',
      reason: 'TIMEOUT',
      domain: 'whale-api',
      metadata: expect.objectContaining({ timeout: 10000 }),
    });
  });

  it('should return 503 when Whale API returns HTTP error status', async () => {
    const notificationId = 12345;
    mockWhaleApiService.getNotificationHistory.mockRejectedValue(
      new ExternalApiException(
        ERROR_CODES.UNAVAILABLE,
        'HTTP Error 500: Internal Server Error',
        {
          '@type': 'type.upd3ops.com/ErrorInfo',
          reason: 'HTTP_ERROR',
          domain: 'whale-api',
          metadata: { httpStatus: 500 },
        },
      ),
    );

    const response = await request(app.getHttpServer())
      .get(`/api/v1/notification-status/history/${notificationId}`)
      .set('ny-operator', 'operations-team')
      .expect(503);

    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('UNAVAILABLE');
    expect(response.body.error.details).toHaveLength(1);
    expect(response.body.error.details[0]).toMatchObject({
      '@type': 'type.upd3ops.com/ErrorInfo',
      reason: 'HTTP_ERROR',
      domain: 'whale-api',
      metadata: expect.objectContaining({ httpStatus: 500 }),
    });
  });

  it('should return 503 for network connection errors', async () => {
    const notificationId = 12345;
    mockWhaleApiService.getNotificationHistory.mockRejectedValue(
      new ExternalApiException(
        ERROR_CODES.UNAVAILABLE,
        'getaddrinfo ENOTFOUND whale-api.example.com',
        {
          '@type': 'type.upd3ops.com/ErrorInfo',
          reason: 'CONNECTION_FAILED',
          domain: 'whale-api',
          metadata: {},
        },
      ),
    );

    const response = await request(app.getHttpServer())
      .get(`/api/v1/notification-status/history/${notificationId}`)
      .set('ny-operator', 'operations-team')
      .expect(503);

    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('UNAVAILABLE');
    expect(response.body.error.message).toBeDefined();
    expect(response.body.error.details).toHaveLength(1);
    expect(response.body.error.details[0]).toMatchObject({
      '@type': 'type.upd3ops.com/ErrorInfo',
      reason: 'CONNECTION_FAILED',
      domain: 'whale-api',
    });
  });

  it('should return 503 for SSL/TLS certificate errors', async () => {
    const notificationId = 12345;
    mockWhaleApiService.getNotificationHistory.mockRejectedValue(
      new ExternalApiException(
        ERROR_CODES.UNAVAILABLE,
        'Certificate is not trusted',
        {
          '@type': 'type.upd3ops.com/ErrorInfo',
          reason: 'CONNECTION_FAILED',
          domain: 'whale-api',
          metadata: {},
        },
      ),
    );

    const response = await request(app.getHttpServer())
      .get(`/api/v1/notification-status/history/${notificationId}`)
      .set('ny-operator', 'operations-team')
      .expect(503);

    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('UNAVAILABLE');
    expect(response.body.error.details).toHaveLength(1);
    expect(response.body.error.details[0]).toMatchObject({
      '@type': 'type.upd3ops.com/ErrorInfo',
      reason: 'CONNECTION_FAILED',
      domain: 'whale-api',
    });
  });

  it('should handle immediate failures without retry attempts', async () => {
    const notificationId = 12345;
    const startTime = Date.now();

    mockWhaleApiService.getNotificationHistory.mockRejectedValue(
      new ExternalApiException(
        ERROR_CODES.UNAVAILABLE,
        'Connection refused',
        {
          '@type': 'type.upd3ops.com/ErrorInfo',
          reason: 'CONNECTION_FAILED',
          domain: 'whale-api',
          metadata: {},
        },
      ),
    );

    const response = await request(app.getHttpServer())
      .get(`/api/v1/notification-status/history/${notificationId}`)
      .set('ny-operator', 'operations-team')
      .expect(503);

    const endTime = Date.now();
    const duration = endTime - startTime;

    // Should fail fast, not wait for retries
    expect(duration).toBeLessThan(1000); // Less than 1 second
    expect(response.body.error.code).toBe('UNAVAILABLE');
    expect(mockWhaleApiService.getNotificationHistory).toHaveBeenCalledTimes(1);
  });
});
