import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../../app.module';
import { WHALE_API_SERVICE_TOKEN } from '../interfaces/whale-api.interface';

describe('Notification History Authentication Tests', () => {
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

  it('should reject requests without ny-operator header', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/notification-status/history/12345')
      .expect(401);

    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('UNAUTHORIZED');
    expect(response.body.error.message).toContain('ny-operator');
    expect(response.body.requestId).toMatch(/^req-\d{14}-[0-9a-f-]{36}/);
    expect(mockWhaleApiService.getNotificationHistory).not.toHaveBeenCalled();
  });

  it('should reject requests with empty ny-operator header', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/v1/notification-status/history/12345')
      .set('ny-operator', '')
      .expect(401);

    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('UNAUTHORIZED');
    expect(response.body.error.message).toContain('ny-operator');
    expect(mockWhaleApiService.getNotificationHistory).not.toHaveBeenCalled();
  });

  it('should accept requests with valid ny-operator header', async () => {
    const mockResponse = {
      code: 'Success',
      message: null,
      data: {
        id: 12345,
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

    mockWhaleApiService.getNotificationHistory.mockResolvedValue(mockResponse);

    const response = await request(app.getHttpServer())
      .get('/api/v1/notification-status/history/12345')
      .set('ny-operator', 'operations-team')
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(mockWhaleApiService.getNotificationHistory).toHaveBeenCalledWith(12345);
  });

  it('should accept different valid ny-operator values', async () => {
    const validOperators = ['operations-team', 'admin-user', 'support-staff'];
    const mockResponse = {
      code: 'Success',
      message: null,
      data: {
        id: 12345,
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

    for (const operator of validOperators) {
      mockWhaleApiService.getNotificationHistory.mockResolvedValue(mockResponse);

      const response = await request(app.getHttpServer())
        .get('/api/v1/notification-status/history/12345')
        .set('ny-operator', operator)
        .expect(200);

      expect(response.body.success).toBe(true);
    }
  });
});