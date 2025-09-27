import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../api/app.module';
import { TestSetupHelper } from '../helpers/test-setup.helper';

describe('RESTful API Design Validation (Integration)', () => {
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

  describe('API Version Control Validation', () => {
    const validRequest = {
      market: 'TW',
      oldSupplierId: 100,
      newSupplierId: 200,
    };
    const shopId = 12345;
    const operatorHeader = 'test-operator@91app.com';

    it('should return 404 for old proxy endpoint (removed)', async () => {
      // Test that old endpoint no longer exists
      await request(app.getHttpServer())
        .post('/proxy/whale/update-supplier-id')
        .set('ny-operator', operatorHeader)
        .send(validRequest)
        .expect(404);
    });

    it('should return 404 when /api/v1 version prefix is missing', async () => {
      // Test that version control is mandatory
      await request(app.getHttpServer())
        .patch(`/shops/${shopId}/suppliers`)
        .set('ny-operator', operatorHeader)
        .send(validRequest)
        .expect(404);
    });

    it('should accept new RESTful endpoint with proper version prefix', async () => {
      // Test that new endpoint works with version control
      await request(app.getHttpServer())
        .patch(`/api/v1/shops/${shopId}/suppliers`)
        .set('ny-operator', operatorHeader)
        .send(validRequest)
        .expect(200);
    });
  });

  describe('Resource-Oriented URL Design', () => {
    it('should follow resource-oriented design pattern', async () => {
      // URL structure: /api/v1/{resource-collection}/{resource-id}/{sub-resource}
      const shopId = 12345;
      const validRequest = {
        market: 'TW',
        oldSupplierId: 100,
        newSupplierId: 200,
      };

      const response = await request(app.getHttpServer())
        .patch(`/api/v1/shops/${shopId}/suppliers`)
        .set('ny-operator', 'test-operator@91app.com')
        .send(validRequest)
        .expect(200);

      // Verify that shopId is extracted from URL path
      expect(response.body.data.shopId).toBe(shopId);
    });

    it('should use PATCH method for partial updates', async () => {
      // Test that PATCH method is used instead of POST for updates
      const shopId = 12345;
      const validRequest = {
        market: 'TW',
        oldSupplierId: 100,
        newSupplierId: 200,
      };

      // PATCH should work
      await request(app.getHttpServer())
        .patch(`/api/v1/shops/${shopId}/suppliers`)
        .set('ny-operator', 'test-operator@91app.com')
        .send(validRequest)
        .expect(200);

      // POST should not be allowed for this resource update (returns 404 since route doesn't exist)
      await request(app.getHttpServer())
        .post(`/api/v1/shops/${shopId}/suppliers`)
        .set('ny-operator', 'test-operator@91app.com')
        .send(validRequest)
        .expect(404); // Not Found - route doesn't exist
    });
  });

  describe('Path Parameter Validation', () => {
    const validRequest = {
      market: 'TW',
      oldSupplierId: 100,
      newSupplierId: 200,
    };

    it('should validate shopId as positive integer', async () => {
      // Test invalid shopId formats
      const invalidShopIds = ['invalid', '0', '-1', 'abc123'];

      for (const invalidShopId of invalidShopIds) {
        await request(app.getHttpServer())
          .patch(`/api/v1/shops/${invalidShopId}/suppliers`)
          .set('ny-operator', 'test-operator@91app.com')
          .send(validRequest)
          .expect(400);
      }
    });

    it('should accept valid shopId format', async () => {
      const validShopIds = ['1', '12345', '999999'];

      for (const validShopId of validShopIds) {
        await request(app.getHttpServer())
          .patch(`/api/v1/shops/${validShopId}/suppliers`)
          .set('ny-operator', 'test-operator@91app.com')
          .send(validRequest)
          .expect(200);
      }
    });
  });

  describe('HTTP Headers Validation', () => {
    const validRequest = {
      market: 'TW',
      oldSupplierId: 100,
      newSupplierId: 200,
    };
    const shopId = 12345;

    it('should require ny-operator header', async () => {
      await request(app.getHttpServer())
        .patch(`/api/v1/shops/${shopId}/suppliers`)
        .send(validRequest)
        .expect(401);
    });

    it('should accept valid ny-operator header', async () => {
      const validOperators = [
        'user@91app.com',
        'admin@company.com',
        'test-operator',
      ];

      for (const operator of validOperators) {
        await request(app.getHttpServer())
          .patch(`/api/v1/shops/${shopId}/suppliers`)
          .set('ny-operator', operator)
          .send(validRequest)
          .expect(200);
      }
    });

    it('should require Content-Type: application/json', async () => {
      await request(app.getHttpServer())
        .patch(`/api/v1/shops/${shopId}/suppliers`)
        .set('ny-operator', 'test-operator@91app.com')
        .set('Content-Type', 'text/plain')
        .send('invalid content')
        .expect(400);
    });
  });
});
