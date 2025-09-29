import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../../app.module';
import { WHALE_API_SERVICE_TOKEN } from '../interfaces/whale-api.interface';

describe('Notification History Success Scenarios', () => {
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

  it('should return notification history for valid ID', async () => {
    const notificationId = 12345;
    const mockHistoryData = {
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
      mockHistoryData,
    );

    const response = await request(app.getHttpServer())
      .get(`/api/v1/notification-status/history/${notificationId}`)
      .set('ny-operator', 'operations-team')
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('id', notificationId);
    expect(response.body.data.channel).toBe('Push');
    expect(response.body.data.status).toBe('Success');
    expect(response.body.requestId).toMatch(
      /^req-\d{14}-[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/,
    );
    expect(mockWhaleApiService.getNotificationHistory).toHaveBeenCalledWith(
      notificationId,
    );
  });

  it('should handle different notification statuses correctly', async () => {
    const testCases = [
      { status: 'Scheduled', isSettled: false },
      { status: 'Sent', isSettled: false },
      { status: 'Success', isSettled: true },
      { status: 'Fail', isSettled: true },
      { status: 'PartialFail', isSettled: true },
    ];

    for (const testCase of testCases) {
      const notificationId = Math.floor(Math.random() * 10000);
      const mockData = {
        code: 'Success',
        message: null,
        data: {
          id: notificationId,
          channel: 'Email',
          bookDatetime: '2024-01-15T10:30:00Z',
          sentDatetime:
            testCase.status === 'Scheduled' ? null : '2024-01-15T10:35:00Z',
          ncId: 'test-uuid',
          ncExtId: 123,
          status: testCase.status,
          isSettled: testCase.isSettled,
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

      mockWhaleApiService.getNotificationHistory.mockResolvedValue(mockData);

      const response = await request(app.getHttpServer())
        .get(`/api/v1/notification-status/history/${notificationId}`)
        .set('ny-operator', 'operations-team')
        .expect(200);

      expect(response.body.data.status).toBe(testCase.status);
      expect(response.body.data.isSettled).toBe(testCase.isSettled);
    }
  });
});
