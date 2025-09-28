import { Test, TestingModule } from '@nestjs/testing';
import { NotificationStatusReportsService } from './notification-status-reports.service';
import { INSReportService, NS_REPORT_SERVICE_TOKEN } from './ns-report.service.interface';
import { RequestIdService } from '../../../common/services/request-id.service';
import { StatusReportRequestDto } from '../dto/status-report-request.dto';

/**
 * 單元測試：通知狀態報告服務
 *
 * 測試 NotificationStatusReportsService 的業務邏輯：
 * - 報告查詢成功流程
 * - 依賴服務整合 (INSReportService, RequestIdService)
 * - 錯誤處理和異常轉換
 * - Request ID 生成整合
 * - 回應資料轉換
 *
 * 注意：此測試會在實作前失敗 (TDD 紅燈階段)
 * 使用 mock 依賴服務，測試業務邏輯層
 */
describe('NotificationStatusReportsService', () => {
  let service: NotificationStatusReportsService;
  let nsReportService: INSReportService;
  let requestIdService: RequestIdService;

  // Mock INSReportService
  const mockNSReportService = {
    getStatusReport: jest.fn(),
  };

  // Mock RequestIdService
  const mockRequestIdService = {
    generateRequestId: jest.fn(),
    validateRequestId: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationStatusReportsService,
        { provide: NS_REPORT_SERVICE_TOKEN, useValue: mockNSReportService },
        { provide: RequestIdService, useValue: mockRequestIdService },
      ],
    }).compile();

    service = module.get<NotificationStatusReportsService>(NotificationStatusReportsService);
    nsReportService = module.get<INSReportService>(NS_REPORT_SERVICE_TOKEN);
    requestIdService = module.get<RequestIdService>(RequestIdService);
  });

  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock setup
    mockRequestIdService.generateRequestId.mockImplementation((prefix: string) =>
      `req-${prefix}-1234567890-abc123`
    );
  });

  describe('getStatusReport', () => {
    const validRequest: StatusReportRequestDto = {
      nsId: 'd68e720f-62ed-4955-802b-8e3f04c56a19',
      notificationDate: '2024/01/15',
      notificationType: 'push',
    };

    it('should successfully return report data with request ID', async () => {
      // Arrange: Mock successful external API response
      const mockExternalResponse = {
        downloadUrl: 'https://s3.amazonaws.com/reports/test-report.tsv?signature=abc123',
        expiredTime: 3600,
      };
      mockNSReportService.getStatusReport.mockResolvedValue(mockExternalResponse);

      // Act
      const result = await service.getStatusReport(validRequest);

      // Assert: Request ID generation
      expect(mockRequestIdService.generateRequestId).toHaveBeenCalledWith('reports');

      // Assert: External service called with correct parameters
      expect(mockNSReportService.getStatusReport).toHaveBeenCalledWith(validRequest);
      expect(mockNSReportService.getStatusReport).toHaveBeenCalledTimes(1);

      // Assert: Response structure
      expect(result).toEqual({
        success: true,
        data: {
          downloadUrl: mockExternalResponse.downloadUrl,
          expiredTime: mockExternalResponse.expiredTime,
        },
        requestId: 'req-reports-1234567890-abc123',
        timestamp: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/),
      });
    });

    it('should handle all supported notification types', async () => {
      // Arrange: Mock responses for different types
      const mockResponse = {
        downloadUrl: 'https://s3.aws.com/reports/type-specific.tsv',
        expiredTime: 1800,
      };
      mockNSReportService.getStatusReport.mockResolvedValue(mockResponse);

      const notificationTypes = ['sms', 'push', 'line', 'email'];

      // Act & Assert: Test each notification type
      for (const notificationType of notificationTypes) {
        const request = { ...validRequest, notificationType };
        const result = await service.getStatusReport(request);

        // Assert: Correct service call
        expect(mockNSReportService.getStatusReport).toHaveBeenCalledWith(request);

        // Assert: Successful response
        expect(result.success).toBe(true);
        expect(result.data).toEqual(mockResponse);

        jest.clearAllMocks();
        mockRequestIdService.generateRequestId.mockReturnValue(`req-reports-${Date.now()}-${Math.random()}`);
      }
    });

    it('should generate unique request ID for each request', async () => {
      // Arrange: Mock multiple unique request IDs
      const mockResponse = {
        downloadUrl: 'https://s3.aws.com/test.tsv',
        expiredTime: 3600,
      };
      mockNSReportService.getStatusReport.mockResolvedValue(mockResponse);

      mockRequestIdService.generateRequestId
        .mockReturnValueOnce('req-reports-1111-aaa')
        .mockReturnValueOnce('req-reports-2222-bbb')
        .mockReturnValueOnce('req-reports-3333-ccc');

      // Act: Multiple requests
      const result1 = await service.getStatusReport(validRequest);
      const result2 = await service.getStatusReport(validRequest);
      const result3 = await service.getStatusReport(validRequest);

      // Assert: Different request IDs generated
      expect(result1.requestId).toBe('req-reports-1111-aaa');
      expect(result2.requestId).toBe('req-reports-2222-bbb');
      expect(result3.requestId).toBe('req-reports-3333-ccc');

      // Assert: RequestIdService called correctly
      expect(mockRequestIdService.generateRequestId).toHaveBeenCalledTimes(3);
      expect(mockRequestIdService.generateRequestId).toHaveBeenCalledWith('reports');
    });

    it('should include accurate timestamp in response', async () => {
      // Arrange
      const mockResponse = {
        downloadUrl: 'https://s3.aws.com/timestamp-test.tsv',
        expiredTime: 7200,
      };
      mockNSReportService.getStatusReport.mockResolvedValue(mockResponse);

      const beforeTime = new Date();

      // Act
      const result = await service.getStatusReport(validRequest);

      const afterTime = new Date();
      const responseTime = new Date(result.timestamp);

      // Assert: Timestamp within request timeframe
      expect(responseTime.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
      expect(responseTime.getTime()).toBeLessThanOrEqual(afterTime.getTime());

      // Assert: ISO 8601 format
      expect(result.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });

    it('should convert external API exception to proper error response', async () => {
      // Arrange: Mock external API failure
      const externalError = new Error('External NS Report API failed');
      externalError.name = 'ExternalApiException';
      mockNSReportService.getStatusReport.mockRejectedValue(externalError);

      // Act & Assert
      await expect(service.getStatusReport(validRequest)).rejects.toThrow('External NS Report API failed');

      // Assert: External service was called
      expect(mockNSReportService.getStatusReport).toHaveBeenCalledWith(validRequest);

      // Assert: Request ID still generated (for error tracking)
      expect(mockRequestIdService.generateRequestId).toHaveBeenCalledWith('reports');
    });

    it('should handle timeout errors from external service', async () => {
      // Arrange: Mock timeout error
      const timeoutError = new Error('Request timeout');
      timeoutError.name = 'TimeoutError';
      mockNSReportService.getStatusReport.mockRejectedValue(timeoutError);

      // Act & Assert
      await expect(service.getStatusReport(validRequest)).rejects.toThrow('Request timeout');
    });

    it('should handle connection errors from external service', async () => {
      // Arrange: Mock connection error
      const connectionError = new Error('ECONNREFUSED');
      connectionError.name = 'ConnectionError';
      mockNSReportService.getStatusReport.mockRejectedValue(connectionError);

      // Act & Assert
      await expect(service.getStatusReport(validRequest)).rejects.toThrow('ECONNREFUSED');
    });

    it('should handle invalid response format from external service', async () => {
      // Arrange: Mock invalid response
      const invalidFormatError = new Error('Invalid response format from NS Report API');
      invalidFormatError.name = 'InvalidResponseError';
      mockNSReportService.getStatusReport.mockRejectedValue(invalidFormatError);

      // Act & Assert
      await expect(service.getStatusReport(validRequest)).rejects.toThrow('Invalid response format from NS Report API');
    });
  });

  describe('Error handling integration', () => {
    const validRequest: StatusReportRequestDto = {
      nsId: 'd68e720f-62ed-4955-802b-8e3f04c56a19',
      notificationDate: '2024/01/15',
      notificationType: 'push',
    };

    it('should preserve error details from external service', async () => {
      // Arrange: Mock error with details
      const detailedError = new Error('External API returned status 500');
      (detailedError as any).details = {
        statusCode: 500,
        statusText: 'Internal Server Error',
        originalMessage: 'Database connection failed',
      };
      mockNSReportService.getStatusReport.mockRejectedValue(detailedError);

      try {
        // Act
        await service.getStatusReport(validRequest);
        fail('Expected error to be thrown');
      } catch (error) {
        // Assert: Error details preserved
        expect(error.message).toBe('External API returned status 500');
        expect((error as any).details).toBeDefined();
        expect((error as any).details.statusCode).toBe(500);
      }
    });

    it('should handle multiple concurrent requests with errors', async () => {
      // Arrange: Mock different errors for different requests
      mockNSReportService.getStatusReport
        .mockRejectedValueOnce(new Error('Timeout error'))
        .mockRejectedValueOnce(new Error('Connection error'))
        .mockResolvedValueOnce({
          downloadUrl: 'https://s3.aws.com/success.tsv',
          expiredTime: 3600,
        });

      // Act: Multiple concurrent requests
      const results = await Promise.allSettled([
        service.getStatusReport(validRequest),
        service.getStatusReport(validRequest),
        service.getStatusReport(validRequest),
      ]);

      // Assert: Different outcomes
      expect(results[0].status).toBe('rejected');
      expect(results[1].status).toBe('rejected');
      expect(results[2].status).toBe('fulfilled');

      // Assert: All requests generated request IDs
      expect(mockRequestIdService.generateRequestId).toHaveBeenCalledTimes(3);
    });
  });

  describe('Service dependencies integration', () => {
    it('should properly integrate with RequestIdService', async () => {
      // Arrange
      const customRequestId = 'custom-req-reports-9999-xyz789';
      mockRequestIdService.generateRequestId.mockReturnValue(customRequestId);

      const mockResponse = {
        downloadUrl: 'https://s3.aws.com/integration-test.tsv',
        expiredTime: 1800,
      };
      mockNSReportService.getStatusReport.mockResolvedValue(mockResponse);

      // Act
      const result = await service.getStatusReport({
        nsId: 'test-uuid',
        notificationDate: '2024/06/30',
        notificationType: 'sms',
      });

      // Assert: RequestIdService integration
      expect(mockRequestIdService.generateRequestId).toHaveBeenCalledWith('reports');
      expect(result.requestId).toBe(customRequestId);
    });

    it('should properly integrate with INSReportService', async () => {
      // Arrange: Specific request data
      const specificRequest: StatusReportRequestDto = {
        nsId: 'specific-test-uuid-12345',
        notificationDate: '2024/03/20',
        notificationType: 'line',
      };

      const specificResponse = {
        downloadUrl: 'https://s3.aws.com/specific-line-report.tsv?sig=specific123',
        expiredTime: 2400,
      };
      mockNSReportService.getStatusReport.mockResolvedValue(specificResponse);

      // Act
      const result = await service.getStatusReport(specificRequest);

      // Assert: Exact data passed to and returned from INSReportService
      expect(mockNSReportService.getStatusReport).toHaveBeenCalledWith(specificRequest);
      expect(result.data).toEqual(specificResponse);
    });
  });
});