import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient, ApiError } from '../lib/api';
import type { Chirp, ChirpFeedItem, CreateChirp } from '../../shared/schemas/chirp';

// Chirp management hooks using TanStack Query

interface ChirpsParams {
  limit?: number;
  offset?: number;
  profile_id?: string;
}

interface ChirpsResponse {
  chirps: ChirpFeedItem[];
  total: number;
  has_more: boolean;
}

// Get chirps feed with pagination
export function useChirps(params?: ChirpsParams) {
  return useQuery({
    queryKey: ['chirps', params],
    queryFn: async (): Promise<ChirpsResponse> => {
      const response = await apiClient.getChirps(params);
      return response;
    },
    staleTime: 1000 * 60, // 1 minute
    retry: (failureCount, error) => {
      // Don't retry on auth errors
      if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
        return false;
      }
      return failureCount < 3;
    },
  });
}

// Get chirps by specific profile
export function useChirpsByProfile(profileId: string, params?: Omit<ChirpsParams, 'profile_id'>) {
  return useQuery({
    queryKey: ['chirps', 'profile', profileId, params],
    queryFn: async (): Promise<ChirpsResponse> => {
      const response = await apiClient.getChirps({
        ...params,
        profile_id: profileId,
      });
      return response;
    },
    enabled: !!profileId,
    staleTime: 1000 * 60, // 1 minute
    retry: (failureCount, error) => {
      // Don't retry on 404 errors
      if (error instanceof ApiError && error.status === 404) {
        return false;
      }
      return failureCount < 3;
    },
  });
}

// Create new chirp
export function useCreateChirp() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (chirpData: CreateChirp): Promise<Chirp> => {
      const response = await apiClient.createChirp(chirpData.content);
      return response.chirp;
    },
    onSuccess: (newChirp) => {
      // Invalidate and refetch chirps queries to show the new chirp
      queryClient.invalidateQueries({
        queryKey: ['chirps'],
        exact: false,
      });
      
      // Also invalidate profile-specific chirps if we know the profile
      if (newChirp.profile_id) {
        queryClient.invalidateQueries({
          queryKey: ['chirps', 'profile', newChirp.profile_id],
          exact: false,
        });
      }
    },
    onError: (error) => {
      console.error('Chirp creation failed:', error);
    },
  });
}

// Delete chirp
export function useDeleteChirp() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (chirpId: string): Promise<void> => {
      await apiClient.deleteChirp(chirpId);
    },
    onSuccess: (_, chirpId) => {
      // Remove the chirp from all relevant query caches
      queryClient.invalidateQueries({
        queryKey: ['chirps'],
        exact: false,
      });
      
      // Also invalidate likes for this chirp
      queryClient.invalidateQueries({
        queryKey: ['likes', 'chirp', chirpId],
        exact: false,
      });
    },
    onError: (error) => {
      console.error('Chirp deletion failed:', error);
    },
  });
}

// Get single chirp by ID (useful for detail views)
export function useChirp(chirpId: string) {
  return useQuery({
    queryKey: ['chirps', 'single', chirpId],
    queryFn: async (): Promise<ChirpFeedItem> => {
      // Note: This assumes the API has a single chirp endpoint
      // If not available, you might need to fetch from the chirps list
      const response = await apiClient.getChirps({ limit: 1 });
      const chirp = response.chirps.find((c: ChirpFeedItem) => c.id === chirpId);
      if (!chirp) {
        throw new ApiError(404, 'Chirp not found');
      }
      return chirp;
    },
    enabled: !!chirpId,
    staleTime: 1000 * 60, // 1 minute
    retry: (failureCount, error) => {
      // Don't retry on 404 errors
      if (error instanceof ApiError && error.status === 404) {
        return false;
      }
      return failureCount < 3;
    },
  });
}