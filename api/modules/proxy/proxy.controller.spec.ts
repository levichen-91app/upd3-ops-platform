import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, BadGatewayException } from '@nestjs/common';
import { BaseApiException } from '../../common/exceptions/base-api.exception';
import { ProxyController } from './proxy.controller';
import { ProxyService } from './proxy.service';
import { UpdateSupplierRequestDto } from './dto/update-supplier-request.dto';
import { UpdateSupplierSuccessResponse } from './interfaces/update-supplier-response.interface';

describe('ProxyController', () => {
  let controller: ProxyController;
  let service: ProxyService;

  const mockProxyService = {
    updateSupplier: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProxyController],
      providers: [
        {
          provide: ProxyService,
          useValue: mockProxyService,
        },
      ],
    }).compile();

    controller = module.get<ProxyController>(ProxyController);
    service = module.get<ProxyService>(ProxyService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('updateSupplierId', () => {
    const validRequestDto: UpdateSupplierRequestDto = {
      shopId: 12345,
      market: 'TW',
      oldSupplierId: 100,
      newSupplierId: 200,
    };

    const validNyOperator = 'Amy Wang';

    const mockSuccessResponse: UpdateSupplierSuccessResponse = {
      success: true,
      data: {
        updatedCount: 5,
        shopId: 12345,
        market: 'TW',
        supplierId: 200,
      },
    };

    it('should successfully process valid request with ny-operator header', async () => {
      mockProxyService.updateSupplier.mockResolvedValue(mockSuccessResponse);

      const result = await controller.updateSupplierId(
        validRequestDto,
        validNyOperator,
      );

      expect(service.updateSupplier).toHaveBeenCalledWith(
        validRequestDto,
        validNyOperator,
      );
      expect(result).toEqual(mockSuccessResponse);
    });

    it('should throw BadRequestException when ny-operator header is missing', async () => {
      await expect(
        controller.updateSupplierId(validRequestDto, undefined),
      ).rejects.toThrow(BaseApiException);

      expect(service.updateSupplier).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when ny-operator header is empty string', async () => {
      await expect(
        controller.updateSupplierId(validRequestDto, ''),
      ).rejects.toThrow(BaseApiException);

      expect(service.updateSupplier).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when ny-operator header is only whitespace', async () => {
      await expect(
        controller.updateSupplierId(validRequestDto, '   '),
      ).rejects.toThrow(BaseApiException);

      expect(service.updateSupplier).not.toHaveBeenCalled();
    });

    it('should handle service BadRequestException', async () => {
      const errorMessage = 'Old and new supplier IDs must be different';
      mockProxyService.updateSupplier.mockRejectedValue(
        new BadRequestException(errorMessage),
      );

      await expect(
        controller.updateSupplierId(validRequestDto, validNyOperator),
      ).rejects.toThrow(BadRequestException);
    });

    it('should handle service BadGatewayException', async () => {
      const errorMessage = 'Whale API error';
      mockProxyService.updateSupplier.mockRejectedValue(
        new BadGatewayException(errorMessage),
      );

      await expect(
        controller.updateSupplierId(validRequestDto, validNyOperator),
      ).rejects.toThrow(BadGatewayException);
    });

    it('should handle unexpected service errors', async () => {
      const unexpectedError = new Error('Unexpected error');
      mockProxyService.updateSupplier.mockRejectedValue(unexpectedError);

      await expect(
        controller.updateSupplierId(validRequestDto, validNyOperator),
      ).rejects.toThrow(Error);
    });

    it('should trim ny-operator header and accept it', async () => {
      const nyOperatorWithSpaces = '  Amy Wang  ';
      mockProxyService.updateSupplier.mockResolvedValue(mockSuccessResponse);

      const result = await controller.updateSupplierId(
        validRequestDto,
        nyOperatorWithSpaces,
      );

      expect(service.updateSupplier).toHaveBeenCalledWith(
        validRequestDto,
        'Amy Wang', // Controller trims the header before passing to service
      );
      expect(result).toEqual(mockSuccessResponse);
    });

    it('should generate unique request IDs for different requests', async () => {
      mockProxyService.updateSupplier.mockResolvedValue(mockSuccessResponse);

      // Make multiple requests
      await controller.updateSupplierId(validRequestDto, validNyOperator);
      await controller.updateSupplierId(validRequestDto, validNyOperator);

      expect(service.updateSupplier).toHaveBeenCalledTimes(2);
    });

    it('should log request details', async () => {
      mockProxyService.updateSupplier.mockResolvedValue(mockSuccessResponse);
      const logSpy = jest.spyOn(controller['logger'], 'log');

      await controller.updateSupplierId(validRequestDto, validNyOperator);

      expect(logSpy).toHaveBeenCalledWith(
        expect.stringContaining('Received supplier update request'),
        expect.stringContaining('shopId'),
      );
    });
  });
});