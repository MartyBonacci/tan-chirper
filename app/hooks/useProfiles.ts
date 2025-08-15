import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient, ApiError } from '../lib/api';
import type { Profile, ProfilePublic, UpdateProfile } from '../../shared/schemas/profile';

// Profile management hooks using TanStack Query

// Get profile by ID
export function useProfile(id: string) {
  return useQuery({
    queryKey: ['profiles', id],
    queryFn: async (): Promise<ProfilePublic> => {
      const response = await apiClient.getProfile(id);
      return response.profile;
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: (failureCount, error) => {
      // Don't retry on 404 errors
      if (error instanceof ApiError && error.status === 404) {
        return false;
      }
      return failureCount < 3;
    },
  });
}

// Get profile by username
export function useProfileByUsername(username: string) {
  return useQuery({
    queryKey: ['profiles', 'username', username],
    queryFn: async (): Promise<ProfilePublic> => {
      const response = await apiClient.getProfileByUsername(username);
      return response.profile;
    },
    enabled: !!username,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: (failureCount, error) => {
      // Don't retry on 404 errors
      if (error instanceof ApiError && error.status === 404) {
        return false;
      }
      return failureCount < 3;
    },
  });
}

// Update current user's profile
export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: UpdateProfile): Promise<Profile> => {
      const response = await apiClient.updateProfile(updates);
      return response.profile;
    },
    onSuccess: (updatedProfile) => {
      // Update the auth user cache
      queryClient.setQueryData(['auth', 'user'], updatedProfile);
      
      // Update the profile cache
      queryClient.setQueryData(['profiles', updatedProfile.id], updatedProfile);
      
      // Update the username-based cache with the new username
      queryClient.setQueryData(['profiles', 'username', updatedProfile.username], updatedProfile);
      
      // Invalidate related queries
      queryClient.invalidateQueries({
        queryKey: ['profiles'],
        exact: false,
      });
    },
    onError: (error) => {
      console.error('Profile update failed:', error);
    },
  });
}

// Get my own profile (authenticated user)
export function useMyProfile() {
  return useQuery({
    queryKey: ['profiles', 'me'],
    queryFn: async (): Promise<Profile> => {
      const response = await apiClient.getMyProfile();
      return response.profile;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: (failureCount, error) => {
      // Don't retry on auth errors
      if (error instanceof ApiError && (error.status === 401 || error.status === 403)) {
        return false;
      }
      return failureCount < 3;
    },
  });
}