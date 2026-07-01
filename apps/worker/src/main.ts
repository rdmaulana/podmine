import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  console.log('🚀 PODMINE Background Worker successfully started and listening to BullMQ queues.');
}
bootstrap();
