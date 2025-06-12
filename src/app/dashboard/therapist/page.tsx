'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { therapistApi, TherapistProfile } from '@/lib/therapistApi';
import Link from 'next/link';

export default function TherapistDashboard() {
  const { user, logout, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [therapist, setTherapist] = useState<TherapistProfile>({});
  const [stats, setStats] = useState<any>({});
  const [upcomingSessions, setUpcomingSessions] = useState<any[]>([]);
  const [completionPercentage, setCompletionPercentage] = useState(0);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login');
    } else if (!isLoading && user?.role !== 'psychiatrist') {
      router.push('/dashboard/user');
    }
  }, [isLoading, isAuthenticated, user, router]);

  useEffect(() => {
    if (isAuthenticated && user?.role === 'psychiatrist') {
      fetchTherapistData();
    }
  }, [isAuthenticated, user]);

  const fetchTherapistData = async () => {
    try {
      // Fetch therapist info
      const therapistResponse = await therapistApi.getCurrentTherapist();
      if (therapistResponse.success && therapistResponse.data && therapistResponse.data.therapist) {
        setTherapist(therapistResponse.data.therapist);
        setCompletionPercentage(therapistResponse.data.therapist.profile_completion || 0);
      }

      // Fetch stats
      const statsResponse = await therapistApi.getTherapistStats();
      if (statsResponse.success && statsResponse.data?.stats) {
        setStats(statsResponse.data.stats);
      }

      // Fetch upcoming sessions
      const sessionsResponse = await therapistApi.getUpcomingSessions();
      if (sessionsResponse.success && sessionsResponse.data?.sessions) {
        setUpcomingSessions(sessionsResponse.data.sessions);
      }
    } catch (error) {
      console.error('Error fetching therapist data:', error);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== 'psychiatrist') {
    return null;
  }

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const displayName = therapist.first_name && therapist.last_name 
    ? `Dr. ${therapist.first_name} ${therapist.last_name}`
    : therapist.first_name || user?.email?.split('@')[0] || 'Doctor';

  const profilePictureUrl = therapist.profile_picture_url || 
    `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&size=64&background=10B981&color=ffffff`;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-green-600">MindNest</h1>
              <span className="ml-4 text-gray-500">Therapist Dashboard</span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <img
                  className="h-8 w-8 rounded-full"
                  src={profilePictureUrl}
                  alt="Profile"
                />
                <span className="text-gray-700">{displayName}</span>
                <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                  {stats.verification_status || 'pending'}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="text-gray-500 hover:text-gray-700 px-3 py-2 rounded-md text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Welcome Section */}
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900">
              {getGreeting()}, {therapist.first_name || 'Doctor'}!
            </h2>
            <p className="mt-2 text-lg text-gray-600">
              Welcome to your practice management dashboard
            </p>
          </div>

          {/* Profile Completion Alert */}
          {completionPercentage < 100 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3 flex-1">
                  <h3 className="text-sm font-medium text-green-800">
                    Complete Your Profile ({completionPercentage}%)
                  </h3>
                  <div className="mt-2 text-sm text-green-700">
                    <p>Complete your profile to start accepting clients and appear in search results.</p>
                  </div>
                  <div className="mt-3">
                    <Link
                      href="/dashboard/therapist/profile"
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200"
                    >
                      Complete Profile
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Verification Status */}
          {stats.verification_status === 'pending' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">Account Verification Pending</h3>
                  <p className="mt-1 text-sm text-yellow-700">
                    Your account is under review. You'll be notified once verified and can start accepting clients.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="px-4 py-6 sm:px-0">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Practice Overview</h3>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-100 rounded-md flex items-center justify-center">
                      <span className="text-green-600 font-semibold">{stats.active_clients || 0}</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Active Clients
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {stats.active_clients || 0}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-100 rounded-md flex items-center justify-center">
                      <span className="text-blue-600 font-semibold">{stats.upcoming_sessions || 0}</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Upcoming Sessions
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {stats.upcoming_sessions || 0}
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-yellow-100 rounded-md flex items-center justify-center">
                      <span className="text-yellow-600 font-semibold">{Math.round(stats.average_rating || 0)}</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Average Rating
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {stats.average_rating || 0}/5
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-purple-100 rounded-md flex items-center justify-center">
                      <span className="text-purple-600 font-semibold">{completionPercentage}</span>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        Profile Complete
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {completionPercentage}%
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="px-4 py-6 sm:px-0">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Link
              href="/dashboard/therapist/profile"
              className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-green-500 rounded-lg shadow hover:shadow-md transition-shadow"
            >
              <div>
                <span className="rounded-lg inline-flex p-3 bg-green-50 text-green-600 ring-4 ring-white">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </span>
              </div>
              <div className="mt-4">
                <h3 className="text-lg font-medium text-gray-900">
                  <span className="absolute inset-0" aria-hidden="true" />
                  My Profile
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  Update professional information and specializations
                </p>
              </div>
            </Link>

            <Link
              href="/dashboard/therapist/availability"
              className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-green-500 rounded-lg shadow hover:shadow-md transition-shadow"
            >
              <div>
                <span className="rounded-lg inline-flex p-3 bg-blue-50 text-blue-600 ring-4 ring-white">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </span>
              </div>
              <div className="mt-4">
                <h3 className="text-lg font-medium text-gray-900">
                  <span className="absolute inset-0" aria-hidden="true" />
                  Availability
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  Manage your schedule and appointment slots
                </p>
              </div>
            </Link>

            <Link
              href="/dashboard/therapist/clients"
              className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-green-500 rounded-lg shadow hover:shadow-md transition-shadow"
            >
              <div>
                <span className="rounded-lg inline-flex p-3 bg-purple-50 text-purple-600 ring-4 ring-white">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </span>
              </div>
              <div className="mt-4">
                <h3 className="text-lg font-medium text-gray-900">
                  <span className="absolute inset-0" aria-hidden="true" />
                  My Clients
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  View and manage your client relationships
                </p>
              </div>
            </Link>

            <Link
              href="/dashboard/settings"
              className="relative group bg-white p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-green-500 rounded-lg shadow hover:shadow-md transition-shadow"
            >
              <div>
                <span className="rounded-lg inline-flex p-3 bg-gray-50 text-gray-600 ring-4 ring-white">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </span>
              </div>
              <div className="mt-4">
                <h3 className="text-lg font-medium text-gray-900">
                  <span className="absolute inset-0" aria-hidden="true" />
                  Settings
                </h3>
                <p className="mt-2 text-sm text-gray-500">
                  Account settings and preferences
                </p>
              </div>
            </Link>
          </div>
        </div>

        {/* Upcoming Sessions */}
        <div className="px-4 py-6 sm:px-0">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Upcoming Sessions</h3>
          <div className="bg-white shadow rounded-lg">
            {upcomingSessions.length > 0 ? (
              <div className="divide-y divide-gray-200">
                {upcomingSessions.slice(0, 5).map((session, index) => (
                  <div key={index} className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                            <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {session.session_type || 'Individual'} Session
                          </div>
                          <div className="text-sm text-gray-500">
                            Client ID: {session.user_id}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900">
                          {new Date(session.start_datetime).toLocaleDateString()}
                        </div>
                        <div className="text-sm text-gray-500">
                          {new Date(session.start_datetime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6">
                <div className="text-center py-12">
                  <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No upcoming sessions</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Your upcoming sessions will appear here.
                  </p>
                  <div className="mt-6">
                    <Link
                      href="/dashboard/therapist/availability"
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                    >
                      Set Availability
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="px-4 py-6 sm:px-0">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Practice Insights</h3>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Session Stats */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-6">
                <h4 className="text-lg font-medium text-gray-900 mb-4">Session Statistics</h4>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Total Sessions</span>
                    <span className="text-sm font-medium text-gray-900">{stats.total_sessions || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Completed Sessions</span>
                    <span className="text-sm font-medium text-gray-900">{stats.completed_sessions || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Total Reviews</span>
                    <span className="text-sm font-medium text-gray-900">{stats.total_reviews || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Member Since</span>
                    <span className="text-sm font-medium text-gray-900">
                      {stats.member_since ? new Date(stats.member_since).toLocaleDateString() : 'Recently'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Verification Status */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-6">
                <h4 className="text-lg font-medium text-gray-900 mb-4">Account Status</h4>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Verification Status</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      stats.verification_status === 'verified' ? 'bg-green-100 text-green-800' :
                      stats.verification_status === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {stats.verification_status || 'Pending'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Profile Completion</span>
                    <span className="text-sm font-medium text-gray-900">{completionPercentage}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Can Accept Clients</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      stats.is_verified ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {stats.is_verified ? 'Yes' : 'Pending Verification'}
                    </span>
                  </div>
                  {!stats.is_verified && (
                    <div className="mt-4 p-3 bg-yellow-50 rounded-md">
                      <p className="text-sm text-yellow-800">
                        Complete your profile and await verification to start accepting clients.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
