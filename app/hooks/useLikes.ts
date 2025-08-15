import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient, ApiError } from '../lib/api';
import type { LikeStats, LikeResponse } from '../../shared/schemas/like';
import type { ChirpFeedItem } from '../../shared/schemas/chirp';

// Like management hooks using TanStack Query

// Get like count and user's like status for a chirp
export function useChirpLikes(chirpId: string) {
  return useQuery({
    queryKey: ['likes', 'chirp', chirpId],
    queryFn: async (): Promise<LikeStats> => {
      const response = await apiClient.getChirpLikes(chirpId);
      return response;
    },
    enabled: !!chirpId,
    staleTime: 1000 * 30, // 30 seconds
    retry: (failureCount, error) => {
      // Don't retry on 404 errors
      if (error instanceof ApiError && error.status === 404) {
        return false;
      }
      return failureCount < 3;
    },
  });
}

// Like a chirp with optimistic updates
export function useLikeChirp() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (chirpId: string): Promise<LikeResponse> => {
      const response = await apiClient.likeChirp(chirpId);
      return response;
    },
    onMutate: async (chirpId: string) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['likes', 'chirp', chirpId] });

      // Snapshot the previous value
      const previousLikeStats = queryClient.getQueryData<LikeStats>(['likes', 'chirp', chirpId]);

      // Optimistically update like stats
      if (previousLikeStats) {
        queryClient.setQueryData<LikeStats>(['likes', 'chirp', chirpId], {
          ...previousLikeStats,
          like_count: previousLikeStats.like_count + 1,
          is_liked: true,
        });
      }

      // Optimistically update chirp in feed queries
      queryClient.setQueriesData<{ chirps: ChirpFeedItem[]; total: number; has_more: boolean }>(
        { queryKey: ['chirps'], exact: false },
        (oldData) => {
          if (!oldData) return oldData;
          
          return {
            ...oldData,
            chirps: oldData.chirps.map(chirp =>
              chirp.id === chirpId
                ? {
                    ...chirp,
                    like_count: chirp.like_count + 1,
                    is_liked: true,
                  }
                : chirp
            ),
          };
        }
      );

      // Return context for rollback
      return { previousLikeStats };
    },
    onError: (error, chirpId, context) => {
      // Rollback optimistic updates on error
      if (context?.previousLikeStats) {
        queryClient.setQueryData(['likes', 'chirp', chirpId], context.previousLikeStats);
      }

      // Rollback chirp feed updates
      queryClient.setQueriesData<{ chirps: ChirpFeedItem[]; total: number; has_more: boolean }>(
        { queryKey: ['chirps'], exact: false },
        (oldData) => {
          if (!oldData) return oldData;
          
          return {
            ...oldData,
            chirps: oldData.chirps.map(chirp =>
              chirp.id === chirpId
                ? {
                    ...chirp,
                    like_count: Math.max(0, chirp.like_count - 1),
                    is_liked: false,
                  }
                : chirp
            ),
          };
        }
      );

      console.error('Like chirp failed:', error);
    },
    onSettled: (_, __, chirpId) => {
      // Always refetch after error or success to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['likes', 'chirp', chirpId] });
    },
  });
}

// Unlike a chirp with optimistic updates
export function useUnlikeChirp() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (chirpId: string): Promise<LikeResponse> => {
      const response = await apiClient.unlikeChirp(chirpId);
      return response;
    },
    onMutate: async (chirpId: string) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['likes', 'chirp', chirpId] });

      // Snapshot the previous value
      const previousLikeStats = queryClient.getQueryData<LikeStats>(['likes', 'chirp', chirpId]);

      // Optimistically update like stats
      if (previousLikeStats) {
        queryClient.setQueryData<LikeStats>(['likes', 'chirp', chirpId], {
          ...previousLikeStats,
          like_count: Math.max(0, previousLikeStats.like_count - 1),
          is_liked: false,
        });
      }

      // Optimistically update chirp in feed queries
      queryClient.setQueriesData<{ chirps: ChirpFeedItem[]; total: number; has_more: boolean }>(
        { queryKey: ['chirps'], exact: false },
        (oldData) => {
          if (!oldData) return oldData;
          
          return {
            ...oldData,
            chirps: oldData.chirps.map(chirp =>
              chirp.id === chirpId
                ? {
                    ...chirp,
                    like_count: Math.max(0, chirp.like_count - 1),
                    is_liked: false,
                  }
                : chirp
            ),
          };
        }
      );

      // Return context for rollback
      return { previousLikeStats };
    },
    onError: (error, chirpId, context) => {
      // Rollback optimistic updates on error
      if (context?.previousLikeStats) {
        queryClient.setQueryData(['likes', 'chirp', chirpId], context.previousLikeStats);
      }

      // Rollback chirp feed updates
      queryClient.setQueriesData<{ chirps: ChirpFeedItem[]; total: number; has_more: boolean }>(
        { queryKey: ['chirps'], exact: false },
        (oldData) => {
          if (!oldData) return oldData;
          
          return {
            ...oldData,
            chirps: oldData.chirps.map(chirp =>
              chirp.id === chirpId
                ? {
                    ...chirp,
                    like_count: chirp.like_count + 1,
                    is_liked: true,
                  }
                : chirp
            ),
          };
        }
      );

      console.error('Unlike chirp failed:', error);
    },
    onSettled: (_, __, chirpId) => {
      // Always refetch after error or success to ensure consistency
      queryClient.invalidateQueries({ queryKey: ['likes', 'chirp', chirpId] });
    },
  });
}

// Toggle like status (convenience hook that automatically chooses like/unlike)
export function useToggleLike() {
  const likeChirp = useLikeChirp();
  const unlikeChirp = useUnlikeChirp();

  return useMutation({
    mutationFn: async ({ chirpId, isCurrentlyLiked }: { chirpId: string; isCurrentlyLiked: boolean }) => {
      if (isCurrentlyLiked) {
        return unlikeChirp.mutateAsync(chirpId);
      } else {
        return likeChirp.mutateAsync(chirpId);
      }
    },
    onError: (error) => {
      console.error('Toggle like failed:', error);
    },
  });
}