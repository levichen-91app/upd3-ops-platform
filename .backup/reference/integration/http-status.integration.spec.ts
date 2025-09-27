import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../api/app.module';
import { TestSetupHelper } from '../helpers/test-setup.helper';

describe('HTTP Status Code Standardization Integration Tests', () => {
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
    testHelper.mockWhaleApiSuccess(5);
  });

  describe('200 OK - Successful PATCH Operations', () => {
    const validRequest = {
      market: 'TW',
      oldSupplierId: 100,
      newSupplierId: 200,
    };
    const shopId = 12345;
    const operatorHeader = 'test-operator@91app.com';

    it('should return 200 OK for successful PATCH partial update', async () => {
      await request(app.getHttpServer())
        .patch(`/api/v1/shops/${shopId}/suppliers`)
        .set('ny-operator', operatorHeader)
        .send(validRequest)
        .expect(200);
    });

    it('should return 200 OK with proper response body for successful updates', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/v1/shops/${shopId}/suppliers`)
        .set('ny-operator', operatorHeader)
        .send(validRequest)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeTruthy();
      expect(response.body.data.updatedCount).toBeGreaterThanOrEqual(0);
    });

    it('should consistently return 200 OK for different valid requests', async () => {
      const testCases = [
        { market: 'TW', oldSupplierId: 100, newSupplierId: 200 },
        { market: 'HK', oldSupplierId: 300, newSupplierId: 400 },
        { market: 'JP', oldSupplierId: 500, newSupplierId: 600 },
      ];

      for (const testCase of testCases) {
        await request(app.getHttpServer())
          .patch(`/api/v1/shops/${shopId}/suppliers`)
          .set('ny-operator', operatorHeader)
          .send(testCase)
          .expect(200);
      }
    });
  });

  describe('400 Bad Request - Validation Errors', () => {
    const shopId = 12345;
    const operatorHeader = 'test-operator@91app.com';

    it('should return 400 Bad Request for missing required fields', async () => {
      const invalidRequests = [
        { oldSupplierId: 100, newSupplierId: 200 }, // Missing market
        { market: 'TW', newSupplierId: 200 }, // Missing oldSupplierId
        { market: 'TW', oldSupplierId: 100 }, // Missing newSupplierId
        {}, // Missing all fields
      ];

      for (const requestPayload of invalidRequests) {
        await request(app.getHttpServer())
          .patch(`/api/v1/shops/${shopId}/suppliers`)
          .set('ny-operator', operatorHeader)
          .send(requestPayload)
          .expect(400);
      }
    });

    it('should return 400 Bad Request for invalid field formats', async () => {
      const invalidRequests = [
        { market: '', oldSupplierId: 100, newSupplierId: 200 }, // Empty market
        { market: 'TOOLONGMARKET', oldSupplierId: 100, newSupplierId: 200 }, // Invalid market format
        { market: 'TW', oldSupplierId: 0, newSupplierId: 200 }, // Invalid oldSupplierId
        { market: 'TW', oldSupplierId: -1, newSupplierId: 200 }, // Negative oldSupplierId
        { market: 'TW', oldSupplierId: 100, newSupplierId: 0 }, // Invalid newSupplierId
        { market: 'TW', oldSupplierId: 100, newSupplierId: -1 }, // Negative newSupplierId
        { market: 'TW', oldSupplierId: 'abc', newSupplierId: 200 }, // Non-numeric supplier ID
        { market: 123, oldSupplierId: 100, newSupplierId: 200 }, // Non-string market
      ];

      for (const requestPayload of invalidRequests) {
        await request(app.getHttpServer())
          .patch(`/api/v1/shops/${shopId}/suppliers`)
          .set('ny-operator', operatorHeader)
          .send(requestPayload)
          .expect(400);
      }
    });

    it('should return 400 Bad Request for business logic violations', async () => {
      const businessLogicViolations = [
        { market: 'TW', oldSupplierId: 100, newSupplierId: 100 }, // Identical supplier IDs
      ];

      for (const requestPayload of businessLogicViolations) {
        await request(app.getHttpServer())
          .patch(`/api/v1/shops/${shopId}/suppliers`)
          .set('ny-operator', operatorHeader)
          .send(requestPayload)
          .expect(400);
      }
    });

    it('should return 400 for invalid shop IDs that fail business validation', async () => {
      const validRequest = {
        market: 'TW',
        oldSupplierId: 100,
        newSupplierId: 200,
      };

      // These pass ParseInt but fail business validation and return 400
      const businessInvalidIds = ['0', '-1'];
      for (const invalidShopId of businessInvalidIds) {
        await request(app.getHttpServer())
          .patch(`/api/v1/shops/${invalidShopId}/suppliers`)
          .set('ny-operator', operatorHeader)
          .send(validRequest)
          .expect(400);
      }
    });

    it('should return 400 Bad Request for malformed JSON', async () => {
      await request(app.getHttpServer())
        .patch(`/api/v1/shops/${shopId}/suppliers`)
        .set('ny-operator', operatorHeader)
        .set('Content-Type', 'application/json')
        .send('{ invalid json }')
        .expect(400);
    });

    it('should return 400 Bad Request for unsupported Content-Type', async () => {
      const validRequest = {
        market: 'TW',
        oldSupplierId: 100,
        newSupplierId: 200,
      };

      await request(app.getHttpServer())
        .patch(`/api/v1/shops/${shopId}/suppliers`)
        .set('ny-operator', operatorHeader)
        .set('Content-Type', 'text/plain')
        .send('some text data')
        .expect(400);
    });
  });

  describe('401 Unauthorized - Authentication Errors', () => {
    const shopId = 12345;
    const validRequest = {
      market: 'TW',
      oldSupplierId: 100,
      newSupplierId: 200,
    };

    it('should return 401 Unauthorized when ny-operator header is missing', async () => {
      await request(app.getHttpServer())
        .patch(`/api/v1/shops/${shopId}/suppliers`)
        .send(validRequest)
        .expect(401);
    });

    it('should return 401 Unauthorized when ny-operator header is empty', async () => {
      await request(app.getHttpServer())
        .patch(`/api/v1/shops/${shopId}/suppliers`)
        .set('ny-operator', '')
        .send(validRequest)
        .expect(401);
    });

    it('should return 401 Unauthorized with proper error response structure', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/v1/shops/${shopId}/suppliers`)
        .send(validRequest)
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'UNAUTHORIZED_ACCESS',
          message: expect.stringMatching(
            /authentication|credential|unauthorized|missing|operator/i,
          ),
        },
        timestamp: expect.any(String),
        requestId: expect.any(String),
      });
    });
  });

  describe('404 Not Found - Resource Not Found', () => {
    const validRequest = {
      market: 'TW',
      oldSupplierId: 100,
      newSupplierId: 200,
    };
    const operatorHeader = 'test-operator@91app.com';

    it('should return 404 Not Found for non-existent endpoints', async () => {
      await request(app.getHttpServer())
        .patch('/api/v1/nonexistent/endpoint')
        .set('ny-operator', operatorHeader)
        .send(validRequest)
        .expect(404);
    });

    it('should return 404 Not Found for old proxy endpoint (removed)', async () => {
      await request(app.getHttpServer())
        .post('/proxy/whale/update-supplier-id')
        .set('ny-operator', operatorHeader)
        .send(validRequest)
        .expect(404);
    });

    it('should return 404 Not Found when version prefix is missing', async () => {
      await request(app.getHttpServer())
        .patch('/shops/12345/suppliers')
        .set('ny-operator', operatorHeader)
        .send(validRequest)
        .expect(404);
    });
  });

  describe('404 Not Found - Unsupported HTTP Methods', () => {
    const shopId = 12345;
    const validRequest = {
      market: 'TW',
      oldSupplierId: 100,
      newSupplierId: 200,
    };
    const operatorHeader = 'test-operator@91app.com';

    it('should return 404 for POST on supplier resource (method not supported)', async () => {
      // This endpoint should only accept PATCH, not POST
      await request(app.getHttpServer())
        .post(`/api/v1/shops/${shopId}/suppliers`)
        .set('ny-operator', operatorHeader)
        .send(validRequest)
        .expect(404);
    });

    it('should return 404 for PUT on supplier resource (method not supported)', async () => {
      // This endpoint should only accept PATCH, not PUT
      await request(app.getHttpServer())
        .put(`/api/v1/shops/${shopId}/suppliers`)
        .set('ny-operator', operatorHeader)
        .send(validRequest)
        .expect(404);
    });

    it('should return 404 for GET on supplier resource (method not supported)', async () => {
      // This endpoint should only accept PATCH, not GET
      await request(app.getHttpServer())
        .get(`/api/v1/shops/${shopId}/suppliers`)
        .set('ny-operator', operatorHeader)
        .expect(404);
    });

    it('should return 404 for DELETE on supplier resource (method not supported)', async () => {
      // This endpoint should only accept PATCH, not DELETE
      await request(app.getHttpServer())
        .delete(`/api/v1/shops/${shopId}/suppliers`)
        .set('ny-operator', operatorHeader)
        .expect(404);
    });
  });

  describe('502 Bad Gateway - Upstream Service Errors', () => {
    const shopId = 12345;
    const operatorHeader = 'test-operator@91app.com';
    const validRequest = {
      market: 'TW',
      oldSupplierId: 100,
      newSupplierId: 200,
    };

    it('should return 502 Bad Gateway when Whale API is unavailable', async () => {
      testHelper.mockWhaleApiNetworkError();

      const response = await request(app.getHttpServer())
        .patch(`/api/v1/shops/${shopId}/suppliers`)
        .set('ny-operator', operatorHeader)
        .send(validRequest)
        .expect(502);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: expect.stringMatching(
            /WHALE_API_UNAVAILABLE|EXTERNAL_SERVICE_ERROR|NETWORK_ERROR/,
          ),
          message: expect.stringMatching(
            /service.*unavailable|network.*error|external.*error/i,
          ),
          details: expect.any(Object),
        },
        timestamp: expect.stringMatching(
          /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
        ),
        requestId: expect.stringMatching(/^req-\d{14}-[a-f0-9-]{36}$/),
      });
    });

    it('should return 502 Bad Gateway for Whale API timeout', async () => {
      testHelper.mockWhaleApiTimeout();

      await request(app.getHttpServer())
        .patch(`/api/v1/shops/${shopId}/suppliers`)
        .set('ny-operator', operatorHeader)
        .send(validRequest)
        .expect(502);
    });

    it('should return 502 Bad Gateway for Whale API server errors', async () => {
      testHelper.mockWhaleApi500Error();

      await request(app.getHttpServer())
        .patch(`/api/v1/shops/${shopId}/suppliers`)
        .set('ny-operator', operatorHeader)
        .send(validRequest)
        .expect(502);
    });

    it('should return 502 Bad Gateway for Whale API client errors', async () => {
      testHelper.mockWhaleApi400Error();

      await request(app.getHttpServer())
        .patch(`/api/v1/shops/${shopId}/suppliers`)
        .set('ny-operator', operatorHeader)
        .send(validRequest)
        .expect(502);
    });
  });

  describe('Status Code Consistency Across Different Scenarios', () => {
    const shopId = 12345;
    const operatorHeader = 'test-operator@91app.com';

    it('should maintain consistent status codes for the same type of errors', async () => {
      // All validation errors should return 400
      const validationErrors = [
        { market: '', oldSupplierId: 100, newSupplierId: 200 },
        { oldSupplierId: 100, newSupplierId: 200 },
        { market: 'TW', oldSupplierId: -1, newSupplierId: 200 },
      ];

      for (const errorRequest of validationErrors) {
        await request(app.getHttpServer())
          .patch(`/api/v1/shops/${shopId}/suppliers`)
          .set('ny-operator', operatorHeader)
          .send(errorRequest)
          .expect(400);
      }
    });

    it('should maintain consistent status codes for authentication errors', async () => {
      const validRequest = {
        market: 'TW',
        oldSupplierId: 100,
        newSupplierId: 200,
      };

      // All auth errors should return 401
      const authScenarios = [
        () =>
          request(app.getHttpServer())
            .patch(`/api/v1/shops/${shopId}/suppliers`)
            .send(validRequest),
        () =>
          request(app.getHttpServer())
            .patch(`/api/v1/shops/${shopId}/suppliers`)
            .set('ny-operator', '')
            .send(validRequest),
      ];

      for (const scenario of authScenarios) {
        await scenario().expect(401);
      }
    });

    it('should use correct status codes according to HTTP semantics', async () => {
      // Test HTTP semantic correctness
      const scenarios = [
        {
          description: 'successful partial update',
          request: () =>
            request(app.getHttpServer())
              .patch(`/api/v1/shops/${shopId}/suppliers`)
              .set('ny-operator', operatorHeader)
              .send({ market: 'TW', oldSupplierId: 100, newSupplierId: 200 }),
          expectedStatus: 200,
        },
        {
          description: 'client error - bad request',
          request: () =>
            request(app.getHttpServer())
              .patch(`/api/v1/shops/${shopId}/suppliers`)
              .set('ny-operator', operatorHeader)
              .send({}),
          expectedStatus: 400,
        },
        {
          description: 'client error - unauthorized',
          request: () =>
            request(app.getHttpServer())
              .patch(`/api/v1/shops/${shopId}/suppliers`)
              .send({ market: 'TW', oldSupplierId: 100, newSupplierId: 200 }),
          expectedStatus: 401,
        },
        {
          description: 'client error - not found',
          request: () =>
            request(app.getHttpServer())
              .patch('/api/v1/nonexistent')
              .set('ny-operator', operatorHeader)
              .send({ market: 'TW', oldSupplierId: 100, newSupplierId: 200 }),
          expectedStatus: 404,
        },
      ];

      for (const scenario of scenarios) {
        await scenario.request().expect(scenario.expectedStatus);
      }
    });
  });
});
