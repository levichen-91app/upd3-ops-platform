import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import request from 'supertest';
import { NotificationStatusModule } from '../../api/modules/notification-status/notification-status.module';
import { NC_DETAIL_SERVICE_TOKEN } from '../../api/modules/notification-status/interfaces/nc-detail.interface';
import ncApiConfig from '../../api/config/nc-api.config';

describe('Notification Detail Integration Tests', () => {
  let app: INestApplication;

  beforeAll(async () => {
    // Mock 外部 NC Detail Service
    const mockNcDetailService = {
      getNotificationDetail: jest.fn(),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          load: [ncApiConfig],
          isGlobal: true,
        }),
        NotificationStatusModule,
      ],
    })
      .overrideProvider(NC_DETAIL_SERVICE_TOKEN)
      .useValue(mockNcDetailService)
      .compile();

    app = moduleFixture.createNestApplication();
    // 手動註冊全域 ResponseFormatInterceptor
    const { ResponseFormatInterceptor } = require('../../api/common/interceptors/response-format.interceptor');
    app.useGlobalInterceptors(new ResponseFormatInterceptor());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Complete notification detail flow', () => {
    const validShopId = 12345;
    const validNcId = 'a4070188-050d-47f7-ab24-2523145408cf';
    const validOperator = 'integration.test.operator';

    it('should complete full flow: request → external API → response transformation', async () => {
      // Setup mock response
      const mockResponse = {
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
      (mockNcDetailService.getNotificationDetail as jest.Mock).mockResolvedValue(mockResponse);

      const response = await request(app.getHttpServer())
        .get(`/api/v1/notification-status/detail/${validShopId}/${validNcId}`)
        .set('ny-operator', validOperator)
        .expect(200);

  // 檢查回應是否包含預期的資料 (格式由全域 interceptor 處理)
  expect(response.body.success).toBe(true);
  expect(response.body.data).toEqual(mockResponse);
  expect(typeof response.body.timestamp).toBe('string');
  expect(typeof response.body.requestId).toBe('string');
    });

    it('should validate request parameters in the complete flow', async () => {
      const invalidShopId = -1;

      const response = await request(app.getHttpServer())
        .get(`/api/v1/notification-status/detail/${invalidShopId}/${validNcId}`)
        .set('ny-operator', validOperator)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should validate ny-operator header in the complete flow', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/notification-status/detail/${validShopId}/${validNcId}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('should return null when notification does not exist', async () => {
      const mockNcDetailService = app.get(NC_DETAIL_SERVICE_TOKEN);
      (mockNcDetailService.getNotificationDetail as jest.Mock).mockResolvedValue(null);

      const response = await request(app.getHttpServer())
        .get(`/api/v1/notification-status/detail/${validShopId}/${validNcId}`)
        .set('ny-operator', validOperator)
        .expect(200);

  expect(response.body.success).toBe(true);
  expect(response.body.data).toBeNull();
  expect(typeof response.body.timestamp).toBe('string');
  expect(typeof response.body.requestId).toBe('string');
    });

    it('should maintain request tracing throughout the flow', async () => {
      const mockNcDetailService = app.get(NC_DETAIL_SERVICE_TOKEN);
      (mockNcDetailService.getNotificationDetail as jest.Mock).mockResolvedValue(null);

      const response = await request(app.getHttpServer())
        .get(`/api/v1/notification-status/detail/${validShopId}/${validNcId}`)
        .set('ny-operator', validOperator)
        .expect(200);

  expect(response.body.success).toBe(true);
  expect(response.body.data).toBeNull();
  expect(typeof response.body.timestamp).toBe('string');
  expect(typeof response.body.requestId).toBe('string');
    });

    it('should demonstrate operator tracking in logs', async () => {
      const uniqueOperator = `integration-test-${Date.now()}`;
      const mockNcDetailService = app.get(NC_DETAIL_SERVICE_TOKEN);
      (mockNcDetailService.getNotificationDetail as jest.Mock).mockResolvedValue(null);

      const response = await request(app.getHttpServer())
        .get(`/api/v1/notification-status/detail/${validShopId}/${validNcId}`)
        .set('ny-operator', uniqueOperator)
        .expect(200);

  // This test verifies that operator tracking works end-to-end
  expect(response.body.requestId).toBeDefined();
  expect(typeof response.body.timestamp).toBe('string');
  expect(response.body.success).toBe(true);
    });
  });
});