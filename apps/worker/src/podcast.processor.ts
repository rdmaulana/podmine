import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { prisma } from '@podmine/database';
import { getEnv } from '@podmine/config';
import { GeminiDriver, ElevenLabsDriver, MacSayDriver, R2Driver } from '@podmine/drivers';
import { JobPayload } from '@podmine/types';

interface WavParsed {
  header: Buffer;
  audioData: Buffer;
}

function parseWav(buffer: Buffer): WavParsed {
  let offset = 12; // Start after 'RIFF' + size + 'WAVE'
  while (offset < buffer.length - 8) {
    const chunkId = buffer.toString('ascii', offset, offset + 4);
    const chunkSize = buffer.readUInt32LE(offset + 4);
    if (chunkId === 'data') {
      const header = buffer.subarray(0, offset + 8);
      const audioData = buffer.subarray(offset + 8);
      return { header, audioData };
    }
    offset += 8 + chunkSize;
  }
  return {
    header: buffer.subarray(0, Math.min(44, buffer.length)),
    audioData: buffer.subarray(Math.min(44, buffer.length)),
  };
}

function mergeWavBuffers(buffers: Buffer[]): Buffer {
  if (buffers.length === 0) return Buffer.alloc(0);
  if (buffers.length === 1) return buffers[0];

  const parsedWavs = buffers.map(buf => parseWav(buf));
  const finalHeader = Buffer.from(parsedWavs[0].header);
  const audioParts = parsedWavs.map(pw => pw.audioData);
  const combinedAudio = Buffer.concat(audioParts);

  // Update RIFF Chunk Size
  finalHeader.writeUInt32LE(finalHeader.length + combinedAudio.length - 8, 4);

  // Update 'data' Subchunk Size (last 4 bytes of header)
  finalHeader.writeUInt32LE(combinedAudio.length, finalHeader.length - 4);

  return Buffer.concat([finalHeader, combinedAudio]);
}

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
      this.logger.log(`Converting script to conversational audio with ${env.AI_TTS_DRIVER}...`);
      
      const dialogueLines = script.dialogue || [];
      if (dialogueLines.length === 0 && script.content) {
        dialogueLines.push({ speaker: 'Host A', text: script.content });
      }

      const segmentBuffers: Buffer[] = [];
      const totalLines = dialogueLines.length;

      for (let i = 0; i < totalLines; i++) {
        const line = dialogueLines[i];
        const progress = 50 + Math.floor((i / totalLines) * 25);
        await this.updateJob(
          dbJob.id,
          progress,
          `Synthesizing line ${i + 1}/${totalLines} (${line.speaker})...`
        );
        this.logger.log(`Synthesizing line ${i + 1}/${totalLines} (${line.speaker}): "${line.text}"`);

        let lineTtsDriver;
        if (env.AI_TTS_DRIVER === 'elevenlabs') {
          const voiceId = line.speaker === 'Host A'
            ? (env.ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM')
            : 'pNInz6obpgq5epa57xxz'; // Adam (Host B)
          
          if (!env.ELEVENLABS_API_KEY) throw new Error('ELEVENLABS_API_KEY is not defined');
          lineTtsDriver = new ElevenLabsDriver(env.ELEVENLABS_API_KEY, voiceId);
        } else if (env.AI_TTS_DRIVER === 'say') {
          const isIndonesian = env.ELEVENLABS_VOICE_ID?.toLowerCase().includes('damayanti');
          const voiceId = line.speaker === 'Host A'
            ? (env.ELEVENLABS_VOICE_ID || 'Samantha')
            : (isIndonesian ? 'Damayanti' : 'Daniel');
          lineTtsDriver = new MacSayDriver(voiceId);
        } else {
          throw new Error(`Unsupported AI_TTS_DRIVER: ${env.AI_TTS_DRIVER}`);
        }

        const buf = await lineTtsDriver.synthesize(line.text);
        segmentBuffers.push(buf);
      }

      // Merge dialogue buffers
      let audioBuffer: Buffer;
      if (env.AI_TTS_DRIVER === 'elevenlabs') {
        audioBuffer = Buffer.concat(segmentBuffers);
      } else if (env.AI_TTS_DRIVER === 'say') {
        audioBuffer = mergeWavBuffers(segmentBuffers);
      } else {
        throw new Error('Unsupported TTS merger');
      }

      this.logger.log(`Audio synthesized successfully. Total size: ${audioBuffer.length} bytes`);
      await this.updateJob(dbJob.id, 75, 'Audio synthesized successfully. Uploading to storage...');

      // Step 3: Upload to Cloudflare R2
      // Detect audio format (magic bytes) to set correct MIME type and file extension
      let mimeType = 'audio/mpeg';
      let extension = 'mp3';
      if (audioBuffer.length > 12 && audioBuffer.toString('ascii', 0, 4) === 'RIFF' && audioBuffer.toString('ascii', 8, 12) === 'WAVE') {
        mimeType = 'audio/wav';
        extension = 'wav';
      } else if (audioBuffer.length > 8 && audioBuffer.toString('ascii', 4, 8) === 'ftyp') {
        mimeType = 'audio/mp4';
        extension = 'm4a';
      }

      const storageKey = `podcasts/${podcastId}.${extension}`;
      this.logger.log(`Uploading audio to R2 storage key: ${storageKey} (${mimeType})...`);
      await storageDriver.upload(storageKey, audioBuffer, mimeType);
      this.logger.log(`Audio uploaded successfully.`);

      // Step 4: Finalize
      let dbAudioUrl = storageKey;
      if (env.R2_PUBLIC_URL) {
        const baseUrl = env.R2_PUBLIC_URL.endsWith('/') ? env.R2_PUBLIC_URL.slice(0, -1) : env.R2_PUBLIC_URL;
        dbAudioUrl = `${baseUrl}/${storageKey}`;
      }

      await prisma.podcast.update({
        where: { id: podcastId },
        data: {
          status: 'COMPLETED',
          audioUrl: dbAudioUrl,
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
