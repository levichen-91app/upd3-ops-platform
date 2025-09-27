import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../api/app.module';
import { TestSetupHelper } from '../helpers/test-setup.helper';

describe('Notification History Validation Contract Tests', () => {
  let app: INestApplication;
  let testHelper: TestSetupHelper;

  beforeAll(async () => {
    testHelper = new TestSetupHelper();
    app = await testHelper.createTestApp();
  });

  afterAll(async () => {
    await testHelper.closeApp();
  });

  describe('GET /api/v1/shops/{shopId}/notifications/{notificationId}/history', () => {
    const validShopId = 12345;
    const validNotificationId = 67890;
    const operatorHeader = 'system-admin';

    describe('Shop ID Validation Error Contract (400)', () => {
      it('should return 400 with VALIDATION_ERROR when shopId is negative', async () => {
        const invalidShopId = -1;

        const response = await request(app.getHttpServer())
          .get(`/api/v1/shops/${invalidShopId}/notifications/${validNotificationId}/history`)
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

        // Verify error message contains relevant validation information
        expect(response.body.error.message.toLowerCase()).toContain('shop');
        expect(response.body.error.details).toHaveProperty('shopId');
      });

      it('should return 400 with VALIDATION_ERROR when shopId is zero', async () => {
        const invalidShopId = 0;

        const response = await request(app.getHttpServer())
          .get(`/api/v1/shops/${invalidShopId}/notifications/${validNotificationId}/history`)
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

        expect(response.body.error.message.toLowerCase()).toContain('shop');
        expect(response.body.error.details).toHaveProperty('shopId');
      });

      it('should return 400 with VALIDATION_ERROR when shopId is non-numeric', async () => {
        const invalidShopId = 'invalid-shop';

        const response = await request(app.getHttpServer())
          .get(`/api/v1/shops/${invalidShopId}/notifications/${validNotificationId}/history`)
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

        expect(response.body.error.message.toLowerCase()).toContain('shop');
        expect(response.body.error.details).toHaveProperty('shopId');
      });

      it('should return 400 with VALIDATION_ERROR when shopId contains special characters', async () => {
        const invalidShopId = '123@45';

        const response = await request(app.getHttpServer())
          .get(`/api/v1/shops/${invalidShopId}/notifications/${validNotificationId}/history`)
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

        expect(response.body.error.message.toLowerCase()).toContain('shop');
        expect(response.body.error.details).toHaveProperty('shopId');
      });
    });

    describe('Notification ID Validation Error Contract (400)', () => {
      it('should return 400 with VALIDATION_ERROR when notificationId is negative', async () => {
        const invalidNotificationId = -1;

        const response = await request(app.getHttpServer())
          .get(`/api/v1/shops/${validShopId}/notifications/${invalidNotificationId}/history`)
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
        expect(response.body.error.details).toHaveProperty('notificationId');
      });

      it('should return 400 with VALIDATION_ERROR when notificationId is zero', async () => {
        const invalidNotificationId = 0;

        const response = await request(app.getHttpServer())
          .get(`/api/v1/shops/${validShopId}/notifications/${invalidNotificationId}/history`)
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
        expect(response.body.error.details).toHaveProperty('notificationId');
      });

      it('should return 400 with VALIDATION_ERROR when notificationId is non-numeric', async () => {
        const invalidNotificationId = 'invalid-notification';

        const response = await request(app.getHttpServer())
          .get(`/api/v1/shops/${validShopId}/notifications/${invalidNotificationId}/history`)
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
        expect(response.body.error.details).toHaveProperty('notificationId');
      });

      it('should return 400 with VALIDATION_ERROR when notificationId contains special characters', async () => {
        const invalidNotificationId = '678#90';

        const response = await request(app.getHttpServer())
          .get(`/api/v1/shops/${validShopId}/notifications/${invalidNotificationId}/history`)
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
        expect(response.body.error.details).toHaveProperty('notificationId');
      });
    });

    describe('Combined Parameter Validation Error Contract (400)', () => {
      it('should return 400 with VALIDATION_ERROR when both shopId and notificationId are invalid', async () => {
        const invalidShopId = -1;
        const invalidNotificationId = 0;

        const response = await request(app.getHttpServer())
          .get(`/api/v1/shops/${invalidShopId}/notifications/${invalidNotificationId}/history`)
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

        // Error details should contain information about both invalid parameters
        expect(response.body.error.details).toHaveProperty('shopId');
        expect(response.body.error.details).toHaveProperty('notificationId');
      });

      it('should return 400 with VALIDATION_ERROR when both parameters are non-numeric', async () => {
        const invalidShopId = 'abc';
        const invalidNotificationId = 'xyz';

        const response = await request(app.getHttpServer())
          .get(`/api/v1/shops/${invalidShopId}/notifications/${invalidNotificationId}/history`)
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

        expect(response.body.error.details).toHaveProperty('shopId');
        expect(response.body.error.details).toHaveProperty('notificationId');
      });
    });

    describe('OpenAPI Contract Validation', () => {
      it('should enforce minimum value constraint for shopId as per OpenAPI spec', async () => {
        const belowMinimumShopId = -999;

        const response = await request(app.getHttpServer())
          .get(`/api/v1/shops/${belowMinimumShopId}/notifications/${validNotificationId}/history`)
          .set('ny-operator', operatorHeader)
          .expect(400);

        expect(response.body.error.code).toBe('VALIDATION_ERROR');
        expect(response.body.error.message).toMatch(/shop.*minimum|minimum.*shop/i);
        expect(response.body.error.details.shopId).toBeDefined();
      });

      it('should enforce minimum value constraint for notificationId as per OpenAPI spec', async () => {
        const belowMinimumNotificationId = -999;

        const response = await request(app.getHttpServer())
          .get(`/api/v1/shops/${validShopId}/notifications/${belowMinimumNotificationId}/history`)
          .set('ny-operator', operatorHeader)
          .expect(400);

        expect(response.body.error.code).toBe('VALIDATION_ERROR');
        expect(response.body.error.message).toMatch(/notification.*minimum|minimum.*notification/i);
        expect(response.body.error.details.notificationId).toBeDefined();
      });

      it('should enforce integer type constraint for shopId as per OpenAPI spec', async () => {
        const floatShopId = '123.45';

        const response = await request(app.getHttpServer())
          .get(`/api/v1/shops/${floatShopId}/notifications/${validNotificationId}/history`)
          .set('ny-operator', operatorHeader)
          .expect(400);

        expect(response.body.error.code).toBe('VALIDATION_ERROR');
        expect(response.body.error.message).toMatch(/shop.*integer|integer.*shop|shop.*number|number.*shop/i);
        expect(response.body.error.details.shopId).toBeDefined();
      });

      it('should enforce integer type constraint for notificationId as per OpenAPI spec', async () => {
        const floatNotificationId = '678.90';

        const response = await request(app.getHttpServer())
          .get(`/api/v1/shops/${validShopId}/notifications/${floatNotificationId}/history`)
          .set('ny-operator', operatorHeader)
          .expect(400);

        expect(response.body.error.code).toBe('VALIDATION_ERROR');
        expect(response.body.error.message).toMatch(/notification.*integer|integer.*notification|notification.*number|number.*notification/i);
        expect(response.body.error.details.notificationId).toBeDefined();
      });
    });

    describe('Error Response Format Consistency', () => {
      it('should maintain consistent error response structure across all validation errors', async () => {
        const testCases = [
          { shopId: -1, notificationId: validNotificationId, scenario: 'negative shopId' },
          { shopId: 0, notificationId: validNotificationId, scenario: 'zero shopId' },
          { shopId: validShopId, notificationId: -1, scenario: 'negative notificationId' },
          { shopId: validShopId, notificationId: 0, scenario: 'zero notificationId' },
          { shopId: 'invalid', notificationId: validNotificationId, scenario: 'non-numeric shopId' },
          { shopId: validShopId, notificationId: 'invalid', scenario: 'non-numeric notificationId' },
        ];

        for (const testCase of testCases) {
          const response = await request(app.getHttpServer())
            .get(`/api/v1/shops/${testCase.shopId}/notifications/${testCase.notificationId}/history`)
            .set('ny-operator', operatorHeader)
            .expect(400);

          // Verify consistent response structure for each test case
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

          // Verify that success is explicitly false (not just falsy)
          expect(response.body.success).toBe(false);

          // Verify error details are not empty
          expect(Object.keys(response.body.error.details).length).toBeGreaterThan(0);

          // Verify timestamp is valid ISO string
          expect(new Date(response.body.timestamp).toISOString()).toBe(response.body.timestamp);
        }
      });

      it('should include appropriate HTTP Content-Type header for validation errors', async () => {
        await request(app.getHttpServer())
          .get(`/api/v1/shops/invalid/notifications/${validNotificationId}/history`)
          .set('ny-operator', operatorHeader)
          .expect('Content-Type', /application\/json/)
          .expect(400);
      });

      it('should generate unique request IDs for validation error responses', async () => {
        const requests = Array(3)
          .fill(null)
          .map(() =>
            request(app.getHttpServer())
              .get(`/api/v1/shops/0/notifications/${validNotificationId}/history`)
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
    });
  });
});