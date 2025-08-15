import { useForm } from '@tanstack/react-form';
import { zodValidator } from '@tanstack/zod-form-adapter';
import { Card, CardContent, CardHeader } from './Card';
import { Button } from './Button';
import { Input } from './Input';
import { useLogin } from '../hooks/useAuth';
import { LoginSchema } from '../../shared/schemas/auth';
import type { Login } from '../../shared/schemas/auth';
import { cn } from '../lib/utils';

export interface LoginFormProps {
  title?: string;
  subtitle?: string;
  onSuccess?: () => void;
  className?: string;
}

const LoginForm = ({ 
  title = 'Sign in to your account',
  subtitle = 'Welcome back! Please enter your details.',
  onSuccess,
  className 
}: LoginFormProps) => {
  const login = useLogin();

  const form = useForm({
    defaultValues: {
      email: '',
      password: '',
    } as Login,
    validatorAdapter: zodValidator(),
    validators: {
      onChange: LoginSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        await login.mutateAsync(value);
        onSuccess?.();
      } catch (error) {
        console.error('Login failed:', error);
      }
    },
  });

  const emailField = form.useField({
    name: 'email',
    validators: {
      onChange: LoginSchema.shape.email,
    },
  });

  const passwordField = form.useField({
    name: 'password',
    validators: {
      onChange: LoginSchema.shape.password,
    },
  });

  const isSubmitting = login.isPending;
  const hasFormErrors = form.state.errors.length > 0;
  const hasFieldErrors = emailField.state.meta.errors.length > 0 || passwordField.state.meta.errors.length > 0;

  return (
    <Card className={cn('w-full max-w-md mx-auto', className)}>
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <div className="h-12 w-12 bg-blue-600 rounded-full flex items-center justify-center">
            <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
        </div>
        <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
        <p className="text-gray-600 mt-2">{subtitle}</p>
      </CardHeader>

      <CardContent>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
          className="space-y-4"
        >
          {/* Display general form errors */}
          {login.error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
              <div className="flex">
                <svg className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  {login.error instanceof Error 
                    ? login.error.message 
                    : 'An error occurred during login. Please try again.'
                  }
                </div>
              </div>
            </div>
          )}

          {/* Email Field */}
          <Input
            type="email"
            label="Email address"
            name={emailField.name}
            value={emailField.state.value}
            onChange={(e) => emailField.handleChange(e.target.value)}
            onBlur={emailField.handleBlur}
            placeholder="Enter your email"
            error={
              emailField.state.meta.errors.length > 0 
                ? String(emailField.state.meta.errors[0]) 
                : undefined
            }
            disabled={isSubmitting}
            autoComplete="email"
            required
          />

          {/* Password Field */}
          <Input
            type="password"
            label="Password"
            name={passwordField.name}
            value={passwordField.state.value}
            onChange={(e) => passwordField.handleChange(e.target.value)}
            onBlur={passwordField.handleBlur}
            placeholder="Enter your password"
            error={
              passwordField.state.meta.errors.length > 0 
                ? String(passwordField.state.meta.errors[0]) 
                : undefined
            }
            disabled={isSubmitting}
            autoComplete="current-password"
            required
          />

          {/* Additional Options */}
          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center">
              <input
                type="checkbox"
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                disabled={isSubmitting}
              />
              <span className="ml-2 text-gray-600">Remember me</span>
            </label>
            <button
              type="button"
              className="text-blue-600 hover:text-blue-500 font-medium"
              disabled={isSubmitting}
              onClick={() => console.log('Forgot password functionality coming soon')}
            >
              Forgot password?
            </button>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting || hasFormErrors || hasFieldErrors}
            loading={isSubmitting}
          >
            Sign in
          </Button>

          {/* Sign up link */}
          <div className="text-center text-sm text-gray-600">
            Don't have an account?{' '}
            <button
              type="button"
              className="text-blue-600 hover:text-blue-500 font-medium"
              disabled={isSubmitting}
              onClick={() => console.log('Navigation to register page coming soon')}
            >
              Sign up
            </button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export { LoginForm };