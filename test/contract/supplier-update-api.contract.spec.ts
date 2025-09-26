import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../api/app.module';
import { TestSetupHelper } from '../helpers/test-setup.helper';

describe('Supplier Update API Contract Tests', () => {
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

  describe('PATCH /api/v1/shops/{shopId}/suppliers', () => {
    const validRequest = {
      market: 'TW',
      oldSupplierId: 100,
      newSupplierId: 200,
    };

    const shopId = 12345;
    const operatorHeader = 'test-operator@91app.com';

    describe('Successful Response Contract', () => {
      it('should return 200 with valid ApiResponse structure', async () => {
        const response = await request(app.getHttpServer())
          .patch(`/api/v1/shops/${shopId}/suppliers`)
          .set('ny-operator', operatorHeader)
          .send(validRequest)
          .expect(200);

        // Assert response structure matches ApiResponse schema
        expect(response.body).toMatchObject({
          success: true,
          data: expect.any(Object),
          timestamp: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/),
          requestId: expect.stringMatching(/^req-\d{14}-[a-f0-9-]{36}$/),
        });

        // Assert data structure matches SupplierUpdateData schema
        expect(response.body.data).toMatchObject({
          updatedCount: expect.any(Number),
          shopId: expect.any(Number),
          market: expect.any(String),
          supplierId: expect.any(Number),
        });

        expect(response.body.data.updatedCount).toBeGreaterThanOrEqual(0);
        expect(response.body.data.shopId).toBe(shopId);
        expect(response.body.data.market).toBe(validRequest.market);
        expect(response.body.data.supplierId).toBe(validRequest.newSupplierId);
      });

      it('should include proper Content-Type header', async () => {
        await request(app.getHttpServer())
          .patch(`/api/v1/shops/${shopId}/suppliers`)
          .set('ny-operator', operatorHeader)
          .send(validRequest)
          .expect('Content-Type', /application\/json/)
          .expect(200);
      });
    });

    describe('Validation Error Response Contract (400)', () => {
      it('should return 400 with ApiErrorResponse when market is missing', async () => {
        const invalidRequest = { ...validRequest };
        delete (invalidRequest as any).market;

        const response = await request(app.getHttpServer())
          .patch(`/api/v1/shops/${shopId}/suppliers`)
          .set('ny-operator', operatorHeader)
          .send(invalidRequest)
          .expect(400);

        // Assert error response structure matches ApiErrorResponse schema
        expect(response.body).toMatchObject({
          success: false,
          error: {
            code: expect.stringMatching(/^(VALIDATION_ERROR|MISSING_REQUIRED_FIELD)$/),
            message: expect.any(String),
            details: expect.any(Object),
          },
          timestamp: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/),
          requestId: expect.stringMatching(/^req-\d{14}-[a-f0-9-]{36}$/),
        });

        expect(response.body.error.message.toLowerCase()).toContain('market');
      });

      it('should return 400 when oldSupplierId equals newSupplierId', async () => {
        const invalidRequest = {
          market: 'TW',
          oldSupplierId: 100,
          newSupplierId: 100, // Same as old
        };

        const response = await request(app.getHttpServer())
          .patch(`/api/v1/shops/${shopId}/suppliers`)
          .set('ny-operator', operatorHeader)
          .send(invalidRequest)
          .expect(400);

        expect(response.body.error.code).toBe('SUPPLIER_IDS_IDENTICAL');
        expect(response.body.error.message).toContain('different');
        expect(response.body.error.details).toMatchObject({
          oldSupplierId: 100,
          newSupplierId: 100,
        });
      });
    });

    describe('Authorization Error Response Contract (401)', () => {
      it('should return 401 when ny-operator header is missing', async () => {
        const response = await request(app.getHttpServer())
          .patch(`/api/v1/shops/${shopId}/suppliers`)
          .send(validRequest)
          .expect(401);

        expect(response.body).toMatchObject({
          success: false,
          error: {
            code: 'UNAUTHORIZED_ACCESS',
            message: expect.stringMatching(/authentication|missing|operator/i),
          },
          timestamp: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/),
          requestId: expect.stringMatching(/^req-\d{14}-[a-f0-9-]{36}$/),
        });
      });
    });

    describe('Request ID Uniqueness Contract', () => {
      it('should generate unique request IDs for concurrent requests', async () => {
        const requests = Array(3).fill(null).map(() =>
          request(app.getHttpServer())
            .patch(`/api/v1/shops/${shopId}/suppliers`)
            .set('ny-operator', operatorHeader)
            .send(validRequest)
        );

        const responses = await Promise.all(requests);
        const requestIds = responses.map(res => res.body.requestId);

        // All request IDs should be unique
        expect(new Set(requestIds).size).toBe(requestIds.length);

        // All should match the expected format
        requestIds.forEach(id => {
          expect(id).toMatch(/^req-\d{14}-[a-f0-9-]{36}$/);
        });
      });
    });
  });
});