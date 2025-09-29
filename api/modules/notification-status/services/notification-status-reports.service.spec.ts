import { Test, TestingModule } from '@nestjs/testing';
import { NotificationStatusReportsService } from './notification-status-reports.service';
import {
  INSReportService,
  NS_REPORT_SERVICE_TOKEN,
} from './ns-report.service.interface';
import { StatusReportRequestDto } from '../dto/status-report-request.dto';

/**
 * 單元測試：通知狀態報告服務
 *
 * 測試 NotificationStatusReportsService 的業務邏輯：
 * - 報告查詢成功流程
 * - 依賴服務整合 (INSReportService)
 * - 錯誤處理和異常轉換
 * - Request ID 統一使用
 * - 回應資料轉換
 *
 * 注意：此測試會在實作前失敗 (TDD 紅燈階段)
 * 使用 mock 依賴服務，測試業務邏輯層
 */
describe('NotificationStatusReportsService', () => {
  let service: NotificationStatusReportsService;
  let nsReportService: INSReportService;

  // Mock INSReportService
  const mockNSReportService = {
    getStatusReport: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationStatusReportsService,
        { provide: NS_REPORT_SERVICE_TOKEN, useValue: mockNSReportService },
      ],
    }).compile();

    service = module.get<NotificationStatusReportsService>(
      NotificationStatusReportsService,
    );
    nsReportService = module.get<INSReportService>(NS_REPORT_SERVICE_TOKEN);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getStatusReport', () => {
    const validRequest: StatusReportRequestDto = {
      nsId: 'd68e720f-62ed-4955-802b-8e3f04c56a19',
      notificationDate: '2024/01/15',
      notificationType: 'push',
    };

    const testRequestId =
      'req-20250928143052-a8b2c4d6-dd70-4edd-9f86-a2cfc0e8be22';

    it('should successfully return report data with request ID', async () => {
      // Arrange: Mock successful external API response
      const mockExternalResponse = {
        downloadUrl:
          'https://s3.amazonaws.com/reports/test-report.tsv?signature=abc123',
        expiredTime: 3600,
      };
      mockNSReportService.getStatusReport.mockResolvedValue(
        mockExternalResponse,
      );

      // Act
      const result = await service.getStatusReport(validRequest, testRequestId);

      // Assert: External service called with correct parameters
      expect(mockNSReportService.getStatusReport).toHaveBeenCalledWith(
        validRequest,
      );
      expect(mockNSReportService.getStatusReport).toHaveBeenCalledTimes(1);

      // Assert: Response structure (raw data without wrapping)
      expect(result).toEqual({
        downloadUrl: mockExternalResponse.downloadUrl,
        expiredTime: mockExternalResponse.expiredTime,
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
        const result = await service.getStatusReport(request, testRequestId);

        // Assert: Correct service call
        expect(mockNSReportService.getStatusReport).toHaveBeenCalledWith(
          request,
        );

        // Assert: Successful response (raw data)
        expect(result).toEqual(mockResponse);

        jest.clearAllMocks();
      }
    });

    it('should use provided request ID in response', async () => {
      // Arrange
      const mockResponse = {
        downloadUrl: 'https://s3.aws.com/test.tsv',
        expiredTime: 3600,
      };
      mockNSReportService.getStatusReport.mockResolvedValue(mockResponse);

      const requestId1 =
        'req-20250928143052-a8b2c4d6-dd70-4edd-9f86-a2cfc0e8be22';
      const requestId2 =
        'req-20250928143053-b9c3d5e7-ee81-5fee-a097-b3dfd1f9cf33';
      const requestId3 =
        'req-20250928143054-c0d4e6f8-ff92-6gff-b0a8-c4eee2e0dg44';

      // Act: Multiple requests with different request IDs
      const result1 = await service.getStatusReport(validRequest, requestId1);
      const result2 = await service.getStatusReport(validRequest, requestId2);
      const result3 = await service.getStatusReport(validRequest, requestId3);

      // Assert: Each response contains the expected data
      expect(result1).toEqual(mockResponse);
      expect(result2).toEqual(mockResponse);
      expect(result3).toEqual(mockResponse);
    });

    it('should return raw data without timestamp wrapper', async () => {
      // Arrange
      const mockResponse = {
        downloadUrl: 'https://s3.aws.com/timestamp-test.tsv',
        expiredTime: 7200,
      };
      mockNSReportService.getStatusReport.mockResolvedValue(mockResponse);

      // Act
      const result = await service.getStatusReport(validRequest, testRequestId);

      // Assert: Raw data structure (timestamp handled by interceptor)
      expect(result).toEqual(mockResponse);
      expect(result.timestamp).toBeUndefined(); // No timestamp in raw data
    });

    it('should propagate external API errors', async () => {
      // Arrange: Mock external API failure
      const externalError = new Error('External NS Report API failed');
      externalError.name = 'ExternalApiException';
      mockNSReportService.getStatusReport.mockRejectedValue(externalError);

      // Act & Assert
      await expect(
        service.getStatusReport(validRequest, testRequestId),
      ).rejects.toThrow('External NS Report API failed');

      // Assert: External service was called
      expect(mockNSReportService.getStatusReport).toHaveBeenCalledWith(
        validRequest,
      );
    });

    it('should handle timeout errors from external service', async () => {
      // Arrange: Mock timeout error
      const timeoutError = new Error('Request timeout');
      timeoutError.name = 'TimeoutError';
      mockNSReportService.getStatusReport.mockRejectedValue(timeoutError);

      // Act & Assert
      await expect(
        service.getStatusReport(validRequest, testRequestId),
      ).rejects.toThrow('Request timeout');
    });

    it('should handle connection errors from external service', async () => {
      // Arrange: Mock connection error
      const connectionError = new Error('ECONNREFUSED');
      connectionError.name = 'ConnectionError';
      mockNSReportService.getStatusReport.mockRejectedValue(connectionError);

      // Act & Assert
      await expect(
        service.getStatusReport(validRequest, testRequestId),
      ).rejects.toThrow('ECONNREFUSED');
    });
  });

  describe('Service dependencies integration', () => {
    const testRequestId =
      'req-20250928143052-a8b2c4d6-dd70-4edd-9f86-a2cfc0e8be22';

    it('should properly integrate with INSReportService', async () => {
      // Arrange: Specific request data
      const specificRequest: StatusReportRequestDto = {
        nsId: 'specific-test-uuid-12345',
        notificationDate: '2024/03/20',
        notificationType: 'line',
      };

      const specificResponse = {
        downloadUrl:
          'https://s3.aws.com/specific-line-report.tsv?sig=specific123',
        expiredTime: 2400,
      };
      mockNSReportService.getStatusReport.mockResolvedValue(specificResponse);

      // Act
      const result = await service.getStatusReport(
        specificRequest,
        testRequestId,
      );

      // Assert: Exact data passed to and returned from INSReportService
      expect(mockNSReportService.getStatusReport).toHaveBeenCalledWith(
        specificRequest,
      );
      expect(result).toEqual(specificResponse);
    });
  });
});
