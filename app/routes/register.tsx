import { createFileRoute, redirect } from '@tanstack/react-router'
import { RegisterForm } from '../components'

// Register page route
export const Route = createFileRoute('/register')({
  component: RegisterPage,
  beforeLoad: () => {
    // Redirect to home if already authenticated
    if (typeof window !== 'undefined' && localStorage.getItem('access_token')) {
      throw redirect({ to: '/' })
    }
  },
})

function RegisterPage() {
  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Join tan-chirper</h1>
          <p className="mt-2 text-gray-600">
            Create your account and start chirping in 141 characters
          </p>
        </div>
        
        <div className="bg-white py-8 px-6 shadow-sm rounded-lg border">
          <RegisterForm />
        </div>
        
        <div className="text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <a
              href="/login"
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Sign in here
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}