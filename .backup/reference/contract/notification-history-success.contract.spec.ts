import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../api/app.module';
import { TestSetupHelper } from '../helpers/test-setup.helper';

describe('Notification History API Contract Tests', () => {
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
    const operatorHeader = 'system-admin';

    describe('Successful Response Contract (200)', () => {
      it('should return 200 with valid NotificationHistoryResponse structure', async () => {
        const response = await request(app.getHttpServer())
          .get(`/api/v1/shops/${shopId}/notifications/${notificationId}/history`)
          .set('ny-operator', operatorHeader)
          .expect(200);

        // Assert response structure matches NotificationHistoryResponse schema
        expect(response.body).toMatchObject({
          success: true,
          data: expect.any(Object),
          timestamp: expect.stringMatching(
            /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
          ),
          requestId: expect.stringMatching(/^req-\d{14}-[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/),
        });

        // Assert data structure matches NotificationHistoryData schema
        expect(response.body.data).toMatchObject({
          shopId: expect.any(Number),
          notificationId: expect.any(Number),
          ncId: expect.any(String),
          bookDateTime: expect.stringMatching(
            /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/,
          ),
          status: expect.stringMatching(/^(Scheduled|Booked|Sent|Error|Success|Fail|PartialFail|NoUser)$/),
          channel: expect.any(String),
          isSettled: expect.any(Boolean),
          originalAudienceCount: expect.any(Number),
          sentAudienceCount: expect.any(Number),
          receivedAudienceCount: expect.any(Number),
          createdAt: expect.stringMatching(
            /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/,
          ),
          updatedAt: expect.stringMatching(
            /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/,
          ),
        });

        // Assert specific required values
        expect(response.body.data.shopId).toBe(shopId);
        expect(response.body.data.notificationId).toBe(notificationId);
        expect(response.body.data.ncId).toBe("a4070188-050d-47f7-ab24-2523145408cf");
        expect(response.body.data.bookDateTime).toBe("2024-01-15T10:30:00Z");

        // Assert optional sentDateTime if present
        if (response.body.data.sentDateTime) {
          expect(response.body.data.sentDateTime).toMatch(
            /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/,
          );
        }
      });

      it('should include proper Content-Type header', async () => {
        await request(app.getHttpServer())
          .get(`/api/v1/shops/${shopId}/notifications/${notificationId}/history`)
          .set('ny-operator', operatorHeader)
          .expect('Content-Type', /application\/json/)
          .expect(200);
      });

      it('should validate core business data from Whale API', async () => {
        const response = await request(app.getHttpServer())
          .get(`/api/v1/shops/${shopId}/notifications/${notificationId}/history`)
          .set('ny-operator', operatorHeader)
          .expect(200);

        const data = response.body.data;

        // Core Whale API extracted fields must be present
        expect(data.ncId).toMatch(/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/);
        expect(data.bookDateTime).toBeTruthy();

        // Audience counts should be logical
        expect(data.originalAudienceCount).toBeGreaterThanOrEqual(0);
        expect(data.sentAudienceCount).toBeLessThanOrEqual(data.originalAudienceCount);
        expect(data.receivedAudienceCount).toBeLessThanOrEqual(data.sentAudienceCount);

        // Status should be valid enum value
        expect(['Scheduled', 'Booked', 'Sent', 'Error', 'Success', 'Fail', 'PartialFail', 'NoUser'])
          .toContain(data.status);
      });
    });

    describe('Validation Error Response Contract (400)', () => {
      it('should return 400 with ApiErrorResponse when shopId is invalid', async () => {
        const invalidShopId = 0; // Below minimum value

        const response = await request(app.getHttpServer())
          .get(`/api/v1/shops/${invalidShopId}/notifications/${notificationId}/history`)
          .set('ny-operator', operatorHeader)
          .expect(400);

        // Assert error response structure matches ApiErrorResponse schema
        expect(response.body).toMatchObject({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: expect.any(String),
            details: expect.any(Object),
          },
          timestamp: expect.stringMatching(
            /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
          ),
          requestId: expect.stringMatching(/^req-\d{14}-[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/),
        });

        expect(response.body.error.message.toLowerCase()).toContain('shop');
      });

      it('should return 400 with ApiErrorResponse when notificationId is invalid', async () => {
        const invalidNotificationId = -1; // Negative value

        const response = await request(app.getHttpServer())
          .get(`/api/v1/shops/${shopId}/notifications/${invalidNotificationId}/history`)
          .set('ny-operator', operatorHeader)
          .expect(400);

        expect(response.body).toMatchObject({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: expect.any(String),
            details: expect.any(Object),
          },
          timestamp: expect.stringMatching(
            /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
          ),
          requestId: expect.stringMatching(/^req-\d{14}-[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/),
        });

        expect(response.body.error.message.toLowerCase()).toContain('notification');
      });
    });

    describe('Authorization Error Response Contract (401)', () => {
      it('should return 401 when ny-operator header is missing', async () => {
        const response = await request(app.getHttpServer())
          .get(`/api/v1/shops/${shopId}/notifications/${notificationId}/history`)
          .expect(401);

        expect(response.body).toMatchObject({
          success: false,
          error: {
            code: 'UNAUTHORIZED_ACCESS',
            message: expect.stringMatching(/missing.*ny-operator.*header/i),
          },
          timestamp: expect.stringMatching(
            /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
          ),
          requestId: expect.stringMatching(/^req-\d{14}-[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/),
        });
      });

      it('should return 401 when ny-operator header is empty', async () => {
        const response = await request(app.getHttpServer())
          .get(`/api/v1/shops/${shopId}/notifications/${notificationId}/history`)
          .set('ny-operator', '')
          .expect(401);

        expect(response.body.error.code).toBe('UNAUTHORIZED_ACCESS');
        expect(response.body.error.message.toLowerCase()).toMatch(/invalid.*ny-operator/i);
      });
    });

    describe('Not Found Error Response Contract (404)', () => {
      beforeEach(() => {
        // Mock Whale API to return not found
        testHelper.mockWhaleApiNotificationNotFound();
      });

      it('should return 404 when notification does not exist', async () => {
        const nonExistentNotificationId = 99404;

        const response = await request(app.getHttpServer())
          .get(`/api/v1/shops/${shopId}/notifications/${nonExistentNotificationId}/history`)
          .set('ny-operator', operatorHeader)
          .expect(404);

        expect(response.body).toMatchObject({
          success: false,
          error: {
            code: 'NOTIFICATION_NOT_FOUND',
            message: expect.stringMatching(/notification.*not.*found/i),
            details: expect.objectContaining({
              notificationId: nonExistentNotificationId,
              shopId: shopId,
            }),
          },
          timestamp: expect.stringMatching(
            /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
          ),
          requestId: expect.stringMatching(/^req-\d{14}-[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/),
        });
      });
    });

    describe('External Service Error Response Contract (502)', () => {
      beforeEach(() => {
        // Mock Whale API to return service unavailable
        testHelper.mockWhaleApiServiceUnavailable();
      });

      it('should return 502 when Whale API is unavailable', async () => {
        const response = await request(app.getHttpServer())
          .get(`/api/v1/shops/${shopId}/notifications/${notificationId}/history`)
          .set('ny-operator', operatorHeader)
          .expect(502);

        expect(response.body).toMatchObject({
          success: false,
          error: {
            code: 'WHALE_API_UNAVAILABLE',
            message: expect.stringMatching(/whale.*api.*unavailable/i),
            details: expect.objectContaining({
              service: 'whale-notification-api',
            }),
          },
          timestamp: expect.stringMatching(
            /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
          ),
          requestId: expect.stringMatching(/^req-\d{14}-[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/),
        });
      });
    });

    describe('Request ID Format and Uniqueness Contract', () => {
      it('should generate unique request IDs for concurrent requests', async () => {
        const requests = Array(3)
          .fill(null)
          .map(() =>
            request(app.getHttpServer())
              .get(`/api/v1/shops/${shopId}/notifications/${notificationId}/history`)
              .set('ny-operator', operatorHeader),
          );

        const responses = await Promise.all(requests);
        const requestIds = responses.map((res) => res.body.requestId);

        // All request IDs should be unique
        expect(new Set(requestIds).size).toBe(requestIds.length);

        // All should match the expected whale notification format
        requestIds.forEach((id) => {
          expect(id).toMatch(/^req-\d{14}-[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/);
        });
      });

      it('should maintain request ID format consistency across error responses', async () => {
        // Test with missing operator header (401)
        const response401 = await request(app.getHttpServer())
          .get(`/api/v1/shops/${shopId}/notifications/${notificationId}/history`)
          .expect(401);

        // Test with invalid parameters (400)
        const response400 = await request(app.getHttpServer())
          .get(`/api/v1/shops/0/notifications/${notificationId}/history`)
          .set('ny-operator', operatorHeader)
          .expect(400);

        [response401, response400].forEach((response) => {
          expect(response.body.requestId).toMatch(/^req-\d{14}-[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/);
        });
      });
    });

    describe('Constitution API Format Compliance', () => {
      it('should follow Constitution API response format exactly', async () => {
        const response = await request(app.getHttpServer())
          .get(`/api/v1/shops/${shopId}/notifications/${notificationId}/history`)
          .set('ny-operator', operatorHeader)
          .expect(200);

        // Constitution API format requires exactly these top-level fields
        const responseKeys = Object.keys(response.body).sort();
        expect(responseKeys).toEqual(['data', 'requestId', 'success', 'timestamp']);

        // success must be boolean true
        expect(response.body.success).toBe(true);

        // timestamp must be ISO 8601 format
        expect(new Date(response.body.timestamp).toISOString()).toBe(response.body.timestamp);

        // requestId must follow whale notification pattern
        expect(response.body.requestId).toMatch(/^req-\d{14}-[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/);

        // data must be object with required notification fields
        expect(typeof response.body.data).toBe('object');
        expect(response.body.data).not.toBeNull();
      });
    });
  });
});