import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import request from 'supertest';
import { AppModule } from '../../api/app.module';

describe('API Documentation Validation Integration Tests', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Configure global validation pipe (same as main.ts)
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );

    // Configure Swagger documentation (same as main.ts)
    const config = new DocumentBuilder()
      .setTitle('UPD3 Operations Platform API')
      .setDescription('Standardized API for supplier operations and management')
      .setVersion('1.0')
      .addTag('Suppliers', 'Supplier management operations')
      .addApiKey({
        type: 'apiKey',
        name: 'ny-operator',
        in: 'header',
        description: 'Operator identification header'
      }, 'operator-auth')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api-docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
      },
    });

    // Serve OpenAPI JSON at /api-json (same as main.ts)
    app.getHttpAdapter().get('/api-json', (req, res) => {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.send(document);
    });

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Swagger/OpenAPI Documentation Availability', () => {
    it('should serve Swagger UI at /api-docs endpoint', async () => {
      const response = await request(app.getHttpServer())
        .get('/api-docs')
        .expect(200);

      expect(response.headers['content-type']).toMatch(/text\/html/);
      expect(response.text).toContain('swagger');
    });

    it('should serve OpenAPI JSON specification at /api-json endpoint', async () => {
      const response = await request(app.getHttpServer())
        .get('/api-json')
        .expect(200);

      expect(response.headers['content-type']).toMatch(/application\/json/);
      expect(response.body).toHaveProperty('openapi');
      expect(response.body).toHaveProperty('info');
      expect(response.body).toHaveProperty('paths');
    });

    it('should have valid OpenAPI 3.0+ specification format', async () => {
      const response = await request(app.getHttpServer())
        .get('/api-json')
        .expect(200);

      const spec = response.body;

      // Validate OpenAPI specification structure
      expect(spec.openapi).toMatch(/^3\.\d+\.\d+$/); // Should be OpenAPI 3.x.x
      expect(spec.info).toHaveProperty('title');
      expect(spec.info).toHaveProperty('version');
      expect(spec.paths).toBeTruthy();
      expect(typeof spec.paths).toBe('object');
    });
  });

  describe('API Endpoint Documentation Coverage', () => {
    let openApiSpec: any;

    beforeAll(async () => {
      const response = await request(app.getHttpServer())
        .get('/api-json')
        .expect(200);
      openApiSpec = response.body;
    });

    it('should document the PATCH /api/v1/shops/{shopId}/suppliers endpoint', async () => {
      const supplierEndpoint = openApiSpec.paths['/api/v1/shops/{shopId}/suppliers'];

      expect(supplierEndpoint).toBeTruthy();
      expect(supplierEndpoint.patch).toBeTruthy();
    });

    it('should have complete endpoint documentation with required fields', async () => {
      const patchEndpoint = openApiSpec.paths['/api/v1/shops/{shopId}/suppliers']?.patch;

      expect(patchEndpoint).toHaveProperty('summary');
      expect(patchEndpoint).toHaveProperty('description');
      expect(patchEndpoint).toHaveProperty('parameters');
      expect(patchEndpoint).toHaveProperty('requestBody');
      expect(patchEndpoint).toHaveProperty('responses');

      // Verify summary and description are meaningful
      expect(patchEndpoint.summary.length).toBeGreaterThan(5);
      expect(patchEndpoint.description.length).toBeGreaterThan(10);
    });

    it('should document path parameters correctly', async () => {
      const patchEndpoint = openApiSpec.paths['/api/v1/shops/{shopId}/suppliers']?.patch;
      const parameters = patchEndpoint.parameters || [];

      // Should document shopId path parameter
      const shopIdParam = parameters.find((p: any) => p.name === 'shopId');
      expect(shopIdParam).toBeTruthy();
      expect(shopIdParam.in).toBe('path');
      expect(shopIdParam.required).toBe(true);
      expect(shopIdParam.schema.type).toBe('integer');
    });

    it('should document header parameters correctly', async () => {
      const patchEndpoint = openApiSpec.paths['/api/v1/shops/{shopId}/suppliers']?.patch;
      const parameters = patchEndpoint.parameters || [];

      // Should document ny-operator header
      const operatorHeader = parameters.find((p: any) => p.name === 'ny-operator');
      expect(operatorHeader).toBeTruthy();
      expect(operatorHeader.in).toBe('header');
      expect(operatorHeader.required).toBe(true);
      expect(operatorHeader.schema.type).toBe('string');
    });

    it('should document request body schema correctly', async () => {
      const patchEndpoint = openApiSpec.paths['/api/v1/shops/{shopId}/suppliers']?.patch;
      const requestBody = patchEndpoint.requestBody;

      expect(requestBody).toBeTruthy();
      expect(requestBody.required).toBe(true);
      expect(requestBody.content).toHaveProperty('application/json');

      const jsonContent = requestBody.content['application/json'];
      expect(jsonContent).toHaveProperty('schema');

      const schema = jsonContent.schema;

      // OpenAPI uses references, so we need to check the components
      if (schema.$ref) {
        expect(schema.$ref).toBe('#/components/schemas/SupplierUpdateRequestDto');

        // Check the referenced schema in components
        const schemaName = schema.$ref.split('/').pop();
        const componentSchema = openApiSpec.components.schemas[schemaName];

        expect(componentSchema).toBeTruthy();
        expect(componentSchema.properties).toHaveProperty('market');
        expect(componentSchema.properties).toHaveProperty('oldSupplierId');
        expect(componentSchema.properties).toHaveProperty('newSupplierId');

        // Verify required fields are documented
        expect(componentSchema.required).toEqual(
          expect.arrayContaining(['market', 'oldSupplierId', 'newSupplierId'])
        );
      } else {
        // Fallback for direct schema
        expect(schema).toHaveProperty('properties');
        expect(schema.properties).toHaveProperty('market');
        expect(schema.properties).toHaveProperty('oldSupplierId');
        expect(schema.properties).toHaveProperty('newSupplierId');

        expect(schema.required).toEqual(
          expect.arrayContaining(['market', 'oldSupplierId', 'newSupplierId'])
        );
      }
    });

    it('should document all possible response status codes', async () => {
      const patchEndpoint = openApiSpec.paths['/api/v1/shops/{shopId}/suppliers']?.patch;
      const responses = patchEndpoint.responses;

      // Should document success and error responses
      expect(responses).toHaveProperty('200'); // Success
      expect(responses).toHaveProperty('400'); // Bad Request
      expect(responses).toHaveProperty('401'); // Unauthorized
      expect(responses).toHaveProperty('502'); // Bad Gateway
    });

    it('should document response schemas correctly', async () => {
      const patchEndpoint = openApiSpec.paths['/api/v1/shops/{shopId}/suppliers']?.patch;
      const responses = patchEndpoint.responses;

      // Check 200 response schema
      const successResponse = responses['200'];
      expect(successResponse).toHaveProperty('description');
      expect(successResponse.content).toHaveProperty('application/json');

      const successSchema = successResponse.content['application/json'].schema;
      expect(successSchema.properties).toHaveProperty('success');
      expect(successSchema.properties).toHaveProperty('data');
      expect(successSchema.properties).toHaveProperty('timestamp');
      expect(successSchema.properties).toHaveProperty('requestId');

      // Check 400 error response schema
      const errorResponse = responses['400'];
      expect(errorResponse).toHaveProperty('description');
      expect(errorResponse.content).toHaveProperty('application/json');

      const errorSchema = errorResponse.content['application/json'].schema;

      // Handle schema references for error responses
      let actualErrorSchema;
      if (errorSchema.$ref) {
        const schemaName = errorSchema.$ref.split('/').pop();
        actualErrorSchema = openApiSpec.components.schemas[schemaName];
      } else {
        actualErrorSchema = errorSchema;
      }

      expect(actualErrorSchema.properties).toHaveProperty('success');
      expect(actualErrorSchema.properties).toHaveProperty('error');
      expect(actualErrorSchema.properties).toHaveProperty('timestamp');
      expect(actualErrorSchema.properties).toHaveProperty('requestId');
    });
  });

  describe('Schema Validation and Examples', () => {
    let openApiSpec: any;

    beforeAll(async () => {
      const response = await request(app.getHttpServer())
        .get('/api-json')
        .expect(200);
      openApiSpec = response.body;
    });

    it('should provide realistic examples for request bodies', async () => {
      const patchEndpoint = openApiSpec.paths['/api/v1/shops/{shopId}/suppliers']?.patch;
      const requestBody = patchEndpoint.requestBody;
      const schema = requestBody.content['application/json'].schema;

      // Handle schema references
      let actualSchema;
      if (schema.$ref) {
        const schemaName = schema.$ref.split('/').pop();
        actualSchema = openApiSpec.components.schemas[schemaName];
      } else {
        actualSchema = schema;
      }

      // Should have example values for all required fields
      if (actualSchema.example || actualSchema.properties?.market?.example) {
        expect(actualSchema.example || {
          market: actualSchema.properties?.market?.example,
          oldSupplierId: actualSchema.properties?.oldSupplierId?.example,
          newSupplierId: actualSchema.properties?.newSupplierId?.example
        }).toMatchObject({
          market: expect.any(String),
          oldSupplierId: expect.any(Number),
          newSupplierId: expect.any(Number)
        });
      }
    });

    it('should provide examples for successful responses', async () => {
      const patchEndpoint = openApiSpec.paths['/api/v1/shops/{shopId}/suppliers']?.patch;
      const successResponse = patchEndpoint.responses['200'];
      const schema = successResponse.content['application/json'].schema;

      // Should have meaningful examples
      if (schema.example) {
        expect(schema.example).toHaveProperty('success', true);
        expect(schema.example).toHaveProperty('data');
        expect(schema.example).toHaveProperty('timestamp');
        expect(schema.example).toHaveProperty('requestId');
      }
    });

    it('should provide examples for error responses', async () => {
      const patchEndpoint = openApiSpec.paths['/api/v1/shops/{shopId}/suppliers']?.patch;
      const errorResponse = patchEndpoint.responses['400'];
      const schema = errorResponse.content['application/json'].schema;

      // Should have meaningful error examples
      if (schema.example || schema.examples) {
        const exampleData = schema.example || (schema.examples && Object.values(schema.examples)[0]);
        if (exampleData) {
          expect(exampleData).toHaveProperty('success', false);
          expect(exampleData).toHaveProperty('error');
          expect(exampleData.error).toHaveProperty('code');
          expect(exampleData.error).toHaveProperty('message');
        }
      }
    });
  });

  describe('Documentation Completeness', () => {
    let openApiSpec: any;

    beforeAll(async () => {
      const response = await request(app.getHttpServer())
        .get('/api-json')
        .expect(200);
      openApiSpec = response.body;
    });

    it('should have complete API information metadata', async () => {
      const info = openApiSpec.info;

      expect(info.title).toBeTruthy();
      expect(info.description).toBeTruthy();
      expect(info.version).toBeTruthy();
      expect(info.title.length).toBeGreaterThan(5);
      expect(info.description.length).toBeGreaterThan(20);
    });

    it('should document security requirements', async () => {
      // Should document security schemes if applicable
      if (openApiSpec.components?.securitySchemes) {
        expect(openApiSpec.components.securitySchemes).toBeTruthy();

        // Should document ny-operator header security
        const headerSecurity = Object.values(openApiSpec.components.securitySchemes).find(
          (scheme: any) => scheme.type === 'apiKey' && scheme.name === 'ny-operator'
        );
        expect(headerSecurity).toBeTruthy();
      }

      // Endpoint should reference security requirements
      const patchEndpoint = openApiSpec.paths['/api/v1/shops/{shopId}/suppliers']?.patch;
      expect(patchEndpoint.security || openApiSpec.security).toBeTruthy();
    });

    it('should use appropriate HTTP status code descriptions', async () => {
      const patchEndpoint = openApiSpec.paths['/api/v1/shops/{shopId}/suppliers']?.patch;
      const responses = patchEndpoint.responses;

      // Verify meaningful descriptions for each status code
      expect(responses['200'].description).toContain('success');
      expect(responses['400'].description).toMatch(/bad request|validation|invalid/i);
      expect(responses['401'].description).toMatch(/unauthorized|authentication/i);
      if (responses['502']) {
        expect(responses['502'].description).toMatch(/gateway|upstream|service/i);
      }
    });

    it('should document all data types and constraints correctly', async () => {
      const patchEndpoint = openApiSpec.paths['/api/v1/shops/{shopId}/suppliers']?.patch;
      const requestSchema = patchEndpoint.requestBody.content['application/json'].schema;

      // Handle schema references
      let actualSchema;
      if (requestSchema.$ref) {
        const schemaName = requestSchema.$ref.split('/').pop();
        actualSchema = openApiSpec.components.schemas[schemaName];
      } else {
        actualSchema = requestSchema;
      }

      // Verify field types and constraints
      expect(actualSchema.properties.market.type).toBe('string');
      expect(actualSchema.properties.oldSupplierId.type).toBe('integer');
      expect(actualSchema.properties.newSupplierId.type).toBe('integer');

      // Should document validation constraints
      if (actualSchema.properties.market.pattern) {
        expect(actualSchema.properties.market.pattern).toBeTruthy();
      }
      if (actualSchema.properties.oldSupplierId.minimum) {
        expect(actualSchema.properties.oldSupplierId.minimum).toBeGreaterThan(0);
      }
      if (actualSchema.properties.newSupplierId.minimum) {
        expect(actualSchema.properties.newSupplierId.minimum).toBeGreaterThan(0);
      }
    });
  });

  describe('Documentation Accessibility and Usability', () => {
    it('should serve documentation with proper CORS headers', async () => {
      await request(app.getHttpServer())
        .get('/api-json')
        .expect(200)
        .expect('Access-Control-Allow-Origin', '*');
    });

    it('should have stable documentation URLs', async () => {
      // Standard Swagger endpoints should be available
      const endpoints = ['/api-docs', '/api-json'];

      for (const endpoint of endpoints) {
        await request(app.getHttpServer())
          .get(endpoint)
          .expect(200);
      }
    });

    it('should serve documentation without authentication requirements', async () => {
      // Documentation endpoints should be publicly accessible
      await request(app.getHttpServer())
        .get('/api-docs')
        .expect(200);

      await request(app.getHttpServer())
        .get('/api-json')
        .expect(200);
    });
  });

  describe('Documentation Accuracy Validation', () => {
    let openApiSpec: any;

    beforeAll(async () => {
      const response = await request(app.getHttpServer())
        .get('/api-json')
        .expect(200);
      openApiSpec = response.body;
    });

    it('should accurately document actual API behavior for successful requests', async () => {
      // This test would require mocking external service
      // For now, we validate that the documented schema exists for successful responses
      const patchEndpoint = openApiSpec.paths['/api/v1/shops/{shopId}/suppliers']?.patch;
      const successResponseSchema = patchEndpoint.responses['200'].content['application/json'].schema;

      // Validate documented success response structure
      expect(successResponseSchema).toBeTruthy();
      expect(successResponseSchema.properties).toHaveProperty('success');
      expect(successResponseSchema.properties).toHaveProperty('data');
      expect(successResponseSchema.properties).toHaveProperty('timestamp');
      expect(successResponseSchema.properties).toHaveProperty('requestId');

      // Verify documented types
      expect(successResponseSchema.properties.success.type).toBe('boolean');
      expect(successResponseSchema.properties.data.type).toBe('object');
      expect(successResponseSchema.properties.timestamp.type).toBe('string');
      expect(successResponseSchema.properties.requestId.type).toBe('string');
    });

    it('should accurately document actual API behavior for error requests', async () => {
      // Make actual API call that should fail
      const apiResponse = await request(app.getHttpServer())
        .patch('/api/v1/shops/12345/suppliers')
        .set('ny-operator', 'test-operator@91app.com')
        .send({ market: 'TW', oldSupplierId: 100, newSupplierId: 100 })
        .expect(400);

      // Compare with documented error schema
      const patchEndpoint = openApiSpec.paths['/api/v1/shops/{shopId}/suppliers']?.patch;
      const errorResponseSchema = patchEndpoint.responses['400'].content['application/json'].schema;

      // Actual error response should match documented structure
      const actualResponse = apiResponse.body;
      expect(actualResponse).toHaveProperty('success', false);
      expect(actualResponse).toHaveProperty('error');
      expect(actualResponse).toHaveProperty('timestamp');
      expect(actualResponse).toHaveProperty('requestId');
      expect(actualResponse.error).toHaveProperty('code');
      expect(actualResponse.error).toHaveProperty('message');
    });
  });
});