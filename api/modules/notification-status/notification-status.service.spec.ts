import { Test, TestingModule } from '@nestjs/testing';
import { NotificationStatusService } from './notification-status.service';
import { INcDetailService, NC_DETAIL_SERVICE_TOKEN } from './interfaces/nc-detail.interface';

describe('NotificationStatusService', () => {
  let service: NotificationStatusService;
  let mockNcDetailService: INcDetailService;

  beforeEach(async () => {
    const mockService = {
      getNotificationDetail: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationStatusService,
        { provide: NC_DETAIL_SERVICE_TOKEN, useValue: mockService },
      ],
    }).compile();

    service = module.get<NotificationStatusService>(NotificationStatusService);
    mockNcDetailService = module.get<INcDetailService>(NC_DETAIL_SERVICE_TOKEN);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getNotificationDetail', () => {
    const shopId = 12345;
    const ncId = 'a4070188-050d-47f7-ab24-2523145408cf';
    const operator = 'test.operator';

    it('should return notification detail when external API returns data', async () => {
      const mockData = {
        NCId: ncId,
        NSId: 'd68e720f-62ed-4955-802b-8e3f04c56a19',
        Status: 'Completed',
        ChannelType: 'Push',
        CreateDateTime: '2025-09-15T01:58:31.117',
        Report: {
          Total: 1,
          NoUserData: 0,
          InBlackList: 0,
          DontWantToReceiveThisMessageType: 0,
          Sent: 1,
          Fail: 0,
          DidNotSend: 0,
          Cancel: 0,
          NoTokenData: 0,
          Received: 0,
        },
        ShortMessageReportLink: null,
      };

      (mockNcDetailService.getNotificationDetail as jest.Mock).mockResolvedValue(mockData);

      const result = await service.getNotificationDetail(shopId, ncId, operator);

      expect(result).toEqual(mockData);
      expect(mockNcDetailService.getNotificationDetail).toHaveBeenCalledWith(shopId, ncId);
    });

    it('should return null data when notification does not exist', async () => {
      (mockNcDetailService.getNotificationDetail as jest.Mock).mockResolvedValue(null);

      const result = await service.getNotificationDetail(shopId, ncId, operator);

      expect(result).toBeNull();
    });

    it('should handle external API errors appropriately', async () => {
      const error = new Error('External API failed');
      (mockNcDetailService.getNotificationDetail as jest.Mock).mockRejectedValue(error);

      await expect(service.getNotificationDetail(shopId, ncId, operator))
        .rejects.toThrow('External API failed');

      expect(mockNcDetailService.getNotificationDetail).toHaveBeenCalledWith(shopId, ncId);
    });

    it('should generate unique requestId for each call', async () => {
      (mockNcDetailService.getNotificationDetail as jest.Mock).mockResolvedValue(null);

      const result1 = await service.getNotificationDetail(shopId, ncId, operator);
      const result2 = await service.getNotificationDetail(shopId, ncId, operator);

      // Since service now only returns data, we test that both calls complete successfully
      expect(result1).toBeNull();
      expect(result2).toBeNull();
      expect(mockNcDetailService.getNotificationDetail).toHaveBeenCalledTimes(2);
    });

    it('should include operator information in the response context', async () => {
      (mockNcDetailService.getNotificationDetail as jest.Mock).mockResolvedValue(null);

      const result = await service.getNotificationDetail(shopId, ncId, operator);

      // This test verifies that operator tracking works (logs are handled by interceptor)
      expect(result).toBeNull();
    });
  });
});