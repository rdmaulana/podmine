import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PodcastService } from './podcast.service';
import { PodcastController } from './podcast.controller';
import { Podcast, Job } from '@podmine/database';

@Module({
  imports: [
    TypeOrmModule.forFeature([Podcast, Job]),
    BullModule.registerQueue({
      name: 'podcast-generation',
    }),
  ],
  providers: [PodcastService],
  controllers: [PodcastController],
  exports: [PodcastService],
})
export class PodcastModule {}
