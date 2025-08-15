import { createFileRoute, redirect, useRouter, Link } from '@tanstack/react-router'
import { useForm } from '@tanstack/react-form'
import { zodValidator } from '@tanstack/zod-form-adapter'
import { Button, Input, Textarea, Card, CardContent, CardHeader, LoadingSpinner } from '../components'
import { useAuth, useRequireAuth } from '../hooks/useAuth'
import { useUpdateProfile } from '../hooks/useProfiles'
import { UpdateProfileSchema } from '../../shared/schemas/profile'
import type { UpdateProfile } from '../../shared/schemas/profile'
import { useState } from 'react'

// Profile edit page route - authentication required
export const Route = createFileRoute('/profile/edit')({
  component: ProfileEditPage,
  beforeLoad: () => {
    // Redirect to login if not authenticated
    if (typeof window !== 'undefined' && !localStorage.getItem('access_token')) {
      throw redirect({ to: '/login' })
    }
  },
})

function ProfileEditPage() {
  const { isAuthenticated, isLoading: authLoading } = useRequireAuth()
  const { data: currentUser } = useAuth()
  const router = useRouter()
  const updateProfile = useUpdateProfile()
  const [avatarPreview, setAvatarPreview] = useState<string>('')

  // Initialize form with current user data
  const form = useForm({
    defaultValues: {
      username: currentUser?.username || '',
      display_name: currentUser?.display_name || '',
      bio: currentUser?.bio || '',
      avatar_url: currentUser?.avatar_url || '',
    } as UpdateProfile,
    validatorAdapter: zodValidator(),
    validators: {
      onChange: UpdateProfileSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        // Only send fields that have actually changed
        const updates: UpdateProfile = {}
        
        if (value.username !== currentUser?.username) {
          updates.username = value.username
        }
        if (value.display_name !== currentUser?.display_name) {
          updates.display_name = value.display_name
        }
        if (value.bio !== currentUser?.bio) {
          updates.bio = value.bio
        }
        if (value.avatar_url !== currentUser?.avatar_url) {
          updates.avatar_url = value.avatar_url
        }

        // If no changes, just redirect back
        if (Object.keys(updates).length === 0) {
          router.navigate({ to: '/profile/$username', params: { username: currentUser?.username || '' } })
          return
        }

        await updateProfile.mutateAsync(updates)
        
        // Redirect to updated profile page
        const newUsername = updates.username || currentUser?.username
        router.navigate({ to: '/profile/$username', params: { username: newUsername || '' } })
      } catch (error) {
        console.error('Failed to update profile:', error)
      }
    },
  })

  // Handle avatar URL preview
  const handleAvatarUrlChange = (url: string) => {
    setAvatarPreview(url)
    // Validate URL format
    if (url && !url.match(/^https?:\/\/.+/)) {
      setAvatarPreview('')
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
  if (!isAuthenticated || !currentUser) {
    return null
  }

  const isSubmitting = updateProfile.isPending

  return (
    <div className="container mx-auto px-4 py-6 max-w-2xl">
      {/* Page Header */}
      <div className="mb-6">
        <div className="flex items-center space-x-3 mb-4">
          <Link to="/profile/$username" params={{ username: currentUser.username }}>
            <Button
              variant="ghost"
              size="sm"
              className="p-2"
              aria-label="Cancel editing"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Profile</h1>
            <p className="text-gray-600">Update your profile information</p>
          </div>
        </div>
      </div>

      {/* Profile Edit Form */}
      <Card className="shadow-sm">
        <CardHeader>
          <h2 className="text-lg font-semibold text-gray-900">Profile Information</h2>
          <p className="text-sm text-gray-600">
            Make changes to your public profile. Your email address is private and cannot be changed here.
          </p>
        </CardHeader>

        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              e.stopPropagation()
              form.handleSubmit()
            }}
            className="space-y-6"
          >
            {/* Avatar Preview */}
            <div className="flex items-center space-x-6">
              <div className="flex-shrink-0">
                {(avatarPreview || currentUser.avatar_url) ? (
                  <img
                    src={avatarPreview || currentUser.avatar_url}
                    alt="Profile avatar preview"
                    className="h-20 w-20 rounded-full object-cover border-2 border-gray-200"
                    onError={() => setAvatarPreview('')}
                  />
                ) : (
                  <div className="h-20 w-20 rounded-full bg-gray-200 flex items-center justify-center border-2 border-gray-200">
                    <span className="text-gray-600 font-bold text-2xl">
                      {currentUser.display_name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-gray-900 mb-1">Profile Picture</h3>
                <p className="text-xs text-gray-500 mb-2">
                  Enter a URL for your avatar image. Must be a valid HTTP/HTTPS URL.
                </p>
              </div>
            </div>

            {/* Avatar URL Field */}
            <form.Field name="avatar_url">
              {(field) => (
                <div>
                  <label htmlFor={field.name} className="block text-sm font-medium text-gray-700 mb-1">
                    Avatar URL
                  </label>
                  <Input
                    id={field.name}
                    name={field.name}
                    type="url"
                    value={field.state.value}
                    onChange={(e) => {
                      field.handleChange(e.target.value)
                      handleAvatarUrlChange(e.target.value)
                    }}
                    onBlur={field.handleBlur}
                    placeholder="https://example.com/your-avatar.jpg"
                    error={
                      field.state.meta.errors.length > 0 
                        ? String(field.state.meta.errors[0]) 
                        : undefined
                    }
                    disabled={isSubmitting}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Leave empty to use your initials as avatar
                  </p>
                </div>
              )}
            </form.Field>

            {/* Username Field */}
            <form.Field name="username">
              {(field) => (
                <div>
                  <label htmlFor={field.name} className="block text-sm font-medium text-gray-700 mb-1">
                    Username *
                  </label>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    placeholder="your_username"
                    error={
                      field.state.meta.errors.length > 0 
                        ? String(field.state.meta.errors[0]) 
                        : undefined
                    }
                    disabled={isSubmitting}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Your username is used in your profile URL: tan-chirper.com/profile/@{field.state.value || 'username'}
                  </p>
                </div>
              )}
            </form.Field>

            {/* Display Name Field */}
            <form.Field name="display_name">
              {(field) => (
                <div>
                  <label htmlFor={field.name} className="block text-sm font-medium text-gray-700 mb-1">
                    Display Name *
                  </label>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    placeholder="Your Display Name"
                    error={
                      field.state.meta.errors.length > 0 
                        ? String(field.state.meta.errors[0]) 
                        : undefined
                    }
                    disabled={isSubmitting}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    This is how your name will appear on your profile and chirps
                  </p>
                </div>
              )}
            </form.Field>

            {/* Bio Field */}
            <form.Field name="bio">
              {(field) => (
                <div>
                  <label htmlFor={field.name} className="block text-sm font-medium text-gray-700 mb-1">
                    Bio
                  </label>
                  <Textarea
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    onBlur={field.handleBlur}
                    placeholder="Tell people about yourself..."
                    rows={4}
                    maxLength={500}
                    showCharCount={true}
                    error={
                      field.state.meta.errors.length > 0 
                        ? String(field.state.meta.errors[0]) 
                        : undefined
                    }
                    disabled={isSubmitting}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Brief description for your profile (optional)
                  </p>
                </div>
              )}
            </form.Field>

            {/* Form Actions */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-200">
              <Link to="/profile/$username" params={{ username: currentUser.username }}>
                <Button
                  variant="ghost"
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
              </Link>
              
              <div className="flex items-center space-x-3">
                {/* Show error message if mutation failed */}
                {updateProfile.isError && (
                  <p className="text-sm text-red-600">
                    Failed to update profile. Please try again.
                  </p>
                )}
                
                <Button
                  type="submit"
                  variant="primary"
                  disabled={isSubmitting}
                  loading={isSubmitting}
                  className="px-6"
                >
                  Save Changes
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Account Settings Link */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg border">
        <h3 className="text-sm font-medium text-gray-900 mb-2">Account Settings</h3>
        <p className="text-sm text-gray-600 mb-3">
          Need to change your email or password? Access your account settings.
        </p>
        <Button
          variant="ghost"
          size="sm"
          disabled
          className="text-gray-500"
        >
          <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Account Settings (Coming Soon)
        </Button>
      </div>
    </div>
  )
}