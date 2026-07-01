import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { PodcastProcessor } from './podcast.processor';

@Module({
  imports: [
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6380', 10),
      },
    }),
    BullModule.registerQueue({
      name: 'podcast-generation',
    }),
  ],
  providers: [PodcastProcessor],
})
export class AppModule {}
