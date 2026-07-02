import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { SnakeCaseInterceptor } from './common/interceptors/snake-case.interceptor';
import { getEnv } from '@podmine/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Set global prefix and API versioning
  app.setGlobalPrefix('api/v1');

  // Register global interceptor for snake_case formatting
  app.useGlobalInterceptors(new SnakeCaseInterceptor());

  // Set validation pipe for request bodies
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  // Enable CORS
  const env = getEnv();
  const allowedOrigins = env.FRONTEND_URL 
    ? env.FRONTEND_URL.split(',').map(url => url.trim()) 
    : '*';

  app.enableCors({
    origin: allowedOrigins,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: allowedOrigins !== '*',
  });

  // Configure Swagger/OpenAPI
  const config = new DocumentBuilder()
    .setTitle('PODMINE API')
    .setDescription('The PODMINE Open Source AI Podcast Platform REST API documentation')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth', // This name must match @ApiBearerAuth()
    )
    .build();
    
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`🚀 API Gateway running on: http://localhost:${port}/api/v1`);
  console.log(`📖 API Documentation available on: http://localhost:${port}/docs`);
}
bootstrap();
