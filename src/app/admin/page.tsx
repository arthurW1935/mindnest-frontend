'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface Therapist {
  id: number;
  auth_user_id: number;
  email: string;
  is_verified: boolean;
  verification_status: 'pending' | 'verified' | 'rejected';
  created_at: string;
  first_name: string | null;
  last_name: string | null;
  title: string | null;
  bio: string | null;
  years_experience: number | null;
  languages_spoken: string | null;
  session_rate: number | null;
  currency: string | null;
  profile_picture_url: string | null;
  average_rating: string;
  review_count: string;
  specializations: string | null;
  approaches: string | null;
}

interface Stats {
  totalTherapists: number;
  verifiedTherapists: number;
  pendingTherapists: number;
  totalUsers: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalTherapists: 0,
    verifiedTherapists: 0,
    pendingTherapists: 0,
    totalUsers: 0,
  });
  const [therapists, setTherapists] = useState<Therapist[]>([]);
  const [selectedTherapist, setSelectedTherapist] = useState<Therapist | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'verified' | 'pending' | 'rejected'>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const router = useRouter();
  const { tokens, logout } = useAuth();

  const fetchStats = async () => {
    try {
      if (!tokens?.accessToken) {
        router.push('/auth/login');
        return;
      }

      const [therapistResponse, userResponse] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_THERAPIST_SERVICE_URL}/api/therapists/admin/stats`, {
          headers: {
            'Authorization': `Bearer ${tokens.accessToken}`
          }
        }),
        fetch(`${process.env.NEXT_PUBLIC_USER_SERVICE_URL}/api/users/admin/count`, {
          headers: {
            'Authorization': `Bearer ${tokens.accessToken}`
          }
        })
      ]);

      if (!therapistResponse.ok || !userResponse.ok) {
        if (therapistResponse.status === 401 || userResponse.status === 401) {
          router.push('/auth/login');
          return;
        }
        throw new Error('Failed to fetch stats');
      }

      const therapistData = await therapistResponse.json();
      const userData = await userResponse.json();

      setStats({
        totalTherapists: therapistData.data.total,
        verifiedTherapists: therapistData.data.verified,
        pendingTherapists: therapistData.data.pending,
        totalUsers: userData.data.count
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const fetchTherapists = async () => {
    try {
      if (!tokens?.accessToken) {
        router.push('/auth/login');
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_THERAPIST_SERVICE_URL}/api/therapists`, {
        headers: {
          'Authorization': `Bearer ${tokens.accessToken}`
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          router.push('/auth/login');
          return;
        }
        throw new Error('Failed to fetch therapists');
      }

      const data = await response.json();
      setTherapists(data.data.therapists || []);
    } catch (error) {
      console.error('Error fetching therapists:', error);
      setError('Failed to fetch therapists');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchTherapists();
  }, [router, tokens]);

  const handleTherapistClick = (therapist: Therapist) => {
    setSelectedTherapist(therapist);
    setShowModal(true);
  };

  const handleUpdateStatus = async (therapistId: number, newStatus: 'verified' | 'rejected') => {
    setActionLoading(true);
    try {
      if (!tokens?.accessToken) {
        router.push('/auth/login');
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_THERAPIST_SERVICE_URL}/api/therapists/${therapistId}/verification`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${tokens.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ verification_status: newStatus })
      });

      if (!response.ok) {
        if (response.status === 401) {
          router.push('/auth/login');
          return;
        }
        throw new Error(`Failed to ${newStatus === 'verified' ? 'verify' : 'reject'} therapist`);
      }

      // Refresh data
      await fetchStats();
      await fetchTherapists();
      
      // Update selected therapist if it's the one we just changed
      if (selectedTherapist && selectedTherapist.id === therapistId) {
        setSelectedTherapist({
          ...selectedTherapist,
          verification_status: newStatus,
          is_verified: newStatus === 'verified'
        });
      }

      setShowModal(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setActionLoading(false);
    }
  };

  const getFullName = (therapist: Therapist) => {
    const fullName = `${therapist.first_name || ''} ${therapist.last_name || ''}`.trim();
    return fullName || 'Unknown';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'pending':
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const filteredTherapists = therapists.filter((therapist) => {
    const fullName = getFullName(therapist);
    const matchesSearch = fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      therapist.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = statusFilter === 'all' || therapist.verification_status === statusFilter;
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="mt-1 text-sm text-gray-500">Manage therapists and monitor platform activity</p>
            </div>
            <button
              onClick={logout}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Error Banner */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">{error}</h3>
              </div>
              <div className="ml-auto pl-3">
                <button
                  onClick={() => setError('')}
                  className="text-red-400 hover:text-red-600"
                >
                  <span className="sr-only">Dismiss</span>
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Users</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.totalUsers}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Therapists</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.totalTherapists}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Verified Therapists</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.verifiedTherapists}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Pending Therapists</dt>
                    <dd className="text-lg font-medium text-gray-900">{stats.pendingTherapists}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Therapist Management</h3>
          </div>
          <div className="p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search therapists by name or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
              <div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                >
                  <option value="all">All Therapists</option>
                  <option value="verified">Verified</option>
                  <option value="pending">Pending</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Therapists List */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {filteredTherapists.length === 0 ? (
              <li className="px-6 py-8 text-center text-gray-500">
                No therapists found matching your criteria
              </li>
            ) : (
              filteredTherapists.map((therapist) => (
                <li key={therapist.id}>
                  <button
                    onClick={() => handleTherapistClick(therapist)}
                    className="w-full px-6 py-4 hover:bg-gray-50 focus:outline-none focus:bg-gray-50 transition duration-150 ease-in-out"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                            <span className="text-sm font-medium text-purple-600">
                              {therapist.first_name?.charAt(0).toUpperCase() || therapist.last_name?.charAt(0).toUpperCase() || 'T'}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4 text-left">
                          <div className="text-sm font-medium text-gray-900">
                            {getFullName(therapist)}
                          </div>
                          <div className="text-sm text-gray-500">
                            {therapist.email} • {therapist.specializations || 'No specialization'}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(therapist.verification_status)}`}>
                          {therapist.verification_status.charAt(0).toUpperCase() + therapist.verification_status.slice(1)}
                        </span>
                        <svg className="ml-3 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>

      {/* Therapist Detail Modal */}
      {showModal && selectedTherapist && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-4 border-b">
                <h3 className="text-lg font-medium text-gray-900">Therapist Details</h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Modal Content */}
              <div className="mt-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Name</label>
                    <p className="mt-1 text-sm text-gray-900">{getFullName(selectedTherapist)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Email</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedTherapist.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Title</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedTherapist.title || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Years of Experience</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedTherapist.years_experience || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Session Rate</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {selectedTherapist.session_rate ? `${selectedTherapist.session_rate} ${selectedTherapist.currency || ''}` : 'Not provided'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Languages</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedTherapist.languages_spoken || 'Not provided'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Average Rating</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedTherapist.average_rating}/5 ({selectedTherapist.review_count} reviews)</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Status</label>
                    <span className={`mt-1 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedTherapist.verification_status)}`}>
                      {selectedTherapist.verification_status.charAt(0).toUpperCase() + selectedTherapist.verification_status.slice(1)}
                    </span>
                  </div>
                </div>

                {selectedTherapist.specializations && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Specializations</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedTherapist.specializations}</p>
                  </div>
                )}

                {selectedTherapist.approaches && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Approaches</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedTherapist.approaches}</p>
                  </div>
                )}

                {selectedTherapist.bio && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Bio</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedTherapist.bio}</p>
                  </div>
                )}
              </div>

              {/* Modal Actions */}
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Cancel
                </button>
                
                {selectedTherapist.verification_status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleUpdateStatus(selectedTherapist.id, 'rejected')}
                      disabled={actionLoading}
                      className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                    >
                      {actionLoading ? 'Processing...' : 'Reject'}
                    </button>
                    <button
                      onClick={() => handleUpdateStatus(selectedTherapist.id, 'verified')}
                      disabled={actionLoading}
                      className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                    >
                      {actionLoading ? 'Processing...' : 'Verify'}
                    </button>
                  </>
                )}
                
                {selectedTherapist.verification_status === 'verified' && (
                  <button
                    onClick={() => handleUpdateStatus(selectedTherapist.id, 'rejected')}
                    disabled={actionLoading}
                    className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                  >
                    {actionLoading ? 'Processing...' : 'Revoke Verification'}
                  </button>
                )}
                
                {selectedTherapist.verification_status === 'rejected' && (
                  <button
                    onClick={() => handleUpdateStatus(selectedTherapist.id, 'verified')}
                    disabled={actionLoading}
                    className="px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                  >
                    {actionLoading ? 'Processing...' : 'Verify'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}