// API client for tan-chirper backend communication
// Handles authentication, token refresh, and error management

interface AuthTokens {
  access_token: string;
  refresh_token: string;
}

class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public data?: any
  ) {
    super(`API Error ${status}: ${statusText}`);
    this.name = 'ApiError';
  }
}

export class ApiClient {
  private baseURL: string;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  constructor(baseURL: string = 'http://localhost:3001/api') {
    this.baseURL = baseURL;
    this.loadTokensFromStorage();
  }

  private loadTokensFromStorage() {
    if (typeof window !== 'undefined') {
      this.accessToken = localStorage.getItem('access_token');
      this.refreshToken = localStorage.getItem('refresh_token');
    }
  }

  private saveTokensToStorage(tokens: AuthTokens) {
    if (typeof window !== 'undefined') {
      localStorage.setItem('access_token', tokens.access_token);
      localStorage.setItem('refresh_token', tokens.refresh_token);
    }
    this.accessToken = tokens.access_token;
    this.refreshToken = tokens.refresh_token;
  }

  private clearTokensFromStorage() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
    }
    this.accessToken = null;
    this.refreshToken = null;
  }

  private async refreshAccessToken(): Promise<boolean> {
    if (!this.refreshToken) {
      return false;
    }

    try {
      const response = await fetch(`${this.baseURL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh_token: this.refreshToken }),
      });

      if (!response.ok) {
        this.clearTokensFromStorage();
        return false;
      }

      const data = await response.json();
      this.accessToken = data.access_token;
      if (typeof window !== 'undefined') {
        localStorage.setItem('access_token', data.access_token);
      }
      return true;
    } catch (error) {
      console.error('Token refresh failed:', error);
      this.clearTokensFromStorage();
      return false;
    }
  }

  private async makeRequest<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const headers = new Headers(options.headers);

    // Add content type for non-GET requests
    if (options.method && options.method !== 'GET') {
      headers.set('Content-Type', 'application/json');
    }

    // Add authorization header if we have an access token
    if (this.accessToken) {
      headers.set('Authorization', `Bearer ${this.accessToken}`);
    }

    const requestOptions: RequestInit = {
      ...options,
      headers,
    };

    let response = await fetch(url, requestOptions);

    // If we get a 401 and have a refresh token, try to refresh and retry
    if (response.status === 401 && this.refreshToken && this.accessToken) {
      const refreshed = await this.refreshAccessToken();
      if (refreshed) {
        // Retry the request with the new access token
        headers.set('Authorization', `Bearer ${this.accessToken}`);
        response = await fetch(url, { ...requestOptions, headers });
      }
    }

    // If still not ok, throw an error
    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = { error: 'Network error', message: response.statusText };
      }
      throw new ApiError(response.status, response.statusText, errorData);
    }

    // Parse JSON response
    const data = await response.json();
    return data;
  }

  // Authentication methods
  async login(email: string, password: string) {
    const data = await this.makeRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    this.saveTokensToStorage({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
    });

    return data;
  }

  async register(userData: {
    username: string;
    display_name: string;
    email: string;
    password: string;
    bio?: string;
  }) {
    const data = await this.makeRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });

    this.saveTokensToStorage({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
    });

    return data;
  }

  logout() {
    this.clearTokensFromStorage();
  }

  // Profile methods
  async getMyProfile() {
    return this.makeRequest('/profiles/me');
  }

  async getProfile(id: string) {
    return this.makeRequest(`/profiles/${id}`);
  }

  async getProfileByUsername(username: string) {
    return this.makeRequest(`/profiles/username/${username}`);
  }

  async updateProfile(updates: {
    username?: string;
    display_name?: string;
    bio?: string;
    avatar_url?: string;
  }) {
    return this.makeRequest('/profiles/me', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  // Chirp methods
  async getChirps(params?: { limit?: number; offset?: number; profile_id?: string }) {
    const searchParams = new URLSearchParams();
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.offset) searchParams.set('offset', params.offset.toString());
    if (params?.profile_id) searchParams.set('profile_id', params.profile_id);

    const query = searchParams.toString();
    return this.makeRequest(`/chirps${query ? `?${query}` : ''}`);
  }

  async createChirp(content: string) {
    return this.makeRequest('/chirps', {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  }

  async deleteChirp(id: string) {
    return this.makeRequest(`/chirps/${id}`, {
      method: 'DELETE',
    });
  }

  // Like methods
  async likeChirp(chirpId: string) {
    return this.makeRequest('/likes', {
      method: 'POST',
      body: JSON.stringify({ chirp_id: chirpId }),
    });
  }

  async unlikeChirp(chirpId: string) {
    return this.makeRequest(`/likes/${chirpId}`, {
      method: 'DELETE',
    });
  }

  async getChirpLikes(chirpId: string) {
    return this.makeRequest(`/chirps/${chirpId}/likes`);
  }

  // Utility methods
  isAuthenticated(): boolean {
    return !!this.accessToken;
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }
}

// Create and export a singleton instance
export const apiClient = new ApiClient();
export { ApiError };