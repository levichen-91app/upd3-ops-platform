import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { UpdateSupplierRequestDto } from '../../api/modules/proxy/dto/update-supplier-request.dto';

describe('UpdateSupplierRequestDto Validation', () => {
  describe('Valid requests', () => {
    it('should pass validation with all valid fields', async () => {
      const validData = {
        shopId: 12345,
        market: 'TW',
        oldSupplierId: 100,
        newSupplierId: 200,
      };

      const dto = plainToClass(UpdateSupplierRequestDto, validData);
      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
      expect(dto.shopId).toBe(12345);
      expect(dto.market).toBe('TW');
      expect(dto.oldSupplierId).toBe(100);
      expect(dto.newSupplierId).toBe(200);
    });

    it('should transform string numbers to integers', async () => {
      const stringData = {
        shopId: '12345',
        market: 'TW',
        oldSupplierId: '100',
        newSupplierId: '200',
      };

      const dto = plainToClass(UpdateSupplierRequestDto, stringData);
      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
      expect(dto.shopId).toBe(12345);
      expect(dto.oldSupplierId).toBe(100);
      expect(dto.newSupplierId).toBe(200);
    });

    it('should trim whitespace from market string', async () => {
      const dataWithWhitespace = {
        shopId: 12345,
        market: '  TW  ',
        oldSupplierId: 100,
        newSupplierId: 200,
      };

      const dto = plainToClass(UpdateSupplierRequestDto, dataWithWhitespace);
      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
      expect(dto.market).toBe('TW');
    });
  });

  describe('shopId validation', () => {
    it('should fail with non-integer shopId', async () => {
      const invalidData = {
        shopId: 'not-a-number',
        market: 'TW',
        oldSupplierId: 100,
        newSupplierId: 200,
      };

      const dto = plainToClass(UpdateSupplierRequestDto, invalidData);
      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('shopId');
      expect(errors[0].constraints?.isInt).toContain(
        'shopId must be an integer',
      );
    });

    it('should fail with negative shopId', async () => {
      const invalidData = {
        shopId: -123,
        market: 'TW',
        oldSupplierId: 100,
        newSupplierId: 200,
      };

      const dto = plainToClass(UpdateSupplierRequestDto, invalidData);
      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('shopId');
      expect(errors[0].constraints?.isPositive).toContain(
        'shopId must be a positive integer',
      );
    });

    it('should fail with zero shopId', async () => {
      const invalidData = {
        shopId: 0,
        market: 'TW',
        oldSupplierId: 100,
        newSupplierId: 200,
      };

      const dto = plainToClass(UpdateSupplierRequestDto, invalidData);
      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('shopId');
      expect(errors[0].constraints?.isPositive).toContain(
        'shopId must be a positive integer',
      );
    });

    it('should fail with missing shopId', async () => {
      const invalidData = {
        market: 'TW',
        oldSupplierId: 100,
        newSupplierId: 200,
      };

      const dto = plainToClass(UpdateSupplierRequestDto, invalidData);
      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('shopId');
    });
  });

  describe('market validation', () => {
    it('should fail with non-string market', async () => {
      const invalidData = {
        shopId: 12345,
        market: 123,
        oldSupplierId: 100,
        newSupplierId: 200,
      };

      const dto = plainToClass(UpdateSupplierRequestDto, invalidData);
      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('market');
      expect(errors[0].constraints?.isString).toContain(
        'market must be a string',
      );
    });

    it('should fail with empty market', async () => {
      const invalidData = {
        shopId: 12345,
        market: '',
        oldSupplierId: 100,
        newSupplierId: 200,
      };

      const dto = plainToClass(UpdateSupplierRequestDto, invalidData);
      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('market');
      expect(errors[0].constraints?.isNotEmpty).toContain(
        'market cannot be empty',
      );
    });

    it('should fail with whitespace-only market', async () => {
      const invalidData = {
        shopId: 12345,
        market: '   ',
        oldSupplierId: 100,
        newSupplierId: 200,
      };

      const dto = plainToClass(UpdateSupplierRequestDto, invalidData);
      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('market');
      expect(errors[0].constraints?.isNotEmpty).toContain(
        'market cannot be empty',
      );
    });

    it('should fail with missing market', async () => {
      const invalidData = {
        shopId: 12345,
        oldSupplierId: 100,
        newSupplierId: 200,
      };

      const dto = plainToClass(UpdateSupplierRequestDto, invalidData);
      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('market');
    });
  });

  describe('oldSupplierId validation', () => {
    it('should fail with non-integer oldSupplierId', async () => {
      const invalidData = {
        shopId: 12345,
        market: 'TW',
        oldSupplierId: 'not-a-number',
        newSupplierId: 200,
      };

      const dto = plainToClass(UpdateSupplierRequestDto, invalidData);
      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('oldSupplierId');
      expect(errors[0].constraints?.isInt).toContain(
        'oldSupplierId must be an integer',
      );
    });

    it('should fail with negative oldSupplierId', async () => {
      const invalidData = {
        shopId: 12345,
        market: 'TW',
        oldSupplierId: -100,
        newSupplierId: 200,
      };

      const dto = plainToClass(UpdateSupplierRequestDto, invalidData);
      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('oldSupplierId');
      expect(errors[0].constraints?.isPositive).toContain(
        'oldSupplierId must be a positive integer',
      );
    });

    it('should fail with zero oldSupplierId', async () => {
      const invalidData = {
        shopId: 12345,
        market: 'TW',
        oldSupplierId: 0,
        newSupplierId: 200,
      };

      const dto = plainToClass(UpdateSupplierRequestDto, invalidData);
      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('oldSupplierId');
      expect(errors[0].constraints?.isPositive).toContain(
        'oldSupplierId must be a positive integer',
      );
    });
  });

  describe('newSupplierId validation', () => {
    it('should fail with non-integer newSupplierId', async () => {
      const invalidData = {
        shopId: 12345,
        market: 'TW',
        oldSupplierId: 100,
        newSupplierId: 'not-a-number',
      };

      const dto = plainToClass(UpdateSupplierRequestDto, invalidData);
      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('newSupplierId');
      expect(errors[0].constraints?.isInt).toContain(
        'newSupplierId must be an integer',
      );
    });

    it('should fail with negative newSupplierId', async () => {
      const invalidData = {
        shopId: 12345,
        market: 'TW',
        oldSupplierId: 100,
        newSupplierId: -200,
      };

      const dto = plainToClass(UpdateSupplierRequestDto, invalidData);
      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('newSupplierId');
      expect(errors[0].constraints?.isPositive).toContain(
        'newSupplierId must be a positive integer',
      );
    });

    it('should fail with zero newSupplierId', async () => {
      const invalidData = {
        shopId: 12345,
        market: 'TW',
        oldSupplierId: 100,
        newSupplierId: 0,
      };

      const dto = plainToClass(UpdateSupplierRequestDto, invalidData);
      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('newSupplierId');
      expect(errors[0].constraints?.isPositive).toContain(
        'newSupplierId must be a positive integer',
      );
    });
  });

  describe('Multiple validation errors', () => {
    it('should return all validation errors for completely invalid data', async () => {
      const invalidData = {
        shopId: 'invalid',
        market: '',
        oldSupplierId: -100,
        newSupplierId: 'also-invalid',
      };

      const dto = plainToClass(UpdateSupplierRequestDto, invalidData);
      const errors = await validate(dto);

      expect(errors).toHaveLength(4);

      const errorProperties = errors.map((error) => error.property);
      expect(errorProperties).toContain('shopId');
      expect(errorProperties).toContain('market');
      expect(errorProperties).toContain('oldSupplierId');
      expect(errorProperties).toContain('newSupplierId');
    });
  });
});
