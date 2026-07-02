import type { Podcast, PodcastListResponse, User } from '../domain/podcast';

const BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1').replace(/\/$/, '');

// Token helper
export const tokenStorage = {
  getToken: (): string | null => localStorage.getItem('podmine_token'),
  setToken: (token: string): void => localStorage.setItem('podmine_token', token),
  clearToken: (): void => localStorage.removeItem('podmine_token'),
  getUser: (): User | null => {
    const userStr = localStorage.getItem('podmine_user');
    return userStr ? JSON.parse(userStr) : null;
  },
  setUser: (user: User): void => localStorage.setItem('podmine_user', JSON.stringify(user)),
  clearUser: (): void => localStorage.removeItem('podmine_user'),
};

// Generic fetch wrapper with token injection
async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = tokenStorage.getToken();
  const headers = new Headers(options.headers || {});
  
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errMsg = `Request failed with status ${response.status}`;
    try {
      const errBody = await response.json();
      errMsg = errBody.message || errBody.error || errMsg;
    } catch {}
    throw new Error(errMsg);
  }

  // Handle empty or text responses
  if (response.status === 204) {
    return {} as T;
  }

  return response.json() as Promise<T>;
}

const decodeJwt = (token: string) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
};

export const api = {
  // Auth
  register: async (email: string, password: string): Promise<User> => {
    const res = await apiRequest<{ access_token: string; refresh_token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    const decoded = decodeJwt(res.access_token);
    const user: User = {
      userId: decoded?.userId || '',
      username: decoded?.email || email,
      accessToken: res.access_token,
    };
    tokenStorage.setToken(user.accessToken);
    tokenStorage.setUser(user);
    return user;
  },

  login: async (email: string, password: string): Promise<User> => {
    const res = await apiRequest<{ access_token: string; refresh_token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    const decoded = decodeJwt(res.access_token);
    const user: User = {
      userId: decoded?.userId || '',
      username: decoded?.email || email,
      accessToken: res.access_token,
    };
    tokenStorage.setToken(user.accessToken);
    tokenStorage.setUser(user);
    return user;
  },

  logout: (): void => {
    tokenStorage.clearToken();
    tokenStorage.clearUser();
  },

  listPodcasts: async (search?: string, page = 1, limit = 20, status?: string, myPodcasts?: string): Promise<PodcastListResponse> => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    if (status) params.append('status', status);
    if (myPodcasts) params.append('myPodcasts', myPodcasts);
    
    return apiRequest<PodcastListResponse>(`/podcasts?${params.toString()}`);
  },

  getPodcast: async (id: string): Promise<Podcast> => {
    return apiRequest<Podcast>(`/podcasts/${id}`);
  },

  generatePodcast: async (prompt: string): Promise<Podcast> => {
    return apiRequest<Podcast>('/podcasts/generate', {
      method: 'POST',
      body: JSON.stringify({ prompt }),
    });
  },

  getStreamUrl: (id: string): string => {
    // Return direct link to streaming endpoint (supporting token or public access)
    const token = tokenStorage.getToken();
    return token 
      ? `${BASE_URL}/podcasts/${id}/stream?token=${token}`
      : `${BASE_URL}/podcasts/${id}/stream`;
  },
};
