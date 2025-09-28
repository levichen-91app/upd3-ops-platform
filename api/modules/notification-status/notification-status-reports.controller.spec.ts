import { Test, TestingModule } from '@nestjs/testing';
import { NotificationStatusController } from './notification-status.controller';
import { NotificationStatusService } from './notification-status.service';
import { NotificationStatusReportsService } from './services/notification-status-reports.service';
import { StatusReportRequestDto } from './dto/status-report-request.dto';

/**
 * 單元測試：通知狀態報告控制器
 *
 * 測試 POST /api/v1/notification-status/reports 端點的核心業務邏輯
 * 認證由 NyOperatorGuard 處理，不在控制器單元測試範圍內
 */
describe('NotificationStatusController - Reports', () => {
  let controller: NotificationStatusController;
  let reportsService: NotificationStatusReportsService;

  // Mock services
  const mockNotificationStatusService = {
    getNotificationDetail: jest.fn(),
    getDevices: jest.fn(),
    getNotificationHistory: jest.fn(),
  };

  const mockReportsService = {
    getStatusReport: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationStatusController],
      providers: [
        { provide: NotificationStatusService, useValue: mockNotificationStatusService },
        { provide: NotificationStatusReportsService, useValue: mockReportsService },
      ],
    }).compile();

    controller = module.get<NotificationStatusController>(NotificationStatusController);
    reportsService = module.get<NotificationStatusReportsService>(NotificationStatusReportsService);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getStatusReports', () => {
    const validRequest: StatusReportRequestDto = {
      nsId: 'd68e720f-62ed-4955-802b-8e3f04c56a19',
      notificationDate: '2024/01/15',
      notificationType: 'push',
    };

    const mockRequest = {
      requestId: 'req-20250928143052-a8b2c4d6-dd70-4edd-9f86-a2cfc0e8be22',
    } as any;

    it('should successfully return report data from service', async () => {
      // Arrange: Mock service response (raw data)
      const mockServiceResponse = {
        downloadUrl: 'mock-download-url',
        expiredTime: 3600,
      };
      mockReportsService.getStatusReport.mockResolvedValue(mockServiceResponse);

      // Act
      const result = await controller.getStatusReports(validRequest, mockRequest);

      // Assert: Service called correctly with requestId
      expect(mockReportsService.getStatusReport).toHaveBeenCalledWith(validRequest, mockRequest.requestId);
      expect(mockReportsService.getStatusReport).toHaveBeenCalledTimes(1);

      // Assert: Raw data response passed through correctly
      expect(result).toEqual(mockServiceResponse);
    });

    it('should handle all supported notification types', async () => {
      // Arrange: Mock response (raw data)
      const mockResponse = {
        downloadUrl: 'mock-type-url',
        expiredTime: 1800,
      };
      mockReportsService.getStatusReport.mockResolvedValue(mockResponse);

      const supportedTypes = ['sms', 'push', 'line', 'email'];

      // Act & Assert: Test each notification type
      for (const notificationType of supportedTypes) {
        const request = { ...validRequest, notificationType };
        const result = await controller.getStatusReports(request, mockRequest);

        // Assert
        expect(mockReportsService.getStatusReport).toHaveBeenCalledWith(request, mockRequest.requestId);
        expect(result).toEqual(mockResponse);

        jest.clearAllMocks();
        mockReportsService.getStatusReport.mockResolvedValue(mockResponse);
      }
    });

    it('should propagate service errors correctly', async () => {
      // Arrange: Mock service error
      const serviceError = new Error('External NS Report API failed');
      mockReportsService.getStatusReport.mockRejectedValue(serviceError);

      // Act & Assert: Error should be propagated
      await expect(controller.getStatusReports(validRequest, mockRequest)).rejects.toThrow('External NS Report API failed');

      // Assert: Service was called
      expect(mockReportsService.getStatusReport).toHaveBeenCalledWith(validRequest, mockRequest.requestId);
    });

    it('should handle concurrent requests independently', async () => {
      // Arrange: Mock different responses (raw data)
      const mockResponse1 = {
        downloadUrl: 'mock-report1-url',
        expiredTime: 3600
      };
      const mockResponse2 = {
        downloadUrl: 'mock-report2-url',
        expiredTime: 7200
      };

      mockReportsService.getStatusReport
        .mockResolvedValueOnce(mockResponse1)
        .mockResolvedValueOnce(mockResponse2);

      // Act: Concurrent requests
      const [result1, result2] = await Promise.all([
        controller.getStatusReports(validRequest, mockRequest),
        controller.getStatusReports(validRequest, mockRequest),
      ]);

      // Assert: Different responses returned
      expect(result1).toEqual(mockResponse1);
      expect(result2).toEqual(mockResponse2);
      expect(mockReportsService.getStatusReport).toHaveBeenCalledTimes(2);
    });
  });
});