// Therapist Service API client

interface TherapistProfile {
    id?: number;
    first_name?: string;
    last_name?: string;
    title?: string;
    bio?: string;
    years_experience?: number;
    education?: string[];
    certifications?: string[];
    languages_spoken?: string[];
    phone?: string;
    license_number?: string;
    license_state?: string;
    session_rate?: number;
    currency?: string;
    timezone?: string;
    profile_picture_url?: string;
    specializations?: Specialization[];
    approaches?: Approach[];
    profile_completion?: number;
  }
  
  interface Specialization {
    id: number;
    name: string;
    description?: string;
    category?: string;
    proficiency_level?: 'beginner' | 'proficient' | 'expert';
  }
  
  interface Approach {
    id: number;
    name: string;
    description?: string;
    category?: string;
  }
  
  interface AvailabilityTemplate {
    id?: number;
    day_of_week: number;
    start_time: string;
    end_time: string;
    session_duration?: number;
    break_between_sessions?: number;
    is_active?: boolean;
  }
  
  interface AvailabilitySlot {
    id?: number;
    therapist_id?: number;
    start_datetime: string;
    end_datetime: string;
    status?: 'available' | 'booked' | 'cancelled' | 'blocked';
    session_type?: 'individual' | 'group' | 'couples' | 'family';
    notes?: string;
  }
  
  interface TherapistSearchFilters {
    specializations?: string[];
    approaches?: string[];
    languages?: string[];
    min_rating?: number;
    max_rate?: number;
    page?: number;
    limit?: number;
    sort_by?: 'rating' | 'experience' | 'rate';
    search?: string;
  }
  
  interface ApiResponse<T = any> {
    success: boolean;
    message: string;
    data?: T;
    errors?: string[];
  }
  
  class TherapistApiClient {
    private baseUrl: string;
  
    constructor() {
      this.baseUrl = process.env.NEXT_PUBLIC_THERAPIST_SERVICE_URL || 'http://localhost:3003';
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
        console.error('Therapist API request failed:', error);
        throw error;
      }
    }
  
    // Therapist Management
    async getCurrentTherapist(): Promise<ApiResponse<{ therapist: TherapistProfile }>> {
      return this.makeRequest('/api/therapists/me');
    }
  
    async updateCurrentTherapist(therapistData: { email?: string }): Promise<ApiResponse<{ therapist: any }>> {
      return this.makeRequest('/api/therapists/me', {
        method: 'PUT',
        body: JSON.stringify(therapistData),
      });
    }
  
    async deleteCurrentTherapist(): Promise<ApiResponse> {
      return this.makeRequest('/api/therapists/me', {
        method: 'DELETE',
      });
    }
  
    async getTherapistStats(): Promise<ApiResponse<{ stats: any }>> {
      return this.makeRequest('/api/therapists/me/stats');
    }
  
    // Public Search & Discovery
    async searchTherapists(filters: TherapistSearchFilters = {}): Promise<ApiResponse<{
      therapists: TherapistProfile[];
      pagination: { page: number; limit: number; total: number; pages: number };
    }>> {
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach(v => params.append(`${key}[]`, v.toString()));
          } else {
            params.append(key, value.toString());
          }
        }
      });
  
      return this.makeRequest(`/api/therapists/search?${params.toString()}`);
    }
  
    async getPublicTherapistProfile(therapistId: number): Promise<ApiResponse<{ therapist: TherapistProfile }>> {
      return this.makeRequest(`/api/therapists/public/${therapistId}`);
    }
  
    async getSpecializations(): Promise<ApiResponse<{ specializations: Record<string, Specialization[]>; all: Specialization[] }>> {
      return this.makeRequest('/api/therapists/specializations');
    }
  
    async getApproaches(): Promise<ApiResponse<{ approaches: Record<string, Approach[]>; all: Approach[] }>> {
      return this.makeRequest('/api/therapists/approaches');
    }
  
    // Profile Management
    async getCurrentTherapistProfile(): Promise<ApiResponse<{ profile: TherapistProfile; completion_percentage: number }>> {
      return this.makeRequest('/api/therapist-profile/me');
    }
  
    async updateCurrentTherapistProfile(profileData: TherapistProfile): Promise<ApiResponse<{ profile: TherapistProfile; completion_percentage: number }>> {
      return this.makeRequest('/api/therapist-profile/me', {
        method: 'PUT',
        body: JSON.stringify(profileData),
      });
    }
  
    async getProfileCompletion(): Promise<ApiResponse<{
      completion_percentage: number;
      is_complete: boolean;
      missing_fields: string[];
      total_required_fields: number;
      completed_fields: number;
    }>> {
      return this.makeRequest('/api/therapist-profile/me/completion');
    }
  
    async getProfilePicture(size: number = 64): Promise<ApiResponse<{ profile_picture_url: string; size: number }>> {
      return this.makeRequest(`/api/therapist-profile/me/picture?size=${size}`);
    }
  
    async getTherapistSpecializations(): Promise<ApiResponse<{ specializations: Specialization[] }>> {
      return this.makeRequest('/api/therapist-profile/me/specializations');
    }
  
    async updateTherapistSpecializations(data: {
      specialization_ids: number[];
      proficiency_levels?: string[];
    }): Promise<ApiResponse<{ specializations: Specialization[] }>> {
      return this.makeRequest('/api/therapist-profile/me/specializations', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    }
  
    async getTherapistApproaches(): Promise<ApiResponse<{ approaches: Approach[] }>> {
      return this.makeRequest('/api/therapist-profile/me/approaches');
    }
  
    async updateTherapistApproaches(data: { approach_ids: number[] }): Promise<ApiResponse<{ approaches: Approach[] }>> {
      return this.makeRequest('/api/therapist-profile/me/approaches', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    }
  
    async getAvailableSpecializations(): Promise<ApiResponse<{ specializations: Record<string, Specialization[]>; all: Specialization[] }>> {
      return this.makeRequest('/api/therapist-profile/specializations/available');
    }
  
    async getAvailableApproaches(): Promise<ApiResponse<{ approaches: Record<string, Approach[]>; all: Approach[] }>> {
      return this.makeRequest('/api/therapist-profile/approaches/available');
    }
  
    // Availability Management
    async getAvailabilityTemplates(): Promise<ApiResponse<{ templates: AvailabilityTemplate[] }>> {
      return this.makeRequest('/api/availability/templates');
    }
  
    async createAvailabilityTemplate(templateData: AvailabilityTemplate): Promise<ApiResponse<{ template: AvailabilityTemplate }>> {
      return this.makeRequest('/api/availability/templates', {
        method: 'POST',
        body: JSON.stringify(templateData),
      });
    }
  
    async updateAvailabilityTemplate(templateId: number, templateData: Partial<AvailabilityTemplate>): Promise<ApiResponse<{ template: AvailabilityTemplate }>> {
      return this.makeRequest(`/api/availability/templates/${templateId}`, {
        method: 'PUT',
        body: JSON.stringify(templateData),
      });
    }
  
    async deleteAvailabilityTemplate(templateId: number): Promise<ApiResponse> {
      return this.makeRequest(`/api/availability/templates/${templateId}`, {
        method: 'DELETE',
      });
    }
  
    async generateSlotsFromTemplate(data: {
      template_id: number;
      start_date: string;
      end_date: string;
      exclude_dates?: string[];
    }): Promise<ApiResponse<{ slots: AvailabilitySlot[] }>> {
      return this.makeRequest('/api/availability/generate', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    }
  
    async getAvailabilitySlots(params: {
      start_date: string;
      end_date: string;
      therapist_id?: number;
      status?: string;
    }): Promise<ApiResponse<{ slots: AvailabilitySlot[] }>> {
      const searchParams = new URLSearchParams(params as any);
      return this.makeRequest(`/api/availability/slots?${searchParams.toString()}`);
    }
  
    async createAvailabilitySlot(slotData: AvailabilitySlot): Promise<ApiResponse<{ slot: AvailabilitySlot }>> {
      return this.makeRequest('/api/availability/slots', {
        method: 'POST',
        body: JSON.stringify(slotData),
      });
    }
  
    async updateAvailabilitySlot(slotId: number, slotData: Partial<AvailabilitySlot>): Promise<ApiResponse<{ slot: AvailabilitySlot }>> {
      return this.makeRequest(`/api/availability/slots/${slotId}`, {
        method: 'PUT',
        body: JSON.stringify(slotData),
      });
    }
  
    async deleteAvailabilitySlot(slotId: number): Promise<ApiResponse> {
      return this.makeRequest(`/api/availability/slots/${slotId}`, {
        method: 'DELETE',
      });
    }
  
    async bookAvailabilitySlot(slotId: number, data: {
      session_type?: string;
      notes?: string;
    }): Promise<ApiResponse<{ slot: AvailabilitySlot; booking: any }>> {
      return this.makeRequest(`/api/availability/slots/${slotId}/book`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    }
  
    async cancelAvailabilitySlot(slotId: number, reason?: string): Promise<ApiResponse<{ slot: AvailabilitySlot }>> {
      return this.makeRequest(`/api/availability/slots/${slotId}/cancel`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      });
    }
  
    async getTherapistCalendar(params: {
      start_date: string;
      end_date: string;
    }): Promise<ApiResponse<{
      calendar: {
        available: AvailabilitySlot[];
        booked: AvailabilitySlot[];
        cancelled: AvailabilitySlot[];
        blocked: AvailabilitySlot[];
      };
      summary: {
        total_slots: number;
        available_slots: number;
        booked_slots: number;
        utilization_rate: number;
      };
    }>> {
      const searchParams = new URLSearchParams(params);
      return this.makeRequest(`/api/availability/calendar?${searchParams.toString()}`);
    }
  
    async searchAvailableSlots(filters: {
      therapist_id?: number;
      start_date?: string;
      end_date?: string;
      session_type?: string;
      duration?: number;
      page?: number;
      limit?: number;
    }): Promise<ApiResponse<{
      slots: AvailabilitySlot[];
      pagination: { page: number; limit: number; total: number; pages: number };
    }>> {
      const params = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
  
      return this.makeRequest(`/api/availability/search?${params.toString()}`);
    }
  
    // Client Management
    async getTherapistClients(params: {
      status?: string;
      page?: number;
      limit?: number;
    } = {}): Promise<ApiResponse<{
      clients: any[];
      pagination: { page: number; limit: number; total: number; pages: number };
    }>> {
      const searchParams = new URLSearchParams(params as any);
      return this.makeRequest(`/api/clients/me?${searchParams.toString()}`);
    }
  
    async createClientRelationship(data: {
      user_id: number;
      relationship_status?: string;
      notes?: string;
      session_rate?: number;
      currency?: string;
    }): Promise<ApiResponse<{ relationship: any }>> {
      return this.makeRequest('/api/clients/relationship', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    }
  
    async getUpcomingSessions(): Promise<ApiResponse<{ sessions: any[] }>> {
      return this.makeRequest('/api/clients/sessions/upcoming');
    }
  
    async getSessionHistory(params: {
      page?: number;
      limit?: number;
    } = {}): Promise<ApiResponse<{ sessions: any[] }>> {
      const searchParams = new URLSearchParams(params as any);
      return this.makeRequest(`/api/clients/sessions/history?${searchParams.toString()}`);
    }
  
    async bookSession(data: {
      therapist_id: number;
      availability_slot_id: number;
      session_type?: string;
      notes?: string;
    }): Promise<ApiResponse<{ booking: any }>> {
      return this.makeRequest('/api/clients/sessions/book', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    }
  
    async cancelSession(sessionId: number, reason?: string): Promise<ApiResponse> {
      return this.makeRequest(`/api/clients/sessions/${sessionId}`, {
        method: 'DELETE',
        body: JSON.stringify({ reason }),
      });
    }
  
    async createTherapistReview(therapistId: number, data: {
      rating: number;
      review_text?: string;
      is_anonymous?: boolean;
    }): Promise<ApiResponse<{ review: any }>> {
      return this.makeRequest(`/api/clients/${therapistId}/review`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    }
  
    async getTherapistReviews(therapistId: number, params: {
      page?: number;
      limit?: number;
      rating_filter?: number;
    } = {}): Promise<ApiResponse<{
      reviews: any[];
      statistics: {
        total_reviews: number;
        average_rating: string;
        five_star: number;
        four_star: number;
        three_star: number;
        two_star: number;
        one_star: number;
      };
      pagination: { page: number; limit: number; total: number; pages: number };
    }>> {
      const searchParams = new URLSearchParams(params as any);
      return this.makeRequest(`/api/clients/${therapistId}/reviews?${searchParams.toString()}`);
    }
  }
  
  export const therapistApi = new TherapistApiClient();
  export type { 
    TherapistProfile, 
    Specialization, 
    Approach, 
    AvailabilityTemplate, 
    AvailabilitySlot, 
    TherapistSearchFilters,
    ApiResponse 
  };