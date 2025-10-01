import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../../app.module';
import { NS_REPORT_SERVICE_TOKEN } from '../services/ns-report.service.interface';

/**
 * 整合測試：認證失敗情境
 *
 * 測試 POST /api/v1/notification-status/reports 認證相關場景：
 * - 缺少 ny-operator header
 * - 無效的 ny-operator header
 * - 空的 ny-operator header
 */
describe('Reports Authentication Integration', () => {
  let app: INestApplication;
  let moduleFixture: TestingModule;

  // Mock NS Report Service - 不應被調用（認證失敗）
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

  describe('POST /api/v1/notification-status/reports - Authentication Failures', () => {
    const validRequest = {
      nsId: 'd68e720f-62ed-4955-802b-8e3f04c56a19',
      notificationDate: '2024/01/15',
      notificationType: 'push',
    };

    it('should return 401 when ny-operator header is missing', async () => {
      // Act: Request without ny-operator header
      const response = await request(app.getHttpServer())
        .post('/api/v1/notification-status/reports')
        .set('Content-Type', 'application/json')
        .send(validRequest)
        .expect(401);

      // Assert: Error response structure (matches NyOperatorGuard behavior)
      expect(response.body).toEqual({
        success: false,
        error: {
          code: 'UNAUTHENTICATED',
          message: 'Authentication required',
        },
        timestamp: expect.stringMatching(
          /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
        ),
        requestId: expect.stringMatching(/^req-\d{14}-[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/),
      });

      // Assert: External service should not be called
      expect(mockNSReportService.getStatusReport).not.toHaveBeenCalled();
    });

    it('should return 401 when ny-operator header is empty', async () => {
      // Act: Request with empty ny-operator header
      const response = await request(app.getHttpServer())
        .post('/api/v1/notification-status/reports')
        .set({
          'ny-operator': '',
          'Content-Type': 'application/json',
        })
        .send(validRequest)
        .expect(401);

      // Assert: Error response structure (matches NyOperatorGuard behavior)
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHENTICATED');
      expect(response.body.error.message).toBe('Authentication required');

      // Assert: External service should not be called
      expect(mockNSReportService.getStatusReport).not.toHaveBeenCalled();
    });

    it('should return 401 when ny-operator header contains only whitespace', async () => {
      // Act: Request with whitespace-only ny-operator header
      const response = await request(app.getHttpServer())
        .post('/api/v1/notification-status/reports')
        .set({
          'ny-operator': '   ',
          'Content-Type': 'application/json',
        })
        .send(validRequest)
        .expect(401);

      // Assert: Error response structure
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('UNAUTHENTICATED');
      expect(response.body.error.message).toBe('Authentication required');

      // Assert: External service should not be called
      expect(mockNSReportService.getStatusReport).not.toHaveBeenCalled();
    });

    it('should include request ID even for authentication failures', async () => {
      // Act: Multiple authentication failures
      const response1 = await request(app.getHttpServer())
        .post('/api/v1/notification-status/reports')
        .set('Content-Type', 'application/json')
        .send(validRequest)
        .expect(401);

      const response2 = await request(app.getHttpServer())
        .post('/api/v1/notification-status/reports')
        .set('Content-Type', 'application/json')
        .send(validRequest)
        .expect(401);

      // Assert: Both responses have unique request IDs
      expect(response1.body.requestId).toMatch(/^req-\d{14}-[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/);
      expect(response2.body.requestId).toMatch(/^req-\d{14}-[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/);
      expect(response1.body.requestId).not.toBe(response2.body.requestId);
    });

    it('should have consistent error response structure across auth failures', async () => {
      // Act: Different types of authentication failures
      const noHeaderResponse = await request(app.getHttpServer())
        .post('/api/v1/notification-status/reports')
        .set('Content-Type', 'application/json')
        .send(validRequest)
        .expect(401);

      const emptyHeaderResponse = await request(app.getHttpServer())
        .post('/api/v1/notification-status/reports')
        .set({
          'ny-operator': '',
          'Content-Type': 'application/json',
        })
        .send(validRequest)
        .expect(401);

      // Assert: Both have same error structure
      const expectedStructure = {
        success: false,
        error: {
          code: 'UNAUTHENTICATED',
          message: expect.any(String),
        },
        timestamp: expect.any(String),
        requestId: expect.any(String),
      };

      expect(noHeaderResponse.body).toMatchObject(expectedStructure);
      expect(emptyHeaderResponse.body).toMatchObject(expectedStructure);
    });

    it('should process request with valid ny-operator header for comparison', async () => {
      // Arrange: Mock successful response for positive test (no real URLs)
      const mockResponse = {
        downloadUrl: 'mock-auth-test-url',
        expiredTime: 3600,
      };
      mockNSReportService.getStatusReport.mockResolvedValue(mockResponse);

      // Act: Request with valid authentication
      const response = await request(app.getHttpServer())
        .post('/api/v1/notification-status/reports')
        .set({
          'ny-operator': 'internal-ops-team',
          'Content-Type': 'application/json',
        })
        .send(validRequest)
        .expect(200);

      // Assert: Success response structure
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockResponse);

      // Assert: External service was called with valid auth
      expect(mockNSReportService.getStatusReport).toHaveBeenCalledWith(
        validRequest,
      );
    });
  });
});
