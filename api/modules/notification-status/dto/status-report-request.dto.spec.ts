import { validate } from 'class-validator';
import { StatusReportRequestDto } from './status-report-request.dto';

/**
 * 單元測試：狀態報告請求 DTO 驗證
 *
 * 測試 StatusReportRequestDto 的驗證邏輯：
 * - nsId UUID 格式驗證
 * - notificationDate YYYY/MM/DD 格式驗證
 * - notificationType 枚舉值驗證
 * - 必填欄位驗證
 * - 邊界條件測試
 *
 * 注意：此測試會在實作前失敗 (TDD 紅燈階段)
 */
describe('StatusReportRequestDto', () => {
  describe('nsId validation', () => {
    it('should pass validation for valid UUID format', async () => {
      // Arrange
      const dto = new StatusReportRequestDto();
      dto.nsId = 'd68e720f-62ed-4955-802b-8e3f04c56a19';
      dto.notificationDate = '2024/01/15';
      dto.notificationType = 'push';

      // Act
      const errors = await validate(dto);

      // Assert
      const nsIdErrors = errors.filter((error) => error.property === 'nsId');
      expect(nsIdErrors).toHaveLength(0);
    });

    it('should fail validation for invalid UUID format', async () => {
      // Arrange
      const dto = new StatusReportRequestDto();
      dto.nsId = 'invalid-uuid-format';
      dto.notificationDate = '2024/01/15';
      dto.notificationType = 'push';

      // Act
      const errors = await validate(dto);

      // Assert
      const nsIdErrors = errors.filter((error) => error.property === 'nsId');
      expect(nsIdErrors.length).toBeGreaterThan(0);
      expect(nsIdErrors[0].constraints).toHaveProperty('isUuid');
      expect(nsIdErrors[0].constraints.isUuid).toContain(
        'must be a valid UUID',
      );
    });

    it('should fail validation for empty nsId', async () => {
      // Arrange
      const dto = new StatusReportRequestDto();
      dto.nsId = '';
      dto.notificationDate = '2024/01/15';
      dto.notificationType = 'push';

      // Act
      const errors = await validate(dto);

      // Assert
      const nsIdErrors = errors.filter((error) => error.property === 'nsId');
      expect(nsIdErrors.length).toBeGreaterThan(0);
      expect(nsIdErrors[0].constraints).toHaveProperty('isNotEmpty');
    });

    it('should fail validation for missing nsId', async () => {
      // Arrange
      const dto = new StatusReportRequestDto();
      dto.notificationDate = '2024/01/15';
      dto.notificationType = 'push';

      // Act
      const errors = await validate(dto);

      // Assert
      const nsIdErrors = errors.filter((error) => error.property === 'nsId');
      expect(nsIdErrors.length).toBeGreaterThan(0);
    });
  });

  describe('notificationDate validation', () => {
    it('should pass validation for valid YYYY/MM/DD format', async () => {
      // Arrange
      const validDates = [
        '2024/01/15',
        '2023/12/31',
        '2024/02/29', // leap year
        '2024/06/30',
      ];

      for (const validDate of validDates) {
        const dto = new StatusReportRequestDto();
        dto.nsId = 'd68e720f-62ed-4955-802b-8e3f04c56a19';
        dto.notificationDate = validDate;
        dto.notificationType = 'push';

        // Act
        const errors = await validate(dto);

        // Assert
        const dateErrors = errors.filter(
          (error) => error.property === 'notificationDate',
        );
        expect(dateErrors).toHaveLength(0);
      }
    });

    it('should fail validation for invalid date formats', async () => {
      // Arrange - Only test formats that will definitely fail our regex
      const invalidDates = [
        '2024-01-15', // ISO format - will fail
        '01/15/2024', // US format - will fail
        '15/01/2024', // EU format - will fail
        '2024/1/15', // Single digit month - will fail
        '2024/01/5', // Single digit day - will fail
        'invalid-date', // Non-date string - will fail
        '', // Empty string - will fail due to @IsNotEmpty
      ];

      for (const invalidDate of invalidDates) {
        const dto = new StatusReportRequestDto();
        dto.nsId = 'd68e720f-62ed-4955-802b-8e3f04c56a19';
        dto.notificationDate = invalidDate;
        dto.notificationType = 'push';

        // Act
        const errors = await validate(dto);

        // Assert
        const dateErrors = errors.filter(
          (error) => error.property === 'notificationDate',
        );
        expect(dateErrors.length).toBeGreaterThan(0);
        expect(dateErrors[0].constraints).toBeDefined();
      }
    });

    it('should fail validation for missing notificationDate', async () => {
      // Arrange
      const dto = new StatusReportRequestDto();
      dto.nsId = 'd68e720f-62ed-4955-802b-8e3f04c56a19';
      dto.notificationType = 'push';

      // Act
      const errors = await validate(dto);

      // Assert
      const dateErrors = errors.filter(
        (error) => error.property === 'notificationDate',
      );
      expect(dateErrors.length).toBeGreaterThan(0);
    });
  });

  describe('notificationType validation', () => {
    it('should pass validation for all valid notification types', async () => {
      // Arrange
      const validTypes = ['sms', 'push', 'line', 'email'];

      for (const validType of validTypes) {
        const dto = new StatusReportRequestDto();
        dto.nsId = 'd68e720f-62ed-4955-802b-8e3f04c56a19';
        dto.notificationDate = '2024/01/15';
        dto.notificationType = validType;

        // Act
        const errors = await validate(dto);

        // Assert
        const typeErrors = errors.filter(
          (error) => error.property === 'notificationType',
        );
        expect(typeErrors).toHaveLength(0);
      }
    });

    it('should fail validation for invalid notification types', async () => {
      // Arrange
      const invalidTypes = [
        'invalid-type',
        'PUSH', // Wrong case
        'Push', // Wrong case
        'text', // Not supported
        'whatsapp', // Not supported
        'telegram', // Not supported
        '', // Empty
        'sms,push', // Multiple values
      ];

      for (const invalidType of invalidTypes) {
        const dto = new StatusReportRequestDto();
        dto.nsId = 'd68e720f-62ed-4955-802b-8e3f04c56a19';
        dto.notificationDate = '2024/01/15';
        dto.notificationType = invalidType;

        // Act
        const errors = await validate(dto);

        // Assert
        const typeErrors = errors.filter(
          (error) => error.property === 'notificationType',
        );
        expect(typeErrors.length).toBeGreaterThan(0);
        expect(typeErrors[0].constraints).toBeDefined();
      }
    });

    it('should fail validation for missing notificationType', async () => {
      // Arrange
      const dto = new StatusReportRequestDto();
      dto.nsId = 'd68e720f-62ed-4955-802b-8e3f04c56a19';
      dto.notificationDate = '2024/01/15';

      // Act
      const errors = await validate(dto);

      // Assert
      const typeErrors = errors.filter(
        (error) => error.property === 'notificationType',
      );
      expect(typeErrors.length).toBeGreaterThan(0);
    });
  });

  describe('Combined validation scenarios', () => {
    it('should pass validation for completely valid DTO', async () => {
      // Arrange
      const dto = new StatusReportRequestDto();
      dto.nsId = 'd68e720f-62ed-4955-802b-8e3f04c56a19';
      dto.notificationDate = '2024/01/15';
      dto.notificationType = 'push';

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors).toHaveLength(0);
    });

    it('should collect all validation errors in single validation call', async () => {
      // Arrange: DTO with multiple invalid fields
      const dto = new StatusReportRequestDto();
      dto.nsId = 'invalid-uuid';
      dto.notificationDate = '2024-01-15';
      dto.notificationType = 'invalid-type';

      // Act
      const errors = await validate(dto);

      // Assert: All three fields should have validation errors
      const fieldNames = errors.map((error) => error.property);
      expect(fieldNames).toContain('nsId');
      expect(fieldNames).toContain('notificationDate');
      expect(fieldNames).toContain('notificationType');
      expect(errors.length).toBeGreaterThanOrEqual(3);
    });

    it('should handle completely empty DTO', async () => {
      // Arrange
      const dto = new StatusReportRequestDto();

      // Act
      const errors = await validate(dto);

      // Assert: All fields should be required
      expect(errors.length).toBeGreaterThanOrEqual(3);
      const fieldNames = errors.map((error) => error.property);
      expect(fieldNames).toContain('nsId');
      expect(fieldNames).toContain('notificationDate');
      expect(fieldNames).toContain('notificationType');
    });
  });

  describe('Edge cases and type safety', () => {
    it('should handle null values correctly', async () => {
      // Arrange
      const dto = new StatusReportRequestDto();
      dto.nsId = null as any;
      dto.notificationDate = null as any;
      dto.notificationType = null as any;

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should handle undefined values correctly', async () => {
      // Arrange
      const dto = new StatusReportRequestDto();
      dto.nsId = undefined as any;
      dto.notificationDate = undefined as any;
      dto.notificationType = undefined as any;

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors.length).toBeGreaterThan(0);
    });

    it('should handle wrong data types', async () => {
      // Arrange
      const dto = new StatusReportRequestDto();
      dto.nsId = 123 as any;
      dto.notificationDate = true as any;
      dto.notificationType = ['push'] as any;

      // Act
      const errors = await validate(dto);

      // Assert
      expect(errors.length).toBeGreaterThan(0);
    });
  });
});
