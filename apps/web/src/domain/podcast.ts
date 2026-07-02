export interface Podcast {
  id: string;
  title: string | null;
  prompt: string;
  audioUrl: string | null;
  status: 'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  userId: string;
  createdAt: string;
  updatedAt: string;
  jobs?: Job[];
}

export interface Job {
  id: string;
  podcastId: string;
  progress: number;
  logs: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  userId: string;
  username: string;
  accessToken: string;
}

export interface PodcastListResponse {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  data: Podcast[];
}
