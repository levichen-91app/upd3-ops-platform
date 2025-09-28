import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { NotificationStatusModule } from '../notification-status.module';
import { NS_REPORT_SERVICE_TOKEN } from '../services/ns-report.service.interface';

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
      imports: [NotificationStatusModule],
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

    it('should return 500 when NS Report API times out', async () => {
      // Arrange: Mock timeout error
      const timeoutError = new Error('Request timeout');
      timeoutError.name = 'TimeoutError';
      mockNSReportService.getStatusReport.mockRejectedValue(timeoutError);

      // Act
      const response = await request(app.getHttpServer())
        .post('/api/v1/notification-status/reports')
        .set(validHeaders)
        .send(validRequest)
        .expect(500);

      // Assert: Error response structure for timeout
      expect(response.body).toEqual({
        success: false,
        error: {
          code: 'EXTERNAL_API_ERROR',
          message: '外部 NS Report API 調用失敗',
        },
        timestamp: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/),
        requestId: expect.stringMatching(/^req-\d{14}-[0-9a-f-]{36}$/),
      });

      // Assert: External service was called
      expect(mockNSReportService.getStatusReport).toHaveBeenCalledWith(validRequest);
    });

    it('should return 500 when NS Report API returns HTTP 500 error', async () => {
      // Arrange: Mock HTTP 500 error
      const httpError = new Error('Internal Server Error');
      httpError.name = 'HttpException';
      (httpError as any).response = {
        status: 500,
        statusText: 'Internal Server Error',
        data: { error: 'Database connection failed' },
      };
      mockNSReportService.getStatusReport.mockRejectedValue(httpError);

      // Act
      const response = await request(app.getHttpServer())
        .post('/api/v1/notification-status/reports')
        .set(validHeaders)
        .send(validRequest)
        .expect(500);

      // Assert: Error response structure for HTTP error
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('EXTERNAL_API_ERROR');
      expect(response.body.error.message).toContain('外部 NS Report API 調用失敗');
      expect(response.body.error.details).toEqual({
        originalMessage: 'Internal Server Error',
        errorType: 'HttpException',
        statusCode: 500,
        statusText: 'Internal Server Error',
      });
    });

    it('should return 500 when NS Report API returns HTTP 404 error', async () => {
      // Arrange: Mock HTTP 404 error (not found in external system)
      const notFoundError = new Error('Report not found');
      notFoundError.name = 'HttpException';
      (notFoundError as any).response = {
        status: 404,
        statusText: 'Not Found',
        data: { message: 'Report data not available for specified date' },
      };
      mockNSReportService.getStatusReport.mockRejectedValue(notFoundError);

      // Act
      const response = await request(app.getHttpServer())
        .post('/api/v1/notification-status/reports')
        .set(validHeaders)
        .send(validRequest)
        .expect(500);

      // Assert: External 404 becomes internal 500 (external API error)
      expect(response.body.error.code).toBe('EXTERNAL_API_ERROR');
      expect(response.body.error.details.statusCode).toBe(404);
    });

    it('should return 500 when NS Report API returns HTTP 403 Forbidden', async () => {
      // Arrange: Mock HTTP 403 error (authentication failure at external API)
      const forbiddenError = new Error('Forbidden');
      forbiddenError.name = 'HttpException';
      (forbiddenError as any).response = {
        status: 403,
        statusText: 'Forbidden',
        data: { error: 'API key invalid or expired' },
      };
      mockNSReportService.getStatusReport.mockRejectedValue(forbiddenError);

      // Act
      const response = await request(app.getHttpServer())
        .post('/api/v1/notification-status/reports')
        .set(validHeaders)
        .send(validRequest)
        .expect(500);

      // Assert: External 403 becomes internal 500
      expect(response.body.error.code).toBe('EXTERNAL_API_ERROR');
      expect(response.body.error.details.statusCode).toBe(403);
    });

    it('should return 500 when NS Report API connection fails', async () => {
      // Arrange: Mock connection failure
      const connectionError = new Error('ECONNREFUSED');
      connectionError.name = 'ConnectionError';
      (connectionError as any).code = 'ECONNREFUSED';
      mockNSReportService.getStatusReport.mockRejectedValue(connectionError);

      // Act
      const response = await request(app.getHttpServer())
        .post('/api/v1/notification-status/reports')
        .set(validHeaders)
        .send(validRequest)
        .expect(500);

      // Assert: Connection error response
      expect(response.body.error.code).toBe('EXTERNAL_API_ERROR');
      expect(response.body.error.details).toEqual({
        originalMessage: 'ECONNREFUSED',
        errorType: 'ConnectionError',
        errorCode: 'ECONNREFUSED',
      });
    });

    it('should return 500 when NS Report API returns invalid JSON response', async () => {
      // Arrange: Mock invalid JSON response
      const parseError = new Error('Unexpected token < in JSON at position 0');
      parseError.name = 'SyntaxError';
      mockNSReportService.getStatusReport.mockRejectedValue(parseError);

      // Act
      const response = await request(app.getHttpServer())
        .post('/api/v1/notification-status/reports')
        .set(validHeaders)
        .send(validRequest)
        .expect(500);

      // Assert: JSON parse error response
      expect(response.body.error.code).toBe('EXTERNAL_API_ERROR');
      expect(response.body.error.details.errorType).toBe('SyntaxError');
    });

    it('should return 500 when NS Report API returns unexpected response structure', async () => {
      // Arrange: Mock service returning incomplete data
      mockNSReportService.getStatusReport.mockResolvedValue({
        downloadUrl: null, // Missing required field
        // expiredTime missing
      });

      // Act
      const response = await request(app.getHttpServer())
        .post('/api/v1/notification-status/reports')
        .set(validHeaders)
        .send(validRequest)
        .expect(500);

      // Assert: Invalid response structure error
      expect(response.body.error.code).toBe('EXTERNAL_API_ERROR');
      expect(response.body.error.message).toContain('外部 NS Report API 調用失敗');
    });

    it('should maintain consistent error response format across all external failures', async () => {
      // Act: Test multiple error types
      const errorScenarios = [
        { error: new Error('Timeout'), name: 'TimeoutError' },
        { error: new Error('Connection failed'), name: 'ConnectionError' },
        { error: new Error('Parse error'), name: 'SyntaxError' },
      ];

      for (const scenario of errorScenarios) {
        scenario.error.name = scenario.name;
        mockNSReportService.getStatusReport.mockRejectedValue(scenario.error);

        const response = await request(app.getHttpServer())
          .post('/api/v1/notification-status/reports')
          .set(validHeaders)
          .send(validRequest)
          .expect(500);

        // Assert: Consistent structure across all errors
        expect(response.body).toMatchObject({
          success: false,
          error: {
            code: 'EXTERNAL_API_ERROR',
            message: expect.any(String),
            details: expect.objectContaining({
              originalMessage: expect.any(String),
              errorType: scenario.name,
            }),
          },
          timestamp: expect.any(String),
          requestId: expect.any(String),
        });

        jest.clearAllMocks();
      }
    });

    it('should include unique request IDs for external API failures', async () => {
      // Arrange: Mock error
      mockNSReportService.getStatusReport.mockRejectedValue(new Error('Service unavailable'));

      // Act: Make multiple requests
      const response1 = await request(app.getHttpServer())
        .post('/api/v1/notification-status/reports')
        .set(validHeaders)
        .send(validRequest)
        .expect(500);

      const response2 = await request(app.getHttpServer())
        .post('/api/v1/notification-status/reports')
        .set(validHeaders)
        .send(validRequest)
        .expect(500);

      // Assert: Different request IDs for each failure
      expect(response1.body.requestId).not.toBe(response2.body.requestId);
      expect(response1.body.requestId).toMatch(/^req-\d{14}-[0-9a-f-]{36}$/);
      expect(response2.body.requestId).toMatch(/^req-\d{14}-[0-9a-f-]{36}$/);
    });
  });
});