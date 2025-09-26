import { Test, TestingModule } from '@nestjs/testing';
import { ProxyController } from '../api/src/modules/proxy/proxy.controller';
import { ProxyService } from '../api/src/modules/proxy/proxy.service';
import { ProxyModule } from '../api/src/modules/proxy/proxy.module';
import { BadRequestException } from '@nestjs/common';

describe('ProxyController - Header Validation Integration', () => {
  let controller: ProxyController;
  let service: ProxyService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ProxyModule],
    }).compile();

    controller = module.get<ProxyController>(ProxyController);
    service = module.get<ProxyService>(ProxyService);
  });

  it('should throw BadRequestException when ny-operator header is missing', async () => {
    const requestDto = {
      shopId: 12345,
      market: 'TW',
      oldSupplierId: 100,
      newSupplierId: 200,
    };

    // Simulate missing header by passing undefined
    await expect(
      controller.updateSupplierId(requestDto, undefined),
    ).rejects.toThrow(BadRequestException);

    await expect(
      controller.updateSupplierId(requestDto, undefined),
    ).rejects.toThrow('Missing required header: ny-operator');
  });

  it('should throw BadRequestException when ny-operator header is empty', async () => {
    const requestDto = {
      shopId: 12345,
      market: 'TW',
      oldSupplierId: 100,
      newSupplierId: 200,
    };

    // Test empty string
    await expect(controller.updateSupplierId(requestDto, '')).rejects.toThrow(
      BadRequestException,
    );

    // Test whitespace only
    await expect(
      controller.updateSupplierId(requestDto, '   '),
    ).rejects.toThrow(BadRequestException);
  });

  it('should accept valid ny-operator header values', async () => {
    // Mock successful service call
    const mockResponse = {
      success: true,
      data: { updatedCount: 1, shopId: 12345, market: 'TW', supplierId: 200 },
    };

    jest.spyOn(service, 'updateSupplier').mockResolvedValue(mockResponse);

    const requestDto = {
      shopId: 12345,
      market: 'TW',
      oldSupplierId: 100,
      newSupplierId: 200,
    };

    // Test valid header values
    const validHeaders = [
      'Amy Wang',
      'John Doe',
      'user@company.com',
      'User Name With Spaces',
      '測試使用者', // Unicode characters
    ];

    for (const header of validHeaders) {
      const result = await controller.updateSupplierId(requestDto, header);
      expect(result).toEqual(mockResponse);
      expect(service.updateSupplier).toHaveBeenCalledWith(requestDto, header);
    }
  });

  it('should validate header presence before calling service', async () => {
    const serviceUpdateSpy = jest.spyOn(service, 'updateSupplier');

    const requestDto = {
      shopId: 12345,
      market: 'TW',
      oldSupplierId: 100,
      newSupplierId: 200,
    };

    // Attempt to call with missing header
    try {
      await controller.updateSupplierId(requestDto, undefined);
    } catch (error) {
      expect(error).toBeInstanceOf(BadRequestException);
    }

    // Service should never be called when header validation fails
    expect(serviceUpdateSpy).not.toHaveBeenCalled();
  });
});
