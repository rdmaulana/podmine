import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { PodcastService } from './podcast.service';
import { PodcastController } from './podcast.controller';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'podcast-generation',
    }),
  ],
  providers: [PodcastService],
  controllers: [PodcastController],
  exports: [PodcastService],
})
export class PodcastModule {}
