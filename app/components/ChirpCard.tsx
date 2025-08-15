import { formatDistanceToNow } from 'date-fns';
import { Card, CardContent, CardFooter, CardHeader } from './Card';
import { Button } from './Button';
import { useDeleteChirp } from '../hooks/useChirps';
import { useLikeChirp, useUnlikeChirp } from '../hooks/useLikes';
import { useAuth } from '../hooks/useAuth';
import type { ChirpFeedItem } from '../../shared/schemas/chirp';
import { cn } from '../lib/utils';

export interface ChirpCardProps {
  chirp: ChirpFeedItem;
  showActions?: boolean;
  className?: string;
}

const ChirpCard = ({ chirp, showActions = true, className }: ChirpCardProps) => {
  const { data: currentUser } = useAuth();
  const deleteChirp = useDeleteChirp();
  const likeChirp = useLikeChirp();
  const unlikeChirp = useUnlikeChirp();

  const isOwnChirp = currentUser?.id === chirp.profile_id;
  const formattedDate = formatDistanceToNow(new Date(chirp.created_at), { addSuffix: true });

  const handleLikeToggle = async () => {
    if (!currentUser) return;

    try {
      if (chirp.is_liked) {
        await unlikeChirp.mutateAsync(chirp.id);
      } else {
        await likeChirp.mutateAsync(chirp.id);
      }
    } catch (error) {
      console.error('Failed to toggle like:', error);
    }
  };

  const handleDelete = async () => {
    if (!isOwnChirp) return;
    
    if (window.confirm('Are you sure you want to delete this chirp?')) {
      try {
        await deleteChirp.mutateAsync(chirp.id);
      } catch (error) {
        console.error('Failed to delete chirp:', error);
      }
    }
  };

  return (
    <Card className={cn('transition-shadow hover:shadow-md', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            {chirp.profile.avatar_url ? (
              <img
                src={chirp.profile.avatar_url}
                alt={`${chirp.profile.display_name}'s avatar`}
                className="h-10 w-10 rounded-full object-cover"
              />
            ) : (
              <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                <span className="text-gray-600 font-medium text-lg">
                  {chirp.profile.display_name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 truncate">
                {chirp.profile.display_name}
              </h3>
              <p className="text-sm text-gray-500 truncate">
                @{chirp.profile.username}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <time dateTime={chirp.created_at.toString()} title={new Date(chirp.created_at).toLocaleString()}>
              {formattedDate}
            </time>
            {isOwnChirp && showActions && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleDelete}
                disabled={deleteChirp.isPending}
                loading={deleteChirp.isPending}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 p-1 h-auto"
                aria-label="Delete chirp"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="py-0">
        <p className="text-gray-900 whitespace-pre-wrap break-words leading-relaxed">
          {chirp.content}
        </p>
      </CardContent>

      {showActions && (
        <CardFooter className="pt-3">
          <div className="flex items-center justify-between w-full">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLikeToggle}
              disabled={!currentUser || likeChirp.isPending || unlikeChirp.isPending}
              className={cn(
                'flex items-center space-x-2 text-gray-500 hover:text-red-500',
                chirp.is_liked && 'text-red-500',
                'transition-colors'
              )}
              aria-label={chirp.is_liked ? 'Unlike chirp' : 'Like chirp'}
            >
              <svg 
                className={cn(
                  'h-5 w-5',
                  chirp.is_liked ? 'fill-current' : 'fill-none'
                )} 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" 
                />
              </svg>
              <span className="text-sm font-medium">
                {chirp.like_count > 0 ? chirp.like_count : ''}
              </span>
            </Button>

            {/* Placeholder for future actions like reply, retweet, share */}
            <div className="flex items-center space-x-2 opacity-50">
              <Button
                variant="ghost"
                size="sm"
                disabled
                className="flex items-center space-x-1 text-gray-400"
                aria-label="Reply (coming soon)"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                disabled
                className="flex items-center space-x-1 text-gray-400"
                aria-label="Share (coming soon)"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                </svg>
              </Button>
            </div>
          </div>
        </CardFooter>
      )}
    </Card>
  );
};

export { ChirpCard };