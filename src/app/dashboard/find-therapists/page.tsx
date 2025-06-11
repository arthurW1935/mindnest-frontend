'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { therapistApi, TherapistProfile, TherapistSearchFilters, Specialization, Approach } from '@/lib/therapistApi';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import BookingModal from '@/components/BookingModal';

export default function FindTherapistsPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  
  const [therapists, setTherapists] = useState<TherapistProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState<TherapistSearchFilters>({
    page: 1,
    limit: 12,
    sort_by: 'rating'
  });
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, pages: 0 });
  const [availableSpecializations, setAvailableSpecializations] = useState<Specialization[]>([]);
  const [availableApproaches, setAvailableApproaches] = useState<Approach[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  // Booking modal state
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedTherapistForBooking, setSelectedTherapistForBooking] = useState<{
    id: number;
    name: string;
  } | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login');
    } else if (!isLoading && user?.role !== 'user') {
      router.push('/dashboard/therapist');
    }
  }, [isLoading, isAuthenticated, user, router]);

  useEffect(() => {
    if (isAuthenticated && user?.role === 'user') {
      fetchInitialData();
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (isAuthenticated && user?.role === 'user') {
      searchTherapists();
    }
  }, [filters, isAuthenticated, user]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      
      // Fetch available filters
      const [specializationsResponse, approachesResponse] = await Promise.all([
        therapistApi.getSpecializations(),
        therapistApi.getApproaches()
      ]);

      if (specializationsResponse.success && specializationsResponse.data) {
        setAvailableSpecializations(specializationsResponse.data.all || []);
      }

      if (approachesResponse.success && approachesResponse.data) {
        setAvailableApproaches(approachesResponse.data.all || []);
      }

    } catch (error) {
      console.error('Error fetching initial data:', error);
      setError('Failed to load filter options');
    } finally {
      setLoading(false);
    }
  };

  const searchTherapists = async () => {
    try {
      setSearchLoading(true);
      setError('');

      const response = await therapistApi.searchTherapists(filters);
      
      if (response.success && response.data) {
        setTherapists(response.data.therapists || []);
        setPagination(response.data.pagination || { page: 1, limit: 12, total: 0, pages: 0 });
      }
    } catch (error) {
      console.error('Error searching therapists:', error);
      setError('Failed to search therapists');
    } finally {
      setSearchLoading(false);
    }
  };

  const handleFilterChange = (key: keyof TherapistSearchFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: key === 'page' ? value : 1 // Reset to page 1 unless specifically changing page
    }));
  };

  const handleSpecializationFilter = (specializationId: string, checked: boolean) => {
    const currentSpecs = filters.specializations || [];
    if (checked) {
      handleFilterChange('specializations', [...currentSpecs, specializationId]);
    } else {
      handleFilterChange('specializations', currentSpecs.filter(id => id !== specializationId));
    }
  };

  const handleApproachFilter = (approachId: string, checked: boolean) => {
    const currentApproaches = filters.approaches || [];
    if (checked) {
      handleFilterChange('approaches', [...currentApproaches, approachId]);
    } else {
      handleFilterChange('approaches', currentApproaches.filter(id => id !== approachId));
    }
  };

  const clearFilters = () => {
    setFilters({
      page: 1,
      limit: 12,
      sort_by: 'rating'
    });
  };

  const handleBookSession = (therapist: TherapistProfile) => {
    setSelectedTherapistForBooking({
      id: therapist.auth_user_id || -1,
      name: `Dr. ${therapist.first_name} ${therapist.last_name}`
    });
    setShowBookingModal(true);
  };

  const handleBookingSuccess = (booking: any) => {
    console.log('Booking created successfully:', booking);
    // You can add additional success handling here, like showing a notification
    // or redirecting to a booking confirmation page
  };

  const handleCloseBookingModal = () => {
    setShowBookingModal(false);
    setSelectedTherapistForBooking(null);
  };

  const generatePaginationPages = () => {
    const pages = [];
    const currentPage = pagination.page;
    const totalPages = pagination.pages;
    
    // Always show first page
    if (totalPages > 0) pages.push(1);
    
    // Show pages around current page
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      if (!pages.includes(i)) pages.push(i);
    }
    
    // Always show last page
    if (totalPages > 1 && !pages.includes(totalPages)) pages.push(totalPages);
    
    return pages;
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== 'user') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Find Therapists</h1>
                <p className="mt-1 text-sm text-gray-500">
                  Connect with licensed mental health professionals
                </p>
              </div>
              <button
                onClick={() => router.back()}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                ← Back
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="p-6">
            {/* Search Bar */}
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search therapists by name or specialty..."
                  value={filters.search || ''}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
                  </svg>
                  Filters
                </button>
                <select
                  value={filters.sort_by || 'rating'}
                  onChange={(e) => handleFilterChange('sort_by', e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="rating">Highest Rated</option>
                  <option value="experience">Most Experienced</option>
                  <option value="rate">Lowest Rate</option>
                </select>
              </div>
            </div>

            {/* Filters Panel */}
            {showFilters && (
              <div className="border-t pt-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Specializations */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-3">Specializations</h3>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {availableSpecializations.map((spec) => (
                        <label key={spec.id} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={filters.specializations?.includes(spec.id.toString()) || false}
                            onChange={(e) => handleSpecializationFilter(spec.id.toString(), e.target.checked)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <span className="ml-2 text-sm text-gray-700">{spec.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Approaches */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-3">Therapy Approaches</h3>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {availableApproaches.map((approach) => (
                        <label key={approach.id} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={filters.approaches?.includes(approach.id.toString()) || false}
                            onChange={(e) => handleApproachFilter(approach.id.toString(), e.target.checked)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <span className="ml-2 text-sm text-gray-700">{approach.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Rate Range */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 mb-3">Session Rate</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs text-gray-500">Maximum Rate ($)</label>
                        <input
                          type="number"
                          placeholder="e.g., 200"
                          value={filters.max_rate || ''}
                          onChange={(e) => handleFilterChange('max_rate', parseFloat(e.target.value) || undefined)}
                          className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <button
                        onClick={clearFilters}
                        className="w-full text-sm text-blue-600 hover:text-blue-700"
                      >
                        Clear All Filters
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-500">
              {searchLoading ? 'Searching...' : `${pagination.total} therapists found`}
            </p>
            <div className="text-sm text-gray-500">
              Page {pagination.page} of {pagination.pages}
            </div>
          </div>
        </div>

        {/* Therapist Grid */}
        {searchLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-16 h-16 bg-gray-300 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-300 rounded"></div>
                  <div className="h-3 bg-gray-300 rounded w-5/6"></div>
                </div>
              </div>
            ))}
          </div>
        ) : therapists.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {therapists.map((therapist) => (
              <div key={therapist.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
                <div className="p-6">
                  {/* Therapist Header */}
                  <div className="flex items-center space-x-4 mb-4">
                    <img
                      className="w-16 h-16 rounded-full object-cover"
                      src={therapist.profile_picture_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(`${therapist.first_name || ''} ${therapist.last_name || ''}`.trim() || 'Therapist')}&size=64&background=10B981&color=ffffff`}
                      alt={`${therapist.first_name} ${therapist.last_name}`}
                    />
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-900">
                        Dr. {therapist.first_name} {therapist.last_name}
                      </h3>
                      <p className="text-sm text-gray-500">{therapist.title}</p>
                      <div className="flex items-center mt-1">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <svg
                              key={i}
                              className={`h-4 w-4 ${i < Math.floor(4.5) ? 'text-yellow-400' : 'text-gray-300'}`}
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                          <span className="ml-2 text-sm text-gray-500">4.5</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Experience and Rate */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-gray-500">
                      {therapist.years_experience} years experience
                    </span>
                    <span className="text-lg font-semibold text-green-600">
                      ${therapist.session_rate}/session
                    </span>
                  </div>

                  {/* Bio */}
                  <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                    {therapist.bio || 'Professional therapist focused on helping clients achieve their mental health goals.'}
                  </p>

                  {/* Specializations */}
                  {therapist.specializations && therapist.specializations.length > 0 && (
                    <div className="mb-4">
                      <div className="flex flex-wrap gap-1">
                        {therapist.specializations.slice(0, 3).map((spec) => (
                          <span
                            key={spec.id}
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                          >
                            {spec.name}
                          </span>
                        ))}
                        {therapist.specializations.length > 3 && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            +{therapist.specializations.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Languages */}
                  {therapist.languages_spoken && therapist.languages_spoken.length > 0 && (
                    <div className="mb-4">
                      <p className="text-xs text-gray-500">
                        Languages: {therapist.languages_spoken.join(', ')}
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex space-x-3">
                    <Link
                      href={`/dashboard/find-therapists/${therapist.id}`}
                      className="flex-1 text-center px-4 py-2 border border-blue-300 rounded-md text-sm font-medium text-blue-700 bg-white hover:bg-blue-50"
                    >
                      View Profile
                    </Link>
                    <button 
                      onClick={() => handleBookSession(therapist)}
                      className="flex-1 px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                    >
                      Book Session
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No therapists found</h3>
            <p className="mt-1 text-sm text-gray-500">
              Try adjusting your search criteria or clearing the filters.
            </p>
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="mt-8 flex items-center justify-between">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => handleFilterChange('page', Math.max(1, pagination.page - 1))}
                disabled={pagination.page <= 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => handleFilterChange('page', Math.min(pagination.pages, pagination.page + 1))}
                disabled={pagination.page >= pagination.pages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{((pagination.page - 1) * pagination.limit) + 1}</span> to{' '}
                  <span className="font-medium">
                    {Math.min(pagination.page * pagination.limit, pagination.total)}
                  </span>{' '}
                  of <span className="font-medium">{pagination.total}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => handleFilterChange('page', Math.max(1, pagination.page - 1))}
                    disabled={pagination.page <= 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    <span className="sr-only">Previous</span>
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                  {generatePaginationPages().map((page, index) => (
                    <button
                      key={page}
                      onClick={() => handleFilterChange('page', page)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        page === pagination.page
                          ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => handleFilterChange('page', Math.min(pagination.pages, pagination.page + 1))}
                    disabled={pagination.page >= pagination.pages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    <span className="sr-only">Next</span>
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Booking Modal */}
      {showBookingModal && selectedTherapistForBooking && (
        <BookingModal
          isOpen={showBookingModal}
          onClose={handleCloseBookingModal}
          therapistId={selectedTherapistForBooking.id}
          therapistName={selectedTherapistForBooking.name}
          onBookingSuccess={handleBookingSuccess}
        />
      )}
    </div>
  );
}