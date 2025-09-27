import { Test, TestingModule } from '@nestjs/testing';
import { MarketingCloudService } from './marketing-cloud.service';
import {
  IMarketingCloudApiService,
  MARKETING_CLOUD_API_SERVICE_TOKEN,
} from './interfaces/marketing-cloud-api.interface';
import { Device } from './entities/device.entity';

describe('MarketingCloudService', () => {
  let service: MarketingCloudService;
  let mockMarketingCloudApiService: IMarketingCloudApiService;

  beforeEach(async () => {
    const mockApiService = {
      getMemberDevices: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MarketingCloudService,
        {
          provide: MARKETING_CLOUD_API_SERVICE_TOKEN,
          useValue: mockApiService,
        },
      ],
    }).compile();

    service = module.get<MarketingCloudService>(MarketingCloudService);
    mockMarketingCloudApiService = module.get<IMarketingCloudApiService>(
      MARKETING_CLOUD_API_SERVICE_TOKEN,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getMemberDevices', () => {
    const mockDevices: Device[] = [
      {
        guid: 'device-guid-1',
        udid: 'device-udid-1',
        token: 'push-token-1',
        shopId: 12345,
        platformDef: 'iOS',
        memberId: 100,
        advertiseId: 'ad-id-1',
        appVersion: '1.2.0',
        updatedDateTime: '2023-12-01T14:45:00Z',
        createdDateTime: '2023-01-15T10:30:00Z',
      },
      {
        guid: 'device-guid-2',
        udid: 'device-udid-2',
        token: 'push-token-2',
        shopId: 12345,
        platformDef: 'Android',
        memberId: 101,
        advertiseId: 'ad-id-2',
        appVersion: '1.2.0',
        updatedDateTime: '2023-11-30T16:20:00Z',
        createdDateTime: '2023-02-20T09:15:00Z',
      },
    ];

    it('should successfully get member devices', async () => {
      const shopId = 12345;
      const phone = '0912345678';
      const operator = 'test@91app.com';

      const mockApiResponse = { devices: mockDevices };
      (mockMarketingCloudApiService.getMemberDevices as jest.Mock).mockResolvedValue(
        mockApiResponse,
      );

      const result = await service.getMemberDevices(shopId, phone, operator);

      expect(result).toEqual({
        shopId,
        phone,
        devices: mockDevices,
        totalCount: 2,
      });
      expect(mockMarketingCloudApiService.getMemberDevices).toHaveBeenCalledWith(
        shopId,
        phone,
        operator,
      );
      expect(mockMarketingCloudApiService.getMemberDevices).toHaveBeenCalledTimes(1);
    });

    it('should handle empty device list', async () => {
      const shopId = 99999;
      const phone = '0987654321';
      const operator = 'admin@91app.com';

      const mockApiResponse = { devices: [] };
      (mockMarketingCloudApiService.getMemberDevices as jest.Mock).mockResolvedValue(
        mockApiResponse,
      );

      const result = await service.getMemberDevices(shopId, phone, operator);

      expect(result).toEqual({
        shopId,
        phone,
        devices: [],
        totalCount: 0,
      });
      expect(mockMarketingCloudApiService.getMemberDevices).toHaveBeenCalledWith(
        shopId,
        phone,
        operator,
      );
    });

    it('should handle single device', async () => {
      const shopId = 54321;
      const phone = '0955123456';
      const operator = 'user@91app.com';
      const singleDevice = mockDevices[0];

      const mockApiResponse = { devices: [singleDevice] };
      (mockMarketingCloudApiService.getMemberDevices as jest.Mock).mockResolvedValue(
        mockApiResponse,
      );

      const result = await service.getMemberDevices(shopId, phone, operator);

      expect(result).toEqual({
        shopId,
        phone,
        devices: [singleDevice],
        totalCount: 1,
      });
      expect(mockMarketingCloudApiService.getMemberDevices).toHaveBeenCalledWith(
        shopId,
        phone,
        operator,
      );
    });

    it('should propagate errors from marketing cloud API service', async () => {
      const shopId = 12345;
      const phone = '0912345678';
      const operator = 'test@91app.com';
      const error = new Error('API service error');

      (mockMarketingCloudApiService.getMemberDevices as jest.Mock).mockRejectedValue(
        error,
      );

      await expect(
        service.getMemberDevices(shopId, phone, operator),
      ).rejects.toThrow('API service error');

      expect(mockMarketingCloudApiService.getMemberDevices).toHaveBeenCalledWith(
        shopId,
        phone,
        operator,
      );
    });

    it('should handle different shop IDs correctly', async () => {
      const phone = '0912345678';
      const operator = 'test@91app.com';
      const mockApiResponse = { devices: mockDevices };

      (mockMarketingCloudApiService.getMemberDevices as jest.Mock).mockResolvedValue(
        mockApiResponse,
      );

      // Test with different shop IDs
      const shopIds = [1, 999, 123456];

      for (const shopId of shopIds) {
        const result = await service.getMemberDevices(shopId, phone, operator);

        expect(result.shopId).toBe(shopId);
        expect(result.phone).toBe(phone);
        expect(result.devices).toEqual(mockDevices);
        expect(result.totalCount).toBe(2);
      }

      expect(mockMarketingCloudApiService.getMemberDevices).toHaveBeenCalledTimes(shopIds.length);
    });

    it('should handle different phone numbers correctly', async () => {
      const shopId = 12345;
      const operator = 'test@91app.com';
      const mockApiResponse = { devices: [] };

      (mockMarketingCloudApiService.getMemberDevices as jest.Mock).mockResolvedValue(
        mockApiResponse,
      );

      // Test with different phone numbers
      const phoneNumbers = ['0912345678', '0987654321', '0955123456'];

      for (const phone of phoneNumbers) {
        const result = await service.getMemberDevices(shopId, phone, operator);

        expect(result.shopId).toBe(shopId);
        expect(result.phone).toBe(phone);
        expect(result.devices).toEqual([]);
        expect(result.totalCount).toBe(0);
      }

      expect(mockMarketingCloudApiService.getMemberDevices).toHaveBeenCalledTimes(phoneNumbers.length);
    });
  });
});