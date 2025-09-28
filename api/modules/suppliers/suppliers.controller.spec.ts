import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { SuppliersController } from './suppliers.controller';
import { SuppliersService } from './suppliers.service';
import { SupplierUpdateRequestDto } from './dto/supplier-update-request.dto';
import { ErrorCode } from '../../common/enums/error-code.enum';

describe('SuppliersController', () => {
  let controller: SuppliersController;
  let mockSuppliersService: Partial<SuppliersService>;

  beforeEach(async () => {
    mockSuppliersService = {
      updateSupplierId: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SuppliersController],
      providers: [
        {
          provide: SuppliersService,
          useValue: mockSuppliersService,
        },
      ],
    }).compile();

    controller = module.get<SuppliersController>(SuppliersController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('updateSupplierId', () => {
    const validShopId = 12345;
    const validOperator = 'test@91app.com';
    const validUpdateDto: SupplierUpdateRequestDto = {
      market: 'TW',
      oldSupplierId: 100,
      newSupplierId: 200,
    };

    it('should successfully update supplier ID', async () => {
      const serviceResult = { updatedCount: 5 };
      (mockSuppliersService.updateSupplierId as jest.Mock).mockResolvedValue(
        serviceResult,
      );

      const result = await controller.updateSupplierId(
        validShopId,
        validOperator,
        validUpdateDto,
      );

      expect(result).toEqual({
        updatedCount: 5,
        shopId: validShopId,
        market: 'TW',
        supplierId: 200,
      });
      expect(mockSuppliersService.updateSupplierId).toHaveBeenCalledWith(
        validShopId,
        validUpdateDto,
        validOperator,
      );
    });

    it('should throw BadRequestException when shopId is zero', async () => {
      await expect(
        controller.updateSupplierId(0, validOperator, validUpdateDto),
      ).rejects.toThrow(
        new BadRequestException({
          code: ErrorCode.VALIDATION_ERROR,
          message: 'Shop ID must be a positive integer',
          details: { shopId: 0 },
        }),
      );

      expect(mockSuppliersService.updateSupplierId).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when shopId is negative', async () => {
      await expect(
        controller.updateSupplierId(-1, validOperator, validUpdateDto),
      ).rejects.toThrow(
        new BadRequestException({
          code: ErrorCode.VALIDATION_ERROR,
          message: 'Shop ID must be a positive integer',
          details: { shopId: -1 },
        }),
      );

      expect(mockSuppliersService.updateSupplierId).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when operator header is missing', async () => {
      await expect(
        controller.updateSupplierId(validShopId, '', validUpdateDto),
      ).rejects.toThrow(
        new UnauthorizedException({
          code: ErrorCode.UNAUTHORIZED_ACCESS,
          message: 'Missing or empty ny-operator header',
        }),
      );

      expect(mockSuppliersService.updateSupplierId).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException when operator header contains only spaces', async () => {
      await expect(
        controller.updateSupplierId(validShopId, '   ', validUpdateDto),
      ).rejects.toThrow(
        new UnauthorizedException({
          code: ErrorCode.UNAUTHORIZED_ACCESS,
          message: 'Missing or empty ny-operator header',
        }),
      );

      expect(mockSuppliersService.updateSupplierId).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when old and new supplier IDs are identical', async () => {
      const identicalDto: SupplierUpdateRequestDto = {
        market: 'TW',
        oldSupplierId: 100,
        newSupplierId: 100,
      };

      await expect(
        controller.updateSupplierId(validShopId, validOperator, identicalDto),
      ).rejects.toThrow(
        new BadRequestException({
          code: ErrorCode.SUPPLIER_IDS_IDENTICAL,
          message: 'Old and new supplier IDs must be different',
          details: {
            oldSupplierId: 100,
            newSupplierId: 100,
          },
        }),
      );

      expect(mockSuppliersService.updateSupplierId).not.toHaveBeenCalled();
    });

    it('should handle different markets correctly', async () => {
      const hkDto: SupplierUpdateRequestDto = {
        market: 'HK',
        oldSupplierId: 300,
        newSupplierId: 400,
      };
      const serviceResult = { updatedCount: 10 };
      (mockSuppliersService.updateSupplierId as jest.Mock).mockResolvedValue(
        serviceResult,
      );

      const result = await controller.updateSupplierId(
        validShopId,
        validOperator,
        hkDto,
      );

      expect(result).toEqual({
        updatedCount: 10,
        shopId: validShopId,
        market: 'HK',
        supplierId: 400,
      });
    });

    it('should handle zero updated records', async () => {
      const serviceResult = { updatedCount: 0 };
      (mockSuppliersService.updateSupplierId as jest.Mock).mockResolvedValue(
        serviceResult,
      );

      const result = await controller.updateSupplierId(
        validShopId,
        validOperator,
        validUpdateDto,
      );

      expect(result).toEqual({
        updatedCount: 0,
        shopId: validShopId,
        market: 'TW',
        supplierId: 200,
      });
    });

    it('should propagate service errors', async () => {
      const error = new Error('Service error');
      (mockSuppliersService.updateSupplierId as jest.Mock).mockRejectedValue(
        error,
      );

      await expect(
        controller.updateSupplierId(validShopId, validOperator, validUpdateDto),
      ).rejects.toThrow('Service error');

      expect(mockSuppliersService.updateSupplierId).toHaveBeenCalledWith(
        validShopId,
        validUpdateDto,
        validOperator,
      );
    });
  });
});
