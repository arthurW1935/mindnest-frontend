// Booking Service API client

interface TimeSlotTemplate {
    _id?: number;
    therapistId: number;
    dayOfWeek: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
    startTime: string; // HH:MM format
    endTime: string; // HH:MM format
    sessionDuration: number; // minutes
    breakTime: number; // minutes
    isActive?: boolean;
  }
  
  interface TimeSlot {
    _id?: number;
    therapistId: number;
    templateId: number;
    date: string; // YYYY-MM-DD format
    startTime: string; // HH:MM format
    endTime: string; // HH:MM format
    isBooked?: boolean;
    bookedBy?: number;
    isActive?: boolean;
    createdAt?: string;
    updatedAt?: string;
  }
  
  interface Booking {
    _id?: number;
    patientId: number;
    patientName: string;
    therapistId: number;
    therapistName: string;
    timeSlotId: number;
    sessionDate: string;
    sessionStartTime: string;
    sessionEndTime: string;
    status: 'confirmed' | 'cancelled' | 'completed' | 'no-show';
    notes?: string;
    cancellationReason?: string;
    cancelledAt?: string;
    cancelledBy?: number;
    createdAt?: string;
    updatedAt?: string;
  }
  
  interface BookingFilters {
    status?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }
  
  interface TimeSlotFilters {
    startDate?: string;
    endDate?: string;
    isBooked?: boolean;
    page?: number;
    limit?: number;
  }
  
  interface GenerateTimeSlotRequest {
    templateId: string;
    startDate: string; // YYYY-MM-DD
    endDate: string; // YYYY-MM-DD
  }
  
  interface ApiResponse<T = any> {
    success: boolean;
    message?: string;
    data?: T;
    errors?: string[];
  }
  
  class BookingApiClient {
    private baseUrl: string;
  
    constructor() {
      this.baseUrl = process.env.NEXT_PUBLIC_BOOKING_SERVICE_URL || 'http://localhost:3004';
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
        console.error('Booking API request failed:', error);
        throw error;
      }
    }
  
    // Template Management (Therapist)
    async createTemplate(templateData: TimeSlotTemplate): Promise<ApiResponse<TimeSlotTemplate>> {
      return this.makeRequest('/api/templates', {
        method: 'POST',
        body: JSON.stringify(templateData),
      });
    }
  
    async getTherapistTemplates(therapistId: number): Promise<ApiResponse<TimeSlotTemplate[]>> {
      return this.makeRequest(`/api/templates/therapist/${therapistId}`);
    }
  
    async updateTemplate(templateId: number, templateData: Partial<TimeSlotTemplate>): Promise<ApiResponse<TimeSlotTemplate>> {
      return this.makeRequest(`/api/templates/${templateId}`, {
        method: 'PUT',
        body: JSON.stringify(templateData),
      });
    }
  
    async deleteTemplate(templateId: number): Promise<ApiResponse> {
      return this.makeRequest(`/api/templates/${templateId}`, {
        method: 'DELETE',
      });
    }
  
    // Time Slot Management
    async generateTimeSlots(data: GenerateTimeSlotRequest): Promise<ApiResponse<{
      generatedSlots: TimeSlot[];
      skippedSlots: any[];
    }>> {
      return this.makeRequest('/api/timeslots/generate', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    }
  
    async getTherapistTimeSlots(therapistId: number, filters: TimeSlotFilters = {}): Promise<ApiResponse<TimeSlot[]>> {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
  
      const queryString = params.toString();
      const url = `/api/timeslots/therapist/${therapistId}${queryString ? `?${queryString}` : ''}`;
      
      return this.makeRequest(url);
    }
  
    async getAvailableTimeSlots(therapistId: number, filters: TimeSlotFilters = {}): Promise<ApiResponse<TimeSlot[]>> {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
  
      const queryString = params.toString();
      const url = `/api/timeslots/available/${therapistId}${queryString ? `?${queryString}` : ''}`;
      
      return this.makeRequest(url);
    }
  
    async updateTimeSlot(slotId: number, slotData: Partial<TimeSlot>): Promise<ApiResponse<TimeSlot>> {
      return this.makeRequest(`/api/timeslots/${slotId}`, {
        method: 'PUT',
        body: JSON.stringify(slotData),
      });
    }
  
    async deleteTimeSlot(slotId: number): Promise<ApiResponse> {
      return this.makeRequest(`/api/timeslots/${slotId}`, {
        method: 'DELETE',
      });
    }
  
    // Booking Management
    async createBooking(bookingData: {
      patientId: number;
      timeSlotId: number;
      notes?: string;
    }): Promise<ApiResponse<Booking>> {
      return this.makeRequest('/api/bookings', {
        method: 'POST',
        body: JSON.stringify(bookingData),
      });
    }
  
    async getPatientBookings(patientId: number, filters: BookingFilters = {}): Promise<ApiResponse<Booking[]>> {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
  
      const queryString = params.toString();
      const url = `/api/bookings/patient/${patientId}${queryString ? `?${queryString}` : ''}`;
      
      return this.makeRequest(url);
    }
  
    async getTherapistBookings(therapistId: number, filters: BookingFilters = {}): Promise<ApiResponse<Booking[]>> {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
  
      const queryString = params.toString();
      const url = `/api/bookings/therapist/${therapistId}${queryString ? `?${queryString}` : ''}`;
      
      return this.makeRequest(url);
    }
  
    async getBookingById(bookingId: number): Promise<ApiResponse<Booking>> {
      return this.makeRequest(`/api/bookings/${bookingId}`);
    }
  
    async cancelBooking(bookingId: number, data: {
      cancellationReason: string;
      cancelledBy: string;
    }): Promise<ApiResponse<Booking>> {
      return this.makeRequest(`/api/bookings/${bookingId}/cancel`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    }
  
    async updateBookingStatus(bookingId: number, status: string): Promise<ApiResponse<Booking>> {
      return this.makeRequest(`/api/bookings/${bookingId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status }),
      });
    }
  }
  
  export const bookingApi = new BookingApiClient();
  export type {
    TimeSlotTemplate,
    TimeSlot,
    Booking,
    BookingFilters,
    TimeSlotFilters,
    GenerateTimeSlotRequest,
    ApiResponse
  };