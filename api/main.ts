import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

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

  // Check if mock mode is enabled
  const mockMode = process.env.MARKETING_CLOUD_MOCK_MODE === 'true';
  const mockIndicator = mockMode ? ' [MOCK MODE]' : '';

  // Configure Swagger documentation
  const config = new DocumentBuilder()
    .setTitle(`UPD3 Operations Platform API${mockIndicator}`)
    .setDescription(
      `Standardized API for supplier operations and management${
        mockMode
          ? '\n\n🎯 **MOCK MODE ENABLED** - Marketing Cloud API will return mock data for development and testing purposes.\n\n**Test Scenarios:**\n- Normal phone numbers: Returns 1-3 mock devices\n- Phone ending with 000: Returns empty device list\n- Phone ending with 404: Returns 404 Not Found error'
          : ''
      }`
    )
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
