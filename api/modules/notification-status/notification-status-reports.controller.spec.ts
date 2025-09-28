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

    it('should successfully return report data from service', async () => {
      // Arrange: Mock service response (no real URLs)
      const mockServiceResponse = {
        success: true,
        data: {
          downloadUrl: 'mock-download-url',
          expiredTime: 3600,
        },
        requestId: 'req-reports-1234567890-abc123',
        timestamp: '2024-01-15T10:30:00.000Z',
      };
      mockReportsService.getStatusReport.mockResolvedValue(mockServiceResponse);

      // Act
      const result = await controller.getStatusReports(validRequest);

      // Assert: Service called correctly
      expect(mockReportsService.getStatusReport).toHaveBeenCalledWith(validRequest);
      expect(mockReportsService.getStatusReport).toHaveBeenCalledTimes(1);

      // Assert: Response passed through correctly
      expect(result).toEqual(mockServiceResponse);
    });

    it('should handle all supported notification types', async () => {
      // Arrange: Mock response (no real URLs)
      const mockResponse = {
        success: true,
        data: {
          downloadUrl: 'mock-type-test-url',
          expiredTime: 1800,
        },
        requestId: 'req-reports-test-123',
        timestamp: '2024-01-15T10:30:00.000Z',
      };
      mockReportsService.getStatusReport.mockResolvedValue(mockResponse);

      const supportedTypes = ['sms', 'push', 'line', 'email'];

      // Act & Assert: Test each notification type
      for (const notificationType of supportedTypes) {
        const request = { ...validRequest, notificationType };
        const result = await controller.getStatusReports(request);

        // Assert
        expect(mockReportsService.getStatusReport).toHaveBeenCalledWith(request);
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
      await expect(controller.getStatusReports(validRequest)).rejects.toThrow('External NS Report API failed');

      // Assert: Service was called
      expect(mockReportsService.getStatusReport).toHaveBeenCalledWith(validRequest);
    });

    it('should handle concurrent requests independently', async () => {
      // Arrange: Mock different responses (no real URLs)
      const mockResponse1 = {
        success: true,
        data: { downloadUrl: 'mock-report1-url', expiredTime: 3600 },
        requestId: 'req-reports-1111-aaa',
        timestamp: '2024-01-15T10:30:00.000Z',
      };

      const mockResponse2 = {
        success: true,
        data: { downloadUrl: 'mock-report2-url', expiredTime: 1800 },
        requestId: 'req-reports-2222-bbb',
        timestamp: '2024-01-15T10:30:01.000Z',
      };

      mockReportsService.getStatusReport
        .mockResolvedValueOnce(mockResponse1)
        .mockResolvedValueOnce(mockResponse2);

      // Act: Concurrent requests
      const [result1, result2] = await Promise.all([
        controller.getStatusReports(validRequest),
        controller.getStatusReports(validRequest),
      ]);

      // Assert: Different responses returned
      expect(result1).toEqual(mockResponse1);
      expect(result2).toEqual(mockResponse2);
      expect(mockReportsService.getStatusReport).toHaveBeenCalledTimes(2);
    });
  });
});