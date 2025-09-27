import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../api/app.module';
import { TestSetupHelper } from '../helpers/test-setup.helper';

describe('Notification History Authentication Contract Tests', () => {
  let app: INestApplication;
  let testHelper: TestSetupHelper;

  beforeAll(async () => {
    testHelper = new TestSetupHelper();
    app = await testHelper.createTestApp();
  });

  afterAll(async () => {
    await testHelper.closeApp();
  });

  beforeEach(() => {
    // Mock successful Whale API response for notification history
    // This ensures we're testing auth failures, not API failures
    const mockNotificationHistoryData = {
      shopId: 12345,
      notificationId: 67890,
      ncId: "a4070188-050d-47f7-ab24-2523145408cf",
      bookDateTime: "2024-01-15T10:30:00Z",
      status: "Success",
      channel: "Email",
      sentDateTime: "2024-01-15T10:35:00Z",
      isSettled: true,
      originalAudienceCount: 1000,
      sentAudienceCount: 900,
      receivedAudienceCount: 850,
      createdAt: "2024-01-15T10:00:00Z",
      updatedAt: "2024-01-15T10:35:00Z"
    };

    testHelper.mockWhaleApiNotificationHistorySuccess(mockNotificationHistoryData);
  });

  describe('GET /api/v1/shops/{shopId}/notifications/{notificationId}/history', () => {
    const shopId = 12345;
    const notificationId = 67890;

    describe('Authentication Failure Contract (401)', () => {
      it('should return 401 with UNAUTHORIZED_ACCESS when ny-operator header is missing', async () => {
        const response = await request(app.getHttpServer())
          .get(`/api/v1/shops/${shopId}/notifications/${notificationId}/history`)
          .expect(401);

        // Assert error response structure matches ApiErrorResponse schema
        expect(response.body).toMatchObject({
          success: false,
          error: {
            code: 'UNAUTHORIZED_ACCESS',
            message: 'Missing or invalid ny-operator header',
          },
          timestamp: expect.stringMatching(
            /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
          ),
          requestId: expect.stringMatching(/^req-\d{14}-[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/),
        });

        // Verify success is explicitly false
        expect(response.body.success).toBe(false);

        // Verify error code is exactly as specified
        expect(response.body.error.code).toBe('UNAUTHORIZED_ACCESS');

        // Verify error message is exactly as specified
        expect(response.body.error.message).toBe('Missing or invalid ny-operator header');
      });

      it('should return 401 with UNAUTHORIZED_ACCESS when ny-operator header is empty string', async () => {
        const response = await request(app.getHttpServer())
          .get(`/api/v1/shops/${shopId}/notifications/${notificationId}/history`)
          .set('ny-operator', '')
          .expect(401);

        expect(response.body).toMatchObject({
          success: false,
          error: {
            code: 'UNAUTHORIZED_ACCESS',
            message: 'Missing or invalid ny-operator header',
          },
          timestamp: expect.stringMatching(
            /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
          ),
          requestId: expect.stringMatching(/^req-\d{14}-[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/),
        });

        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('UNAUTHORIZED_ACCESS');
        expect(response.body.error.message).toBe('Missing or invalid ny-operator header');
      });

      it('should return 401 with UNAUTHORIZED_ACCESS when ny-operator header is whitespace only', async () => {
        const response = await request(app.getHttpServer())
          .get(`/api/v1/shops/${shopId}/notifications/${notificationId}/history`)
          .set('ny-operator', '   ')
          .expect(401);

        expect(response.body).toMatchObject({
          success: false,
          error: {
            code: 'UNAUTHORIZED_ACCESS',
            message: 'Missing or invalid ny-operator header',
          },
          timestamp: expect.stringMatching(
            /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
          ),
          requestId: expect.stringMatching(/^req-\d{14}-[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/),
        });

        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('UNAUTHORIZED_ACCESS');
        expect(response.body.error.message).toBe('Missing or invalid ny-operator header');
      });

      it('should return 401 with UNAUTHORIZED_ACCESS when ny-operator header contains only tabs', async () => {
        const response = await request(app.getHttpServer())
          .get(`/api/v1/shops/${shopId}/notifications/${notificationId}/history`)
          .set('ny-operator', '\t\t\t')
          .expect(401);

        expect(response.body).toMatchObject({
          success: false,
          error: {
            code: 'UNAUTHORIZED_ACCESS',
            message: 'Missing or invalid ny-operator header',
          },
          timestamp: expect.stringMatching(
            /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
          ),
          requestId: expect.stringMatching(/^req-\d{14}-[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/),
        });

        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('UNAUTHORIZED_ACCESS');
        expect(response.body.error.message).toBe('Missing or invalid ny-operator header');
      });

      it('should return 401 with UNAUTHORIZED_ACCESS when ny-operator header contains mixed whitespace', async () => {
        const response = await request(app.getHttpServer())
          .get(`/api/v1/shops/${shopId}/notifications/${notificationId}/history`)
          .set('ny-operator', ' \t  ')
          .expect(401);

        expect(response.body).toMatchObject({
          success: false,
          error: {
            code: 'UNAUTHORIZED_ACCESS',
            message: 'Missing or invalid ny-operator header',
          },
          timestamp: expect.stringMatching(
            /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
          ),
          requestId: expect.stringMatching(/^req-\d{14}-[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/),
        });

        expect(response.body.success).toBe(false);
        expect(response.body.error.code).toBe('UNAUTHORIZED_ACCESS');
        expect(response.body.error.message).toBe('Missing or invalid ny-operator header');
      });
    });

    describe('HTTP Headers and Content Type Contract', () => {
      it('should include proper Content-Type header in 401 responses', async () => {
        await request(app.getHttpServer())
          .get(`/api/v1/shops/${shopId}/notifications/${notificationId}/history`)
          .expect('Content-Type', /application\/json/)
          .expect(401);
      });

      it('should include proper Content-Type header for empty ny-operator header', async () => {
        await request(app.getHttpServer())
          .get(`/api/v1/shops/${shopId}/notifications/${notificationId}/history`)
          .set('ny-operator', '')
          .expect('Content-Type', /application\/json/)
          .expect(401);
      });

      it('should include proper Content-Type header for whitespace ny-operator header', async () => {
        await request(app.getHttpServer())
          .get(`/api/v1/shops/${shopId}/notifications/${notificationId}/history`)
          .set('ny-operator', '   ')
          .expect('Content-Type', /application\/json/)
          .expect(401);
      });
    });

    describe('Request ID Format and Uniqueness Contract', () => {
      it('should generate unique request IDs for concurrent authentication failures', async () => {
        const requests = Array(3)
          .fill(null)
          .map(() =>
            request(app.getHttpServer())
              .get(`/api/v1/shops/${shopId}/notifications/${notificationId}/history`),
          );

        const responses = await Promise.all(requests);
        const requestIds = responses.map((res) => res.body.requestId);

        // All request IDs should be unique
        expect(new Set(requestIds).size).toBe(requestIds.length);

        // All should match the expected whale notification format
        requestIds.forEach((id) => {
          expect(id).toMatch(/^req-\d{14}-[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/);
        });

        // All responses should be 401
        responses.forEach((res) => {
          expect(res.status).toBe(401);
        });
      });

      it('should maintain request ID format consistency across different auth failure scenarios', async () => {
        // Test missing header
        const responseMissing = await request(app.getHttpServer())
          .get(`/api/v1/shops/${shopId}/notifications/${notificationId}/history`)
          .expect(401);

        // Test empty header
        const responseEmpty = await request(app.getHttpServer())
          .get(`/api/v1/shops/${shopId}/notifications/${notificationId}/history`)
          .set('ny-operator', '')
          .expect(401);

        // Test whitespace header
        const responseWhitespace = await request(app.getHttpServer())
          .get(`/api/v1/shops/${shopId}/notifications/${notificationId}/history`)
          .set('ny-operator', '   ')
          .expect(401);

        [responseMissing, responseEmpty, responseWhitespace].forEach((response) => {
          expect(response.body.requestId).toMatch(
            /^req-\d{14}-[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/,
          );
        });
      });
    });

    describe('OpenAPI Security Requirements Contract', () => {
      it('should enforce OpenAPI security scheme requirements', async () => {
        // This test verifies that the API enforces the security requirements
        // defined in the OpenAPI specification for the ny-operator apiKey
        const response = await request(app.getHttpServer())
          .get(`/api/v1/shops/${shopId}/notifications/${notificationId}/history`)
          .expect(401);

        // The response should conform to the OpenAPI error schema
        expect(response.body).toHaveProperty('success', false);
        expect(response.body).toHaveProperty('error');
        expect(response.body.error).toHaveProperty('code', 'UNAUTHORIZED_ACCESS');
        expect(response.body.error).toHaveProperty('message');
        expect(response.body).toHaveProperty('timestamp');
        expect(response.body).toHaveProperty('requestId');

        // The error message should clearly indicate the authentication issue
        expect(response.body.error.message).toBe('Missing or invalid ny-operator header');
      });

      it('should validate the operator-auth security scheme from OpenAPI spec', async () => {
        // Test that the API key security scheme named 'operator-auth' is properly enforced
        const response = await request(app.getHttpServer())
          .get(`/api/v1/shops/${shopId}/notifications/${notificationId}/history`)
          .set('ny-operator', '') // Invalid according to security scheme
          .expect(401);

        expect(response.body.error.code).toBe('UNAUTHORIZED_ACCESS');
        expect(response.body.error.message).toBe('Missing or invalid ny-operator header');
      });
    });

    describe('Error Response Structure Consistency Contract', () => {
      it('should maintain consistent error response structure across all auth failure scenarios', async () => {
        const testCases = [
          { header: undefined, scenario: 'missing ny-operator header' },
          { header: '', scenario: 'empty ny-operator header' },
          { header: '   ', scenario: 'whitespace-only ny-operator header' },
          { header: '\t', scenario: 'tab-only ny-operator header' },
          { header: ' ', scenario: 'single-space ny-operator header' },
        ];

        for (const testCase of testCases) {
          const request_builder = request(app.getHttpServer())
            .get(`/api/v1/shops/${shopId}/notifications/${notificationId}/history`);

          if (testCase.header !== undefined) {
            request_builder.set('ny-operator', testCase.header);
          }

          const response = await request_builder.expect(401);

          // Verify consistent response structure for each test case
          expect(response.body, `Failed for ${testCase.scenario}`).toMatchObject({
            success: false,
            error: {
              code: 'UNAUTHORIZED_ACCESS',
              message: 'Missing or invalid ny-operator header',
            },
            timestamp: expect.stringMatching(
              /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
            ),
            requestId: expect.stringMatching(/^req-\d{14}-[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/),
          });

          // Verify that success is explicitly false (not just falsy)
          expect(response.body.success).toBe(false);

          // Verify timestamp is valid ISO string
          expect(new Date(response.body.timestamp).toISOString()).toBe(response.body.timestamp);

          // Verify error message is exactly as specified in contract
          expect(response.body.error.message).toBe('Missing or invalid ny-operator header');

          // Verify error code is exactly as specified in contract
          expect(response.body.error.code).toBe('UNAUTHORIZED_ACCESS');
        }
      });

      it('should follow Constitution API response format exactly for auth errors', async () => {
        const response = await request(app.getHttpServer())
          .get(`/api/v1/shops/${shopId}/notifications/${notificationId}/history`)
          .expect(401);

        // Constitution API format requires exactly these top-level fields for errors
        const responseKeys = Object.keys(response.body).sort();
        expect(responseKeys).toEqual(['error', 'requestId', 'success', 'timestamp']);

        // success must be boolean false
        expect(response.body.success).toBe(false);

        // timestamp must be ISO 8601 format
        expect(new Date(response.body.timestamp).toISOString()).toBe(response.body.timestamp);

        // requestId must follow standard request ID pattern
        expect(response.body.requestId).toMatch(/^req-\d{14}-[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/);

        // error must be object with required fields
        expect(typeof response.body.error).toBe('object');
        expect(response.body.error).not.toBeNull();
        expect(response.body.error).toHaveProperty('code');
        expect(response.body.error).toHaveProperty('message');
      });
    });

    describe('Authentication Takes Precedence Over Other Validations', () => {
      it('should return 401 for missing auth header even with invalid shopId', async () => {
        const invalidShopId = -1;

        const response = await request(app.getHttpServer())
          .get(`/api/v1/shops/${invalidShopId}/notifications/${notificationId}/history`)
          .expect(401);

        expect(response.body.error.code).toBe('UNAUTHORIZED_ACCESS');
        expect(response.body.error.message).toBe('Missing or invalid ny-operator header');
      });

      it('should return 401 for empty auth header even with invalid notificationId', async () => {
        const invalidNotificationId = -1;

        const response = await request(app.getHttpServer())
          .get(`/api/v1/shops/${shopId}/notifications/${invalidNotificationId}/history`)
          .set('ny-operator', '')
          .expect(401);

        expect(response.body.error.code).toBe('UNAUTHORIZED_ACCESS');
        expect(response.body.error.message).toBe('Missing or invalid ny-operator header');
      });

      it('should return 401 for whitespace auth header even with invalid parameters', async () => {
        const invalidShopId = 0;
        const invalidNotificationId = 0;

        const response = await request(app.getHttpServer())
          .get(`/api/v1/shops/${invalidShopId}/notifications/${invalidNotificationId}/history`)
          .set('ny-operator', '   ')
          .expect(401);

        expect(response.body.error.code).toBe('UNAUTHORIZED_ACCESS');
        expect(response.body.error.message).toBe('Missing or invalid ny-operator header');
      });
    });
  });
});