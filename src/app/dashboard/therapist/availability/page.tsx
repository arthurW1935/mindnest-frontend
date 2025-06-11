'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { bookingApi, TimeSlotTemplate, TimeSlot } from '@/lib/bookingApi';
import { useRouter } from 'next/navigation';

const daysOfWeek = [
  { value: 'monday', name: 'Monday' },
  { value: 'tuesday', name: 'Tuesday' },
  { value: 'wednesday', name: 'Wednesday' },
  { value: 'thursday', name: 'Thursday' },
  { value: 'friday', name: 'Friday' },
  { value: 'saturday', name: 'Saturday' },
  { value: 'sunday', name: 'Sunday' },
];

export default function TherapistAvailabilityPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  
  const [templates, setTemplates] = useState<TimeSlotTemplate[]>([]);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [calendarData, setCalendarData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState<'templates' | 'calendar' | 'slots'>('templates');
  
  // Template form state
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<TimeSlotTemplate | null>(null);
  const [templateForm, setTemplateForm] = useState<Partial<TimeSlotTemplate>>({
    dayOfWeek: 'monday',
    startTime: '09:00',
    endTime: '17:00',
    sessionDuration: 50,
    breakTime: 10,
    isActive: true
  });

  // Generate slots form state
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generateForm, setGenerateForm] = useState({
    templateId: '',
    startDate: '',
    endDate: ''
  });

  // Date range for viewing slots/calendar
  const [dateRange, setDateRange] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  });

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

  const fetchData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchTemplates(),
        fetchSlots(),
        calculateCalendarData()
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load availability data');
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      if (!user?.id) return;
      const response = await bookingApi.getTherapistTemplates(user.id);
      if (response.success && response.data) {
        setTemplates(response.data);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  const fetchSlots = async () => {
    try {
      if (!user?.id) return;
      const response = await bookingApi.getTherapistTimeSlots(user.id, {
        startDate: dateRange.startDate,
        endDate: dateRange.endDate
      });
      if (response.success && response.data) {
        setSlots(response.data);
      }
    } catch (error) {
      console.error('Error fetching slots:', error);
    }
  };

  const calculateCalendarData = async () => {
    try {
      if (!slots.length) return;
      
      const availableSlots = slots.filter(slot => !slot.isBooked && slot.isActive);
      const bookedSlots = slots.filter(slot => slot.isBooked);
      const totalSlots = slots.length;
      const utilizationRate = totalSlots > 0 ? (bookedSlots.length / totalSlots) * 100 : 0;

      setCalendarData({
        summary: {
          total_slots: totalSlots,
          available_slots: availableSlots.length,
          booked_slots: bookedSlots.length,
          utilization_rate: utilizationRate
        }
      });
    } catch (error) {
      console.error('Error calculating calendar data:', error);
    }
  };

  useEffect(() => {
    calculateCalendarData();
  }, [slots]);

  const handleTemplateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!user?.id) return;

    try {
      const templateData = {
        ...templateForm,
        therapistId: user.id
      } as TimeSlotTemplate;

      if (editingTemplate) {
        await bookingApi.updateTemplate(editingTemplate._id!, templateData);
        setSuccess('Template updated successfully!');
      } else {
        await bookingApi.createTemplate(templateData);
        setSuccess('Template created successfully!');
      }
      
      setShowTemplateModal(false);
      setEditingTemplate(null);
      setTemplateForm({
        dayOfWeek: 'monday',
        startTime: '09:00',
        endTime: '17:00',
        sessionDuration: 50,
        breakTime: 10,
        isActive: true
      });
      
      await fetchTemplates();
    } catch (error) {
      console.error('Error saving template:', error);
      setError('Failed to save template');
    }
  };

  const handleDeleteTemplate = async (templateId: number) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      await bookingApi.deleteTemplate(templateId);
      setSuccess('Template deleted successfully!');
      await fetchTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
      setError('Failed to delete template');
    }
  };

  const handleGenerateSlots = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const response = await bookingApi.generateTimeSlots(generateForm);
      if (response.success && response.data) {
        setSuccess(`Generated ${response.data!.generatedSlots.length} time slots!`);
        if (response.data!.skippedSlots.length > 0) {
          setSuccess(prev => prev + ` (${response.data!.skippedSlots.length} slots were skipped because they already exist)`);
        }
        setShowGenerateModal(false);
        await fetchSlots();
      }
    } catch (error) {
      console.error('Error generating slots:', error);
      setError('Failed to generate slots');
    }
  };

  const handleSlotStatusChange = async (slotId: number, newStatus: 'active' | 'inactive') => {
    try {
      await bookingApi.updateTimeSlot(slotId, { 
        isActive: newStatus === 'active' 
      });
      
      setSuccess('Slot updated successfully!');
      await fetchSlots();
    } catch (error) {
      console.error('Error updating slot:', error);
      setError('Failed to update slot');
    }
  };

  const editTemplate = (template: TimeSlotTemplate) => {
    setEditingTemplate(template);
    setTemplateForm(template);
    setShowTemplateModal(true);
  };

  const formatTime = (time: string) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  };

  const getStatusColor = (slot: TimeSlot) => {
    if (!slot.isActive) return 'bg-gray-100 text-gray-800';
    if (slot.isBooked) return 'bg-blue-100 text-blue-800';
    return 'bg-green-100 text-green-800';
  };

  const getStatusText = (slot: TimeSlot) => {
    if (!slot.isActive) return 'Inactive';
    if (slot.isBooked) return 'Booked';
    return 'Available';
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
                <h1 className="text-2xl font-bold text-gray-900">Availability Management</h1>
                <p className="mt-1 text-sm text-gray-500">
                  Manage your schedule, templates, and appointment availability
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

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('templates')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'templates'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Templates
              </button>
              <button
                onClick={() => setActiveTab('calendar')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'calendar'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Calendar Overview
              </button>
              <button
                onClick={() => setActiveTab('slots')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'slots'
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Manage Slots
              </button>
            </nav>
          </div>

          <div className="p-6">
            {/* Templates Tab */}
            {activeTab === 'templates' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-medium text-gray-900">Availability Templates</h2>
                  <button
                    onClick={() => setShowTemplateModal(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                  >
                    <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Create Template
                  </button>
                </div>

                {templates.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {templates.map((template) => (
                      <div key={template._id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-medium text-gray-900">
                            {daysOfWeek.find(d => d.value === template.dayOfWeek)?.name}
                          </h3>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            template.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {template.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        
                        <div className="space-y-2 text-sm text-gray-600">
                          <p>Time: {formatTime(template.startTime)} - {formatTime(template.endTime)}</p>
                          <p>Session Duration: {template.sessionDuration} minutes</p>
                          <p>Break: {template.breakTime} minutes</p>
                        </div>

                        <div className="flex space-x-2 mt-4">
                          <button
                            onClick={() => editTemplate(template)}
                            className="flex-1 text-sm bg-green-50 text-green-700 py-2 px-3 rounded hover:bg-green-100"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteTemplate(template._id!)}
                            className="flex-1 text-sm bg-red-50 text-red-700 py-2 px-3 rounded hover:bg-red-100"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No templates yet</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Create your first availability template to get started.
                    </p>
                  </div>
                )}

                {/* Generate Slots Section */}
                {templates.length > 0 && (
                  <div className="mt-8 pt-8 border-t">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">Generate Availability Slots</h3>
                        <p className="text-sm text-gray-500">Create appointment slots from your templates</p>
                      </div>
                      <button
                        onClick={() => setShowGenerateModal(true)}
                        className="inline-flex items-center px-4 py-2 border border-green-300 text-sm font-medium rounded-md text-green-700 bg-green-50 hover:bg-green-100"
                      >
                        Generate Slots
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Calendar Tab */}
            {activeTab === 'calendar' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-medium text-gray-900">Calendar Overview</h2>
                  <div className="flex space-x-3">
                    <input
                      type="date"
                      value={dateRange.startDate}
                      onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                      className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                    <span className="flex items-center text-gray-500">to</span>
                    <input
                      type="date"
                      value={dateRange.endDate}
                      onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                      className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                    <button
                      onClick={() => { fetchSlots(); }}
                      className="px-4 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700"
                    >
                      Update
                    </button>
                  </div>
                </div>

                {calendarData && (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-green-50 rounded-lg p-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                            <span className="text-white font-semibold text-sm">
                              {calendarData.summary?.available_slots || 0}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-green-900">Available</p>
                          <p className="text-xs text-green-700">Open slots</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                            <span className="text-white font-semibold text-sm">
                              {calendarData.summary?.booked_slots || 0}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-blue-900">Booked</p>
                          <p className="text-xs text-blue-700">Scheduled sessions</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-gray-500 rounded-md flex items-center justify-center">
                            <span className="text-white font-semibold text-sm">
                              {calendarData.summary?.total_slots || 0}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-900">Total Slots</p>
                          <p className="text-xs text-gray-700">All time slots</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-purple-50 rounded-lg p-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                            <span className="text-white font-semibold text-sm">
                              {calendarData.summary?.utilization_rate ? Math.round(calendarData.summary.utilization_rate) : 0}%
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-purple-900">Utilization</p>
                          <p className="text-xs text-purple-700">Booking rate</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Simple Calendar View */}
                <div className="bg-white border rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-4">Upcoming Availability</h3>
                  {slots.length > 0 ? (
                    <div className="space-y-3">
                      {slots.slice(0, 10).map((slot) => (
                        <div key={slot._id} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded">
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {new Date(slot.date).toLocaleDateString()} at {formatTime(slot.startTime)}
                            </p>
                            <p className="text-xs text-gray-500">
                              Duration: {slot.endTime && slot.startTime ? 
                                Math.round((new Date(`2000-01-01T${slot.endTime}`).getTime() - new Date(`2000-01-01T${slot.startTime}`).getTime()) / (1000 * 60)) 
                                : 0} minutes
                            </p>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(slot)}`}>
                            {getStatusText(slot)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No availability slots in the selected date range.</p>
                  )}
                </div>
              </div>
            )}

            {/* Slots Tab */}
            {activeTab === 'slots' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-medium text-gray-900">Manage Slots</h2>
                  <div className="flex space-x-3">
                    <input
                      type="date"
                      value={dateRange.startDate}
                      onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                      className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                    <span className="flex items-center text-gray-500">to</span>
                    <input
                      type="date"
                      value={dateRange.endDate}
                      onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                      className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                    <button
                      onClick={fetchSlots}
                      className="px-4 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700"
                    >
                      Update
                    </button>
                  </div>
                </div>

                {slots.length > 0 ? (
                  <div className="bg-white border rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date & Time
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Duration
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {slots.map((slot) => (
                          <tr key={slot._id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {new Date(slot.date).toLocaleDateString()} at {formatTime(slot.startTime)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {slot.endTime && slot.startTime ? 
                                Math.round((new Date(`2000-01-01T${slot.endTime}`).getTime() - new Date(`2000-01-01T${slot.startTime}`).getTime()) / (1000 * 60)) 
                                : 0} min
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(slot)}`}>
                                {getStatusText(slot)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              {!slot.isBooked && (
                                <div className="flex space-x-2">
                                  {slot.isActive ? (
                                    <button
                                      onClick={() => handleSlotStatusChange(slot._id!, 'inactive')}
                                      className="text-red-600 hover:text-red-900"
                                    >
                                      Deactivate
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => handleSlotStatusChange(slot._id!, 'active')}
                                      className="text-green-600 hover:text-green-900"
                                    >
                                      Activate
                                    </button>
                                  )}
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No slots found</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Generate slots from your templates or adjust the date range.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Template Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <form onSubmit={handleTemplateSubmit}>
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {editingTemplate ? 'Edit Template' : 'Create Template'}
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Day of Week</label>
                    <select
                      value={templateForm.dayOfWeek}
                      onChange={(e) => setTemplateForm(prev => ({ ...prev, dayOfWeek: e.target.value as any }))}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                      required
                    >
                      {daysOfWeek.map(day => (
                        <option key={day.value} value={day.value}>{day.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Start Time</label>
                      <input
                        type="time"
                        value={templateForm.startTime}
                        onChange={(e) => setTemplateForm(prev => ({ ...prev, startTime: e.target.value }))}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">End Time</label>
                      <input
                        type="time"
                        value={templateForm.endTime}
                        onChange={(e) => setTemplateForm(prev => ({ ...prev, endTime: e.target.value }))}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Session Duration (min)</label>
                      <input
                        type="number"
                        value={templateForm.sessionDuration}
                        onChange={(e) => setTemplateForm(prev => ({ ...prev, sessionDuration: parseInt(e.target.value) }))}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                        min="15"
                        step="5"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Break (min)</label>
                      <input
                        type="number"
                        value={templateForm.breakTime}
                        onChange={(e) => setTemplateForm(prev => ({ ...prev, breakTime: parseInt(e.target.value) }))}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                        min="0"
                        step="5"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={templateForm.isActive}
                      onChange={(e) => setTemplateForm(prev => ({ ...prev, isActive: e.target.checked }))}
                      className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-sm text-gray-900">
                      Active template
                    </label>
                  </div>
                </div>

                <div className="flex space-x-3 mt-6">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700"
                  >
                    {editingTemplate ? 'Update' : 'Create'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowTemplateModal(false);
                      setEditingTemplate(null);
                      setTemplateForm({
                        dayOfWeek: 'monday',
                        startTime: '09:00',
                        endTime: '17:00',
                        sessionDuration: 50,
                        breakTime: 10,
                        isActive: true
                      });
                    }}
                    className="flex-1 px-4 py-2 bg-gray-300 text-gray-800 text-sm font-medium rounded-md hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Generate Slots Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <form onSubmit={handleGenerateSlots}>
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Generate Availability Slots</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Template</label>
                    <select
                      value={generateForm.templateId}
                      onChange={(e) => {
                        console.log(e.target.value);
                        setGenerateForm(prev => ({ ...prev, templateId: (e.target.value)}))
                      }}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                      required
                    >
                      <option value={0}>Select a template</option>
                      {templates.filter(t => t.isActive).map(template => (
                        <option key={template._id} value={template._id || 0}>
                          {daysOfWeek.find(d => d.value === template.dayOfWeek)?.name} - {formatTime(template.startTime)} to {formatTime(template.endTime)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Start Date</label>
                    <input
                      type="date"
                      value={generateForm.startDate}
                      onChange={(e) => setGenerateForm(prev => ({ ...prev, startDate: e.target.value }))}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">End Date</label>
                    <input
                      type="date"
                      value={generateForm.endDate}
                      onChange={(e) => setGenerateForm(prev => ({ ...prev, endDate: e.target.value }))}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
                      required
                    />
                  </div>
                </div>

                <div className="flex space-x-3 mt-6">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700"
                  >
                    Generate Slots
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowGenerateModal(false);
                      setGenerateForm({
                        templateId: '',
                        startDate: '',
                        endDate: ''
                      });
                    }}
                    className="flex-1 px-4 py-2 bg-gray-300 text-gray-800 text-sm font-medium rounded-md hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}