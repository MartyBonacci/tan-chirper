import { useForm } from '@tanstack/react-form';
import { zodValidator } from '@tanstack/zod-form-adapter';
import { Card, CardContent, CardHeader } from './Card';
import { Button } from './Button';
import { Input } from './Input';
import { Textarea } from './Textarea';
import { useRegister } from '../hooks/useAuth';
import { RegisterSchema } from '../../shared/schemas/auth';
import type { Register } from '../../shared/schemas/auth';
import { cn } from '../lib/utils';

export interface RegisterFormProps {
  title?: string;
  subtitle?: string;
  onSuccess?: () => void;
  className?: string;
}

const RegisterForm = ({ 
  title = 'Create your account',
  subtitle = 'Join the conversation! Sign up to start chirping.',
  onSuccess,
  className 
}: RegisterFormProps) => {
  const register = useRegister();

  const form = useForm({
    defaultValues: {
      username: '',
      display_name: '',
      email: '',
      password: '',
      bio: '',
    } as Register,
    validatorAdapter: zodValidator(),
    validators: {
      onChange: RegisterSchema,
    },
    onSubmit: async ({ value }) => {
      try {
        await register.mutateAsync(value);
        onSuccess?.();
      } catch (error) {
        console.error('Registration failed:', error);
      }
    },
  });

  const usernameField = form.useField({
    name: 'username',
    validators: {
      onChange: RegisterSchema.shape.username,
    },
  });

  const displayNameField = form.useField({
    name: 'display_name',
    validators: {
      onChange: RegisterSchema.shape.display_name,
    },
  });

  const emailField = form.useField({
    name: 'email',
    validators: {
      onChange: RegisterSchema.shape.email,
    },
  });

  const passwordField = form.useField({
    name: 'password',
    validators: {
      onChange: RegisterSchema.shape.password,
    },
  });

  const bioField = form.useField({
    name: 'bio',
    validators: {
      onChange: RegisterSchema.shape.bio,
    },
  });

  const isSubmitting = register.isPending;
  const hasFormErrors = form.state.errors.length > 0;
  const hasFieldErrors = [usernameField, displayNameField, emailField, passwordField, bioField]
    .some(field => field.state.meta.errors.length > 0);

  return (
    <Card className={cn('w-full max-w-lg mx-auto', className)}>
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
          {register.error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
              <div className="flex">
                <svg className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  {register.error instanceof Error 
                    ? register.error.message 
                    : 'An error occurred during registration. Please try again.'
                  }
                </div>
              </div>
            </div>
          )}

          {/* Username Field */}
          <Input
            type="text"
            label="Username"
            name={usernameField.name}
            value={usernameField.state.value}
            onChange={(e) => usernameField.handleChange(e.target.value)}
            onBlur={usernameField.handleBlur}
            placeholder="Enter a unique username"
            helperText="Only letters, numbers, and underscores allowed (3-50 characters)"
            error={
              usernameField.state.meta.errors.length > 0 
                ? String(usernameField.state.meta.errors[0]) 
                : undefined
            }
            disabled={isSubmitting}
            autoComplete="username"
            required
          />

          {/* Display Name Field */}
          <Input
            type="text"
            label="Display Name"
            name={displayNameField.name}
            value={displayNameField.state.value}
            onChange={(e) => displayNameField.handleChange(e.target.value)}
            onBlur={displayNameField.handleBlur}
            placeholder="Your display name"
            helperText="This is how your name will appear to others"
            error={
              displayNameField.state.meta.errors.length > 0 
                ? String(displayNameField.state.meta.errors[0]) 
                : undefined
            }
            disabled={isSubmitting}
            autoComplete="name"
            required
          />

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
            placeholder="Create a strong password"
            helperText="Must be at least 8 characters long"
            error={
              passwordField.state.meta.errors.length > 0 
                ? String(passwordField.state.meta.errors[0]) 
                : undefined
            }
            disabled={isSubmitting}
            autoComplete="new-password"
            required
          />

          {/* Bio Field */}
          <Textarea
            label="Bio (Optional)"
            name={bioField.name}
            value={bioField.state.value}
            onChange={(e) => bioField.handleChange(e.target.value)}
            onBlur={bioField.handleBlur}
            placeholder="Tell us a little about yourself..."
            helperText="Share a brief description about yourself (max 500 characters)"
            maxLength={500}
            showCharCount={true}
            rows={3}
            error={
              bioField.state.meta.errors.length > 0 
                ? String(bioField.state.meta.errors[0]) 
                : undefined
            }
            disabled={isSubmitting}
          />

          {/* Terms and Privacy */}
          <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded-md">
            By creating an account, you agree to our{' '}
            <button
              type="button"
              className="text-blue-600 hover:text-blue-500 underline"
              onClick={() => console.log('Terms of Service coming soon')}
            >
              Terms of Service
            </button>
            {' '}and{' '}
            <button
              type="button"
              className="text-blue-600 hover:text-blue-500 underline"
              onClick={() => console.log('Privacy Policy coming soon')}
            >
              Privacy Policy
            </button>
            .
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting || hasFormErrors || hasFieldErrors}
            loading={isSubmitting}
          >
            Create Account
          </Button>

          {/* Sign in link */}
          <div className="text-center text-sm text-gray-600">
            Already have an account?{' '}
            <button
              type="button"
              className="text-blue-600 hover:text-blue-500 font-medium"
              disabled={isSubmitting}
              onClick={() => console.log('Navigation to login page coming soon')}
            >
              Sign in
            </button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export { RegisterForm };