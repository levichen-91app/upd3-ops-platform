import { Test, TestingModule } from '@nestjs/testing';
import { NotificationStatusService } from '../notification-status.service';
import { BusinessNotFoundException } from '../../../common/exceptions/business-logic.exception';
import { NC_DETAIL_SERVICE_TOKEN } from '../interfaces/nc-detail.interface';
import { MARKETING_CLOUD_SERVICE_TOKEN } from '../interfaces/marketing-cloud.interface';
import {
  WHALE_API_SERVICE_TOKEN,
  IWhaleApiService,
} from '../interfaces/whale-api.interface';
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
        {
          provide: MARKETING_CLOUD_SERVICE_TOKEN,
          useValue: mockMarketingCloudService,
        },
        { provide: WHALE_API_SERVICE_TOKEN, useValue: mockWhaleApiService },
      ],
    }).compile();

    service = module.get<NotificationStatusService>(NotificationStatusService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getNotificationHistory', () => {
    const testRequestId =
      'req-20250928143052-a8b2c4d6-dd70-4edd-9f86-a2cfc0e8be22';

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

      mockWhaleApiService.getNotificationHistory.mockResolvedValue(
        mockWhaleResponse,
      );

      const result = await service.getNotificationHistory(
        notificationId,
        testRequestId,
      );

      expect(result.success).toBe(true);
      expect(result.data.id).toBe(notificationId);
      expect(result.data.channel).toBe('Push');
      expect(result.data.status).toBe(NotificationStatus.SUCCESS);
      expect(result.data.report.Total).toBe(1000);
      expect(result.requestId).toBe(testRequestId);
      expect(result.timestamp).toBeDefined();
      expect(mockWhaleApiService.getNotificationHistory).toHaveBeenCalledWith(
        notificationId,
      );
    });

    it('should handle different notification statuses correctly', async () => {
      const statusMappings = [
        {
          whaleStatus: 'Scheduled',
          expectedStatus: NotificationStatus.SCHEDULED,
        },
        { whaleStatus: 'Sent', expectedStatus: NotificationStatus.SENT },
        { whaleStatus: 'Success', expectedStatus: NotificationStatus.SUCCESS },
        { whaleStatus: 'Fail', expectedStatus: NotificationStatus.FAIL },
        {
          whaleStatus: 'PartialFail',
          expectedStatus: NotificationStatus.PARTIAL_FAIL,
        },
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

        mockWhaleApiService.getNotificationHistory.mockResolvedValue(
          mockResponse,
        );

        const result = await service.getNotificationHistory(
          notificationId,
          testRequestId,
        );

        expect(result.data.status).toBe(mapping.expectedStatus);
      }
    });

    it('should throw BusinessNotFoundException when notification is not found (null response)', async () => {
      const notificationId = 99999;
      mockWhaleApiService.getNotificationHistory.mockResolvedValue(null);

      await expect(
        service.getNotificationHistory(notificationId, testRequestId),
      ).rejects.toThrow(BusinessNotFoundException);

      const error = await service
        .getNotificationHistory(notificationId, testRequestId)
        .catch((e) => e);
      const response = error.getResponse();
      expect(response.code).toBe('NOT_FOUND');
      expect(response.message).toBe('找不到指定的通知');
      expect(response.details).toHaveLength(1);
      expect(response.details[0]).toMatchObject({
        '@type': 'type.upd3ops.com/ResourceInfo',
        notificationId,
      });
    });

    it('should throw BusinessNotFoundException when whale response has no data', async () => {
      const notificationId = 88888;
      const mockResponse = {
        code: 'Success',
        message: null,
        data: null,
      };

      mockWhaleApiService.getNotificationHistory.mockResolvedValue(
        mockResponse,
      );

      await expect(
        service.getNotificationHistory(notificationId, testRequestId),
      ).rejects.toThrow(BusinessNotFoundException);
    });

    it('should re-throw errors from WhaleApiService without modification', async () => {
      const notificationId = 12345;
      const externalError = new Error('External API error from WhaleApiService');

      mockWhaleApiService.getNotificationHistory.mockRejectedValue(
        externalError,
      );

      await expect(
        service.getNotificationHistory(notificationId, testRequestId),
      ).rejects.toThrow(externalError);
    });

    it('should re-throw BusinessNotFoundException without modification', async () => {
      const notificationId = 12345;
      const businessError = new BusinessNotFoundException(
        'Custom not found message',
        { notificationId },
      );

      mockWhaleApiService.getNotificationHistory.mockRejectedValue(
        businessError,
      );

      await expect(
        service.getNotificationHistory(notificationId, testRequestId),
      ).rejects.toThrow(BusinessNotFoundException);

      await expect(
        service.getNotificationHistory(notificationId, testRequestId),
      ).rejects.toThrow('Custom not found message');
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

      mockWhaleApiService.getNotificationHistory.mockResolvedValue(
        mockResponse,
      );

      const requestId1 =
        'req-20250928143052-a8b2c4d6-dd70-4edd-9f86-a2cfc0e8be22';
      const requestId2 =
        'req-20250928143053-b9c3d5e7-ee81-5fee-a097-b3dfd1f9cf33';

      const result1 = await service.getNotificationHistory(
        notificationId,
        requestId1,
      );
      const result2 = await service.getNotificationHistory(
        notificationId,
        requestId2,
      );

      expect(result1.requestId).toBe(requestId1);
      expect(result2.requestId).toBe(requestId2);
      expect(result1.requestId).not.toBe(result2.requestId);
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

      mockWhaleApiService.getNotificationHistory.mockResolvedValue(
        mockResponse,
      );

      const result = await service.getNotificationHistory(
        notificationId,
        testRequestId,
      );

      expect(result.success).toBe(true);
      expect(result.data.sentDatetime).toBeNull();
      expect(result.data.status).toBe(NotificationStatus.SCHEDULED);
      expect(result.data.isSettled).toBe(false);
    });
  });
});
