'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { therapistApi, TherapistProfile, Specialization, Approach } from '@/lib/therapistApi';
import { useRouter } from 'next/navigation';

export default function TherapistProfilePage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  
  const [profile, setProfile] = useState<TherapistProfile>({});
  const [completionPercentage, setCompletionPercentage] = useState(0);
  const [completionData, setCompletionData] = useState<any>({});
  const [availableSpecializations, setAvailableSpecializations] = useState<Specialization[]>([]);
  const [availableApproaches, setAvailableApproaches] = useState<Approach[]>([]);
  const [selectedSpecializations, setSelectedSpecializations] = useState<{ id: number; proficiency_level: string }[]>([]);
  const [selectedApproaches, setSelectedApproaches] = useState<number[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login');
    } else if (!isLoading && user?.role !== 'psychiatrist') {
      router.push('/dashboard/user');
    }
  }, [isLoading, isAuthenticated, user, router]);

  useEffect(() => {
    if (isAuthenticated && user?.role === 'psychiatrist') {
      fetchProfileData();
    }
  }, [isAuthenticated, user]);

  const fetchProfileData = async () => {
    try {
      // Fetch profile
      const profileResponse = await therapistApi.getCurrentTherapistProfile();
      if (profileResponse.success && profileResponse.data) {
        setProfile(profileResponse.data.profile);
        setCompletionPercentage(profileResponse.data.completion_percentage);
      }

      // Fetch completion data
      const completionResponse = await therapistApi.getProfileCompletion();
      if (completionResponse.success && completionResponse.data) {
        setCompletionData(completionResponse.data);
      }

      // Fetch available specializations and approaches
      const [specializationsResponse, approachesResponse] = await Promise.all([
        therapistApi.getAvailableSpecializations(),
        therapistApi.getAvailableApproaches()
      ]);

      if (specializationsResponse.success && specializationsResponse.data) {
        setAvailableSpecializations(specializationsResponse.data.all);
      }

      if (approachesResponse.success && approachesResponse.data) {
        setAvailableApproaches(approachesResponse.data.all);
      }

      // Fetch current specializations and approaches
      const [currentSpecsResponse, currentApproachesResponse] = await Promise.all([
        therapistApi.getTherapistSpecializations(),
        therapistApi.getTherapistApproaches()
      ]);

      if (currentSpecsResponse.success && currentSpecsResponse.data) {
        setSelectedSpecializations(
          currentSpecsResponse.data.specializations.map(spec => ({
            id: spec.id,
            proficiency_level: spec.proficiency_level || 'proficient'
          }))
        );
      }

      if (currentApproachesResponse.success && currentApproachesResponse.data) {
        setSelectedApproaches(currentApproachesResponse.data.approaches.map(app => app.id));
      }

    } catch (error) {
      console.error('Error fetching profile data:', error);
      setError('Failed to load profile data');
    }
  };

  const handleInputChange = (field: keyof TherapistProfile, value: any) => {
    setProfile(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSpecializationChange = (specializationId: number, checked: boolean, proficiencyLevel: string = 'proficient') => {
    if (checked) {
      setSelectedSpecializations(prev => [
        ...prev.filter(s => s.id !== specializationId),
        { id: specializationId, proficiency_level: proficiencyLevel }
      ]);
    } else {
      setSelectedSpecializations(prev => prev.filter(s => s.id !== specializationId));
    }
  };

  const handleApproachChange = (approachId: number, checked: boolean) => {
    if (checked) {
      setSelectedApproaches(prev => [...prev, approachId]);
    } else {
      setSelectedApproaches(prev => prev.filter(id => id !== approachId));
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError('');
    setSuccess('');

    try {
      // Update profile
      const profileResponse = await therapistApi.updateCurrentTherapistProfile(profile);
      if (profileResponse.success && profileResponse.data) {
        setProfile(profileResponse.data.profile);
        setCompletionPercentage(profileResponse.data.completion_percentage);
      }

      // Update specializations
      await therapistApi.updateTherapistSpecializations({
        specialization_ids: selectedSpecializations.map(s => s.id),
        proficiency_levels: selectedSpecializations.map(s => s.proficiency_level)
      });

      // Update approaches
      await therapistApi.updateTherapistApproaches({
        approach_ids: selectedApproaches
      });

      setSuccess('Profile updated successfully!');
      setIsEditing(false);
      
      // Refresh completion data
      const completionResponse = await therapistApi.getProfileCompletion();
      if (completionResponse.success && completionResponse.data) {
        setCompletionData(completionResponse.data);
        setCompletionPercentage(completionResponse.data.completion_percentage);
      }

    } catch (error) {
      console.error('Error updating profile:', error);
      setError(error instanceof Error ? error.message : 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    fetchProfileData(); // Reset to original data
    setError('');
    setSuccess('');
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

  const displayName = profile.first_name && profile.last_name 
    ? `Dr. ${profile.first_name} ${profile.last_name}`
    : profile.first_name || user?.email?.split('@')[0] || 'Doctor';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Professional Profile</h1>
                <p className="mt-1 text-sm text-gray-500">
                  Manage your professional information, specializations, and qualifications
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

      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Profile Completion */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-gray-900">Profile Completion</h2>
            <span className="text-sm font-medium text-green-600">{completionPercentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-green-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${completionPercentage}%` }}
            ></div>
          </div>
          {completionData.missing_fields && completionData.missing_fields.length > 0 && (
            <div className="mt-4">
              <p className="text-sm text-gray-600 mb-2">Missing fields:</p>
              <div className="flex flex-wrap gap-2">
                {completionData.missing_fields.map((field: string) => (
                  <span key={field} className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                    {field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

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

        {/* Basic Information */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-lg font-medium text-gray-900">Basic Information</h2>
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
              >
                Edit Profile
              </button>
            ) : (
              <div className="flex space-x-3">
                <button
                  onClick={handleCancel}
                  disabled={isSaving}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            )}
          </div>

          <div className="p-6">
            {/* Profile Picture */}
            <div className="flex items-center space-x-6 mb-8">
              <div className="flex-shrink-0">
                <img
                  className="h-20 w-20 rounded-full object-cover"
                  src={profile.profile_picture_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&size=80&background=10B981&color=ffffff`}
                  alt="Profile"
                />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">{displayName}</h3>
                <p className="text-sm text-gray-500">
                  Profile picture is automatically generated from your name
                </p>
              </div>
            </div>

            {/* Form Fields */}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {/* First Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700">First Name *</label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={profile.first_name || ''}
                  onChange={(e) => handleInputChange('first_name', e.target.value)}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 disabled:bg-gray-50 disabled:text-gray-500"
                  placeholder="Enter your first name"
                />
              </div>

              {/* Last Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Last Name *</label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={profile.last_name || ''}
                  onChange={(e) => handleInputChange('last_name', e.target.value)}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 disabled:bg-gray-50 disabled:text-gray-500"
                  placeholder="Enter your last name"
                />
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Professional Title</label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={profile.title || ''}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 disabled:bg-gray-50 disabled:text-gray-500"
                  placeholder="e.g., Licensed Clinical Psychologist"
                />
              </div>

              {/* Years of Experience */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Years of Experience</label>
                <input
                  type="number"
                  disabled={!isEditing}
                  value={profile.years_experience || ''}
                  onChange={(e) => handleInputChange('years_experience', parseInt(e.target.value) || 0)}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 disabled:bg-gray-50 disabled:text-gray-500"
                  placeholder="Years of professional experience"
                  min="0"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                <input
                  type="tel"
                  disabled={!isEditing}
                  value={profile.phone || ''}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 disabled:bg-gray-50 disabled:text-gray-500"
                  placeholder="+1 (555) 123-4567"
                />
              </div>

              {/* Session Rate */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Session Rate ($)</label>
                <input
                  type="number"
                  disabled={!isEditing}
                  value={profile.session_rate || ''}
                  onChange={(e) => handleInputChange('session_rate', parseFloat(e.target.value) || 0)}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 disabled:bg-gray-50 disabled:text-gray-500"
                  placeholder="Session rate in USD"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            {/* Bio */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700">Professional Bio</label>
              <textarea
                disabled={!isEditing}
                value={profile.bio || ''}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                rows={4}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 disabled:bg-gray-50 disabled:text-gray-500"
                placeholder="Describe your professional background, approach to therapy, and what clients can expect..."
              />
            </div>

            {/* License Information */}
            <div className="mt-8">
              <h3 className="text-lg font-medium text-gray-900 mb-4">License Information</h3>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">License Number</label>
                  <input
                    type="text"
                    disabled={!isEditing}
                    value={profile.license_number || ''}
                    onChange={(e) => handleInputChange('license_number', e.target.value)}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 disabled:bg-gray-50 disabled:text-gray-500"
                    placeholder="License number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">License State</label>
                  <input
                    type="text"
                    disabled={!isEditing}
                    value={profile.license_state || ''}
                    onChange={(e) => handleInputChange('license_state', e.target.value)}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 disabled:bg-gray-50 disabled:text-gray-500"
                    placeholder="State of license"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Specializations */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Specializations</h2>
            <p className="mt-1 text-sm text-gray-500">Select your areas of expertise</p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {availableSpecializations.map((specialization) => {
                const selected = selectedSpecializations.find(s => s.id === specialization.id);
                return (
                  <div key={specialization.id} className="relative">
                    <label className="flex items-start space-x-3 cursor-pointer">
                      <input
                        type="checkbox"
                        disabled={!isEditing}
                        checked={!!selected}
                        onChange={(e) => handleSpecializationChange(specialization.id, e.target.checked)}
                        className="mt-1 h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded disabled:opacity-50"
                      />
                      <div className="flex-1">
                        <span className="text-sm font-medium text-gray-900">{specialization.name}</span>
                        {specialization.description && (
                          <p className="text-xs text-gray-500">{specialization.description}</p>
                        )}
                        {selected && isEditing && (
                          <select
                            value={selected.proficiency_level}
                            onChange={(e) => handleSpecializationChange(specialization.id, true, e.target.value)}
                            className="mt-1 block w-full text-xs border-gray-300 rounded focus:ring-green-500 focus:border-green-500"
                          >
                            <option value="beginner">Beginner</option>
                            <option value="proficient">Proficient</option>
                            <option value="expert">Expert</option>
                          </select>
                        )}
                        {selected && !isEditing && (
                          <span className="text-xs text-green-600 capitalize">{selected.proficiency_level}</span>
                        )}
                      </div>
                    </label>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Therapy Approaches */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Therapy Approaches</h2>
            <p className="mt-1 text-sm text-gray-500">Select your therapeutic approaches and methodologies</p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {availableApproaches.map((approach) => (
                <label key={approach.id} className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    disabled={!isEditing}
                    checked={selectedApproaches.includes(approach.id)}
                    onChange={(e) => handleApproachChange(approach.id, e.target.checked)}
                    className="mt-1 h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded disabled:opacity-50"
                  />
                  <div>
                    <span className="text-sm font-medium text-gray-900">{approach.name}</span>
                    {approach.description && (
                      <p className="text-xs text-gray-500">{approach.description}</p>
                    )}
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}