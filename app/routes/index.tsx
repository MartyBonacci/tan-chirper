import { createFileRoute, redirect } from '@tanstack/react-router'
import { useState } from 'react'
import { ChirpForm, ChirpCard, ProfileCard, LoadingSpinner } from '../components'
import { useAuth, useRequireAuth } from '../hooks/useAuth'
import { useChirps } from '../hooks/useChirps'
import { cn } from '../lib/utils'

// Home page route - Main feed with authentication required
export const Route = createFileRoute('/')({
  component: HomePage,
  beforeLoad: () => {
    // Redirect to login if not authenticated
    if (typeof window !== 'undefined' && !localStorage.getItem('access_token')) {
      throw redirect({ to: '/login' })
    }
  },
})

function HomePage() {
  const { isAuthenticated, isLoading: authLoading } = useRequireAuth()
  const { data: currentUser } = useAuth()
  const [feedParams, setFeedParams] = useState({ limit: 20, offset: 0 })
  const { data: feedData, isLoading: feedLoading, error } = useChirps(feedParams)

  // Handle infinite scroll (simplified for MVP)
  const handleLoadMore = () => {
    if (feedData?.has_more) {
      setFeedParams((prev: { limit: number; offset: number }) => ({
        ...prev,
        offset: prev.offset + prev.limit
      }))
    }
  }

  // Show loading spinner while authentication is being checked
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  // Redirect to login if not authenticated (handled by beforeLoad, but backup)
  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Profile Card (hidden on mobile) */}
        <div className="hidden lg:block">
          {currentUser && (
            <div className="sticky top-6">
              <ProfileCard 
                profile={currentUser} 
                showFollowButton={false}
                className="mb-6"
              />
              
              {/* Quick Stats */}
              {/*<div className="bg-white rounded-lg border p-4">*/}
              {/*  <h3 className="font-semibold text-gray-900 mb-3">Quick Stats</h3>*/}
              {/*  <div className="space-y-2 text-sm">*/}
              {/*    <div className="flex justify-between">*/}
              {/*      <span className="text-gray-600">Your Chirps</span>*/}
              {/*      <span className="font-medium">{feedData?.total || 0}</span>*/}
              {/*    </div>*/}
              {/*    <div className="flex justify-between opacity-50">*/}
              {/*      <span className="text-gray-600">Following</span>*/}
              {/*      <span className="font-medium">0</span>*/}
              {/*    </div>*/}
              {/*    <div className="flex justify-between opacity-50">*/}
              {/*      <span className="text-gray-600">Followers</span>*/}
              {/*      <span className="font-medium">0</span>*/}
              {/*    </div>*/}
              {/*  </div>*/}
              {/*</div>*/}
            </div>
          )}
        </div>

        {/* Main Column - Chirp Form and Feed */}
        <div className="lg:col-span-2">
          {/* Page Header */}
          {/*<div className="mb-6">*/}
          {/*  <h1 className="text-2xl font-bold text-gray-900 mb-2">Home</h1>*/}
          {/*  <p className="text-gray-600">*/}
          {/*    Welcome back, {currentUser?.display_name}! What's on your mind?*/}
          {/*  </p>*/}
          {/*</div>*/}

          {/* Chirp Form */}
          <div className="mb-6">
            <ChirpForm 
              placeholder="What's happening in your world? Share it in 141 characters..."
              className="shadow-sm"
            />
          </div>

          {/* Feed Loading State */}
          {feedLoading && !feedData && (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          )}

          {/* Feed Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
              <div className="text-red-600 mb-2">
                <svg className="h-8 w-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-red-900 mb-1">Failed to load feed</h3>
              <p className="text-red-700 mb-4">There was an error loading the chirps feed.</p>
              <button 
                onClick={() => window.location.reload()} 
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Feed Content */}
          {feedData && (
            <>
              {/* Empty State */}
              {feedData.chirps.length === 0 ? (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
                  <div className="text-gray-400 mb-4">
                    <svg className="h-12 w-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m0 0V1a1 1 0 011-1h2a1 1 0 011 1v3M7 4H5a1 1 0 00-1 1v3m0 0v11a1 1 0 001 1h14a1 1 0 001-1V8m0 0V5a1 1 0 00-1-1h-2M7 4h10" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No chirps yet</h3>
                  <p className="text-gray-600 mb-4">
                    Be the first to share something! Create your first chirp above.
                  </p>
                </div>
              ) : (
                <>
                  {/* Feed Header */}
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-gray-900">
                      Recent Chirps
                    </h2>
                    <div className="text-sm text-gray-500">
                      {feedData.total} {feedData.total === 1 ? 'chirp' : 'chirps'}
                    </div>
                  </div>

                  {/* Chirps List */}
                  <div className="space-y-4">
                    {feedData.chirps.map((chirp) => (
                      <ChirpCard 
                        key={chirp.id} 
                        chirp={chirp}
                        className="shadow-sm hover:shadow-md transition-shadow"
                      />
                    ))}
                  </div>

                  {/* Load More Button */}
                  {feedData.has_more && (
                    <div className="mt-8 text-center">
                      <button
                        onClick={handleLoadMore}
                        disabled={feedLoading}
                        className={cn(
                          "bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors",
                          "disabled:opacity-50 disabled:cursor-not-allowed",
                          "flex items-center justify-center mx-auto space-x-2"
                        )}
                      >
                        {feedLoading ? (
                          <>
                            <LoadingSpinner size="sm" />
                            <span>Loading...</span>
                          </>
                        ) : (
                          <span>Load More Chirps</span>
                        )}
                      </button>
                    </div>
                  )}

                  {/* End of Feed Message */}
                  {!feedData.has_more && feedData.chirps.length > 0 && (
                    <div className="mt-8 text-center py-6 border-t border-gray-200">
                      <p className="text-gray-500 text-sm">
                        You've reached the end of the feed! 🎉
                      </p>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}