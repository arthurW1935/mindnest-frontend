'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { bookingApi, Booking } from '@/lib/bookingApi';
import { userApi } from '@/lib/userApi';
import { useRouter } from 'next/navigation';

interface Client {
  id: number;
  patientId: number;
  first_name?: string;
  last_name?: string;
  email?: string;
  last_session?: string;
  total_sessions?: number;
  next_session?: string;
}

interface BookingWithClient extends Booking {
  clientName?: string;
  clientEmail?: string;
}

export default function TherapistClientsPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  
  const [clients, setClients] = useState<Client[]>([]);
  const [bookings, setBookings] = useState<BookingWithClient[]>([]);
  const [upcomingSessions, setUpcomingSessions] = useState<BookingWithClient[]>([]);
  const [pastSessions, setPastSessions] = useState<BookingWithClient[]>([]);
  const [sessionHistory, setSessionHistory] = useState<BookingWithClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState<'clients' | 'upcoming' | 'past' |'history'>('clients');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showClientModal, setShowClientModal] = useState(false);
  
  // Pagination
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, pages: 0 });

  // Filters
  const [statusFilter, setStatusFilter] = useState('all'); // all, confirmed, completed, cancelled
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login');
    } else if (!isLoading && user?.role !== 'psychiatrist') {
      router.push('/dashboard/user');
    }
  }, [isLoading, isAuthenticated, user, router]);

  useEffect(() => {
    if (isAuthenticated && user?.role === 'psychiatrist' && user.id) {
      fetchData();
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    buildClientsList();
  }, [bookings, searchTerm]);

  const fetchData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchBookings(),
        fetchUpcomingSessions(),
        fetchPastSessions,
        fetchSessionHistory()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load client data');
    } finally {
      setLoading(false);
    }
  };

  const fetchBookings = async () => {
    try {
      if (!user?.id) return;
      
      const response = await bookingApi.getTherapistBookings(user.id, {
        page: 1,
        limit: 100 // Get more to build comprehensive client list
      });

      if (response.success && response.data) {
        // Fetch client details for each booking
        const bookingsWithClients = await Promise.all(
          response.data.map(async (booking) => {
            try {
              const userResponse = await userApi.getUserByAuthId(booking.patientId);
              const client = userResponse.data?.user;

              return {
                ...booking,
                clientName: `${client.first_name ?? ''} ${client.last_name ?? ''}`,
                clientEmail: (client.email ?? '')
              } as BookingWithClient;
            } catch (error) {
              return {
                ...booking,
                clientName: `Client ${booking.patientId}`,
                clientEmail: 'client@example.com'
              } as BookingWithClient;
            }
          })
        );

        setBookings(bookingsWithClients);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    }
  };

  const fetchUpcomingSessions = async () => {
    try {
      if (!user?.id) return;
      
      const today = new Date().toISOString().split('T')[0];
      const response = await bookingApi.getTherapistBookings(user.id, {
        startDate: today,
        status: 'confirmed'
      });

      if (response.success && response.data) {
        const upcomingBookings = response.data.filter(booking => 
          booking.sessionDate >= today && booking.status === 'confirmed'
        );

        const bookingsWithClients = await Promise.all(
          upcomingBookings.map(async (booking) => {
            try {
              const userResponse = await userApi.getUserByAuthId(booking.patientId);
              const client = userResponse.data?.user;

              return {
                ...booking,
                clientName: `${client.first_name ?? ''} ${client.last_name ?? ''}`,
                clientEmail: (client.email ?? '')
              } as BookingWithClient;
            } catch (error) {
              return {
                ...booking,
                clientName: `Client ${booking.patientId}`,
                clientEmail: 'client@example.com'
              } as BookingWithClient;
            }
          })
        );

        setUpcomingSessions(bookingsWithClients);
      }
    } catch (error) {
      console.error('Error fetching upcoming sessions:', error);
    }
  };

  const fetchPastSessions = async () => {
    try {
      if (!user?.id) return;
      
      const today = new Date();
      const response = await bookingApi.getTherapistBookings(user.id, {
        startDate: today.toISOString().split('T')[0],
      });

      if (response.success && response.data) {
        const pastBookings = response.data.filter(booking => 
          new Date(`${booking.sessionDate.split('T')[0]}T${booking.sessionStartTime}`) < today
        );

        const bookingsWithClients = await Promise.all(
          pastBookings.map(async (booking) => {
            try {
              const userResponse = await userApi.getUserByAuthId(booking.patientId);
              const client = userResponse.data?.user;

              return {
                ...booking,
                clientName: `${client.first_name ?? ''} ${client.last_name ?? ''}`,
                clientEmail: (client.email ?? '')
              } as BookingWithClient;
            } catch (error) {
              return {
                ...booking,
                clientName: `Client ${booking.patientId}`,
                clientEmail: 'client@example.com'
              } as BookingWithClient;
            }
          })
        );

        console.log("past", bookingsWithClients);

        setPastSessions(bookingsWithClients);
      }
    } catch (error) {
      console.error('Error fetching upcoming sessions:', error);
    }
  };

  const fetchSessionHistory = async () => {
    try {
      if (!user?.id) return;
      
      const response = await bookingApi.getTherapistBookings(user.id, {
        page,
        limit: 10
      });

      if (response.success && response.data) {
        const bookingsWithClients = await Promise.all(
          response.data.map(async (booking) => {
            try {
              const userResponse = await userApi.getUserByAuthId(booking.patientId);
              const client = userResponse.data?.user;

              return {
                ...booking,
                clientName: `${client.first_name ?? ''} ${client.last_name ?? ''}`,
                clientEmail: (client.email ?? '')
              } as BookingWithClient;
            } catch (error) {
              return {
                ...booking,
                clientName: `Client ${booking.patientId}`,
                clientEmail: 'client@example.com'
              } as BookingWithClient;
            }
          })
        );

        setSessionHistory(bookingsWithClients);
        setPagination({ page, limit: 10, total: response.data.length, pages: Math.ceil(response.data.length / 10) });
      }
    } catch (error) {
      console.error('Error fetching session history:', error);
    }
  };

  const buildClientsList = () => {
    // Build unique clients list from bookings
    const clientsMap = new Map<number, Client>();
    
    bookings.forEach(booking => {
      const clientId = booking.patientId;
      if (!clientsMap.has(clientId)) {
        const clientBookings = bookings.filter(b => b.patientId === clientId);
        const completedSessions = clientBookings.filter(b => b.status === 'completed');
        const upcomingSession = clientBookings.find(b => 
          b.status === 'confirmed' && 
          b.sessionDate >= new Date().toISOString().split('T')[0]
        );

        console.log(upcomingSession);
        const lastSession = completedSessions
          .sort((a, b) => new Date(b.sessionDate).getTime() - new Date(a.sessionDate).getTime())[0];

        clientsMap.set(clientId, {
          id: clientId,
          patientId: clientId,
          first_name: booking.clientName?.split(' ')[0] || 'Client',
          last_name: booking.clientName?.split(' ')[1] || clientId.toString(),
          email: booking.clientEmail || 'client@example.com',
          total_sessions: completedSessions.length,
          last_session: lastSession?.sessionDate,
          next_session: upcomingSession?.sessionDate
        });
      }
    });

    console.log(clientsMap)

    let clientsList = Array.from(clientsMap.values());
    
    // Apply search filter
    if (searchTerm) {
      clientsList = clientsList.filter(client =>
        `${client.first_name} ${client.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setClients(clientsList);
  };

  useEffect(() => {
    buildClientsList();
  }, [bookings, searchTerm]);

  const handleCancelSession = async (sessionId: number) => {
    if (!confirm('Are you sure you want to cancel this session?') || !user?.id) return;

    try {
      await bookingApi.cancelBooking(sessionId, {
        cancellationReason: 'Cancelled by therapist',
        cancelledBy: 'therapist'
      });
      setSuccess('Session cancelled successfully');
      await fetchData();
    } catch (error) {
      console.error('Error cancelling session:', error);
      setError('Failed to cancel session');
    }
  };

  const handleUpdateStatusSession = async (sessionId: number, status: string) => {
    if (!confirm(`Are you sure you want to mark this session as ${status}?`) || !user?.id) return;

    try {
      await bookingApi.updateBookingStatus(sessionId, status);
      setSuccess('Session cancelled successfully');
      await fetchData();
    } catch (error) {
      console.error('Error cancelling session:', error);
      setError('Failed to cancel session');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'no-show': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDateTime = (date: string, time: string) => {
    const dateTime = new Date(`${date.split('T')[0]}T${time}`);
    return {
      date: dateTime.toLocaleDateString(),
      time: dateTime.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    };
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!isAuthenticated || user?.role !== 'psychiatrist') {
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
                <h1 className="text-2xl font-bold text-gray-900">Client Management</h1>
                <p className="mt-1 text-sm text-gray-500">
                  Manage your client relationships and sessions
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
        {/* Error/Success Messages */}
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

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-800">{success}</p>
              </div>
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-md flex items-center justify-center">
                  <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Clients</p>
                <p className="text-2xl font-semibold text-gray-900">{clients.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-md flex items-center justify-center">
                  <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Upcoming Sessions</p>
                <p className="text-2xl font-semibold text-gray-900">{upcomingSessions.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-100 rounded-md flex items-center justify-center">
                  <svg className="h-5 w-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Sessions</p>
                <p className="text-2xl font-semibold text-gray-900">{bookings.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-100 rounded-md flex items-center justify-center">
                  <svg className="h-5 w-5 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">This Week</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {upcomingSessions.filter(session => {
                    const sessionDate = new Date(session.sessionDate);
                    const weekFromNow = new Date();
                    weekFromNow.setDate(weekFromNow.getDate() + 7);
                    return sessionDate <= weekFromNow;
                  }).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('clients')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'clients'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Clients ({clients.length})
              </button>
              <button
                onClick={() => setActiveTab('upcoming')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'upcoming'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Upcoming Sessions ({upcomingSessions.length})
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'history'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Session History
              </button>
            </nav>
          </div>

          <div className="p-6">
            {/* Clients Tab */}
            {activeTab === 'clients' && (
              <div>
                {/* Search */}
                <div className="mb-6">
                  <input
                    type="text"
                    placeholder="Search clients..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                  />
                </div>

                {/* Clients List */}
                {clients.length > 0 ? (
                  <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                    <table className="min-w-full divide-y divide-gray-300">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Client
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Sessions
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Last Session
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Next Session
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {clients.map((client) => (
                          <tr key={client.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10">
                                  <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                                    <span className="text-sm font-medium text-green-800">
                                      {(client.first_name?.[0] || client.email?.[0] || 'C').toUpperCase()}
                                    </span>
                                  </div>
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">
                                    {client.first_name && client.last_name 
                                      ? `${client.first_name} ${client.last_name}`
                                      : client.email?.split('@')[0] || `Client ${client.patientId}`
                                    }
                                  </div>
                                  <div className="text-sm text-gray-500">{client.email}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {client.total_sessions || 0}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {client.last_session ? client.last_session.split('T')[0] : 'Never'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {client.next_session ? client.next_session.split('T')[0] : 'None scheduled'}
                            </td>
                            <td className="px-6 py-4 text-sm font-medium">
                              <button
                                onClick={() => {
                                  setSelectedClient(client);
                                  setShowClientModal(true);
                                }}
                                className="text-blue-600 rounded-sm hover:text-blue-900 bg-blue-100 px-2 py-1 m-1"
                              >
                                View
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No clients found</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      No clients match your current search criteria.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Upcoming Sessions Tab */}
            {activeTab === 'upcoming' && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Upcoming Sessions</h3>
                {upcomingSessions.length > 0 ? (
                  <div className="space-y-4">
                    {upcomingSessions.map((session) => {
                      const { date, time } = formatDateTime(session.sessionDate, session.sessionStartTime);
                      return (
                        <div key={session._id} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3">
                                <div className="flex-shrink-0">
                                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                    <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                  </div>
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-gray-900">
                                    Session with {session.clientName}
                                  </p>
                                  <p className="text-sm text-gray-500">
                                    {date} at {time}
                                  </p>
                                  {session.notes && (
                                    <p className="text-xs text-gray-500 mt-1">{session.notes}</p>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-3">
                              
                              <button
                                onClick={() => handleCancelSession(session._id!)}
                                className="text-red-600 hover:text-red-900 bg-red-100 rounded-sm px-2 py-1 m-1 text-sm"
                              >
                                Cancel
                              </button>
                              
                              <button 
                                onClick={() => handleUpdateStatusSession(session._id!, 'completed')}
                                className="text-green-600 hover:text-green-900 bg-green-100 rounded-sm px-2 py-1 m-1 text-sm"
                              >
                                Mark as Completed
                              </button>

                              <button 
                                onClick={() => handleUpdateStatusSession(session._id!, 'no-show')}
                                className="text-blue-600 hover:text-blue-900 bg-blue-100 rounded-sm px-2 py-1 m-1 text-sm"
                              >
                                Mark as No-Show
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No upcoming sessions</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      You don't have any sessions scheduled.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Session History Tab */}
            {activeTab === 'history' && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Session History</h3>
                {sessionHistory.length > 0 ? (
                  <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                    <table className="min-w-full divide-y divide-gray-300">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date & Time
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Client
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Duration
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Notes
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {sessionHistory.map((session) => {
                          const { date, time } = formatDateTime(session.sessionDate, session.sessionStartTime);
                          const duration = Math.round(
                            (new Date(`${session.sessionDate.split('T')[0]}T${session.sessionEndTime}`).getTime() - 
                             new Date(`${session.sessionDate.split('T')[0]}T${session.sessionStartTime}`).getTime()) / (1000 * 60)
                          );
                          return (
                            <tr key={session._id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                <div>{date}</div>
                                <div className="text-xs text-gray-500">{time}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {session.clientName}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(session.status)}`}>
                                  {session.status}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {duration} min
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                                {session.notes || 'No notes'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No session history</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      You haven't completed any sessions yet.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Client Detail Modal */}
      {showClientModal && selectedClient && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Client Details</h3>
                <button
                  onClick={() => setShowClientModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0 h-12 w-12">
                    <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                      <span className="text-lg font-medium text-green-800">
                        {(selectedClient.first_name?.[0] || selectedClient.email?.[0] || 'C').toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="text-lg font-medium text-gray-900">
                      {selectedClient.first_name && selectedClient.last_name 
                        ? `${selectedClient.first_name} ${selectedClient.last_name}`
                        : selectedClient.email?.split('@')[0] || `Client ${selectedClient.patientId}`
                      }
                    </div>
                    <div className="text-sm text-gray-500">{selectedClient.email}</div>
                  </div>
                </div>

                <div className="border-t pt-3">
                  <dl className="space-y-2">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Total Sessions</dt>
                      <dd className="mt-1 text-sm text-gray-900">{selectedClient.total_sessions || 0}</dd>
                    </div>
                    
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Last Session</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {selectedClient.last_session ? new Date(selectedClient.last_session).toLocaleDateString() : 'Never'}
                      </dd>
                    </div>
                    
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Next Session</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {selectedClient.next_session ? new Date(selectedClient.next_session).toLocaleDateString() : 'Not scheduled'}
                      </dd>
                    </div>
                    
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Client Since</dt>
                      <dd className="mt-1 text-sm text-gray-900">
                        {/* We'd need to track when the client first booked */}
                        Recently
                      </dd>
                    </div>
                  </dl>
                </div>

                <div className="border-t pt-3 flex space-x-3">
                  <button className="flex-1 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700">
                    Schedule Session
                  </button>
                  <button className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50">
                    Send Message
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}