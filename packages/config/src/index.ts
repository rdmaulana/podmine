import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),

  // Database
  DATABASE_URL: z.string().url().default('mysql://root:root@localhost:3306/podmine'),

  // Redis
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().default(6380),
  REDIS_PASSWORD: z.string().optional(),

  // JWT Auth
  JWT_SECRET: z.string().default('podmine-super-secret-key-change-me'),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  // Drivers Configuration
  AI_SCRIPT_DRIVER: z.enum(['gemini', 'openai', 'ollama']).default('gemini'),
  AI_TTS_DRIVER: z.enum(['elevenlabs', 'piper', 'kokoro']).default('elevenlabs'),
  STORAGE_DRIVER: z.enum(['r2', 'local']).default('r2'),

  // Gemini API
  GEMINI_API_KEY: z.string().optional(),

  // ElevenLabs API
  ELEVENLABS_API_KEY: z.string().optional(),
  ELEVENLABS_VOICE_ID: z.string().optional(), // optional voice override

  // Cloudflare R2 / S3
  R2_ACCESS_KEY_ID: z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_BUCKET_NAME: z.string().optional(),
  R2_ENDPOINT: z.string().optional(), // Endpoint URL for R2 S3 compatibility
});

export type Env = z.infer<typeof envSchema>;

let _env: Env | null = null;

export function getEnv(): Env {
  if (!_env) {
    const result = envSchema.safeParse(process.env);
    if (!result.success) {
      console.error('❌ Invalid environment variables:', result.error.format());
      throw new Error('Invalid environment variables configuration.');
    }
    _env = result.data;
  }
  return _env;
}
