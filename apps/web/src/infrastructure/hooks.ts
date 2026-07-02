import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './api';

export function usePodcasts(search?: string, page = 1, status?: string, myPodcasts?: string) {
  return useQuery({
    queryKey: ['podcasts', search, page, status, myPodcasts],
    queryFn: () => api.listPodcasts(search, page, 20, status, myPodcasts),
    placeholderData: (prev) => prev, // Smooth page transitions
    refetchInterval: (query) => {
      // If any podcast in the list is still QUEUED or PROCESSING, poll every 3 seconds to update progress
      const data = query.state.data;
      if (data && data.data.some(p => p.status === 'QUEUED' || p.status === 'PROCESSING')) {
        return 3000;
      }
      return false;
    },
  });
}

export function usePodcastDetail(id: string | null) {
  return useQuery({
    queryKey: ['podcast', id],
    queryFn: () => (id ? api.getPodcast(id) : null),
    enabled: !!id,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (data && (data.status === 'QUEUED' || data.status === 'PROCESSING')) {
        return 3000;
      }
      return false;
    },
  });
}

export function useGeneratePodcast() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (prompt: string) => api.generatePodcast(prompt),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['podcasts'] });
    },
  });
}

export function useLogin() {
  return useMutation({
    mutationFn: ({ email, password }: any) => api.login(email, password),
  });
}

export function useRegister() {
  return useMutation({
    mutationFn: ({ email, password }: any) => api.register(email, password),
  });
}
