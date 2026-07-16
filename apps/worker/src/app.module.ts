import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PodcastProcessor } from './podcast.processor';
import { getEnv } from '@podmine/config';
import { User, RefreshToken, Podcast, Job } from '@podmine/database';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      useFactory: () => {
        const env = getEnv();
        return {
          type: 'mysql',
          url: env.DATABASE_URL,
          entities: [User, RefreshToken, Podcast, Job],
          synchronize: env.RUN_MIGRATIONS === 'true',
          logging: env.NODE_ENV === 'development',
        };
      },
    }),
    TypeOrmModule.forFeature([Podcast, Job]),
    BullModule.forRootAsync({
      useFactory: () => {
        const env = getEnv();
        return {
          connection: {
            host: env.REDIS_HOST,
            port: env.REDIS_PORT,
            password: env.REDIS_PASSWORD,
          },
        };
      },
    }),
    BullModule.registerQueue({
      name: 'podcast-generation',
    }),
  ],
  providers: [PodcastProcessor],
})
export class AppModule {}
