import { Test, TestingModule } from '@nestjs/testing';
import { ValidationPipe, BadRequestException } from '@nestjs/common';
import { ProxyController } from '../api/src/modules/proxy/proxy.controller';
import { ProxyService } from '../api/src/modules/proxy/proxy.service';
import { ProxyModule } from '../api/src/modules/proxy/proxy.module';
import { UpdateSupplierRequestDto } from '../api/src/modules/proxy/dto/update-supplier-request.dto';

describe('ProxyController - Payload Validation Integration', () => {
  let controller: ProxyController;
  let service: ProxyService;
  let validationPipe: ValidationPipe;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ProxyModule],
    }).compile();

    controller = module.get<ProxyController>(ProxyController);
    service = module.get<ProxyService>(ProxyService);

    // Initialize validation pipe with same settings as main app
    validationPipe = new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    });
  });

  it('should reject negative shopId', async () => {
    const invalidDto = {
      shopId: -1,
      market: 'TW',
      oldSupplierId: 100,
      newSupplierId: 200,
    };

    await expect(
      validationPipe.transform(invalidDto, {
        type: 'body',
        metatype: UpdateSupplierRequestDto,
      }),
    ).rejects.toThrow();
  });

  it('should reject zero shopId', async () => {
    const invalidDto = {
      shopId: 0,
      market: 'TW',
      oldSupplierId: 100,
      newSupplierId: 200,
    };

    await expect(
      validationPipe.transform(invalidDto, {
        type: 'body',
        metatype: UpdateSupplierRequestDto,
      }),
    ).rejects.toThrow();
  });

  it('should reject empty market string', async () => {
    const invalidDto = {
      shopId: 12345,
      market: '',
      oldSupplierId: 100,
      newSupplierId: 200,
    };

    await expect(
      validationPipe.transform(invalidDto, {
        type: 'body',
        metatype: UpdateSupplierRequestDto,
      }),
    ).rejects.toThrow();
  });

  it('should reject negative supplier IDs', async () => {
    const invalidDtos = [
      {
        shopId: 12345,
        market: 'TW',
        oldSupplierId: -1,
        newSupplierId: 200,
      },
      {
        shopId: 12345,
        market: 'TW',
        oldSupplierId: 100,
        newSupplierId: -1,
      },
    ];

    for (const dto of invalidDtos) {
      await expect(
        validationPipe.transform(dto, {
          type: 'body',
          metatype: UpdateSupplierRequestDto,
        }),
      ).rejects.toThrow();
    }
  });

  it('should reject missing required fields', async () => {
    const incompleteDtos = [
      { market: 'TW', oldSupplierId: 100, newSupplierId: 200 }, // Missing shopId
      { shopId: 12345, oldSupplierId: 100, newSupplierId: 200 }, // Missing market
      { shopId: 12345, market: 'TW', newSupplierId: 200 }, // Missing oldSupplierId
      { shopId: 12345, market: 'TW', oldSupplierId: 100 }, // Missing newSupplierId
    ];

    for (const dto of incompleteDtos) {
      await expect(
        validationPipe.transform(dto, {
          type: 'body',
          metatype: UpdateSupplierRequestDto,
        }),
      ).rejects.toThrow();
    }
  });

  it('should reject additional properties', async () => {
    const dtoWithExtra = {
      shopId: 12345,
      market: 'TW',
      oldSupplierId: 100,
      newSupplierId: 200,
      extraField: 'not allowed',
      anotherField: 123,
    };

    await expect(
      validationPipe.transform(dtoWithExtra, {
        type: 'body',
        metatype: UpdateSupplierRequestDto,
      }),
    ).rejects.toThrow();
  });

  it('should reject non-numeric values for numeric fields', async () => {
    const invalidDtos = [
      {
        shopId: 'not-a-number',
        market: 'TW',
        oldSupplierId: 100,
        newSupplierId: 200,
      },
      {
        shopId: 12345,
        market: 'TW',
        oldSupplierId: 'invalid',
        newSupplierId: 200,
      },
      {
        shopId: 12345,
        market: 'TW',
        oldSupplierId: 100,
        newSupplierId: 'invalid',
      },
    ];

    for (const dto of invalidDtos) {
      await expect(
        validationPipe.transform(dto, {
          type: 'body',
          metatype: UpdateSupplierRequestDto,
        }),
      ).rejects.toThrow();
    }
  });

  it('should accept valid request payload', async () => {
    const validDto = {
      shopId: 12345,
      market: 'TW',
      oldSupplierId: 100,
      newSupplierId: 200,
    };

    const result = await validationPipe.transform(validDto, {
      type: 'body',
      metatype: UpdateSupplierRequestDto,
    });

    expect(result).toEqual(validDto);
    expect(result).toBeInstanceOf(UpdateSupplierRequestDto);
  });

  it('should handle business logic validation (same supplier IDs)', async () => {
    // Mock service to simulate business logic validation
    const mockService = jest
      .spyOn(service, 'updateSupplier')
      .mockRejectedValue(
        new BadRequestException('Old and new supplier IDs must be different'),
      );

    const requestDto = {
      shopId: 12345,
      market: 'TW',
      oldSupplierId: 100,
      newSupplierId: 100, // Same as old
    };

    await expect(
      controller.updateSupplierId(requestDto, 'Amy Wang'),
    ).rejects.toThrow(BadRequestException);

    await expect(
      controller.updateSupplierId(requestDto, 'Amy Wang'),
    ).rejects.toThrow('Old and new supplier IDs must be different');

    mockService.mockRestore();
  });
});
