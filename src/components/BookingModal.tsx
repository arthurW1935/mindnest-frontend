'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { bookingApi, TimeSlot } from '@/lib/bookingApi';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  therapistId: number;
  therapistName: string;
  onBookingSuccess?: (booking: any) => void;
}

export default function BookingModal({ 
  isOpen, 
  onClose, 
  therapistId, 
  therapistName,
  onBookingSuccess 
}: BookingModalProps) {
  const { user } = useAuth();
  const [step, setStep] = useState<'select-date' | 'select-time' | 'confirm'>('select-date');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Date filtering
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showDateFilter, setShowDateFilter] = useState(false);
  
  // Date selection
  const [selectedDate, setSelectedDate] = useState('');
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  
  // Time slot selection
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  
  // Booking details
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (isOpen) {
      initializeModal();
    }
  }, [isOpen, therapistId]);

  useEffect(() => {
    if (selectedDate) {
      fetchAvailableSlots();
    }
  }, [selectedDate]);

  const initializeModal = () => {
    resetModal();
    setDefaultDateRange();
    fetchAvailableDates();
  };

  const resetModal = () => {
    setStep('select-date');
    setSelectedDate('');
    setSelectedSlot(null);
    setNotes('');
    setError('');
    setSuccess('');
    setShowDateFilter(false);
  };

  const setDefaultDateRange = () => {
    const today = new Date();
    const thirtyDaysLater = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    
    setStartDate(today.toISOString().split('T')[0]);
    setEndDate(thirtyDaysLater.toISOString().split('T')[0]);
  };

  const fetchAvailableDates = async () => {
    try {
      setLoading(true);
      
      const response = await bookingApi.getAvailableTimeSlots(therapistId, {
        startDate: startDate,
        endDate: endDate
      });

      if (response.success && response.data) {
        const slots = response.data;
        const uniqueDates = [...new Set(slots.map(slot => slot.date))].sort();
        setAvailableDates(uniqueDates);
      }
    } catch (error) {
      console.error('Error fetching available dates:', error);
      setError('Failed to load available dates');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableSlots = async () => {
    try {
      setLoading(true);
      
      const response = await bookingApi.getAvailableTimeSlots(therapistId, {
        startDate: selectedDate,
        endDate: selectedDate
      });

      if (response.success && response.data) {
        const daySlots = response.data.filter(slot => slot.date === selectedDate);
        setAvailableSlots(daySlots);
      }
    } catch (error) {
      console.error('Error fetching available slots:', error);
      setError('Failed to load available time slots');
    } finally {
      setLoading(false);
    }
  };

  const handleDateRangeFilter = () => {
    if (startDate && endDate) {
      fetchAvailableDates();
      setShowDateFilter(false);
    }
  };

  const resetDateFilter = () => {
    setDefaultDateRange();
    fetchAvailableDates();
    setShowDateFilter(false);
  };

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setStep('select-time');
  };

  const handleSlotSelect = (slot: TimeSlot) => {
    setSelectedSlot(slot);
    setStep('confirm');
  };

  const handleBooking = async () => {
    if (!selectedSlot || !user?.id) return;

    try {
      setLoading(true);
      setError('');

      const response = await bookingApi.createBooking({
        patientId: user.id,
        timeSlotId: selectedSlot._id!,
        notes: notes.trim() || undefined
      });

      if (response.success && response.data) {
        setSuccess('Session booked successfully!');
        onBookingSuccess?.(response.data);
        
        // Close modal after a short delay
        setTimeout(() => {
          onClose();
        }, 1500);
      }
    } catch (error) {
      console.error('Error creating booking:', error);
      setError('Failed to book session. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    if (step === 'select-time') {
      setStep('select-date');
      setSelectedSlot(null);
    } else if (step === 'confirm') {
      setStep('select-time');
      setSelectedSlot(null);
    }
  };

  const formatTime = (time: string) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString([], { 
      hour: 'numeric', 
      minute: '2-digit' 
    });
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString([], { 
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getSlotCount = (date: string) => {
    return availableSlots.filter(slot => slot.date === date).length;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                Book Session
              </h3>
              <p className="text-sm text-gray-500">with {therapistName}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-center mb-6">
            <div className="flex items-center space-x-4">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                step === 'select-date' ? 'bg-blue-600 text-white' : 
                step === 'select-time' || step === 'confirm' ? 'bg-green-600 text-white' : 
                'bg-gray-300 text-gray-500'
              }`}>
                1
              </div>
              <div className="flex-1 h-1 bg-gray-300">
                <div className={`h-1 transition-all duration-300 ${
                  step === 'select-time' || step === 'confirm' ? 'bg-green-600 w-full' : 'bg-gray-300 w-0'
                }`}></div>
              </div>
              <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                step === 'select-time' ? 'bg-blue-600 text-white' : 
                step === 'confirm' ? 'bg-green-600 text-white' : 
                'bg-gray-300 text-gray-500'
              }`}>
                2
              </div>
              <div className="flex-1 h-1 bg-gray-300">
                <div className={`h-1 transition-all duration-300 ${
                  step === 'confirm' ? 'bg-green-600 w-full' : 'bg-gray-300 w-0'
                }`}></div>
              </div>
              <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                step === 'confirm' ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-500'
              }`}>
                3
              </div>
            </div>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-4 bg-green-50 border border-green-200 rounded-md p-3">
              <p className="text-sm text-green-800">{success}</p>
            </div>
          )}

          {/* Step Content */}
          <div className="min-h-[400px]">
            {/* Step 1: Select Date */}
            {step === 'select-date' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium text-gray-900">Select a Date</h4>
                  <button
                    onClick={() => setShowDateFilter(!showDateFilter)}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
                    </svg>
                    Filter Dates
                  </button>
                </div>

                {/* Date Range Filter */}
                {showDateFilter && (
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <h5 className="font-medium text-gray-900 mb-3">Date Range Filter</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Start Date
                        </label>
                        <input
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          min={new Date().toISOString().split('T')[0]}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          End Date
                        </label>
                        <input
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          min={startDate}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    <div className="flex space-x-3 mt-4">
                      <button
                        onClick={handleDateRangeFilter}
                        className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
                      >
                        Apply Filter
                      </button>
                      <button
                        onClick={resetDateFilter}
                        className="px-4 py-2 bg-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-400"
                      >
                        Reset
                      </button>
                      <button
                        onClick={() => setShowDateFilter(false)}
                        className="px-4 py-2 text-gray-500 text-sm font-medium hover:text-gray-700"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Current Date Range Display */}
                <div className="mb-4 p-3 bg-blue-50 rounded-md">
                  <p className="text-sm text-blue-800">
                    Showing available dates from {formatDate(startDate)} to {formatDate(endDate)}
                  </p>
                </div>

                {loading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : availableDates.length > 0 ? (
                  <div className="grid grid-cols-1 gap-2 max-h-80 overflow-y-auto">
                    {availableDates.map((date) => {
                      const slotsForDate = availableSlots.filter(slot => slot.date === date);
                      return (
                        <button
                          key={date}
                          onClick={() => handleDateSelect(date)}
                          className="p-3 text-left border border-gray-300 rounded-md hover:border-blue-500 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-gray-900">
                                {formatDate(date)}
                              </div>
                              <div className="text-sm text-gray-500">
                                Multiple time slots available
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Available
                              </span>
                              <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No available dates</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      This therapist doesn't have any available slots in the selected date range.
                    </p>
                    <button
                      onClick={() => setShowDateFilter(true)}
                      className="mt-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
                    >
                      Try different dates
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Select Time */}
            {step === 'select-time' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium text-gray-900">Select a Time</h4>
                  <button
                    onClick={goBack}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    ← Change Date
                  </button>
                </div>
                <div className="mb-4 p-3 bg-blue-50 rounded-md">
                  <p className="text-sm font-medium text-blue-900">
                    {formatDate(selectedDate)}
                  </p>
                </div>
                {loading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : availableSlots.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-80 overflow-y-auto">
                    {availableSlots.map((slot) => (
                      <button
                        key={slot._id}
                        onClick={() => handleSlotSelect(slot)}
                        className="p-3 text-center border border-gray-300 rounded-md hover:border-blue-500 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                      >
                        <div className="font-medium text-gray-900">
                          {formatTime(slot.startTime)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {Math.round((new Date(`2000-01-01T${slot.endTime}`).getTime() - new Date(`2000-01-01T${slot.startTime}`).getTime()) / (1000 * 60))} min
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No available times</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      No available time slots for this date.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Confirm Booking */}
            {step === 'confirm' && selectedSlot && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium text-gray-900">Confirm Booking</h4>
                  <button
                    onClick={goBack}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    ← Change Time
                  </button>
                </div>

                {/* Booking Summary */}
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <h5 className="font-medium text-gray-900 mb-3">Session Details</h5>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Therapist:</span>
                      <span className="font-medium text-gray-900">{therapistName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Date:</span>
                      <span className="font-medium text-gray-900">{formatDate(selectedSlot.date)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Time:</span>
                      <span className="font-medium text-gray-900">
                        {formatTime(selectedSlot.startTime)} - {formatTime(selectedSlot.endTime)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Duration:</span>
                      <span className="font-medium text-gray-900">
                        {Math.round((new Date(`2000-01-01T${selectedSlot.endTime}`).getTime() - new Date(`2000-01-01T${selectedSlot.startTime}`).getTime()) / (1000 * 60))} minutes
                      </span>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Session Notes (Optional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add any notes or topics you'd like to discuss..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    maxLength={500}
                  />
                  <p className="mt-1 text-xs text-gray-500">{notes.length}/500 characters</p>
                </div>

                {/* Booking Policy */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-6">
                  <h6 className="text-sm font-medium text-yellow-800 mb-1">Booking Policy</h6>
                  <ul className="text-xs text-yellow-700 space-y-1">
                    <li>• Sessions can be cancelled up to 24 hours in advance</li>
                    <li>• Late cancellations may incur a fee</li>
                    <li>• Please arrive 5 minutes early for your appointment</li>
                    <li>• You will receive a confirmation email with session details</li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex space-x-3 mt-6">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            {step === 'confirm' && (
              <button
                onClick={handleBooking}
                disabled={loading}
                className="flex-1 px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Booking...
                  </>
                ) : (
                  'Confirm Booking'
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}