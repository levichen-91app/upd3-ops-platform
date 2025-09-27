import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { MarketingCloudController } from './marketing-cloud.controller';
import { MarketingCloudService } from './marketing-cloud.service';
import { MemberDevicesData } from './dto/member-devices-response.dto';
import { Device } from './entities/device.entity';

describe('MarketingCloudController', () => {
  let controller: MarketingCloudController;
  let mockMarketingCloudService: Partial<MarketingCloudService>;

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
  ];

  beforeEach(async () => {
    mockMarketingCloudService = {
      getMemberDevices: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [MarketingCloudController],
      providers: [
        {
          provide: MarketingCloudService,
          useValue: mockMarketingCloudService,
        },
      ],
    }).compile();

    controller = module.get<MarketingCloudController>(MarketingCloudController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getMemberDevices', () => {
    const validShopId = '12345';
    const validPhone = '0912345678';
    const validOperator = 'test@91app.com';

    it('should successfully get member devices', async () => {
      const mockServiceResponse: MemberDevicesData = {
        shopId: 12345,
        phone: validPhone,
        devices: mockDevices,
        totalCount: 1,
      };

      (mockMarketingCloudService.getMemberDevices as jest.Mock).mockResolvedValue(
        mockServiceResponse,
      );

      const result = await controller.getMemberDevices(
        validShopId,
        validPhone,
        validOperator,
      );

      expect(result.success).toBe(true);
      expect(result.data.shopId).toBe(12345);
      expect(result.data.phone).toBe(validPhone);
      expect(result.data.devices).toEqual(mockDevices);
      expect(result.data.totalCount).toBe(1);
      expect(result.timestamp).toBeDefined();
      expect(result.requestId).toBeDefined();

      expect(mockMarketingCloudService.getMemberDevices).toHaveBeenCalledWith(
        12345,
        validPhone,
        validOperator,
      );
    });

    it('should handle empty devices list', async () => {
      const mockServiceResponse: MemberDevicesData = {
        shopId: 12345,
        phone: validPhone,
        devices: [],
        totalCount: 0,
      };

      (mockMarketingCloudService.getMemberDevices as jest.Mock).mockResolvedValue(
        mockServiceResponse,
      );

      const result = await controller.getMemberDevices(
        validShopId,
        validPhone,
        validOperator,
      );

      expect(result.success).toBe(true);
      expect(result.data.devices).toEqual([]);
      expect(result.data.totalCount).toBe(0);
    });

    it('should throw UnauthorizedException when operator header is missing', async () => {
      await expect(
        controller.getMemberDevices(validShopId, validPhone, undefined),
      ).rejects.toThrow(
        new UnauthorizedException('Missing ny-operator header'),
      );

      expect(mockMarketingCloudService.getMemberDevices).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when operator header is empty string', async () => {
      await expect(
        controller.getMemberDevices(validShopId, validPhone, ''),
      ).rejects.toThrow(
        new UnauthorizedException('Missing ny-operator header'),
      );

      expect(mockMarketingCloudService.getMemberDevices).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when shopId is not a number', async () => {
      await expect(
        controller.getMemberDevices('invalid', validPhone, validOperator),
      ).rejects.toThrow(
        new BadRequestException('Invalid shop ID format - must be a number'),
      );

      expect(mockMarketingCloudService.getMemberDevices).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when shopId is zero', async () => {
      await expect(
        controller.getMemberDevices('0', validPhone, validOperator),
      ).rejects.toThrow(
        new BadRequestException('Invalid shop ID - must be a positive integer'),
      );

      expect(mockMarketingCloudService.getMemberDevices).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when shopId is negative', async () => {
      await expect(
        controller.getMemberDevices('-1', validPhone, validOperator),
      ).rejects.toThrow(
        new BadRequestException('Invalid shop ID - must be a positive integer'),
      );

      expect(mockMarketingCloudService.getMemberDevices).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when phone is empty', async () => {
      await expect(
        controller.getMemberDevices(validShopId, '', validOperator),
      ).rejects.toThrow(
        new BadRequestException('Phone number cannot be empty'),
      );

      expect(mockMarketingCloudService.getMemberDevices).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when phone contains only whitespace', async () => {
      await expect(
        controller.getMemberDevices(validShopId, '   ', validOperator),
      ).rejects.toThrow(
        new BadRequestException('Phone number cannot be empty'),
      );

      expect(mockMarketingCloudService.getMemberDevices).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when phone contains URL encoded characters', async () => {
      await expect(
        controller.getMemberDevices(validShopId, '0912%20345678', validOperator),
      ).rejects.toThrow(
        new BadRequestException('Phone number contains invalid characters'),
      );

      expect(mockMarketingCloudService.getMemberDevices).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when phone contains plus sign', async () => {
      await expect(
        controller.getMemberDevices(validShopId, '+886912345678', validOperator),
      ).rejects.toThrow(
        new BadRequestException('Phone number contains invalid characters'),
      );

      expect(mockMarketingCloudService.getMemberDevices).not.toHaveBeenCalled();
    });

    it('should handle large shop IDs correctly', async () => {
      const largeShopId = '999999999';
      const mockServiceResponse: MemberDevicesData = {
        shopId: 999999999,
        phone: validPhone,
        devices: mockDevices,
        totalCount: 1,
      };

      (mockMarketingCloudService.getMemberDevices as jest.Mock).mockResolvedValue(
        mockServiceResponse,
      );

      const result = await controller.getMemberDevices(
        largeShopId,
        validPhone,
        validOperator,
      );

      expect(result.data.shopId).toBe(999999999);
      expect(mockMarketingCloudService.getMemberDevices).toHaveBeenCalledWith(
        999999999,
        validPhone,
        validOperator,
      );
    });

    it('should handle different phone number formats', async () => {
      const phoneNumbers = ['0912345678', '912345678', '09-1234-5678'];
      const mockServiceResponse: MemberDevicesData = {
        shopId: 12345,
        phone: '',
        devices: [],
        totalCount: 0,
      };

      (mockMarketingCloudService.getMemberDevices as jest.Mock).mockResolvedValue(
        mockServiceResponse,
      );

      for (const phone of phoneNumbers) {
        mockServiceResponse.phone = phone;

        const result = await controller.getMemberDevices(
          validShopId,
          phone,
          validOperator,
        );

        expect(result.data.phone).toBe(phone);
        expect(mockMarketingCloudService.getMemberDevices).toHaveBeenCalledWith(
          12345,
          phone,
          validOperator,
        );
      }

      expect(mockMarketingCloudService.getMemberDevices).toHaveBeenCalledTimes(phoneNumbers.length);
    });

    it('should propagate service errors', async () => {
      const error = new Error('Service error');
      (mockMarketingCloudService.getMemberDevices as jest.Mock).mockRejectedValue(
        error,
      );

      await expect(
        controller.getMemberDevices(validShopId, validPhone, validOperator),
      ).rejects.toThrow('Service error');

      expect(mockMarketingCloudService.getMemberDevices).toHaveBeenCalledWith(
        12345,
        validPhone,
        validOperator,
      );
    });

    it('should generate unique request IDs for different requests', async () => {
      const mockServiceResponse: MemberDevicesData = {
        shopId: 12345,
        phone: validPhone,
        devices: [],
        totalCount: 0,
      };

      (mockMarketingCloudService.getMemberDevices as jest.Mock).mockResolvedValue(
        mockServiceResponse,
      );

      const result1 = await controller.getMemberDevices(
        validShopId,
        validPhone,
        validOperator,
      );

      const result2 = await controller.getMemberDevices(
        validShopId,
        validPhone,
        validOperator,
      );

      expect(result1.requestId).toBeDefined();
      expect(result2.requestId).toBeDefined();
      expect(result1.requestId).not.toBe(result2.requestId);
    });
  });
});