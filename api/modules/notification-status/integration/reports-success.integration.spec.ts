import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../../app.module';
import { NS_REPORT_SERVICE_TOKEN } from '../services/ns-report.service.interface';

/**
 * 整合測試：報告成功查詢情境
 *
 * 測試 POST /api/v1/notification-status/reports 成功流程：
 * - 有效的認證 header (ny-operator)
 * - 正確的請求參數格式
 * - 外部 API 成功回應
 * - 回傳正確的 presigned URL 和過期時間
 */
describe('Reports Success Integration', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;

  // Mock NS Report Service - 絕對禁止真實 HTTP 請求
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

  describe('POST /api/v1/notification-status/reports - Success Scenarios', () => {
    const validRequest = {
      nsId: 'd68e720f-62ed-4955-802b-8e3f04c56a19',
      notificationDate: '2024/01/15',
      notificationType: 'push',
    };

    const validHeaders = {
      'ny-operator': 'internal-ops-team',
      'Content-Type': 'application/json',
    };

    it('should successfully return report download link for push notification', async () => {
      // Arrange: Mock successful NS Report API response
      const mockDownloadData = {
        downloadUrl:
          'https://s3.amazonaws.com/reports/push-report-123.tsv?signature=abc123',
        expiredTime: 3600,
      };
      mockNSReportService.getStatusReport.mockResolvedValue(mockDownloadData);

      // Act
      const response = await request(app.getHttpServer())
        .post('/api/v1/notification-status/reports')
        .set(validHeaders)
        .send(validRequest)
        .expect(200);

      // Assert: Response structure
      expect(response.body).toEqual({
        success: true,
        data: {
          downloadUrl: mockDownloadData.downloadUrl,
          expiredTime: mockDownloadData.expiredTime,
        },
        timestamp: expect.any(String),
        requestId: expect.stringMatching(/^req-reports-\d+-[a-zA-Z0-9]+$/),
      });

      // Assert: External service called with correct parameters
      expect(mockNSReportService.getStatusReport).toHaveBeenCalledWith({
        nsId: validRequest.nsId,
        notificationDate: validRequest.notificationDate,
        notificationType: validRequest.notificationType,
      });
      expect(mockNSReportService.getStatusReport).toHaveBeenCalledTimes(1);
    });

    it('should handle SMS notification type successfully', async () => {
      // Arrange
      const smsRequest = { ...validRequest, notificationType: 'sms' };
      const mockSmsResponse = {
        downloadUrl:
          'https://s3.amazonaws.com/reports/sms-report-456.tsv?signature=def456',
        expiredTime: 1800, // 30 minutes
      };
      mockNSReportService.getStatusReport.mockResolvedValue(mockSmsResponse);

      // Act
      const response = await request(app.getHttpServer())
        .post('/api/v1/notification-status/reports')
        .set(validHeaders)
        .send(smsRequest)
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockSmsResponse);
      expect(mockNSReportService.getStatusReport).toHaveBeenCalledWith(
        smsRequest,
      );
    });

    it('should handle LINE notification type successfully', async () => {
      // Arrange
      const lineRequest = { ...validRequest, notificationType: 'line' };
      const mockLineResponse = {
        downloadUrl:
          'https://s3.amazonaws.com/reports/line-report-789.tsv?signature=ghi789',
        expiredTime: 7200, // 2 hours
      };
      mockNSReportService.getStatusReport.mockResolvedValue(mockLineResponse);

      // Act
      const response = await request(app.getHttpServer())
        .post('/api/v1/notification-status/reports')
        .set(validHeaders)
        .send(lineRequest)
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockLineResponse);
    });

    it('should handle EMAIL notification type successfully', async () => {
      // Arrange
      const emailRequest = { ...validRequest, notificationType: 'email' };
      const mockEmailResponse = {
        downloadUrl:
          'https://s3.amazonaws.com/reports/email-report-101.tsv?signature=jkl101',
        expiredTime: 10800, // 3 hours
      };
      mockNSReportService.getStatusReport.mockResolvedValue(mockEmailResponse);

      // Act
      const response = await request(app.getHttpServer())
        .post('/api/v1/notification-status/reports')
        .set(validHeaders)
        .send(emailRequest)
        .expect(200);

      // Assert
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockEmailResponse);
    });

    it('should generate unique request IDs for each request', async () => {
      // Arrange
      const mockResponse = {
        downloadUrl: 'https://s3.amazonaws.com/reports/test.tsv',
        expiredTime: 3600,
      };
      mockNSReportService.getStatusReport.mockResolvedValue(mockResponse);

      // Act: Make multiple requests
      const response1 = await request(app.getHttpServer())
        .post('/api/v1/notification-status/reports')
        .set(validHeaders)
        .send(validRequest);

      const response2 = await request(app.getHttpServer())
        .post('/api/v1/notification-status/reports')
        .set(validHeaders)
        .send(validRequest);

      // Assert: Request IDs are unique
      expect(response1.body.requestId).not.toBe(response2.body.requestId);
      expect(response1.body.requestId).toMatch(
        /^req-reports-\d+-[a-zA-Z0-9]+$/,
      );
      expect(response2.body.requestId).toMatch(
        /^req-reports-\d+-[a-zA-Z0-9]+$/,
      );
    });

    it('should include timestamp in ISO 8601 format', async () => {
      // Arrange
      const mockResponse = {
        downloadUrl: 'https://s3.amazonaws.com/reports/timestamp-test.tsv',
        expiredTime: 3600,
      };
      mockNSReportService.getStatusReport.mockResolvedValue(mockResponse);

      // Act
      const response = await request(app.getHttpServer())
        .post('/api/v1/notification-status/reports')
        .set(validHeaders)
        .send(validRequest)
        .expect(200);

      // Assert: Timestamp format
      const timestamp = response.body.timestamp;
      expect(timestamp).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
      );

      // Assert: Timestamp is recent (within 5 seconds)
      const requestTime = new Date(timestamp);
      const now = new Date();
      const diffMs = Math.abs(now.getTime() - requestTime.getTime());
      expect(diffMs).toBeLessThan(5000);
    });
  });
});
