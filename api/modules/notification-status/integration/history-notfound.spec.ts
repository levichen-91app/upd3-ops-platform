import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../../app.module';
import { WHALE_API_SERVICE_TOKEN } from '../interfaces/whale-api.interface';

describe('Notification History Not Found Tests', () => {
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

  it('should return 404 for non-existent notification', async () => {
    const notificationId = 99999;
    mockWhaleApiService.getNotificationHistory.mockResolvedValue(null);

    const response = await request(app.getHttpServer())
      .get(`/api/v1/notification-status/history/${notificationId}`)
      .set('ny-operator', 'operations-team')
      .expect(404);

    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('NOTIFICATION_NOT_FOUND');
    expect(response.body.error.message).toBe('找不到指定的通知');
    expect(response.body.error.details.notificationId).toBe(notificationId);
    expect(response.body.requestId).toMatch(/^req-\d{14}-[0-9a-f-]{36}/);
    expect(mockWhaleApiService.getNotificationHistory).toHaveBeenCalledWith(
      notificationId,
    );
  });

  it('should return 404 when Whale API returns NOT_FOUND response', async () => {
    const notificationId = 88888;
    const notFoundResponse = {
      code: 'NOT_FOUND',
      message: 'Not found',
      data: null,
    };

    mockWhaleApiService.getNotificationHistory.mockResolvedValue(
      notFoundResponse,
    );

    const response = await request(app.getHttpServer())
      .get(`/api/v1/notification-status/history/${notificationId}`)
      .set('ny-operator', 'operations-team')
      .expect(404);

    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('NOTIFICATION_NOT_FOUND');
    expect(response.body.error.message).toBe('找不到指定的通知');
    expect(response.body.error.details.notificationId).toBe(notificationId);
  });

  it('should return 404 when Whale API returns empty data object', async () => {
    const notificationId = 77777;
    const emptyResponse = {
      code: 'Success',
      message: null,
      data: null,
    };

    mockWhaleApiService.getNotificationHistory.mockResolvedValue(emptyResponse);

    const response = await request(app.getHttpServer())
      .get(`/api/v1/notification-status/history/${notificationId}`)
      .set('ny-operator', 'operations-team')
      .expect(404);

    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('NOTIFICATION_NOT_FOUND');
    expect(response.body.error.details.notificationId).toBe(notificationId);
  });

  it('should return 404 when Whale API returns undefined', async () => {
    const notificationId = 66666;
    mockWhaleApiService.getNotificationHistory.mockResolvedValue(undefined);

    const response = await request(app.getHttpServer())
      .get(`/api/v1/notification-status/history/${notificationId}`)
      .set('ny-operator', 'operations-team')
      .expect(404);

    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('NOTIFICATION_NOT_FOUND');
    expect(response.body.error.message).toBe('找不到指定的通知');
    expect(response.body.error.details.notificationId).toBe(notificationId);
  });

  it('should distinguish between not found (404) and external API error (500)', async () => {
    // Test 404 case
    const notFoundId = 11111;
    mockWhaleApiService.getNotificationHistory.mockResolvedValueOnce(null);

    const notFoundResponse = await request(app.getHttpServer())
      .get(`/api/v1/notification-status/history/${notFoundId}`)
      .set('ny-operator', 'operations-team')
      .expect(404);

    expect(notFoundResponse.body.error.code).toBe('NOTIFICATION_NOT_FOUND');

    // Test 500 case (external API failure)
    const errorId = 22222;
    mockWhaleApiService.getNotificationHistory.mockRejectedValueOnce(
      new Error('External API failed'),
    );

    const errorResponse = await request(app.getHttpServer())
      .get(`/api/v1/notification-status/history/${errorId}`)
      .set('ny-operator', 'operations-team')
      .expect(500);

    expect(errorResponse.body.error.code).toBe('EXTERNAL_API_ERROR');
  });

  it('should include proper error details for not found cases', async () => {
    const notificationId = 55555;
    mockWhaleApiService.getNotificationHistory.mockResolvedValue(null);

    const response = await request(app.getHttpServer())
      .get(`/api/v1/notification-status/history/${notificationId}`)
      .set('ny-operator', 'operations-team')
      .expect(404);

    expect(response.body.success).toBe(false);
    expect(response.body.error).toHaveProperty('code');
    expect(response.body.error).toHaveProperty('message');
    expect(response.body.error).toHaveProperty('details');
    expect(response.body).toHaveProperty('timestamp');
    expect(response.body).toHaveProperty('requestId');
    expect(response.body.error.details).toEqual({
      notificationId: notificationId,
    });
  });
});
