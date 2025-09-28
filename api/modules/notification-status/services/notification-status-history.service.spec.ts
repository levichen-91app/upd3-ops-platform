import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { NotificationStatusService } from '../notification-status.service';
import { NC_DETAIL_SERVICE_TOKEN } from '../interfaces/nc-detail.interface';
import { MARKETING_CLOUD_SERVICE_TOKEN } from '../interfaces/marketing-cloud.interface';
import { WHALE_API_SERVICE_TOKEN, IWhaleApiService } from '../interfaces/whale-api.interface';
import { NotificationStatus } from '../dto/notification-history.dto';

describe('NotificationStatusService - History Method Only', () => {
  let service: NotificationStatusService;
  let mockWhaleApiService: jest.Mocked<IWhaleApiService>;

  const mockNcDetailService = {
    getNotificationDetail: jest.fn(),
  };

  const mockMarketingCloudService = {
    getDevices: jest.fn(),
  };

  beforeEach(async () => {
    mockWhaleApiService = {
      getNotificationHistory: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationStatusService,
        { provide: NC_DETAIL_SERVICE_TOKEN, useValue: mockNcDetailService },
        { provide: MARKETING_CLOUD_SERVICE_TOKEN, useValue: mockMarketingCloudService },
        { provide: WHALE_API_SERVICE_TOKEN, useValue: mockWhaleApiService },
      ],
    }).compile();

    service = module.get<NotificationStatusService>(NotificationStatusService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getNotificationHistory', () => {
    it('should successfully retrieve and transform notification history', async () => {
      const notificationId = 12345;
      const mockWhaleResponse = {
        code: 'Success',
        message: null,
        data: {
          id: notificationId,
          channel: 'Push',
          bookDatetime: '2024-01-15T10:30:00Z',
          sentDatetime: '2024-01-15T10:35:00Z',
          ncId: 'a4070188-050d-47f7-ab24-2523145408cf',
          ncExtId: 67890,
          status: 'Success',
          isSettled: true,
          originalAudienceCount: 1000,
          filteredAudienceCount: 950,
          sentAudienceCount: 900,
          receivedAudienceCount: 850,
          sentFailedCount: 50,
          report: {
            Total: 1000,
            Sent: 950,
            Success: 900,
            Fail: 50,
            NoUser: 50,
          },
        },
      };

      mockWhaleApiService.getNotificationHistory.mockResolvedValue(mockWhaleResponse);

      const result = await service.getNotificationHistory(notificationId);

      expect(result.success).toBe(true);
      expect(result.data.id).toBe(notificationId);
      expect(result.data.channel).toBe('Push');
      expect(result.data.status).toBe(NotificationStatus.SUCCESS);
      expect(result.data.report.Total).toBe(1000);
      expect(result.requestId).toMatch(/^req-history-/);
      expect(result.timestamp).toBeDefined();
      expect(mockWhaleApiService.getNotificationHistory).toHaveBeenCalledWith(notificationId);
    });

    it('should handle different notification statuses correctly', async () => {
      const statusMappings = [
        { whaleStatus: 'Scheduled', expectedStatus: NotificationStatus.SCHEDULED },
        { whaleStatus: 'Sent', expectedStatus: NotificationStatus.SENT },
        { whaleStatus: 'Success', expectedStatus: NotificationStatus.SUCCESS },
        { whaleStatus: 'Fail', expectedStatus: NotificationStatus.FAIL },
        { whaleStatus: 'PartialFail', expectedStatus: NotificationStatus.PARTIAL_FAIL },
      ];

      for (const mapping of statusMappings) {
        const notificationId = Math.floor(Math.random() * 10000);
        const mockResponse = {
          code: 'Success',
          message: null,
          data: {
            id: notificationId,
            channel: 'Email',
            bookDatetime: '2024-01-15T10:30:00Z',
            sentDatetime: '2024-01-15T10:35:00Z',
            ncId: 'test-uuid',
            ncExtId: 123,
            status: mapping.whaleStatus,
            isSettled: true,
            originalAudienceCount: 100,
            filteredAudienceCount: 90,
            sentAudienceCount: 85,
            receivedAudienceCount: 80,
            sentFailedCount: 5,
            report: {
              Total: 100,
              Sent: 85,
              Success: 80,
              Fail: 5,
              NoUser: 10,
            },
          },
        };

        mockWhaleApiService.getNotificationHistory.mockResolvedValue(mockResponse);

        const result = await service.getNotificationHistory(notificationId);

        expect(result.data.status).toBe(mapping.expectedStatus);
      }
    });

    it('should throw NotFoundException when notification is not found (null response)', async () => {
      const notificationId = 99999;
      mockWhaleApiService.getNotificationHistory.mockResolvedValue(null);

      await expect(service.getNotificationHistory(notificationId)).rejects.toThrow(NotFoundException);

      const error = await service.getNotificationHistory(notificationId).catch(e => e);
      expect(error.getResponse()).toEqual({
        code: 'NOTIFICATION_NOT_FOUND',
        message: '找不到指定的通知',
        details: { notificationId },
      });
    });

    it('should throw NotFoundException when whale response has no data', async () => {
      const notificationId = 88888;
      const mockResponse = {
        code: 'Success',
        message: null,
        data: null,
      };

      mockWhaleApiService.getNotificationHistory.mockResolvedValue(mockResponse);

      await expect(service.getNotificationHistory(notificationId)).rejects.toThrow(NotFoundException);
    });

    it('should throw TIMEOUT_ERROR for timeout exceptions', async () => {
      const notificationId = 12345;
      const timeoutError = new Error('Timeout: Request took longer than 10000ms');

      mockWhaleApiService.getNotificationHistory.mockRejectedValue(timeoutError);

      await expect(service.getNotificationHistory(notificationId)).rejects.toThrow('TIMEOUT_ERROR');
    });

    it('should throw EXTERNAL_API_ERROR for axios HTTP errors', async () => {
      const notificationId = 12345;
      const axiosError = new Error('HTTP Error 500: Internal Server Error');
      axiosError.name = 'AxiosError';
      (axiosError as any).response = { status: 500 };

      mockWhaleApiService.getNotificationHistory.mockRejectedValue(axiosError);

      await expect(service.getNotificationHistory(notificationId)).rejects.toThrow('EXTERNAL_API_ERROR');
    });

    it('should throw EXTERNAL_API_ERROR for connection errors', async () => {
      const notificationId = 12345;
      const connectionError = new Error('ECONNREFUSED: Connection refused');

      mockWhaleApiService.getNotificationHistory.mockRejectedValue(connectionError);

      await expect(service.getNotificationHistory(notificationId)).rejects.toThrow('EXTERNAL_API_ERROR');
    });

    it('should throw EXTERNAL_API_ERROR for DNS errors', async () => {
      const notificationId = 12345;
      const dnsError = new Error('ENOTFOUND: getaddrinfo ENOTFOUND whale-api.example.com');

      mockWhaleApiService.getNotificationHistory.mockRejectedValue(dnsError);

      await expect(service.getNotificationHistory(notificationId)).rejects.toThrow('EXTERNAL_API_ERROR');
    });

    it('should re-throw NotFoundException without modification', async () => {
      const notificationId = 12345;
      const notFoundException = new NotFoundException({
        code: 'NOTIFICATION_NOT_FOUND',
        message: 'Custom not found message',
        details: { notificationId },
      });

      mockWhaleApiService.getNotificationHistory.mockRejectedValue(notFoundException);

      await expect(service.getNotificationHistory(notificationId)).rejects.toThrow(NotFoundException);
    });

    it('should treat unknown errors as EXTERNAL_API_ERROR', async () => {
      const notificationId = 12345;
      const unknownError = new Error('Some unexpected error');

      mockWhaleApiService.getNotificationHistory.mockRejectedValue(unknownError);

      await expect(service.getNotificationHistory(notificationId)).rejects.toThrow('EXTERNAL_API_ERROR');
    });

    it('should generate unique request IDs', async () => {
      const notificationId = 12345;
      const mockResponse = {
        code: 'Success',
        message: null,
        data: {
          id: notificationId,
          channel: 'Push',
          bookDatetime: '2024-01-15T10:30:00Z',
          sentDatetime: '2024-01-15T10:35:00Z',
          ncId: 'test-uuid',
          ncExtId: 123,
          status: 'Success',
          isSettled: true,
          originalAudienceCount: 100,
          filteredAudienceCount: 90,
          sentAudienceCount: 85,
          receivedAudienceCount: 80,
          sentFailedCount: 5,
          report: {
            Total: 100,
            Sent: 85,
            Success: 80,
            Fail: 5,
            NoUser: 10,
          },
        },
      };

      mockWhaleApiService.getNotificationHistory.mockResolvedValue(mockResponse);

      const result1 = await service.getNotificationHistory(notificationId);
      const result2 = await service.getNotificationHistory(notificationId);

      expect(result1.requestId).not.toBe(result2.requestId);
      expect(result1.requestId).toMatch(/^req-history-\d+-[a-f0-9]+$/);
      expect(result2.requestId).toMatch(/^req-history-\d+-[a-f0-9]+$/);
    });

    it('should handle null sentDatetime correctly', async () => {
      const notificationId = 12345;
      const mockResponse = {
        code: 'Success',
        message: null,
        data: {
          id: notificationId,
          channel: 'Push',
          bookDatetime: '2024-01-15T10:30:00Z',
          sentDatetime: null, // null sentDatetime for scheduled notifications
          ncId: 'test-uuid',
          ncExtId: 123,
          status: 'Scheduled',
          isSettled: false,
          originalAudienceCount: 100,
          filteredAudienceCount: 90,
          sentAudienceCount: 0,
          receivedAudienceCount: 0,
          sentFailedCount: 0,
          report: {
            Total: 100,
            Sent: 0,
            Success: 0,
            Fail: 0,
            NoUser: 100,
          },
        },
      };

      mockWhaleApiService.getNotificationHistory.mockResolvedValue(mockResponse);

      const result = await service.getNotificationHistory(notificationId);

      expect(result.success).toBe(true);
      expect(result.data.sentDatetime).toBeNull();
      expect(result.data.status).toBe(NotificationStatus.SCHEDULED);
      expect(result.data.isSettled).toBe(false);
    });
  });
});