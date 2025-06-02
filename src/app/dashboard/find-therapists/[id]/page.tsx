'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { therapistApi, TherapistProfile } from '@/lib/therapistApi';
import { useRouter, useParams } from 'next/navigation';

interface Review {
  id: number;
  rating: number;
  review_text: string;
  is_anonymous: boolean;
  created_at: string;
  user_name?: string;
}

interface ReviewStats {
  total_reviews: number;
  average_rating: string;
  five_star: number;
  four_star: number;
  three_star: number;
  two_star: number;
  one_star: number;
}

export default function TherapistDetailPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const therapistId = parseInt(params.id as string);
  
  const [therapist, setTherapist] = useState<TherapistProfile | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewStats, setReviewStats] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'reviews'>('overview');

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/auth/login');
    } else if (!isLoading && user?.role !== 'user') {
      router.push('/dashboard/therapist');
    }
  }, [isLoading, isAuthenticated, user, router]);

  useEffect(() => {
    if (isAuthenticated && user?.role === 'user' && therapistId) {
      fetchTherapistData();
    }
  }, [isAuthenticated, user, therapistId]);

  const fetchTherapistData = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch therapist profile
      const therapistResponse = await therapistApi.getPublicTherapistProfile(therapistId);
      
      if (therapistResponse.success && therapistResponse.data) {
        setTherapist(therapistResponse.data.therapist);
      } else {
        setError('Therapist not found');
        return;
      }

      // Fetch reviews
      fetchReviews();

    } catch (error) {
      console.error('Error fetching therapist data:', error);
      setError('Failed to load therapist information');
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      setReviewsLoading(true);
      
      const reviewsResponse = await therapistApi.getTherapistReviews(therapistId, {
        page: 1,
        limit: 10
      });

      if (reviewsResponse.success && reviewsResponse.data) {
        setReviews(reviewsResponse.data.reviews || []);
        setReviewStats(reviewsResponse.data.statistics || null);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setReviewsLoading(false);
    }
  };

  const renderStarRating = (rating: number, size: 'sm' | 'md' | 'lg' = 'md') => {
    const sizeClasses = {
      sm: 'h-4 w-4',
      md: 'h-5 w-5', 
      lg: 'h-6 w-6'
    };

    return (
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
          <svg
            key={i}
            className={`${sizeClasses[size]} ${i < Math.floor(rating) ? 'text-yellow-400' : 'text-gray-300'}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
    );
  };

  const renderRatingDistribution = () => {
    if (!reviewStats) return null;

    const ratings = [
      { stars: 5, count: reviewStats.five_star },
      { stars: 4, count: reviewStats.four_star },
      { stars: 3, count: reviewStats.three_star },
      { stars: 2, count: reviewStats.two_star },
      { stars: 1, count: reviewStats.one_star },
    ];

    return (
      <div className="space-y-2">
        {ratings.map(({ stars, count }) => (
          <div key={stars} className="flex items-center space-x-3">
            <span className="text-sm text-gray-600 w-8">{stars}★</span>
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div
                className="bg-yellow-400 h-2 rounded-full"
                style={{
                  width: `${reviewStats.total_reviews > 0 ? (count / reviewStats.total_reviews) * 100 : 0}%`
                }}
              ></div>
            </div>
            <span className="text-sm text-gray-600 w-8">{count}</span>
          </div>
        ))}
      </div>
    );
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

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => router.back()}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!therapist) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Therapist Not Found</h2>
          <p className="text-gray-600 mb-4">The therapist you're looking for doesn't exist.</p>
          <button
            onClick={() => router.back()}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const displayName = `Dr. ${therapist.first_name} ${therapist.last_name}`;
  const averageRating = reviewStats ? parseFloat(reviewStats.average_rating) : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{displayName}</h1>
                <p className="mt-1 text-sm text-gray-500">{therapist.title}</p>
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
        <div className="lg:grid lg:grid-cols-3 lg:gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2">
            {/* Therapist Info Card */}
            <div className="bg-white rounded-lg shadow mb-6">
              <div className="p-6">
                <div className="flex items-start space-x-6">
                  <img
                    className="w-24 h-24 rounded-full object-cover"
                    src={therapist.profile_picture_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&size=96&background=10B981&color=ffffff`}
                    alt={displayName}
                  />
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-gray-900">{displayName}</h2>
                    <p className="text-lg text-gray-600">{therapist.title}</p>
                    
                    {/* Rating */}
                    <div className="flex items-center mt-2">
                      {renderStarRating(averageRating, 'md')}
                      <span className="ml-2 text-sm text-gray-600">
                        {averageRating.toFixed(1)} ({reviewStats?.total_reviews || 0} reviews)
                      </span>
                    </div>

                    {/* Key Info */}
                    <div className="flex items-center space-x-6 mt-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {therapist.years_experience} years experience
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {therapist.license_state}
                      </div>
                      {therapist.languages_spoken && therapist.languages_spoken.length > 0 && (
                        <div className="flex items-center text-sm text-gray-600">
                          <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                          </svg>
                          {therapist.languages_spoken.join(', ')}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-lg shadow">
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8 px-6">
                  <button
                    onClick={() => setActiveTab('overview')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'overview'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Overview
                  </button>
                  <button
                    onClick={() => setActiveTab('reviews')}
                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === 'reviews'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Reviews ({reviewStats?.total_reviews || 0})
                  </button>
                </nav>
              </div>

              <div className="p-6">
                {activeTab === 'overview' && (
                  <div className="space-y-8">
                    {/* Bio */}
                    {therapist.bio && (
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-3">About</h3>
                        <p className="text-gray-600 leading-relaxed">{therapist.bio}</p>
                      </div>
                    )}

                    {/* Specializations */}
                    {therapist.specializations && therapist.specializations.length > 0 && (
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-3">Specializations</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {therapist.specializations.map((spec) => (
                            <div key={spec.id} className="border rounded-lg p-4">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-medium text-gray-900">{spec.name}</h4>
                                {spec.proficiency_level && (
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                    spec.proficiency_level === 'expert' ? 'bg-green-100 text-green-800' :
                                    spec.proficiency_level === 'proficient' ? 'bg-blue-100 text-blue-800' :
                                    'bg-yellow-100 text-yellow-800'
                                  }`}>
                                    {spec.proficiency_level}
                                  </span>
                                )}
                              </div>
                              {spec.description && (
                                <p className="text-sm text-gray-600">{spec.description}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Therapy Approaches */}
                    {therapist.approaches && therapist.approaches.length > 0 && (
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-3">Therapy Approaches</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {therapist.approaches.map((approach) => (
                            <div key={approach.id} className="border rounded-lg p-4">
                              <h4 className="font-medium text-gray-900 mb-2">{approach.name}</h4>
                              {approach.description && (
                                <p className="text-sm text-gray-600">{approach.description}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Education & Certifications */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {therapist.education && therapist.education.length > 0 && (
                        <div>
                          <h3 className="text-lg font-medium text-gray-900 mb-3">Education</h3>
                          <ul className="space-y-2">
                            {therapist.education.map((edu, index) => (
                              <li key={index} className="flex items-start">
                                <svg className="h-5 w-5 text-green-500 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                <span className="text-gray-600">{edu}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {therapist.certifications && therapist.certifications.length > 0 && (
                        <div>
                          <h3 className="text-lg font-medium text-gray-900 mb-3">Certifications</h3>
                          <ul className="space-y-2">
                            {therapist.certifications.map((cert, index) => (
                              <li key={index} className="flex items-start">
                                <svg className="h-5 w-5 text-blue-500 mt-0.5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                <span className="text-gray-600">{cert}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'reviews' && (
                  <div className="space-y-6">
                    {reviewStats && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Overall Rating */}
                        <div className="text-center">
                          <div className="text-4xl font-bold text-gray-900 mb-2">
                            {averageRating.toFixed(1)}
                          </div>
                          {renderStarRating(averageRating, 'lg')}
                          <p className="text-sm text-gray-600 mt-2">
                            Based on {reviewStats.total_reviews} reviews
                          </p>
                        </div>

                        {/* Rating Distribution */}
                        <div>
                          <h4 className="font-medium text-gray-900 mb-4">Rating Distribution</h4>
                          {renderRatingDistribution()}
                        </div>
                      </div>
                    )}

                    {/* Reviews List */}
                    <div className="border-t pt-6">
                      <h4 className="font-medium text-gray-900 mb-4">Recent Reviews</h4>
                      {reviewsLoading ? (
                        <div className="space-y-4">
                          {[...Array(3)].map((_, i) => (
                            <div key={i} className="animate-pulse">
                              <div className="flex items-center space-x-2 mb-2">
                                <div className="h-4 bg-gray-300 rounded w-20"></div>
                                <div className="h-4 bg-gray-300 rounded w-32"></div>
                              </div>
                              <div className="h-20 bg-gray-300 rounded"></div>
                            </div>
                          ))}
                        </div>
                      ) : reviews.length > 0 ? (
                        <div className="space-y-6">
                          {reviews.map((review) => (
                            <div key={review.id} className="border-b pb-6 last:border-b-0">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center space-x-3">
                                  {renderStarRating(review.rating, 'sm')}
                                  <span className="text-sm text-gray-600">
                                    {review.is_anonymous ? 'Anonymous' : review.user_name || 'Anonymous'}
                                  </span>
                                </div>
                                <span className="text-sm text-gray-500">
                                  {new Date(review.created_at).toLocaleDateString()}
                                </span>
                              </div>
                              {review.review_text && (
                                <p className="text-gray-600">{review.review_text}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                          <h3 className="mt-2 text-sm font-medium text-gray-900">No reviews yet</h3>
                          <p className="mt-1 text-sm text-gray-500">
                            Be the first to leave a review for {therapist.first_name}.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Booking Sidebar */}
          <div className="lg:col-span-1 mt-6 lg:mt-0">
            <div className="bg-white rounded-lg shadow sticky top-8">
              <div className="p-6">
                {/* Session Rate */}
                <div className="text-center mb-6">
                  <div className="text-3xl font-bold text-green-600 mb-1">
                    ${therapist.session_rate}/session
                  </div>
                  <p className="text-sm text-gray-500">50-minute session</p>
                </div>

                {/* Book Session Button */}
                <button
                  onClick={() => setShowBookingModal(true)}
                  className="w-full bg-blue-600 text-white py-3 px-4 rounded-md font-medium hover:bg-blue-700 transition-colors mb-4"
                >
                  Book Session
                </button>

                {/* Contact Options */}
                <div className="space-y-3">
                  <button className="w-full border border-gray-300 text-gray-700 py-2 px-4 rounded-md font-medium hover:bg-gray-50 transition-colors">
                    Send Message
                  </button>
                  {therapist.phone && (
                    <a
                      href={`tel:${therapist.phone}`}
                      className="w-full border border-gray-300 text-gray-700 py-2 px-4 rounded-md font-medium hover:bg-gray-50 transition-colors block text-center"
                    >
                      Call {therapist.phone}
                    </a>
                  )}
                </div>

                {/* Quick Info */}
                <div className="mt-6 pt-6 border-t">
                  <h4 className="font-medium text-gray-900 mb-3">Quick Info</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Response time:</span>
                      <span className="text-gray-900">Within 24 hours</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Session format:</span>
                      <span className="text-gray-900">Video call</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Cancellation:</span>
                      <span className="text-gray-900">24 hours notice</span>
                    </div>
                  </div>
                </div>

                {/* License Info */}
                {(therapist.license_number || therapist.license_state) && (
                  <div className="mt-6 pt-6 border-t">
                    <h4 className="font-medium text-gray-900 mb-3">License Information</h4>
                    <div className="space-y-1 text-sm text-gray-600">
                      {therapist.license_number && (
                        <p>License: {therapist.license_number}</p>
                      )}
                      {therapist.license_state && (
                        <p>State: {therapist.license_state}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Modal Placeholder */}
      {showBookingModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <h3 className="text-lg font-medium text-gray-900">Book Session</h3>
              <div className="mt-4 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Booking functionality will be implemented with the booking service.
                </p>
              </div>
              <div className="items-center px-4 py-3">
                <button
                  onClick={() => setShowBookingModal(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-800 text-base font-medium rounded-md w-full shadow-sm hover:bg-gray-400"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}