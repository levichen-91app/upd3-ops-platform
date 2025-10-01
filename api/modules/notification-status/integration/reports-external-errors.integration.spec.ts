import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../../app.module';
import { NS_REPORT_SERVICE_TOKEN } from '../services/ns-report.service.interface';
import { ExternalApiException } from '../../../common/exceptions/external-api.exception';
import { ERROR_CODES } from '../../../constants/error-codes.constants';

/**
 * 整合測試：外部 NS Report API 錯誤情境
 *
 * 測試 POST /api/v1/notification-status/reports 外部 API 失敗場景：
 * - NS Report API 超時 (timeout)
 * - NS Report API 返回 HTTP 4xx/5xx 錯誤
 * - NS Report API 連接失敗 (connection failure)
 * - NS Report API 返回無效格式回應
 *
 * 特別注意：所有外部 API 調用必須使用 Jest Mock，絕對禁止真實 HTTP 請求
 */
describe('Reports External Errors Integration', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;

  // Mock NS Report Service - 模擬各種外部 API 錯誤
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

  describe('POST /api/v1/notification-status/reports - External API Failures', () => {
    const validRequest = {
      nsId: 'd68e720f-62ed-4955-802b-8e3f04c56a19',
      notificationDate: '2024/01/15',
      notificationType: 'push',
    };

    const validHeaders = {
      'ny-operator': 'internal-ops-team',
      'Content-Type': 'application/json',
    };

    it('should return 504 when NS Report API times out', async () => {
      // Arrange: Mock timeout error
      mockNSReportService.getStatusReport.mockRejectedValue(
        new ExternalApiException(
          ERROR_CODES.DEADLINE_EXCEEDED,
          'Request timeout',
          {
            '@type': 'type.upd3ops.com/ErrorInfo',
            reason: 'TIMEOUT',
            domain: 'ns-report',
            metadata: { timeout: 10000 },
          },
        ),
      );

      // Act
      const response = await request(app.getHttpServer())
        .post('/api/v1/notification-status/reports')
        .set(validHeaders)
        .send(validRequest)
        .expect(504);

      // Assert: Error response structure for timeout
      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'DEADLINE_EXCEEDED',
          message: expect.any(String),
          details: expect.arrayContaining([
            expect.objectContaining({
              '@type': 'type.upd3ops.com/ErrorInfo',
              reason: 'TIMEOUT',
              domain: 'ns-report',
              metadata: expect.objectContaining({ timeout: 10000 }),
            }),
          ]),
        },
        timestamp: expect.stringMatching(
          /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
        ),
        requestId: expect.stringMatching(/^req-\d{14}-[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/),
      });

      // Assert: External service was called
      expect(mockNSReportService.getStatusReport).toHaveBeenCalledWith(
        validRequest,
      );
    });

    it('should return 503 when NS Report API returns HTTP 500 error', async () => {
      // Arrange: Mock HTTP 500 error
      mockNSReportService.getStatusReport.mockRejectedValue(
        new ExternalApiException(
          ERROR_CODES.UNAVAILABLE,
          'Internal Server Error',
          {
            '@type': 'type.upd3ops.com/ErrorInfo',
            reason: 'HTTP_ERROR',
            domain: 'ns-report',
            metadata: { httpStatus: 500 },
          },
        ),
      );

      // Act
      const response = await request(app.getHttpServer())
        .post('/api/v1/notification-status/reports')
        .set(validHeaders)
        .send(validRequest)
        .expect(503);

      // Assert: Error response structure for HTTP error
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAVAILABLE');
      expect(response.body.error.message).toBeDefined();
      expect(response.body.error.details).toHaveLength(1);
      expect(response.body.error.details[0]).toMatchObject({
        '@type': 'type.upd3ops.com/ErrorInfo',
        reason: 'HTTP_ERROR',
        domain: 'ns-report',
        metadata: expect.objectContaining({ httpStatus: 500 }),
      });
    });

    it('should return 404 when NS Report API returns HTTP 404 error', async () => {
      // Arrange: Mock HTTP 404 error (not found in external system)
      mockNSReportService.getStatusReport.mockRejectedValue(
        new ExternalApiException(
          ERROR_CODES.NOT_FOUND,
          'Report not found',
          {
            '@type': 'type.upd3ops.com/ErrorInfo',
            reason: 'HTTP_ERROR',
            domain: 'ns-report',
            metadata: { httpStatus: 404 },
          },
        ),
      );

      // Act
      const response = await request(app.getHttpServer())
        .post('/api/v1/notification-status/reports')
        .set(validHeaders)
        .send(validRequest)
        .expect(404);

      // Assert: External 404 becomes internal 404 (not found)
      expect(response.body.error.code).toBe('NOT_FOUND');
      expect(response.body.error.details).toHaveLength(1);
      expect(response.body.error.details[0]).toMatchObject({
        '@type': 'type.upd3ops.com/ErrorInfo',
        reason: 'HTTP_ERROR',
        domain: 'ns-report',
        metadata: expect.objectContaining({ httpStatus: 404 }),
      });
    });

    it('should return 503 when NS Report API returns HTTP 403 Forbidden', async () => {
      // Arrange: Mock HTTP 403 error (authentication failure at external API)
      mockNSReportService.getStatusReport.mockRejectedValue(
        new ExternalApiException(
          ERROR_CODES.UNAVAILABLE,
          'Forbidden',
          {
            '@type': 'type.upd3ops.com/ErrorInfo',
            reason: 'HTTP_ERROR',
            domain: 'ns-report',
            metadata: { httpStatus: 403 },
          },
        ),
      );

      // Act
      const response = await request(app.getHttpServer())
        .post('/api/v1/notification-status/reports')
        .set(validHeaders)
        .send(validRequest)
        .expect(503);

      // Assert: External 403 becomes internal 503
      expect(response.body.error.code).toBe('UNAVAILABLE');
      expect(response.body.error.details).toHaveLength(1);
      expect(response.body.error.details[0]).toMatchObject({
        '@type': 'type.upd3ops.com/ErrorInfo',
        reason: 'HTTP_ERROR',
        domain: 'ns-report',
        metadata: expect.objectContaining({ httpStatus: 403 }),
      });
    });

    it('should return 503 when NS Report API connection fails', async () => {
      // Arrange: Mock connection failure
      mockNSReportService.getStatusReport.mockRejectedValue(
        new ExternalApiException(
          ERROR_CODES.UNAVAILABLE,
          'ECONNREFUSED',
          {
            '@type': 'type.upd3ops.com/ErrorInfo',
            reason: 'CONNECTION_FAILED',
            domain: 'ns-report',
            metadata: {},
          },
        ),
      );

      // Act
      const response = await request(app.getHttpServer())
        .post('/api/v1/notification-status/reports')
        .set(validHeaders)
        .send(validRequest)
        .expect(503);

      // Assert: Connection error response
      expect(response.body.error.code).toBe('UNAVAILABLE');
      expect(response.body.error.details).toHaveLength(1);
      expect(response.body.error.details[0]).toMatchObject({
        '@type': 'type.upd3ops.com/ErrorInfo',
        reason: 'CONNECTION_FAILED',
        domain: 'ns-report',
      });
    });

    it('should return 503 when NS Report API returns invalid JSON response', async () => {
      // Arrange: Mock invalid JSON response
      mockNSReportService.getStatusReport.mockRejectedValue(
        new ExternalApiException(
          ERROR_CODES.UNAVAILABLE,
          'Unexpected token < in JSON at position 0',
          {
            '@type': 'type.upd3ops.com/ErrorInfo',
            reason: 'INVALID_RESPONSE',
            domain: 'ns-report',
            metadata: {},
          },
        ),
      );

      // Act
      const response = await request(app.getHttpServer())
        .post('/api/v1/notification-status/reports')
        .set(validHeaders)
        .send(validRequest)
        .expect(503);

      // Assert: JSON parse error response
      expect(response.body.error.code).toBe('UNAVAILABLE');
      expect(response.body.error.details).toHaveLength(1);
      expect(response.body.error.details[0]).toMatchObject({
        '@type': 'type.upd3ops.com/ErrorInfo',
        reason: 'INVALID_RESPONSE',
        domain: 'ns-report',
      });
    });

    it('should return 200 when NS Report API returns response with null values', async () => {
      // Arrange: Mock service returning data with null values
      // Note: Currently system does not validate response structure
      // TODO: Add response structure validation in future
      mockNSReportService.getStatusReport.mockResolvedValue({
        downloadUrl: null,
        expiredTime: undefined,
      });

      // Act
      const response = await request(app.getHttpServer())
        .post('/api/v1/notification-status/reports')
        .set(validHeaders)
        .send(validRequest)
        .expect(200);

      // Assert: Response is returned as-is
      expect(response.body.success).toBe(true);
      expect(response.body.data.downloadUrl).toBeNull();
    });

    it('should maintain consistent error response format across all external failures', async () => {
      // Act: Test multiple error types
      const errorScenarios = [
        {
          exception: new ExternalApiException(
            ERROR_CODES.DEADLINE_EXCEEDED,
            'Timeout',
            {
              '@type': 'type.upd3ops.com/ErrorInfo',
              reason: 'TIMEOUT',
              domain: 'ns-report',
              metadata: { timeout: 10000 },
            },
          ),
          name: 'TimeoutError',
          expectedCode: 'DEADLINE_EXCEEDED',
          expectedStatus: 504,
        },
        {
          exception: new ExternalApiException(
            ERROR_CODES.UNAVAILABLE,
            'Connection failed',
            {
              '@type': 'type.upd3ops.com/ErrorInfo',
              reason: 'CONNECTION_FAILED',
              domain: 'ns-report',
              metadata: {},
            },
          ),
          name: 'ConnectionError',
          expectedCode: 'UNAVAILABLE',
          expectedStatus: 503,
        },
        {
          exception: new ExternalApiException(
            ERROR_CODES.UNAVAILABLE,
            'Parse error',
            {
              '@type': 'type.upd3ops.com/ErrorInfo',
              reason: 'INVALID_RESPONSE',
              domain: 'ns-report',
              metadata: {},
            },
          ),
          name: 'SyntaxError',
          expectedCode: 'UNAVAILABLE',
          expectedStatus: 503,
        },
      ];

      for (const scenario of errorScenarios) {
        mockNSReportService.getStatusReport.mockRejectedValue(
          scenario.exception,
        );

        const response = await request(app.getHttpServer())
          .post('/api/v1/notification-status/reports')
          .set(validHeaders)
          .send(validRequest)
          .expect(scenario.expectedStatus);

        // Assert: Consistent structure across all errors
        expect(response.body).toMatchObject({
          success: false,
          error: {
            code: scenario.expectedCode,
            message: expect.any(String),
            details: expect.arrayContaining([
              expect.objectContaining({
                '@type': 'type.upd3ops.com/ErrorInfo',
                reason: expect.any(String),
                domain: 'ns-report',
              }),
            ]),
          },
          timestamp: expect.any(String),
          requestId: expect.any(String),
        });

        jest.clearAllMocks();
      }
    });

    it('should include unique request IDs for external API failures', async () => {
      // Arrange: Mock error
      mockNSReportService.getStatusReport.mockRejectedValue(
        new ExternalApiException(
          ERROR_CODES.UNAVAILABLE,
          'Service unavailable',
          {
            '@type': 'type.upd3ops.com/ErrorInfo',
            reason: 'HTTP_ERROR',
            domain: 'ns-report',
            metadata: { httpStatus: 503 },
          },
        ),
      );

      // Act: Make multiple requests
      const response1 = await request(app.getHttpServer())
        .post('/api/v1/notification-status/reports')
        .set(validHeaders)
        .send(validRequest)
        .expect(503);

      const response2 = await request(app.getHttpServer())
        .post('/api/v1/notification-status/reports')
        .set(validHeaders)
        .send(validRequest)
        .expect(503);

      // Assert: Different request IDs for each failure
      expect(response1.body.requestId).not.toBe(response2.body.requestId);
      expect(response1.body.requestId).toMatch(/^req-\d{14}-[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/);
      expect(response2.body.requestId).toMatch(/^req-\d{14}-[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/);
    });
  });
});
