import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../../app.module';
import { WHALE_API_SERVICE_TOKEN } from '../interfaces/whale-api.interface';

describe('Notification History Contract Tests', () => {
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

  describe('GET /api/v1/notification-status/history/{notificationId}', () => {
    it('should match OpenAPI specification for successful response', async () => {
      const notificationId = 12345;
      const mockResponse = {
        code: 'Success',
        message: null,
        data: {
          id: notificationId,
          channel: 'Push',
          bookDatetime: '2024-01-15T10:30:00Z',
          sentDatetime: '2024-01-15T10:35:00Z',
          ncId: 'a4070188-050d-47f7-ab24-2523145408cf',
          ncExtId: 67890,
          status: 'Success',
          isSettled: true,
          originalAudienceCount: 1000,
          filteredAudienceCount: 950,
          sentAudienceCount: 900,
          receivedAudienceCount: 850,
          sentFailedCount: 50,
          report: {
            Total: 1000,
            Sent: 950,
            Success: 900,
            Fail: 50,
            NoUser: 50,
          },
        },
      };

      mockWhaleApiService.getNotificationHistory.mockResolvedValue(
        mockResponse,
      );

      const response = await request(app.getHttpServer())
        .get(`/api/v1/notification-status/history/${notificationId}`)
        .set('ny-operator', 'operations-team')
        .expect(200);

      // Validate response structure matches OpenAPI spec
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('requestId');
      expect(response.body.requestId).toMatch(
        /^req-\d{14}-[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/,
      );

      // Validate data structure
      const { data } = response.body;
      expect(data).toHaveProperty('id', notificationId);
      expect(data).toHaveProperty('channel', 'Push');
      expect(data).toHaveProperty('bookDatetime');
      expect(data).toHaveProperty('ncId');
      expect(data).toHaveProperty('status');
      expect(data).toHaveProperty('report');
      expect(data.report).toHaveProperty('Total');
      expect(data.report).toHaveProperty('Success');
    });

    it('should match OpenAPI specification for validation error response', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/notification-status/history/invalid')
        .set('ny-operator', 'operations-team')
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code', 'INVALID_ARGUMENT');
      expect(response.body.error).toHaveProperty('message');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('requestId');
    });
  });
});
