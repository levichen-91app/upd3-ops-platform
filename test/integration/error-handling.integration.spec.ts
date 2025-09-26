import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../api/app.module';
import { TestSetupHelper } from '../helpers/test-setup.helper';

describe('Structured Error Handling Integration Tests', () => {
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

  describe('Error Code Classification System', () => {
    const shopId = 12345;
    const operatorHeader = 'test-operator@91app.com';

    it('should return validation errors (1000-1999) for input validation failures', async () => {
      const validationTestCases = [
        {
          request: { oldSupplierId: 100, newSupplierId: 200 }, // Missing market
          expectedCodes: ['VALIDATION_ERROR', 'MISSING_REQUIRED_FIELD'],
          description: 'missing required field'
        },
        {
          request: { market: '', oldSupplierId: 100, newSupplierId: 200 }, // Empty market
          expectedCodes: ['VALIDATION_ERROR', 'INVALID_FIELD_FORMAT'],
          description: 'empty required field'
        },
        {
          request: { market: 'TOOLONG', oldSupplierId: 0, newSupplierId: 200 }, // Invalid supplier ID
          expectedCodes: ['VALIDATION_ERROR', 'INVALID_SUPPLIER_ID'],
          description: 'invalid supplier ID format'
        },
        {
          request: { market: 'INVALID_FORMAT_123', oldSupplierId: 100, newSupplierId: 200 }, // Invalid market format
          expectedCodes: ['VALIDATION_ERROR', 'INVALID_MARKET_CODE'],
          description: 'invalid market code format'
        }
      ];

      for (const testCase of validationTestCases) {
        const response = await request(app.getHttpServer())
          .patch(`/api/v1/shops/${shopId}/suppliers`)
          .set('ny-operator', operatorHeader)
          .send(testCase.request)
          .expect(400);

        expect(testCase.expectedCodes).toContain(response.body.error.code);
        expect(response.body.error.message).toBeTruthy();
        expect(typeof response.body.error.message).toBe('string');
        expect(response.body.error.message.length).toBeGreaterThan(0);
      }
    });

    it('should return business logic errors (4000-4999) for business rule violations', async () => {
      const businessLogicTestCases = [
        {
          request: { market: 'TW', oldSupplierId: 100, newSupplierId: 100 }, // Identical IDs
          expectedCode: 'SUPPLIER_IDS_IDENTICAL',
          description: 'identical supplier IDs not allowed'
        }
      ];

      for (const testCase of businessLogicTestCases) {
        const response = await request(app.getHttpServer())
          .patch(`/api/v1/shops/${shopId}/suppliers`)
          .set('ny-operator', operatorHeader)
          .send(testCase.request)
          .expect(400);

        expect(response.body.error.code).toBe(testCase.expectedCode);
        expect(response.body.error.message).toContain('different');
        expect(response.body.error.details).toBeTruthy();
      }
    });

    it('should return system errors (5000-5999) for external service failures', async () => {
      const validRequest = { market: 'TW', oldSupplierId: 100, newSupplierId: 200 };

      // Test Whale API unavailable error
      testHelper.mockWhaleApiNetworkError();

      const response = await request(app.getHttpServer())
        .patch(`/api/v1/shops/${shopId}/suppliers`)
        .set('ny-operator', operatorHeader)
        .send(validRequest)
        .expect(502);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: expect.stringMatching(/WHALE_API_UNAVAILABLE|EXTERNAL_SERVICE_ERROR|NETWORK_ERROR/),
          message: expect.stringMatching(/service.*unavailable|network.*error|external.*error/i),
          details: expect.any(Object)
        },
        timestamp: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/),
        requestId: expect.stringMatching(/^req-\d{14}-[a-f0-9-]{36}$/)
      });
    });

    it('should return system errors for Whale API timeout', async () => {
      const validRequest = { market: 'TW', oldSupplierId: 100, newSupplierId: 200 };

      testHelper.mockWhaleApiTimeout();

      const response = await request(app.getHttpServer())
        .patch(`/api/v1/shops/${shopId}/suppliers`)
        .set('ny-operator', operatorHeader)
        .send(validRequest)
        .expect(502);

      expect(response.body.error.code).toMatch(/TIMEOUT|EXTERNAL_SERVICE_ERROR|WHALE_API_UNAVAILABLE/);
      expect(response.body.error.message).toMatch(/timeout|external.*error|unavailable|service/i);
    });

    it('should return system errors for Whale API server errors', async () => {
      const validRequest = { market: 'TW', oldSupplierId: 100, newSupplierId: 200 };

      testHelper.mockWhaleApi500Error();

      const response = await request(app.getHttpServer())
        .patch(`/api/v1/shops/${shopId}/suppliers`)
        .set('ny-operator', operatorHeader)
        .send(validRequest)
        .expect(502);

      expect(response.body.error.code).toMatch(/WHALE_API_ERROR|EXTERNAL_SERVICE_ERROR|SERVER_ERROR/);
      expect(response.body.error.message).toMatch(/server.*error|external.*error/i);
    });
  });

  describe('English Error Messages', () => {
    const shopId = 12345;
    const operatorHeader = 'test-operator@91app.com';

    it('should return error messages in English only', async () => {
      const testCases = [
        { market: '', oldSupplierId: 100, newSupplierId: 200 },
        { market: 'TW', oldSupplierId: 100, newSupplierId: 100 },
        { market: 'INVALID', oldSupplierId: -1, newSupplierId: 200 }
      ];

      for (const testCase of testCases) {
        const response = await request(app.getHttpServer())
          .patch(`/api/v1/shops/${shopId}/suppliers`)
          .set('ny-operator', operatorHeader)
          .send(testCase)
          .expect(400);

        const message = response.body.error.message;

        // Should be English text (basic validation)
        expect(message).toMatch(/^[a-zA-Z0-9\s.,!?-]+$/);
        expect(message).not.toMatch(/[\u4e00-\u9fff]/); // No Chinese characters
        expect(message).not.toMatch(/[\u3040-\u309f\u30a0-\u30ff]/); // No Japanese characters

        // Should be meaningful and descriptive
        expect(message.length).toBeGreaterThan(5);
        expect(message.toLowerCase()).toMatch(/(error|invalid|required|missing|different|not|cannot|must|be)/);
      }
    });

    it('should provide clear and actionable error messages', async () => {
      const errorTestCases = [
        {
          request: { oldSupplierId: 100, newSupplierId: 200 }, // Missing market
          expectedKeywords: ['market']
        },
        {
          request: { market: 'TW', oldSupplierId: 100, newSupplierId: 100 }, // Identical IDs
          expectedKeywords: ['supplier', 'different', 'must']
        },
        {
          request: { market: '', oldSupplierId: 100, newSupplierId: 200 }, // Empty market
          expectedKeywords: ['market']
        }
      ];

      for (const testCase of errorTestCases) {
        const response = await request(app.getHttpServer())
          .patch(`/api/v1/shops/${shopId}/suppliers`)
          .set('ny-operator', operatorHeader)
          .send(testCase.request)
          .expect(400);

        const message = response.body.error.message.toLowerCase();

        // Should contain relevant keywords for the error
        for (const keyword of testCase.expectedKeywords) {
          expect(message).toContain(keyword.toLowerCase());
        }
      }
    });
  });

  describe('Error Context and Details', () => {
    const shopId = 12345;
    const operatorHeader = 'test-operator@91app.com';

    it('should provide detailed error context for validation failures', async () => {
      const requestPayload = { oldSupplierId: 100, newSupplierId: 200 }; // Missing market

      const response = await request(app.getHttpServer())
        .patch(`/api/v1/shops/${shopId}/suppliers`)
        .set('ny-operator', operatorHeader)
        .send(requestPayload)
        .expect(400);

      expect(response.body.error.details).toBeTruthy();
      expect(typeof response.body.error.details).toBe('object');

      // Should provide context about the validation failure
      if (response.body.error.code === 'MISSING_REQUIRED_FIELD') {
        expect(response.body.error.details).toHaveProperty('field');
        expect(response.body.error.details.field).toBe('market');
      }
    });

    it('should provide business context for business logic errors', async () => {
      const requestPayload = { market: 'TW', oldSupplierId: 100, newSupplierId: 100 };

      const response = await request(app.getHttpServer())
        .patch(`/api/v1/shops/${shopId}/suppliers`)
        .set('ny-operator', operatorHeader)
        .send(requestPayload)
        .expect(400);

      expect(response.body.error.code).toBe('SUPPLIER_IDS_IDENTICAL');
      expect(response.body.error.details).toMatchObject({
        oldSupplierId: 100,
        newSupplierId: 100
      });

      // Should help with debugging and troubleshooting
      expect(response.body.error.details.oldSupplierId).toBe(requestPayload.oldSupplierId);
      expect(response.body.error.details.newSupplierId).toBe(requestPayload.newSupplierId);
    });
  });

  describe('Global Error Handling Consistency', () => {
    it('should handle authorization errors consistently', async () => {
      const validRequest = { market: 'TW', oldSupplierId: 100, newSupplierId: 200 };

      // Missing ny-operator header
      const response = await request(app.getHttpServer())
        .patch(`/api/v1/shops/12345/suppliers`)
        .send(validRequest)
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          code: 'UNAUTHORIZED_ACCESS',
          message: expect.stringMatching(/authentication|authorization|credential|missing|operator/i)
        },
        timestamp: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/),
        requestId: expect.stringMatching(/^req-\d{14}-[a-f0-9-]{36}$/)
      });
    });

    it('should handle malformed JSON consistently', async () => {
      await request(app.getHttpServer())
        .patch('/api/v1/shops/12345/suppliers')
        .set('ny-operator', 'test-operator@91app.com')
        .set('Content-Type', 'application/json')
        .send('{ invalid json }')
        .expect(400);
    });

    it('should handle unsupported Content-Type consistently', async () => {
      const validRequest = { market: 'TW', oldSupplierId: 100, newSupplierId: 200 };

      await request(app.getHttpServer())
        .patch('/api/v1/shops/12345/suppliers')
        .set('ny-operator', 'test-operator@91app.com')
        .set('Content-Type', 'text/plain')
        .send(JSON.stringify(validRequest))
        .expect(400);
    });
  });

  describe('Error Response Headers and Status Codes', () => {
    const shopId = 12345;
    const operatorHeader = 'test-operator@91app.com';

    it('should return proper Content-Type for all error responses', async () => {
      const errorTestCases = [
        { request: { oldSupplierId: 100, newSupplierId: 200 }, expectedStatus: 400 },
        { request: { market: 'TW', oldSupplierId: 100, newSupplierId: 100 }, expectedStatus: 400 }
      ];

      for (const testCase of errorTestCases) {
        await request(app.getHttpServer())
          .patch(`/api/v1/shops/${shopId}/suppliers`)
          .set('ny-operator', operatorHeader)
          .send(testCase.request)
          .expect('Content-Type', /application\/json/)
          .expect(testCase.expectedStatus);
      }
    });

    it('should maintain consistent error response structure across all error types', async () => {
      const errorScenarios = [
        {
          setup: () => request(app.getHttpServer()).patch('/api/v1/shops/12345/suppliers').send({}),
          description: 'missing operator header'
        },
        {
          setup: () => request(app.getHttpServer()).patch('/api/v1/shops/12345/suppliers')
            .set('ny-operator', 'test').send({ oldSupplierId: 100, newSupplierId: 200 }),
          description: 'missing required field'
        }
      ];

      for (const scenario of errorScenarios) {
        const response = await scenario.setup();

        // All error responses should have the same structure
        expect(response.body).toMatchObject({
          success: false,
          error: {
            code: expect.any(String),
            message: expect.any(String)
          },
          timestamp: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/),
          requestId: expect.stringMatching(/^req-\d{14}-[a-f0-9-]{36}$/)
        });

        expect(Object.keys(response.body)).toEqual(['success', 'error', 'timestamp', 'requestId']);
      }
    });
  });
});