import { useForm } from '@tanstack/react-form';
import { zodValidator } from '@tanstack/zod-form-adapter';
import { Card, CardContent, CardHeader } from './Card';
import { Button } from './Button';
import { Textarea } from './Textarea';
import { useCreateChirp } from '../hooks/useChirps';
import { useAuth } from '../hooks/useAuth';
import { CreateChirpSchema } from '../../shared/schemas/chirp';
import type { CreateChirp } from '../../shared/schemas/chirp';

export interface ChirpFormProps {
  placeholder?: string;
  onSuccess?: () => void;
  className?: string;
}

const ChirpForm = ({ 
  placeholder = "What's happening?", 
  onSuccess,
  className 
}: ChirpFormProps) => {
  const { data: currentUser } = useAuth();
  const createChirp = useCreateChirp();

  const form = useForm({
    defaultValues: {
      content: '',
    } as CreateChirp,
    validatorAdapter: zodValidator(),
    validators: {
      onChange: CreateChirpSchema,
    },
    onSubmit: async ({ value }) => {
      if (!currentUser) {
        console.error('User must be authenticated to create a chirp');
        return;
      }

      try {
        await createChirp.mutateAsync(value);
        form.reset();
        onSuccess?.();
      } catch (error) {
        console.error('Failed to create chirp:', error);
      }
    },
  });

  const contentField = form.useField({
    name: 'content',
    validators: {
      onChange: CreateChirpSchema.shape.content,
    },
  });

  const isSubmitting = createChirp.isPending;
  const contentLength = contentField.state.value.length;
  const isOverLimit = contentLength > 141;
  const canSubmit = contentLength > 0 && contentLength <= 141 && !isSubmitting;

  if (!currentUser) {
    return (
      <Card className={className}>
        <CardContent className="text-center py-8">
          <p className="text-gray-500">Please log in to create a chirp.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <div className="flex items-start space-x-3">
          {currentUser.avatar_url ? (
            <img
              src={currentUser.avatar_url}
              alt={`${currentUser.display_name}'s avatar`}
              className="h-10 w-10 rounded-full object-cover flex-shrink-0"
            />
          ) : (
            <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
              <span className="text-gray-600 font-medium text-lg">
                {currentUser.display_name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
          <div className="flex-1">
            <p className="text-sm text-gray-600">
              Chirping as <span className="font-medium">{currentUser.display_name}</span>
            </p>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
          className="space-y-4"
        >
          <Textarea
            name={contentField.name}
            value={contentField.state.value}
            onChange={(e) => contentField.handleChange(e.target.value)}
            onBlur={contentField.handleBlur}
            placeholder={placeholder}
            maxLength={141}
            showCharCount={true}
            resize="none"
            rows={3}
            className="text-lg placeholder:text-gray-400 border-none focus-visible:ring-0 p-0 resize-none"
            error={
              contentField.state.meta.errors.length > 0 
                ? String(contentField.state.meta.errors[0]) 
                : undefined
            }
            disabled={isSubmitting}
          />

          <div className="flex items-center justify-between pt-2 border-t border-gray-100">
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <span>
                {contentLength > 0 && (
                  <>
                    <span className={contentLength > 126 ? 'text-yellow-600' : ''}>
                      {contentLength}
                    </span>
                    <span className={isOverLimit ? 'text-red-600' : ''}>/141</span>
                  </>
                )}
              </span>
              {isOverLimit && (
                <span className="text-red-600 text-xs">
                  Character limit exceeded
                </span>
              )}
            </div>

            <Button
              type="submit"
              disabled={!canSubmit}
              loading={isSubmitting}
              size="sm"
              className="px-6"
            >
              Chirp
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export { ChirpForm };