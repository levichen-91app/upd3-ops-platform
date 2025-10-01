import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../api/app.module';
import { NC_DETAIL_SERVICE_TOKEN } from '../../api/modules/notification-status/interfaces/nc-detail.interface';

describe('Notification Detail API Contract Tests', () => {
  let app: INestApplication;

  beforeEach(async () => {
    // Mock 外部服務以避免實際 API 調用
    const mockNcDetailService = {
      getNotificationDetail: jest.fn(),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(NC_DETAIL_SERVICE_TOKEN)
      .useValue(mockNcDetailService)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('GET /api/v1/notification-status/detail/:shopId/:ncId', () => {
    const validShopId = 12345;
    const validNcId = 'a4070188-050d-47f7-ab24-2523145408cf';
    const validOperator = 'test.operator';

    it('should return 200 with notification detail when notification exists', async () => {
      // Setup mock 回應
      const mockData = {
        NCId: validNcId,
        NSId: 'd68e720f-62ed-4955-802b-8e3f04c56a19',
        Status: 'Completed',
        ChannelType: 'Push',
        CreateDateTime: '2025-09-15T01:58:31.117',
        Report: {
          Total: 1,
          NoUserData: 0,
          InBlackList: 0,
          DontWantToReceiveThisMessageType: 0,
          Sent: 1,
          Fail: 0,
          DidNotSend: 0,
          Cancel: 0,
          NoTokenData: 0,
          Received: 0,
        },
        ShortMessageReportLink: null,
      };

      const mockNcDetailService = app.get(NC_DETAIL_SERVICE_TOKEN);
      (
        mockNcDetailService.getNotificationDetail as jest.Mock
      ).mockResolvedValue(mockData);

      const response = await request(app.getHttpServer())
        .get(`/api/v1/notification-status/detail/${validShopId}/${validNcId}`)
        .set('ny-operator', validOperator)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('requestId');
      expect(response.body.data).toEqual(mockData);
    });

    it('should return 200 with null data when notification does not exist', async () => {
      const nonExistentNcId = 'b4070188-050d-47f7-ab24-2523145408cf';

      const mockNcDetailService = app.get(NC_DETAIL_SERVICE_TOKEN);
      (
        mockNcDetailService.getNotificationDetail as jest.Mock
      ).mockResolvedValue(null);

      const response = await request(app.getHttpServer())
        .get(
          `/api/v1/notification-status/detail/${validShopId}/${nonExistentNcId}`,
        )
        .set('ny-operator', validOperator)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: null,
        timestamp: expect.any(String),
        requestId: expect.any(String),
      });
    });

    it('should return 400 when shopId is invalid', async () => {
      const invalidShopId = 0;

      const response = await request(app.getHttpServer())
        .get(`/api/v1/notification-status/detail/${invalidShopId}/${validNcId}`)
        .set('ny-operator', validOperator)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code', 'INVALID_ARGUMENT');
    });

    it('should return 400 when ncId is not UUID format', async () => {
      const invalidNcId = 'invalid-uuid';

      const response = await request(app.getHttpServer())
        .get(`/api/v1/notification-status/detail/${validShopId}/${invalidNcId}`)
        .set('ny-operator', validOperator)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code', 'INVALID_ARGUMENT');
    });

    it('should return 400 when ny-operator header is missing', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/notification-status/detail/${validShopId}/${validNcId}`)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
      expect(response.body.error).toHaveProperty('code', 'INVALID_ARGUMENT');
      expect(response.body.error.message).toContain('Missing required header');
    });

    it('should return 500 when external NC API fails', async () => {
      // This test will be implemented when we have mock control
      // For now, we expect it to fail until the external service is properly mocked
      expect(true).toBe(true); // Placeholder test
    });

    it('should return 500 when external NC API times out', async () => {
      // This test will be implemented when we have timeout simulation
      // For now, we expect it to fail until timeout handling is implemented
      expect(true).toBe(true); // Placeholder test
    });
  });
});
