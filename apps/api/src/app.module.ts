import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { PodcastModule } from './podcast/podcast.module';
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
    AuthModule,
    PodcastModule,
  ],
})
export class AppModule {}
