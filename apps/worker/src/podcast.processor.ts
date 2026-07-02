import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { prisma } from '@podmine/database';
import { getEnv } from '@podmine/config';
import { GeminiDriver, ElevenLabsDriver, MacSayDriver, R2Driver } from '@podmine/drivers';
import { JobPayload } from '@podmine/types';

@Processor('podcast-generation')
export class PodcastProcessor extends WorkerHost {
  private readonly logger = new Logger(PodcastProcessor.name);

  async process(job: Job<JobPayload>): Promise<any> {
    const { podcastId, prompt } = job.data;
    this.logger.log(`Starting podcast generation job ${job.id} for podcast ID: ${podcastId}`);

    // Create Job tracking record in DB
    const dbJob = await prisma.job.create({
      data: {
        id: job.id || undefined,
        podcastId,
        progress: 10,
        logs: 'Job initialized. Starting generation...',
      },
    });

    try {
      const env = getEnv();

      // Initialize Drivers dynamically based on config
      // 1. LLM Driver
      let llmDriver;
      if (env.AI_SCRIPT_DRIVER === 'gemini') {
        if (!env.GEMINI_API_KEY) throw new Error('GEMINI_API_KEY is not defined');
        llmDriver = new GeminiDriver(env.GEMINI_API_KEY);
      } else {
        throw new Error(`Unsupported AI_SCRIPT_DRIVER: ${env.AI_SCRIPT_DRIVER}`);
      }

      // 2. TTS Driver
      let ttsDriver;
      if (env.AI_TTS_DRIVER === 'elevenlabs') {
        if (!env.ELEVENLABS_API_KEY) throw new Error('ELEVENLABS_API_KEY is not defined');
        ttsDriver = new ElevenLabsDriver(env.ELEVENLABS_API_KEY, env.ELEVENLABS_VOICE_ID);
      } else if (env.AI_TTS_DRIVER === 'say') {
        ttsDriver = new MacSayDriver(env.ELEVENLABS_VOICE_ID || 'Samantha');
      } else {
        throw new Error(`Unsupported AI_TTS_DRIVER: ${env.AI_TTS_DRIVER}`);
      }

      // 3. Storage Driver
      let storageDriver;
      if (env.STORAGE_DRIVER === 'r2') {
        if (!env.R2_ACCESS_KEY_ID || !env.R2_SECRET_ACCESS_KEY || !env.R2_BUCKET_NAME || !env.R2_ENDPOINT) {
          throw new Error('Cloudflare R2 storage credentials are not fully configured');
        }
        storageDriver = new R2Driver({
          accessKeyId: env.R2_ACCESS_KEY_ID,
          secretAccessKey: env.R2_SECRET_ACCESS_KEY,
          bucket: env.R2_BUCKET_NAME,
          endpoint: env.R2_ENDPOINT,
        });
      } else {
        throw new Error(`Unsupported STORAGE_DRIVER: ${env.STORAGE_DRIVER}`);
      }

      // Update podcast status to PROCESSING
      await prisma.podcast.update({
        where: { id: podcastId },
        data: { status: 'PROCESSING' },
      });

      await this.updateJob(dbJob.id, 20, 'Initialized drivers successfully. Generating script...');

      // Step 1: Generate Script
      this.logger.log(`Generating script with ${env.AI_SCRIPT_DRIVER}...`);
      const script = await llmDriver.generateScript(prompt);
      this.logger.log(`Script generated successfully. Title: "${script.title}"`);

      // Update podcast title and progress
      await prisma.podcast.update({
        where: { id: podcastId },
        data: { title: script.title },
      });
      await this.updateJob(dbJob.id, 50, `Script generated: "${script.title}". Starting Text-To-Speech conversion...`);

      // Step 2: Text To Speech
      this.logger.log(`Converting script to audio with ${env.AI_TTS_DRIVER}...`);
      const audioBuffer = await ttsDriver.synthesize(script.content);
      this.logger.log(`Audio synthesized successfully. Size: ${audioBuffer.length} bytes`);
      await this.updateJob(dbJob.id, 75, 'Audio synthesized successfully. Uploading to storage...');

      // Step 3: Upload to Cloudflare R2
      const storageKey = `podcasts/${podcastId}.mp3`;
      this.logger.log(`Uploading audio to R2 storage key: ${storageKey}...`);
      await storageDriver.upload(storageKey, audioBuffer, 'audio/mpeg');
      this.logger.log(`Audio uploaded successfully.`);

      // Step 4: Finalize
      await prisma.podcast.update({
        where: { id: podcastId },
        data: {
          status: 'COMPLETED',
          audioUrl: storageKey, // We store the storage key instead of public URL for signed URL generation
        },
      });

      await this.updateJob(dbJob.id, 100, 'Podcast generated and stored successfully!');
      this.logger.log(`Job ${job.id} completed successfully for podcast ID: ${podcastId}`);

      return { success: true, key: storageKey };
    } catch (error: any) {
      this.logger.error(`Error processing podcast generation job: ${error.message}`, error.stack);
      
      // Update DB records to FAILED
      await prisma.podcast.update({
        where: { id: podcastId },
        data: { status: 'FAILED' },
      });

      await prisma.job.update({
        where: { id: dbJob.id },
        data: {
          progress: 100,
          logs: `FAILED: ${error.message}\nStack: ${error.stack}`,
        },
      });

      throw error;
    }
  }

  private async updateJob(id: string, progress: number, logMessage: string) {
    const existingJob = await prisma.job.findUnique({ where: { id } });
    const updatedLogs = existingJob?.logs ? `${existingJob.logs}\n[${new Date().toISOString()}] ${logMessage}` : logMessage;

    await prisma.job.update({
      where: { id },
      data: {
        progress,
        logs: updatedLogs,
      },
    });
  }
}
