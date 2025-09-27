import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { SupplierUpdateRequestDto } from '../../api/modules/suppliers/dto/supplier-update-request.dto';

describe('SupplierUpdateRequestDto Validation', () => {
  describe('Valid requests', () => {
    it('should pass validation with all valid fields', async () => {
      const validData = {
        market: 'TW',
        oldSupplierId: 100,
        newSupplierId: 200,
      };

      const dto = plainToClass(SupplierUpdateRequestDto, validData);
      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
      expect(dto.market).toBe('TW');
      expect(dto.oldSupplierId).toBe(100);
      expect(dto.newSupplierId).toBe(200);
    });

    it('should transform string numbers to integers', async () => {
      const stringData = {
        market: 'TW',
        oldSupplierId: '100',
        newSupplierId: '200',
      };

      const dto = plainToClass(SupplierUpdateRequestDto, stringData);
      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
      expect(dto.oldSupplierId).toBe(100);
      expect(dto.newSupplierId).toBe(200);
    });

    it('should trim whitespace from market string', async () => {
      const dataWithWhitespace = {
        market: '  TW  ',
        oldSupplierId: 100,
        newSupplierId: 200,
      };

      const dto = plainToClass(SupplierUpdateRequestDto, dataWithWhitespace);
      const errors = await validate(dto);

      expect(errors).toHaveLength(0);
      expect(dto.market).toBe('TW');
    });
  });

  describe('market validation', () => {
    it('should fail with non-string market', async () => {
      const invalidData = {
        market: 123,
        oldSupplierId: 100,
        newSupplierId: 200,
      };

      const dto = plainToClass(SupplierUpdateRequestDto, invalidData);
      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('market');
      expect(errors[0].constraints?.isString).toContain(
        'Market must be a string',
      );
    });

    it('should fail with empty market', async () => {
      const invalidData = {
        market: '',
        oldSupplierId: 100,
        newSupplierId: 200,
      };

      const dto = plainToClass(SupplierUpdateRequestDto, invalidData);
      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('market');
      expect(errors[0].constraints?.isNotEmpty).toContain('Market is required');
    });

    it('should fail with invalid market format', async () => {
      const invalidData = {
        market: 'TOOLONG',
        oldSupplierId: 100,
        newSupplierId: 200,
      };

      const dto = plainToClass(SupplierUpdateRequestDto, invalidData);
      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('market');
      expect(errors[0].constraints?.matches).toContain(
        'Market must be 2-4 uppercase letters',
      );
    });

    it('should fail with missing market', async () => {
      const invalidData = {
        oldSupplierId: 100,
        newSupplierId: 200,
      };

      const dto = plainToClass(SupplierUpdateRequestDto, invalidData);
      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('market');
    });
  });

  describe('oldSupplierId validation', () => {
    it('should fail with non-integer oldSupplierId', async () => {
      const invalidData = {
        market: 'TW',
        oldSupplierId: 'not-a-number',
        newSupplierId: 200,
      };

      const dto = plainToClass(SupplierUpdateRequestDto, invalidData);
      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('oldSupplierId');
      expect(errors[0].constraints?.isInt).toContain(
        'Old supplier ID must be an integer',
      );
    });

    it('should fail with negative oldSupplierId', async () => {
      const invalidData = {
        market: 'TW',
        oldSupplierId: -100,
        newSupplierId: 200,
      };

      const dto = plainToClass(SupplierUpdateRequestDto, invalidData);
      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('oldSupplierId');
      expect(errors[0].constraints?.min).toContain(
        'Old supplier ID must be greater than 0',
      );
    });

    it('should fail with zero oldSupplierId', async () => {
      const invalidData = {
        market: 'TW',
        oldSupplierId: 0,
        newSupplierId: 200,
      };

      const dto = plainToClass(SupplierUpdateRequestDto, invalidData);
      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('oldSupplierId');
      expect(errors[0].constraints?.min).toContain(
        'Old supplier ID must be greater than 0',
      );
    });
  });

  describe('newSupplierId validation', () => {
    it('should fail with non-integer newSupplierId', async () => {
      const invalidData = {
        market: 'TW',
        oldSupplierId: 100,
        newSupplierId: 'not-a-number',
      };

      const dto = plainToClass(SupplierUpdateRequestDto, invalidData);
      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('newSupplierId');
      expect(errors[0].constraints?.isInt).toContain(
        'New supplier ID must be an integer',
      );
    });

    it('should fail with negative newSupplierId', async () => {
      const invalidData = {
        market: 'TW',
        oldSupplierId: 100,
        newSupplierId: -200,
      };

      const dto = plainToClass(SupplierUpdateRequestDto, invalidData);
      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('newSupplierId');
      expect(errors[0].constraints?.min).toContain(
        'New supplier ID must be greater than 0',
      );
    });

    it('should fail with zero newSupplierId', async () => {
      const invalidData = {
        market: 'TW',
        oldSupplierId: 100,
        newSupplierId: 0,
      };

      const dto = plainToClass(SupplierUpdateRequestDto, invalidData);
      const errors = await validate(dto);

      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('newSupplierId');
      expect(errors[0].constraints?.min).toContain(
        'New supplier ID must be greater than 0',
      );
    });
  });

  describe('Multiple validation errors', () => {
    it('should return all validation errors for completely invalid data', async () => {
      const invalidData = {
        market: '',
        oldSupplierId: -100,
        newSupplierId: 'also-invalid',
      };

      const dto = plainToClass(SupplierUpdateRequestDto, invalidData);
      const errors = await validate(dto);

      expect(errors).toHaveLength(3);

      const errorProperties = errors.map((error) => error.property);
      expect(errorProperties).toContain('market');
      expect(errorProperties).toContain('oldSupplierId');
      expect(errorProperties).toContain('newSupplierId');
    });
  });
});
