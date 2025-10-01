import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../../app.module';
import { NS_REPORT_SERVICE_TOKEN } from '../services/ns-report.service.interface';

/**
 * 整合測試：請求驗證錯誤情境
 *
 * 測試 POST /api/v1/notification-status/reports 參數驗證場景：
 * - 無效的 UUID 格式 (nsId)
 * - 無效的日期格式 (notificationDate)
 * - 不支援的通知類型 (notificationType)
 * - 缺少必填欄位
 * - 空值和型別錯誤
 */
describe('Reports Validation Integration', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;

  // Mock NS Report Service - 驗證錯誤時不應被調用
  const mockNSReportService = {
    getStatusReport: jest.fn(),
  };

  beforeAll(async () => {
    moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(NS_REPORT_SERVICE_TOKEN)
      .useValue(mockNSReportService)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/v1/notification-status/reports - Validation Errors', () => {
    const validHeaders = {
      'ny-operator': 'internal-ops-team',
      'Content-Type': 'application/json',
    };

    describe('nsId validation errors', () => {
      it('should return 400 for invalid UUID format', async () => {
        // Act: Request with invalid UUID
        const invalidRequest = {
          nsId: 'invalid-uuid-format',
          notificationDate: '2024/01/15',
          notificationType: 'push',
        };

        const response = await request(app.getHttpServer())
          .post('/api/v1/notification-status/reports')
          .set(validHeaders)
          .send(invalidRequest)
          .expect(400);

        // Assert: Validation error response
        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('INVALID_ARGUMENT');
        expect(response.body.error.message).toBeDefined();
        expect(response.body.error.details).toHaveLength(1);
        expect(response.body.error.details[0]).toEqual({
          '@type': 'type.upd3ops.com/ValidationError',
          validationErrors: expect.arrayContaining([
            expect.stringContaining('nsId must be a valid UUID'),
          ]),
        });
        expect(response.body.timestamp).toBeDefined();
        expect(response.body.requestId).toMatch(
          /^req-\d{14}-[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/,
        );

        // Assert: External service not called
        expect(mockNSReportService.getStatusReport).not.toHaveBeenCalled();
      });

      it('should return 400 for empty nsId', async () => {
        // Act
        const invalidRequest = {
          nsId: '',
          notificationDate: '2024/01/15',
          notificationType: 'push',
        };

        const response = await request(app.getHttpServer())
          .post('/api/v1/notification-status/reports')
          .set(validHeaders)
          .send(invalidRequest)
          .expect(400);

        // Assert
        expect(response.body.error.code).toBe('INVALID_ARGUMENT');
        expect(response.body.error.details).toHaveLength(1);
        expect(response.body.error.details[0]).toEqual({
          '@type': 'type.upd3ops.com/ValidationError',
          validationErrors: expect.arrayContaining([
            expect.stringContaining('should not be empty'),
          ]),
        });
      });

      it('should return 400 for missing nsId', async () => {
        // Act
        const invalidRequest = {
          notificationDate: '2024/01/15',
          notificationType: 'push',
        };

        const response = await request(app.getHttpServer())
          .post('/api/v1/notification-status/reports')
          .set(validHeaders)
          .send(invalidRequest)
          .expect(400);

        // Assert
        expect(response.body.error.code).toBe('INVALID_ARGUMENT');
        expect(response.body.error.details).toHaveLength(1);
        expect(response.body.error.details[0]).toEqual({
          '@type': 'type.upd3ops.com/ValidationError',
          validationErrors: expect.arrayContaining([
            expect.stringContaining('should not be empty'),
          ]),
        });
      });
    });

    describe('notificationDate validation errors', () => {
      it('should return 400 for invalid date format', async () => {
        // Act: Various invalid date formats
        const invalidDates = [
          '2024-01-15', // ISO format instead of YYYY/MM/DD
          '01/15/2024', // US format
          '15/01/2024', // EU format
          '2024/1/15', // Single digit month
          '2024/01/5', // Single digit day
          'invalid-date', // Non-date string
          '2024/13/01', // Invalid month
          '2024/02/30', // Invalid day
        ];

        for (const invalidDate of invalidDates) {
          const invalidRequest = {
            nsId: 'd68e720f-62ed-4955-802b-8e3f04c56a19',
            notificationDate: invalidDate,
            notificationType: 'push',
          };

          const response = await request(app.getHttpServer())
            .post('/api/v1/notification-status/reports')
            .set(validHeaders)
            .send(invalidRequest)
            .expect(400);

          expect(response.body.error.code).toBe('INVALID_ARGUMENT');
          expect(response.body.error.message).toBeDefined();
          expect(response.body.error.details).toHaveLength(1);
          expect(response.body.error.details[0]).toEqual({
            '@type': 'type.upd3ops.com/ValidationError',
            validationErrors: expect.arrayContaining([
              expect.stringContaining('YYYY/MM/DD'),
            ]),
          });
        }
      });

      it('should return 400 for empty notificationDate', async () => {
        // Act
        const invalidRequest = {
          nsId: 'd68e720f-62ed-4955-802b-8e3f04c56a19',
          notificationDate: '',
          notificationType: 'push',
        };

        const response = await request(app.getHttpServer())
          .post('/api/v1/notification-status/reports')
          .set(validHeaders)
          .send(invalidRequest)
          .expect(400);

        // Assert
        expect(response.body.error.code).toBe('INVALID_ARGUMENT');
        expect(response.body.error.message).toBeDefined();
        expect(response.body.error.details).toHaveLength(1);
        expect(response.body.error.details[0]).toEqual({
          '@type': 'type.upd3ops.com/ValidationError',
          validationErrors: expect.arrayContaining([
            expect.stringContaining('should not be empty'),
          ]),
        });
      });
    });

    describe('notificationType validation errors', () => {
      it('should return 400 for invalid notification type', async () => {
        // Act: Various invalid notification types
        const invalidTypes = [
          'invalid-type',
          'PUSH', // Wrong case
          'Push', // Wrong case
          'text', // Not supported
          'whatsapp', // Not supported
          'telegram', // Not supported
          '', // Empty
        ];

        for (const invalidType of invalidTypes) {
          const invalidRequest = {
            nsId: 'd68e720f-62ed-4955-802b-8e3f04c56a19',
            notificationDate: '2024/01/15',
            notificationType: invalidType,
          };

          const response = await request(app.getHttpServer())
            .post('/api/v1/notification-status/reports')
            .set(validHeaders)
            .send(invalidRequest)
            .expect(400);

          expect(response.body.error.code).toBe('INVALID_ARGUMENT');
          expect(response.body.error.message).toBeDefined();
          expect(response.body.error.details).toHaveLength(1);
          expect(response.body.error.details[0]).toEqual({
            '@type': 'type.upd3ops.com/ValidationError',
            validationErrors: expect.arrayContaining([
              expect.stringContaining('must be one of'),
            ]),
          });
        }
      });

      it('should accept all valid notification types', async () => {
        // Arrange: Mock successful response
        const mockResponse = {
          downloadUrl: 'https://s3.amazonaws.com/reports/test.tsv',
          expiredTime: 3600,
        };
        mockNSReportService.getStatusReport.mockResolvedValue(mockResponse);

        const validTypes = ['sms', 'push', 'line', 'email'];

        // Act & Assert: Test each valid type
        for (const validType of validTypes) {
          const validRequest = {
            nsId: 'd68e720f-62ed-4955-802b-8e3f04c56a19',
            notificationDate: '2024/01/15',
            notificationType: validType,
          };

          const response = await request(app.getHttpServer())
            .post('/api/v1/notification-status/reports')
            .set(validHeaders)
            .send(validRequest)
            .expect(200);

          expect(response.body.success).toBe(true);
          expect(mockNSReportService.getStatusReport).toHaveBeenCalledWith(
            validRequest,
          );
        }
      });
    });

    describe('Multiple validation errors', () => {
      it('should return all validation errors in single response', async () => {
        // Act: Request with multiple validation errors
        const multipleErrorsRequest = {
          nsId: 'invalid-uuid', // Invalid UUID
          notificationDate: '2024-01-15', // Wrong date format
          notificationType: 'invalid', // Invalid type
        };

        const response = await request(app.getHttpServer())
          .post('/api/v1/notification-status/reports')
          .set(validHeaders)
          .send(multipleErrorsRequest)
          .expect(400);

        // Assert: All errors included
        expect(response.body.error.code).toBe('INVALID_ARGUMENT');
        expect(response.body.error.message).toBeDefined();
        expect(response.body.error.details).toHaveLength(1);
        expect(response.body.error.details[0]['@type']).toBe(
          'type.upd3ops.com/ValidationError',
        );
        // Should have multiple validation errors
        expect(
          response.body.error.details[0].validationErrors.length,
        ).toBeGreaterThan(1);
      });
    });

    describe('Type validation errors', () => {
      it('should return 400 for wrong data types', async () => {
        // Act: Request with wrong data types
        const wrongTypesRequest = {
          nsId: 123, // Number instead of string
          notificationDate: true, // Boolean instead of string
          notificationType: ['push'], // Array instead of string
        };

        const response = await request(app.getHttpServer())
          .post('/api/v1/notification-status/reports')
          .set(validHeaders)
          .send(wrongTypesRequest)
          .expect(400);

        // Assert
        expect(response.body.error.code).toBe('INVALID_ARGUMENT');
        expect(response.body.error.message).toBeDefined();
        expect(response.body.error.details).toHaveLength(1);
        expect(response.body.error.details[0]['@type']).toBe(
          'type.upd3ops.com/ValidationError',
        );
        expect(response.body.error.details[0].validationErrors.length).toBeGreaterThan(0);
      });
    });

    it('should maintain consistent error response structure', async () => {
      // Act: Various validation errors
      const invalidRequest = {
        nsId: 'invalid',
        notificationDate: 'invalid',
        notificationType: 'invalid',
      };

      const response = await request(app.getHttpServer())
        .post('/api/v1/notification-status/reports')
        .set(validHeaders)
        .send(invalidRequest)
        .expect(400);

      // Assert: Response structure consistency
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('INVALID_ARGUMENT');
      expect(response.body.error.message).toBeDefined();
      expect(response.body.error.details).toHaveLength(1);
      expect(response.body.error.details[0]).toEqual({
        '@type': 'type.upd3ops.com/ValidationError',
        validationErrors: expect.any(Array),
      });
      expect(response.body.timestamp).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
      );
      expect(response.body.requestId).toMatch(
        /^req-\d{14}-[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/,
      );
    });
  });
});
