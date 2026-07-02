import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { prisma } from '@podmine/database';
import { getEnv } from '@podmine/config';
import { R2Driver } from '@podmine/drivers';
import { GeneratePodcastDto, PodcastQueryDto } from './dto/podcast.dto';
import { JobPayload } from '@podmine/types';

@Injectable()
export class PodcastService {
  constructor(
    @InjectQueue('podcast-generation')
    private readonly podcastQueue: Queue<JobPayload>,
  ) {}

  async generate(dto: GeneratePodcastDto, userId: string) {
    // Create the podcast record in database first
    const podcast = await prisma.podcast.create({
      data: {
        prompt: dto.prompt,
        status: 'QUEUED',
        userId,
      },
    });

    // Pushes the job to the BullMQ queue
    await this.podcastQueue.add(
      'generate-podcast',
      {
        podcastId: podcast.id,
        prompt: dto.prompt,
      },
      {
        jobId: podcast.id, // Use podcast ID as Job ID to prevent duplicate jobs
      },
    );

    return podcast;
  }

  async findAll(query: PodcastQueryDto, userId?: string) {
    const { search, page = 1, limit = 10, status, myPodcasts } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (myPodcasts === 'true' && userId) {
      where.userId = userId;
    }
    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { prompt: { contains: search } },
      ];
    }

    const [total, data] = await prisma.$transaction([
      prisma.podcast.count({ where }),
      prisma.podcast.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      data,
    };
  }

  async findOne(id: string, userId?: string) {
    const podcast = await prisma.podcast.findUnique({
      where: { id },
      include: {
        jobs: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!podcast) {
      throw new NotFoundException(`Podcast with ID ${id} not found`);
    }

    return podcast;
  }

  async getDownloadUrl(id: string, userId?: string): Promise<string> {
    const podcast = await this.findOne(id, userId);

    if (podcast.status !== 'COMPLETED' || !podcast.audioUrl) {
      throw new NotFoundException('Podcast audio is not generated yet');
    }

    let key = podcast.audioUrl;
    if (key.startsWith('http')) {
      try {
        const url = new URL(key);
        key = url.pathname.startsWith('/') ? url.pathname.slice(1) : url.pathname;
      } catch {}
    }

    const env = getEnv();
    if (env.STORAGE_DRIVER === 'r2') {
      if (!env.R2_ACCESS_KEY_ID || !env.R2_SECRET_ACCESS_KEY || !env.R2_BUCKET_NAME || !env.R2_ENDPOINT) {
        throw new Error('Cloudflare R2 storage credentials are not configured');
      }
      const storageDriver = new R2Driver({
        accessKeyId: env.R2_ACCESS_KEY_ID,
        secretAccessKey: env.R2_SECRET_ACCESS_KEY,
        bucket: env.R2_BUCKET_NAME,
        endpoint: env.R2_ENDPOINT,
      });

      return storageDriver.getSignedUrl(key);
    }

    throw new Error(`Unsupported STORAGE_DRIVER: ${env.STORAGE_DRIVER}`);
  }

  async getStream(id: string, userId?: string, range?: string) {
    const podcast = await this.findOne(id, userId);

    if (podcast.status !== 'COMPLETED' || !podcast.audioUrl) {
      throw new NotFoundException('Podcast audio is not generated yet');
    }

    let key = podcast.audioUrl;
    if (key.startsWith('http')) {
      try {
        const url = new URL(key);
        key = url.pathname.startsWith('/') ? url.pathname.slice(1) : url.pathname;
      } catch {}
    }

    const env = getEnv();
    if (env.STORAGE_DRIVER === 'r2') {
      if (!env.R2_ACCESS_KEY_ID || !env.R2_SECRET_ACCESS_KEY || !env.R2_BUCKET_NAME || !env.R2_ENDPOINT) {
        throw new Error('Cloudflare R2 storage credentials are not configured');
      }
      const storageDriver = new R2Driver({
        accessKeyId: env.R2_ACCESS_KEY_ID,
        secretAccessKey: env.R2_SECRET_ACCESS_KEY,
        bucket: env.R2_BUCKET_NAME,
        endpoint: env.R2_ENDPOINT,
      });

      return storageDriver.getDownloadStream(key, range);
    }

    throw new Error(`Unsupported STORAGE_DRIVER: ${env.STORAGE_DRIVER}`);
  }
}
