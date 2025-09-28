import { Test, TestingModule } from '@nestjs/testing';
import { SuppliersService } from './suppliers.service';
import {
  IWhaleApiService,
  WHALE_API_SERVICE_TOKEN,
} from './interfaces/whale-api.interface';
import { SupplierUpdateRequestDto } from './dto/supplier-update-request.dto';

describe('SuppliersService', () => {
  let service: SuppliersService;
  let mockWhaleApiService: IWhaleApiService;

  beforeEach(async () => {
    const mockService = {
      updateSupplierId: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SuppliersService,
        {
          provide: WHALE_API_SERVICE_TOKEN,
          useValue: mockService,
        },
      ],
    }).compile();

    service = module.get<SuppliersService>(SuppliersService);
    mockWhaleApiService = module.get<IWhaleApiService>(WHALE_API_SERVICE_TOKEN);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('updateSupplierId', () => {
    it('should successfully update supplier ID', async () => {
      const shopId = 12345;
      const operator = 'test@91app.com';
      const updateDto: SupplierUpdateRequestDto = {
        market: 'TW',
        oldSupplierId: 100,
        newSupplierId: 200,
      };
      const expectedResult = { updatedCount: 5 };

      (mockWhaleApiService.updateSupplierId as jest.Mock).mockResolvedValue(
        expectedResult,
      );

      const result = await service.updateSupplierId(
        shopId,
        updateDto,
        operator,
      );

      expect(result).toEqual(expectedResult);
      expect(mockWhaleApiService.updateSupplierId).toHaveBeenCalledWith(
        shopId,
        updateDto,
        operator,
      );
      expect(mockWhaleApiService.updateSupplierId).toHaveBeenCalledTimes(1);
    });

    it('should handle zero updated records', async () => {
      const shopId = 12345;
      const operator = 'test@91app.com';
      const updateDto: SupplierUpdateRequestDto = {
        market: 'HK',
        oldSupplierId: 300,
        newSupplierId: 400,
      };
      const expectedResult = { updatedCount: 0 };

      (mockWhaleApiService.updateSupplierId as jest.Mock).mockResolvedValue(
        expectedResult,
      );

      const result = await service.updateSupplierId(
        shopId,
        updateDto,
        operator,
      );

      expect(result).toEqual(expectedResult);
      expect(mockWhaleApiService.updateSupplierId).toHaveBeenCalledWith(
        shopId,
        updateDto,
        operator,
      );
    });

    it('should propagate errors from whale API service', async () => {
      const shopId = 12345;
      const operator = 'test@91app.com';
      const updateDto: SupplierUpdateRequestDto = {
        market: 'MY',
        oldSupplierId: 500,
        newSupplierId: 600,
      };
      const error = new Error('External service error');

      (mockWhaleApiService.updateSupplierId as jest.Mock).mockRejectedValue(
        error,
      );

      await expect(
        service.updateSupplierId(shopId, updateDto, operator),
      ).rejects.toThrow('External service error');

      expect(mockWhaleApiService.updateSupplierId).toHaveBeenCalledWith(
        shopId,
        updateDto,
        operator,
      );
    });

    it('should handle large number of updated records', async () => {
      const shopId = 99999;
      const operator = 'admin@91app.com';
      const updateDto: SupplierUpdateRequestDto = {
        market: 'TW',
        oldSupplierId: 1,
        newSupplierId: 2,
      };
      const expectedResult = { updatedCount: 1000 };

      (mockWhaleApiService.updateSupplierId as jest.Mock).mockResolvedValue(
        expectedResult,
      );

      const result = await service.updateSupplierId(
        shopId,
        updateDto,
        operator,
      );

      expect(result).toEqual(expectedResult);
      expect(result.updatedCount).toBe(1000);
    });
  });
});
