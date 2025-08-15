import { createFileRoute, redirect } from '@tanstack/react-router'
import { LoginForm } from '../components'

// Login page route
export const Route = createFileRoute('/login')({
  component: LoginPage,
  beforeLoad: () => {
    // Redirect to home if already authenticated
    // Note: This is a simple check, in a real app you might want to verify the token
    if (typeof window !== 'undefined' && localStorage.getItem('access_token')) {
      throw redirect({ to: '/' })
    }
  },
})

function LoginPage() {
  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Welcome back</h1>
          <p className="mt-2 text-gray-600">
            Sign in to your tan-chirper account
          </p>
        </div>
        
        <div className="bg-white py-8 px-6 shadow-sm rounded-lg border">
          <LoginForm />
        </div>
        
        <div className="text-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{' '}
            <a
              href="/register"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Sign up here
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}