import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../../app.module';
import { WHALE_API_SERVICE_TOKEN } from '../interfaces/whale-api.interface';

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
      new Error('UNAVAILABLE: Connection refused'),
    );

    const response = await request(app.getHttpServer())
      .get(`/api/v1/notification-status/history/${notificationId}`)
      .set('ny-operator', 'operations-team')
      .expect(503);

    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('UNAVAILABLE');
    expect(response.body.error.message).toContain('外部服務調用失敗');
    expect(response.body.error.details.service).toBe('Whale API');
    expect(response.body.requestId).toMatch(/^req-\d{14}-[0-9a-f-]{36}/);
  });

  it('should return 504 when Whale API times out', async () => {
    const notificationId = 12345;
    mockWhaleApiService.getNotificationHistory.mockRejectedValue(
      new Error('DEADLINE_EXCEEDED: Request took longer than 10000ms'),
    );

    const response = await request(app.getHttpServer())
      .get(`/api/v1/notification-status/history/${notificationId}`)
      .set('ny-operator', 'operations-team')
      .expect(504);

    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('DEADLINE_EXCEEDED');
    expect(response.body.error.message).toBe('請求處理超時');
    expect(response.body.error.details.service).toBe('Whale API');
    expect(response.body.error.details.timeoutMs).toBe(10000);
  });

  it('should return 503 when Whale API returns HTTP error status', async () => {
    const notificationId = 12345;
    const httpError = new Error('UNAVAILABLE: HTTP Error 500: Internal Server Error');
    httpError.name = 'AxiosError';
    (httpError as any).response = {
      status: 500,
      statusText: 'Internal Server Error',
      data: { message: 'Database connection failed' },
    };

    mockWhaleApiService.getNotificationHistory.mockRejectedValue(httpError);

    const response = await request(app.getHttpServer())
      .get(`/api/v1/notification-status/history/${notificationId}`)
      .set('ny-operator', 'operations-team')
      .expect(503);

    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('UNAVAILABLE');
    expect(response.body.error.details.service).toBe('Whale API');
  });

  it('should return 503 for network connection errors', async () => {
    const notificationId = 12345;
    const networkError = new Error(
      'UNAVAILABLE: getaddrinfo ENOTFOUND whale-api.example.com',
    );

    mockWhaleApiService.getNotificationHistory.mockRejectedValue(networkError);

    const response = await request(app.getHttpServer())
      .get(`/api/v1/notification-status/history/${notificationId}`)
      .set('ny-operator', 'operations-team')
      .expect(503);

    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('UNAVAILABLE');
    expect(response.body.error.message).toContain('外部服務調用失敗');
    expect(response.body.error.details.service).toBe('Whale API');
  });

  it('should return 503 for SSL/TLS certificate errors', async () => {
    const notificationId = 12345;
    const sslError = new Error('UNAVAILABLE: Certificate is not trusted');

    mockWhaleApiService.getNotificationHistory.mockRejectedValue(sslError);

    const response = await request(app.getHttpServer())
      .get(`/api/v1/notification-status/history/${notificationId}`)
      .set('ny-operator', 'operations-team')
      .expect(503);

    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('UNAVAILABLE');
    expect(response.body.error.details.service).toBe('Whale API');
  });

  it('should handle immediate failures without retry attempts', async () => {
    const notificationId = 12345;
    const startTime = Date.now();

    mockWhaleApiService.getNotificationHistory.mockRejectedValue(
      new Error('UNAVAILABLE: Connection refused'),
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
