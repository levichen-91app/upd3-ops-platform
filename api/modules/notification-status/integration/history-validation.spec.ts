import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { NotificationStatusModule } from '../notification-status.module';
import { WHALE_API_SERVICE_TOKEN } from '../interfaces/whale-api.interface';

describe('Notification History Validation Tests', () => {
  let app: INestApplication;
  let mockWhaleApiService: any;

  beforeEach(async () => {
    mockWhaleApiService = {
      getNotificationHistory: jest.fn(),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [NotificationStatusModule],
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

  it('should reject invalid notification ID format (string)', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/notification-status/history/invalid')
      .set('ny-operator', 'operations-team')
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect(response.body.error.message).toBe('通知ID必須為正整數');
    expect(response.body.requestId).toMatch(/^req-error-/);
    expect(mockWhaleApiService.getNotificationHistory).not.toHaveBeenCalled();
  });

  it('should reject negative notification IDs', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/notification-status/history/-123')
      .set('ny-operator', 'operations-team')
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect(response.body.error.message).toBe('通知ID必須為正整數');
    expect(mockWhaleApiService.getNotificationHistory).not.toHaveBeenCalled();
  });

  it('should reject zero as notification ID', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/notification-status/history/0')
      .set('ny-operator', 'operations-team')
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect(response.body.error.message).toBe('通知ID必須為正整數');
    expect(mockWhaleApiService.getNotificationHistory).not.toHaveBeenCalled();
  });

  it('should reject decimal notification IDs', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/notification-status/history/123.45')
      .set('ny-operator', 'operations-team')
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect(mockWhaleApiService.getNotificationHistory).not.toHaveBeenCalled();
  });

  it('should accept valid positive integer notification IDs', async () => {
    const validIds = [1, 123, 999999, 2147483647];
    const mockResponse = {
      code: 'Success',
      message: null,
      data: {
        id: 123,
        channel: 'Push',
        bookDatetime: '2024-01-15T10:30:00Z',
        sentDatetime: '2024-01-15T10:35:00Z',
        ncId: 'test-uuid',
        ncExtId: 123,
        status: 'Success',
        isSettled: true,
        originalAudienceCount: 100,
        filteredAudienceCount: 90,
        sentAudienceCount: 85,
        receivedAudienceCount: 80,
        sentFailedCount: 5,
        report: {
          Total: 100,
          Sent: 85,
          Success: 80,
          Fail: 5,
          NoUser: 10,
        },
      },
    };

    for (const id of validIds) {
      mockWhaleApiService.getNotificationHistory.mockResolvedValue({
        ...mockResponse,
        data: { ...mockResponse.data, id },
      });

      const response = await request(app.getHttpServer())
        .get(`/api/v1/notification-status/history/${id}`)
        .set('ny-operator', 'operations-team')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(id);
      expect(mockWhaleApiService.getNotificationHistory).toHaveBeenCalledWith(id);
    }
  });

  it('should provide detailed validation error information', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/notification-status/history/abc123')
      .set('ny-operator', 'operations-team')
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
    expect(response.body.error.message).toBeDefined();
    expect(response.body.error.details).toBeDefined();
    expect(response.body.timestamp).toBeDefined();
    expect(response.body.requestId).toMatch(/^req-error-/);
  });
});