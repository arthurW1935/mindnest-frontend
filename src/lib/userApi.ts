// User Service API client

interface UserProfile {
    id?: number;
    first_name?: string;
    last_name?: string;
    date_of_birth?: string;
    gender?: 'male' | 'female' | 'non-binary' | 'prefer-not-to-say' | 'other';
    phone?: string;
    address_line_1?: string;
    address_line_2?: string;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
    bio?: string;
    emergency_contact_name?: string;
    emergency_contact_phone?: string;
    emergency_contact_relationship?: string;
    profile_picture_url?: string;
  }
  
  interface UserPreferences {
    theme?: 'light' | 'dark' | 'system';
    language?: string;
    timezone?: string;
    email_notifications?: boolean;
    push_notifications?: boolean;
    sms_notifications?: boolean;
    appointment_reminders?: boolean;
    wellness_tips?: boolean;
    marketing_emails?: boolean;
    data_sharing?: boolean;
    session_recording?: boolean;
  }
  
  interface ApiResponse<T = any> {
    success: boolean;
    message: string;
    data?: T;
    errors?: string[];
  }
  
  class UserApiClient {
    private baseUrl: string;
  
    constructor() {
      this.baseUrl = process.env.NEXT_PUBLIC_USER_SERVICE_URL || 'http://localhost:3002';
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
        console.error('User API request failed:', error);
        throw error;
      }
    }
  
    // User Management
    async getCurrentUser(): Promise<ApiResponse<{ user: any }>> {
      return this.makeRequest('/api/users/me');
    }
  
    async updateCurrentUser(userData: { email?: string }): Promise<ApiResponse<{ user: any }>> {
      return this.makeRequest('/api/users/me', {
        method: 'PUT',
        body: JSON.stringify(userData),
      });
    }
  
    async deleteCurrentUser(): Promise<ApiResponse> {
      return this.makeRequest('/api/users/me', {
        method: 'DELETE',
      });
    }
  
    async exportUserData(): Promise<ApiResponse> {
      return this.makeRequest('/api/users/me/export');
    }
  
    // Profile Management
    async getCurrentUserProfile(): Promise<ApiResponse<{ profile: UserProfile; completion_percentage: number }>> {
      return this.makeRequest('/api/profile/me');
    }
  
    async updateCurrentUserProfile(profileData: UserProfile): Promise<ApiResponse<{ profile: UserProfile; completion_percentage: number }>> {
      return this.makeRequest('/api/profile/me', {
        method: 'PUT',
        body: JSON.stringify(profileData),
      });
    }
  
    async getProfilePicture(size: number = 64): Promise<ApiResponse<{ profile_picture_url: string; size: number }>> {
      return this.makeRequest(`/api/profile/me/picture?size=${size}`);
    }
  
    async getProfileCompletion(): Promise<ApiResponse<{
      completion_percentage: number;
      is_complete: boolean;
      missing_fields: string[];
      total_required_fields: number;
      completed_fields: number;
    }>> {
      return this.makeRequest('/api/profile/me/completion');
    }
  
    // Preferences Management
    async getCurrentUserPreferences(): Promise<ApiResponse<{ preferences: UserPreferences }>> {
      return this.makeRequest('/api/preferences/me');
    }
  
    async updateCurrentUserPreferences(preferencesData: UserPreferences): Promise<ApiResponse<{ preferences: UserPreferences }>> {
      return this.makeRequest('/api/preferences/me', {
        method: 'PUT',
        body: JSON.stringify(preferencesData),
      });
    }
  
    async getNotificationPreferences(): Promise<ApiResponse<{
      notifications: {
        email_notifications: boolean;
        push_notifications: boolean;
        sms_notifications: boolean;
        appointment_reminders: boolean;
        wellness_tips: boolean;
        marketing_emails: boolean;
      }
    }>> {
      return this.makeRequest('/api/preferences/me/notifications');
    }
  
    async updateNotificationPreferences(notificationData: Partial<UserPreferences>): Promise<ApiResponse> {
      return this.makeRequest('/api/preferences/me/notifications', {
        method: 'PUT',
        body: JSON.stringify(notificationData),
      });
    }
  
    async getPrivacyPreferences(): Promise<ApiResponse<{
      privacy: {
        data_sharing: boolean;
        session_recording: boolean;
      }
    }>> {
      return this.makeRequest('/api/preferences/me/privacy');
    }
  
    async updatePrivacyPreferences(privacyData: Partial<UserPreferences>): Promise<ApiResponse> {
      return this.makeRequest('/api/preferences/me/privacy', {
        method: 'PUT',
        body: JSON.stringify(privacyData),
      });
    }
  
    async resetPreferencesToDefault(): Promise<ApiResponse<{ preferences: UserPreferences }>> {
      return this.makeRequest('/api/preferences/me/reset', {
        method: 'POST',
      });
    }
  }
  
  export const userApi = new UserApiClient();
  export type { UserProfile, UserPreferences, ApiResponse };