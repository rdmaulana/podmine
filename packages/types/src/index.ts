export type PodcastStatus = 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface RefreshToken {
  id: string;
  token: string;
  userId: string;
  expiresAt: Date;
  createdAt: Date;
}

export interface Podcast {
  id: string;
  title: string | null;
  prompt: string;
  audioUrl: string | null;
  status: PodcastStatus;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface JobPayload {
  podcastId: string;
  prompt: string;
}

// Driver Interfaces
export interface PodcastScript {
  title: string;
  content: string;
}

export interface LLMDriver {
  generateScript(prompt: string): Promise<PodcastScript>;
}

export interface TTSDriver {
  synthesize(text: string): Promise<Buffer>;
}

export interface StorageDriver {
  upload(key: string, file: Buffer, contentType: string): Promise<string>;
  getSignedUrl(key: string): Promise<string>;
  getDownloadStream?(key: string, range?: string): Promise<{
    stream: any;
    contentType?: string;
    contentLength?: number;
    contentRange?: string;
  }>;
}
