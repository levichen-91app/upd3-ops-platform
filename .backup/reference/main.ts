import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { isMockModeEnabled } from './config/external-apis.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for API documentation access
  app.enableCors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'ny-operator',
      'x-request-id',
    ],
  });

  // Configure global validation pipe
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

  // Check if mock modes are enabled
  const globalMockMode = process.env.MOCK_MODE === 'true';
  const marketingCloudMockMode = isMockModeEnabled('marketing_cloud');
  const whaleApiMockMode = isMockModeEnabled('whale_api');

  const anyMockMode = globalMockMode || marketingCloudMockMode || whaleApiMockMode;

  // Build mock mode indicators
  const mockServices = [];
  if (globalMockMode) mockServices.push('ALL SERVICES');
  else {
    if (marketingCloudMockMode) mockServices.push('Marketing Cloud');
    if (whaleApiMockMode) mockServices.push('Whale API');
  }

  const mockIndicator = anyMockMode ? ` [MOCK: ${mockServices.join(', ')}]` : '';

  // Build mock mode description
  let mockDescription = '';
  if (anyMockMode) {
    mockDescription = '\n\n🎯 **MOCK MODE ENABLED** - Some APIs will return mock data for development and testing.\n\n';

    if (marketingCloudMockMode) {
      mockDescription += '**Marketing Cloud API Mock Scenarios:**\n';
      mockDescription += '- Normal phone numbers: Returns 1-3 mock devices\n';
      mockDescription += '- Phone ending with 000: Returns empty device list\n';
      mockDescription += '- Phone ending with 404: Returns 404 Not Found error\n\n';
    }

    if (whaleApiMockMode) {
      mockDescription += '**Whale API Mock Scenarios:**\n';
      mockDescription += '- shopId 404: Returns 0 updated records\n';
      mockDescription += '- shopId ending in 0: Returns 100-500 updated records\n';
      mockDescription += '- Other shopIds: Returns 1-50 updated records\n\n';
    }

    mockDescription += '**Environment Variables:**\n';
    mockDescription += '- `MOCK_MODE=true` - Enable all API mocks\n';
    mockDescription += '- `MARKETING_CLOUD_MOCK_MODE=true` - Enable Marketing Cloud mock only\n';
    mockDescription += '- `WHALE_API_MOCK_MODE=true` - Enable Whale API mock only';
  }

  // Configure Swagger documentation
  const config = new DocumentBuilder()
    .setTitle(`UPD3 Operations Platform API${mockIndicator}`)
    .setDescription(`Standardized API for supplier operations and management${mockDescription}`)
    .setVersion('1.0')
    .addTag('Suppliers', 'Supplier management operations')
    .addTag('Marketing Cloud', 'Marketing Cloud Device API integration')
    .addApiKey(
      {
        type: 'apiKey',
        name: 'ny-operator',
        in: 'header',
        description: 'Operator identification header',
      },
      'operator-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  // Serve OpenAPI JSON at /api-json
  app.getHttpAdapter().get('/api-json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.send(document);
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`🚀 Application is running on: http://localhost:${port}`);
  console.log(`📚 API Documentation: http://localhost:${port}/api-docs`);
  console.log(`📋 OpenAPI JSON: http://localhost:${port}/api-json`);
}
bootstrap();
