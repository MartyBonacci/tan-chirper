import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from '@tanstack/react-router';
import { apiClient, ApiError } from '../lib/api';
import type { Login, Register } from '../../shared/schemas/auth';

// Authentication hooks using TanStack Query

export interface AuthUser {
  id: string;
  username: string;
  display_name: string;
  bio: string;
  avatar_url: string;
  email: string;
  created_at: Date;
  updated_at: Date;
}

export interface LoginResponse {
  message: string;
  access_token: string;
  refresh_token: string;
  profile: AuthUser;
}

export interface RegisterResponse extends LoginResponse {}

// Get current user query
export function useAuth() {
  return useQuery({
    queryKey: ['auth', 'user'],
    queryFn: async (): Promise<AuthUser | null> => {
      if (!apiClient.isAuthenticated()) {
        return null;
      }
      
      try {
        const response = await apiClient.getMyProfile();
        return response.profile;
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          // User is not authenticated
          return null;
        }
        throw error;
      }
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

// Login mutation
export function useLogin() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async (credentials: Login): Promise<LoginResponse> => {
      const response = await apiClient.login(credentials.email, credentials.password);
      return response;
    },
    onSuccess: (data) => {
      // Update the auth query cache with the new user
      queryClient.setQueryData(['auth', 'user'], data.profile);
      
      // Invalidate all queries to refresh data with new auth state
      queryClient.invalidateQueries();
      
      // Redirect to home page
      router.navigate({ to: '/' });
    },
    onError: (error) => {
      console.error('Login failed:', error);
    },
  });
}

// Register mutation
export function useRegister() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async (userData: Register): Promise<RegisterResponse> => {
      const response = await apiClient.register(userData);
      return response;
    },
    onSuccess: (data) => {
      // Update the auth query cache with the new user
      queryClient.setQueryData(['auth', 'user'], data.profile);
      
      // Invalidate all queries to refresh data with new auth state
      queryClient.invalidateQueries();
      
      // Redirect to home page
      router.navigate({ to: '/' });
    },
    onError: (error) => {
      console.error('Registration failed:', error);
    },
  });
}

// Logout mutation
export function useLogout() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async () => {
      apiClient.logout();
    },
    onSuccess: () => {
      // Clear all cached data
      queryClient.clear();
      
      // Set auth user to null
      queryClient.setQueryData(['auth', 'user'], null);
      
      // Redirect to login page
      router.navigate({ to: '/login' });
    },
  });
}

// Utility hook to check if user is authenticated
export function useIsAuthenticated() {
  const { data: user, isLoading } = useAuth();
  return {
    isAuthenticated: !!user,
    user,
    isLoading,
  };
}

// Hook to require authentication (redirects to login if not authenticated)
export function useRequireAuth() {
  const { isAuthenticated, isLoading } = useIsAuthenticated();
  const router = useRouter();

  if (!isLoading && !isAuthenticated) {
    router.navigate({ to: '/login' });
  }

  return { isAuthenticated, isLoading };
}