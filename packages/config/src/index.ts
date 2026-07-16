import { z } from 'zod';
import * as fs from 'fs';
import * as path from 'path';

// Automatically discover and load the .env file from the monorepo root
function loadEnvFile() {
  let currentDir = __dirname;
  const root = path.parse(currentDir).root;
  while (currentDir !== root) {
    const envPath = path.join(currentDir, '.env');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      for (const line of envContent.split('\n')) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const firstEqual = trimmed.indexOf('=');
          if (firstEqual !== -1) {
            const key = trimmed.slice(0, firstEqual).trim();
            let val = trimmed.slice(firstEqual + 1).trim();
            
            // Strip inline comments if present
            const hashIndex = val.indexOf('#');
            if (hashIndex !== -1) {
              if (val.startsWith('"')) {
                const closingQuote = val.indexOf('"', 1);
                if (closingQuote !== -1) {
                  val = val.substring(0, closingQuote + 1).trim();
                }
              } else if (val.startsWith("'")) {
                const closingQuote = val.indexOf("'", 1);
                if (closingQuote !== -1) {
                  val = val.substring(0, closingQuote + 1).trim();
                }
              } else {
                val = val.substring(0, hashIndex).trim();
              }
            }

            if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
              val = val.slice(1, -1);
            }
            if (process.env[key] === undefined) {
              process.env[key] = val;
            }
          }
        }
      }
      break;
    }
    currentDir = path.dirname(currentDir);
  }
}

loadEnvFile();

// Clean up surrounding quotes from all process.env variables (e.g. injected by Docker Compose)
for (const key in process.env) {
  const val = process.env[key];
  if (val && ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'")))) {
    process.env[key] = val.slice(1, -1);
  }
}

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),
  FRONTEND_URL: z.string().optional(),

  // Database
  DATABASE_URL: z.string().url().default('mysql://root:root@localhost:3306/podmine'),
  RUN_MIGRATIONS: z.string().optional(),

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
  AI_TTS_DRIVER: z.enum(['elevenlabs', 'piper', 'kokoro', 'say']).default('elevenlabs'),
  STORAGE_DRIVER: z.enum(['r2', 'local']).default('r2'),
  R2_PUBLIC_URL: z.string().url().optional(),

  // Gemini API
  GEMINI_API_KEY: z.string().optional(),

  // ElevenLabs API
  ELEVENLABS_API_KEY: z.string().optional(),
  ELEVENLABS_VOICE_ID: z.string().optional(), // optional voice override

  // Piper TTS API
  PIPER_HOST_A_URL: z.string().url().default('http://localhost:5001'),
  PIPER_HOST_B_URL: z.string().url().default('http://localhost:5002'),

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
