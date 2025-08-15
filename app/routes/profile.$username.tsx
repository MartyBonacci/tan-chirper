import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import { ChirpCard, ProfileCard, LoadingSpinner, Button } from '../components'
import { useAuth } from '../hooks/useAuth'
import { useProfileByUsername } from '../hooks/useProfiles'
import { useChirpsByProfile } from '../hooks/useChirps'
import { useState } from 'react'
import { cn } from '../lib/utils'

// Dynamic profile page route - accessible by username
export const Route = createFileRoute('/profile/$username')({
  component: ProfilePage,
  loader: async ({ params }) => {
    // Pre-validate username parameter
    if (!params.username || params.username.trim() === '') {
      throw new Error('Username is required')
    }
    return { username: params.username }
  },
})

function ProfilePage() {
  const { username } = Route.useParams()
  const router = useRouter()
  const { data: currentUser } = useAuth()
  const [chirpParams, setChirpParams] = useState({ limit: 20, offset: 0 })
  
  // Fetch profile data by username
  const { 
    data: profile, 
    isLoading: profileLoading, 
    error: profileError 
  } = useProfileByUsername(username)
  
  // Fetch user's chirps
  const { 
    data: chirpsData, 
    isLoading: chirpsLoading, 
    error: chirpsError 
  } = useChirpsByProfile(profile?.id || '', chirpParams)

  const isOwnProfile = currentUser?.id === profile?.id
  const hasChirps = chirpsData && chirpsData.chirps.length > 0

  // Handle load more chirps
  const handleLoadMore = () => {
    if (chirpsData?.has_more) {
      setChirpParams(prev => ({
        ...prev,
        offset: prev.offset + prev.limit
      }))
    }
  }

  // Loading state
  if (profileLoading) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="flex items-center justify-center min-h-[50vh]">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    )
  }

  // Profile not found error
  if (profileError || !profile) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
          <div className="text-gray-400 mb-4">
            <svg className="h-16 w-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">User not found</h1>
          <p className="text-gray-600 mb-6">
            The user "@{username}" doesn't exist or may have been deleted.
          </p>
          <div className="space-y-3">
            <Button
              onClick={() => router.history.back()}
              variant="outline"
              className="mr-3"
            >
              Go Back
            </Button>
            <Link to="/">
              <Button variant="primary">
                Go to Home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      {/* Page Header */}
      <div className="mb-6">
        <div className="flex items-center space-x-3 mb-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.history.back()}
            className="p-2"
            aria-label="Go back"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{profile.display_name}</h1>
            <p className="text-gray-600">@{profile.username}</p>
          </div>
        </div>
        
        {/* Profile actions for own profile */}
        {isOwnProfile && (
          <div className="flex items-center space-x-3">
            <Link to="/profile/edit">
              <Button variant="outline" size="sm">
                <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Edit Profile
              </Button>
            </Link>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <div className="sticky top-6">
            <ProfileCard 
              profile={profile}
              showFollowButton={!isOwnProfile}
              className="shadow-sm"
            />
          </div>
        </div>

        {/* Chirps Section */}
        <div className="lg:col-span-2">
          {/* Chirps Header */}
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {isOwnProfile ? 'Your Chirps' : `${profile.display_name}'s Chirps`}
            </h2>
            {chirpsData && (
              <p className="text-gray-600">
                {chirpsData.total} {chirpsData.total === 1 ? 'chirp' : 'chirps'}
              </p>
            )}
          </div>

          {/* Chirps Loading State */}
          {chirpsLoading && !chirpsData && (
            <div className="flex items-center justify-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          )}

          {/* Chirps Error State */}
          {chirpsError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
              <div className="text-red-600 mb-2">
                <svg className="h-8 w-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-red-900 mb-1">Failed to load chirps</h3>
              <p className="text-red-700 mb-4">There was an error loading {isOwnProfile ? 'your' : 'this user\'s'} chirps.</p>
              <button 
                onClick={() => window.location.reload()} 
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          )}

          {/* Chirps Content */}
          {chirpsData && (
            <>
              {/* Empty State */}
              {!hasChirps ? (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
                  <div className="text-gray-400 mb-4">
                    <svg className="h-12 w-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {isOwnProfile ? 'No chirps yet' : 'No chirps to show'}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {isOwnProfile 
                      ? 'Start sharing your thoughts! Create your first chirp.'
                      : `${profile.display_name} hasn't shared any chirps yet.`
                    }
                  </p>
                  {isOwnProfile && (
                    <Link to="/">
                      <Button variant="primary">
                        Create Your First Chirp
                      </Button>
                    </Link>
                  )}
                </div>
              ) : (
                <>
                  {/* Chirps List */}
                  <div className="space-y-4">
                    {chirpsData.chirps.map((chirp) => (
                      <ChirpCard 
                        key={chirp.id} 
                        chirp={chirp}
                        className="shadow-sm hover:shadow-md transition-shadow"
                      />
                    ))}
                  </div>

                  {/* Load More Button */}
                  {chirpsData.has_more && (
                    <div className="mt-8 text-center">
                      <button
                        onClick={handleLoadMore}
                        disabled={chirpsLoading}
                        className={cn(
                          "bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors",
                          "disabled:opacity-50 disabled:cursor-not-allowed",
                          "flex items-center justify-center mx-auto space-x-2"
                        )}
                      >
                        {chirpsLoading ? (
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

                  {/* End of Chirps Message */}
                  {!chirpsData.has_more && hasChirps && (
                    <div className="mt-8 text-center py-6 border-t border-gray-200">
                      <p className="text-gray-500 text-sm">
                        {isOwnProfile 
                          ? "You've reached the end of your chirps! 🎉"
                          : `You've seen all of ${profile.display_name}'s chirps! 🎉`
                        }
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