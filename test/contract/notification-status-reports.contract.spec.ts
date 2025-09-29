import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../api/app.module';
import { NotificationStatusModule } from '../../api/modules/notification-status/notification-status.module';
import { NS_REPORT_SERVICE_TOKEN } from '../../api/modules/notification-status/services/ns-report.service.interface';
import { ExternalApiException } from '../../api/common/exceptions/external-api.exception';

/**
 * 合約測試：通知狀態報告 API
 *
 * 驗證 POST /api/v1/notification-status/reports 端點：
 * - 回應格式符合 OpenAPI 規範
 * - 資料類型正確
 * - 必填欄位存在
 * - 錯誤格式一致
 */
describe('NotificationStatusReports Contract Tests', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;

  // Mock NS Report Service for contract testing
  const mockNSReportService = {
    getStatusReport: jest.fn(),
  };

  beforeAll(async () => {
    moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(NS_REPORT_SERVICE_TOKEN)
      .useValue(mockNSReportService)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/v1/notification-status/reports', () => {
    const validRequest = {
      nsId: 'd68e720f-62ed-4955-802b-8e3f04c56a19',
      notificationDate: '2024/01/15',
      notificationType: 'push',
    };

    const validHeaders = {
      'ny-operator': 'internal-ops-team',
      'Content-Type': 'application/json',
    };

    it('should return valid success response schema', async () => {
      // Arrange: Mock successful external API response
      const mockResponseData = {
        downloadUrl: 'mock-contract-test-url',
        expiredTime: 3600,
      };
      mockNSReportService.getStatusReport.mockResolvedValue(mockResponseData);

      // Act
      const response = await request(app.getHttpServer())
        .post('/api/v1/notification-status/reports')
        .set(validHeaders)
        .send(validRequest)
        .expect(200);

      // Assert: Response structure matches actual implementation
      expect(response.body).toMatchObject({
        success: true,
        data: {
          downloadUrl: expect.any(String),
          expiredTime: expect.any(Number),
        },
        timestamp: expect.stringMatching(
          /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
        ),
        requestId: expect.stringMatching(/^req-\d{14}-[0-9a-f-]{36}$/),
      });

      // Assert: Data types are correct
      expect(typeof response.body.success).toBe('boolean');
      expect(typeof response.body.data.downloadUrl).toBe('string');
      expect(typeof response.body.data.expiredTime).toBe('number');
      expect(typeof response.body.timestamp).toBe('string');
      expect(typeof response.body.requestId).toBe('string');
    });

    it('should return valid error response schema for validation errors', async () => {
      // Act: Send invalid request (invalid UUID)
      const invalidRequest = {
        nsId: 'invalid-uuid',
        notificationDate: '2024/01/15',
        notificationType: 'push',
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/notification-status/reports')
        .set(validHeaders)
        .send(invalidRequest)
        .expect(400);

      // Assert: Error response structure matches OpenAPI schema
      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: expect.stringMatching(/^[A-Z_]+$/),
          message: expect.any(String),
          details: expect.anything(),
        },
        timestamp: expect.stringMatching(
          /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
        ),
        requestId: expect.stringMatching(/^req-\d{14}-[0-9a-f-]{36}$/),
      });

      // Assert: Error structure types
      expect(typeof response.body.success).toBe('boolean');
      expect(response.body.success).toBe(false);
      expect(typeof response.body.error.code).toBe('string');
      expect(typeof response.body.error.message).toBe('string');
    });

    it('should return valid error response schema for authentication failures', async () => {
      // Act: Send request without ny-operator header
      const response = await request(app.getHttpServer())
        .post('/api/v1/notification-status/reports')
        .set('Content-Type', 'application/json')
        .send(validRequest)
        .expect(401);

      // Assert: Authentication error structure
      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: expect.any(String),
        },
        timestamp: expect.any(String),
        requestId: expect.stringMatching(/^req-\d{14}-[0-9a-f-]{36}$/),
      });
    });

    it('should return valid error response schema for external API failures', async () => {
      // Arrange: Mock external API failure
      mockNSReportService.getStatusReport.mockRejectedValue(
        new ExternalApiException('External service unavailable'),
      );

      // Act
      const response = await request(app.getHttpServer())
        .post('/api/v1/notification-status/reports')
        .set(validHeaders)
        .send(validRequest)
        .expect(500);

      // Assert: External API error structure
      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'EXTERNAL_API_ERROR',
          message: expect.any(String),
        },
        timestamp: expect.any(String),
        requestId: expect.stringMatching(/^req-\d{14}-[0-9a-f-]{36}$/),
      });
    });
  });
});
