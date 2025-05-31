// API client utility for making authenticated requests

interface ApiResponse<T = any> {
    success: boolean;
    message: string;
    data?: T;
    errors?: string[];
  }
  
  class ApiClient {
    private baseUrl: string;
  
    constructor(baseUrl: string) {
      this.baseUrl = baseUrl;
    }
  
    private getAuthToken(): string | null {
      if (typeof window === 'undefined') return null;
      
      try {
        const tokens = localStorage.getItem('mindnest_tokens');
        if (tokens) {
          const parsed = JSON.parse(tokens);
          return parsed.accessToken;
        }
      } catch (error) {
        console.error('Error getting auth token:', error);
      }
      return null;
    }
  
    private async makeRequest<T>(
      endpoint: string,
      options: RequestInit = {}
    ): Promise<ApiResponse<T>> {
      const url = `${this.baseUrl}${endpoint}`;
      const token = this.getAuthToken();
  
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string> || {}),
      };
  
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }
  
      try {
        const response = await fetch(url, {
          ...options,
          headers,
        });
  
        const data = await response.json();
  
        if (!response.ok) {
          throw new Error(data.message || `HTTP error! status: ${response.status}`);
        }
  
        return data;
      } catch (error) {
        console.error('API request failed:', error);
        throw error;
      }
    }
  
    async get<T>(endpoint: string): Promise<ApiResponse<T>> {
      return this.makeRequest<T>(endpoint, { method: 'GET' });
    }
  
    async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
      return this.makeRequest<T>(endpoint, {
        method: 'POST',
        body: data ? JSON.stringify(data) : undefined,
      });
    }
  
    async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
      return this.makeRequest<T>(endpoint, {
        method: 'PUT',
        body: data ? JSON.stringify(data) : undefined,
      });
    }
  
    async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
      return this.makeRequest<T>(endpoint, { method: 'DELETE' });
    }
  }
  
  // Create API client instances for each service
  export const authApi = new ApiClient(
    process.env.NEXT_PUBLIC_AUTH_SERVICE_URL || 'http://localhost:3001'
  );
  
  export const userApi = new ApiClient(
    process.env.NEXT_PUBLIC_USER_SERVICE_URL || 'http://localhost:3002'
  );
  
  export const therapistApi = new ApiClient(
    process.env.NEXT_PUBLIC_THERAPIST_SERVICE_URL || 'http://localhost:3003'
  );
  
  export default ApiClient;