import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../api/app.module';
import { TestSetupHelper } from '../helpers/test-setup.helper';

describe('Unified Response Format Integration Tests', () => {
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

  describe('Successful Response Format', () => {
    const validRequest = {
      market: 'TW',
      oldSupplierId: 100,
      newSupplierId: 200,
    };
    const shopId = 12345;
    const operatorHeader = 'test-operator@91app.com';

    it('should return unified success response structure', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/v1/shops/${shopId}/suppliers`)
        .set('ny-operator', operatorHeader)
        .send(validRequest)
        .expect(200);

      // Validate ApiResponse<T> structure
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('requestId');

      // Validate required fields are present
      expect(Object.keys(response.body)).toEqual(
        expect.arrayContaining(['success', 'data', 'timestamp', 'requestId'])
      );

      // No additional properties should be present
      expect(Object.keys(response.body)).toHaveLength(4);
    });

    it('should have valid timestamp in ISO 8601 format', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/v1/shops/${shopId}/suppliers`)
        .set('ny-operator', operatorHeader)
        .send(validRequest)
        .expect(200);

      const timestamp = response.body.timestamp;

      // Should match ISO 8601 format
      expect(timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);

      // Should be a valid date
      const date = new Date(timestamp);
      expect(date).toBeInstanceOf(Date);
      expect(date.getTime()).not.toBeNaN();

      // Should be recent (within last 5 seconds)
      const now = new Date();
      const timeDiff = now.getTime() - date.getTime();
      expect(timeDiff).toBeLessThan(5000);
    });

    it('should have valid requestId format', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/v1/shops/${shopId}/suppliers`)
        .set('ny-operator', operatorHeader)
        .send(validRequest)
        .expect(200);

      const requestId = response.body.requestId;

      // Should match req-{timestamp}-{uuid} format
      expect(requestId).toMatch(/^req-\d{14}-[a-f0-9-]{36}$/);

      // Should be unique for different requests
      const response2 = await request(app.getHttpServer())
        .patch(`/api/v1/shops/${shopId}/suppliers`)
        .set('ny-operator', operatorHeader)
        .send(validRequest)
        .expect(200);

      expect(response2.body.requestId).not.toBe(requestId);
    });

    it('should have proper data structure for supplier update', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/api/v1/shops/${shopId}/suppliers`)
        .set('ny-operator', operatorHeader)
        .send(validRequest)
        .expect(200);

      const data = response.body.data;

      // Validate SupplierUpdateData structure
      expect(data).toHaveProperty('updatedCount');
      expect(data).toHaveProperty('shopId');
      expect(data).toHaveProperty('market');
      expect(data).toHaveProperty('supplierId');

      // Validate data types
      expect(typeof data.updatedCount).toBe('number');
      expect(typeof data.shopId).toBe('number');
      expect(typeof data.market).toBe('string');
      expect(typeof data.supplierId).toBe('number');

      // Validate data values
      expect(data.updatedCount).toBeGreaterThanOrEqual(0);
      expect(data.shopId).toBe(shopId);
      expect(data.market).toBe(validRequest.market);
      expect(data.supplierId).toBe(validRequest.newSupplierId);
    });
  });

  describe('Error Response Format', () => {
    const shopId = 12345;
    const operatorHeader = 'test-operator@91app.com';

    it('should return unified error response structure for validation errors', async () => {
      const invalidRequest = {
        market: '', // Invalid empty market
        oldSupplierId: 100,
        newSupplierId: 200,
      };

      const response = await request(app.getHttpServer())
        .patch(`/api/v1/shops/${shopId}/suppliers`)
        .set('ny-operator', operatorHeader)
        .send(invalidRequest)
        .expect(400);

      // Validate ApiErrorResponse structure
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('requestId');

      // Validate error object structure
      expect(response.body.error).toHaveProperty('code');
      expect(response.body.error).toHaveProperty('message');
      expect(response.body.error).toHaveProperty('details');

      // No additional properties should be present
      expect(Object.keys(response.body)).toEqual(
        expect.arrayContaining(['success', 'error', 'timestamp', 'requestId'])
      );
      expect(Object.keys(response.body)).toHaveLength(4);
    });

    it('should return structured error codes', async () => {
      const testCases = [
        {
          request: { oldSupplierId: 100, newSupplierId: 200 }, // Missing market
          expectedCode: /^(VALIDATION_ERROR|MISSING_REQUIRED_FIELD)$/,
          description: 'missing required field'
        },
        {
          request: { market: 'TW', oldSupplierId: 100, newSupplierId: 100 }, // Identical IDs
          expectedCode: 'SUPPLIER_IDS_IDENTICAL',
          description: 'business logic violation'
        },
        {
          request: { market: 'INVALID', oldSupplierId: -1, newSupplierId: 200 }, // Invalid values
          expectedCode: /^(VALIDATION_ERROR|INVALID_FIELD_FORMAT)$/,
          description: 'invalid field format'
        }
      ];

      for (const testCase of testCases) {
        const response = await request(app.getHttpServer())
          .patch(`/api/v1/shops/${shopId}/suppliers`)
          .set('ny-operator', operatorHeader)
          .send(testCase.request)
          .expect(400);

        if (typeof testCase.expectedCode === 'string') {
          expect(response.body.error.code).toBe(testCase.expectedCode);
        } else {
          expect(response.body.error.code).toMatch(testCase.expectedCode);
        }

        expect(response.body.error.message).toBeTruthy();
        expect(typeof response.body.error.message).toBe('string');
      }
    });

    it('should include error details for context', async () => {
      const invalidRequest = {
        market: 'TW',
        oldSupplierId: 100,
        newSupplierId: 100, // Same as old - business logic error
      };

      const response = await request(app.getHttpServer())
        .patch(`/api/v1/shops/${shopId}/suppliers`)
        .set('ny-operator', operatorHeader)
        .send(invalidRequest)
        .expect(400);

      expect(response.body.error.details).toBeTruthy();
      expect(typeof response.body.error.details).toBe('object');

      // For SUPPLIER_IDS_IDENTICAL error, should include both IDs in details
      if (response.body.error.code === 'SUPPLIER_IDS_IDENTICAL') {
        expect(response.body.error.details).toHaveProperty('oldSupplierId');
        expect(response.body.error.details).toHaveProperty('newSupplierId');
        expect(response.body.error.details.oldSupplierId).toBe(100);
        expect(response.body.error.details.newSupplierId).toBe(100);
      }
    });

    it('should have consistent timestamp and requestId in error responses', async () => {
      const invalidRequest = {
        market: 'TW',
        oldSupplierId: 100,
        newSupplierId: 100,
      };

      const response = await request(app.getHttpServer())
        .patch(`/api/v1/shops/${shopId}/suppliers`)
        .set('ny-operator', operatorHeader)
        .send(invalidRequest)
        .expect(400);

      // Same timestamp validation as success responses
      expect(response.body.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);

      // Same requestId validation as success responses
      expect(response.body.requestId).toMatch(/^req-\d{14}-[a-f0-9-]{36}$/);

      const date = new Date(response.body.timestamp);
      expect(date).toBeInstanceOf(Date);
      expect(date.getTime()).not.toBeNaN();
    });
  });

  describe('Response Headers Validation', () => {
    const validRequest = {
      market: 'TW',
      oldSupplierId: 100,
      newSupplierId: 200,
    };
    const shopId = 12345;
    const operatorHeader = 'test-operator@91app.com';

    it('should return proper Content-Type header for JSON responses', async () => {
      await request(app.getHttpServer())
        .patch(`/api/v1/shops/${shopId}/suppliers`)
        .set('ny-operator', operatorHeader)
        .send(validRequest)
        .expect('Content-Type', /application\/json/)
        .expect(200);
    });

    it('should return proper Content-Type header for error responses', async () => {
      const invalidRequest = { market: '', oldSupplierId: 100, newSupplierId: 200 };

      await request(app.getHttpServer())
        .patch(`/api/v1/shops/${shopId}/suppliers`)
        .set('ny-operator', operatorHeader)
        .send(invalidRequest)
        .expect('Content-Type', /application\/json/)
        .expect(400);
    });
  });
});