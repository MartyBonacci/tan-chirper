import { formatDistanceToNow } from 'date-fns';
import { Card, CardContent, CardHeader } from './Card';
import { Button } from './Button';
import { useAuth } from '../hooks/useAuth';
import { useChirpsByProfile } from '../hooks/useChirps';
import type { ProfilePublic } from '../../shared/schemas/profile';
import { cn } from '../lib/utils';

export interface ProfileCardProps {
  profile: ProfilePublic;
  showStats?: boolean;
  showFollowButton?: boolean;
  className?: string;
}

const ProfileCard = ({ 
  profile, 
  showStats = true, 
  showFollowButton = true,
  className 
}: ProfileCardProps) => {
  const { data: currentUser } = useAuth();
  const { data: chirpsData } = useChirpsByProfile(profile.id);
  
  const isOwnProfile = currentUser?.id === profile.id;
  const createdDate = profile.created_at ? new Date(profile.created_at) : null;
  const joinedDate = createdDate && !isNaN(createdDate.getTime()) 
    ? formatDistanceToNow(createdDate, { addSuffix: true })
    : 'Unknown';
  const chirpCount = chirpsData?.total || 0;

  const handleFollowToggle = async () => {
    // Placeholder for future follow functionality
    console.log('Follow/unfollow functionality coming soon');
  };

  const handleEditProfile = () => {
    // Placeholder for profile editing
    console.log('Edit profile functionality coming soon');
  };

  return (
    <Card className={cn('overflow-hidden', className)}>
      {/* Profile Header/Cover */}
      <div className="h-32 bg-gradient-to-r from-blue-400 to-purple-500 relative">
        <div className="absolute -bottom-8 left-6">
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt={`${profile.display_name}'s avatar`}
              className="h-16 w-16 rounded-full border-4 border-white object-cover bg-white"
            />
          ) : (
            <div className="h-16 w-16 rounded-full border-4 border-white bg-gray-200 flex items-center justify-center">
              <span className="text-gray-600 font-bold text-xl">
                {profile.display_name.charAt(0).toUpperCase()}
              </span>
            </div>
          )}
        </div>
      </div>

      <CardHeader className="pt-10 pb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-gray-900 truncate">
              {profile.display_name}
            </h2>
            <p className="text-gray-500 text-sm">
              @{profile.username}
            </p>
          </div>
          
          <div className="flex-shrink-0 ml-4">
            {isOwnProfile ? (
              <Button
                variant="outline"
                size="sm"
                onClick={handleEditProfile}
                className="text-sm"
              >
                Edit Profile
              </Button>
            ) : showFollowButton && currentUser ? (
              <Button
                variant="primary"
                size="sm"
                onClick={handleFollowToggle}
                className="text-sm"
              >
                Follow
              </Button>
            ) : null}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Bio */}
        {profile.bio && (
          <div className="mb-4">
            <p className="text-gray-900 whitespace-pre-wrap break-words leading-relaxed">
              {profile.bio}
            </p>
          </div>
        )}

        {/* Join Date */}
        <div className="flex items-center text-sm text-gray-500 mb-4">
          <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span>Joined {joinedDate}</span>
        </div>

        {/* Stats */}
        {showStats && (
          <div className="flex items-center space-x-6 text-sm">
            <div className="flex items-center">
              <span className="font-bold text-gray-900 mr-1">
                {chirpCount.toLocaleString()}
              </span>
              <span className="text-gray-500">
                {chirpCount === 1 ? 'Chirp' : 'Chirps'}
              </span>
            </div>

            {/* Placeholder for followers/following counts */}
            <div className="flex items-center opacity-50">
              <span className="font-bold text-gray-900 mr-1">0</span>
              <span className="text-gray-500">Following</span>
            </div>

            <div className="flex items-center opacity-50">
              <span className="font-bold text-gray-900 mr-1">0</span>
              <span className="text-gray-500">Followers</span>
            </div>
          </div>
        )}

        {/* Profile Actions Menu (for own profile) */}
        {isOwnProfile && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <div className="flex flex-wrap gap-2 text-sm">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => console.log('View analytics')}
                className="text-gray-600 hover:text-gray-900"
                disabled
              >
                <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Analytics
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => console.log('Account settings')}
                className="text-gray-600 hover:text-gray-900"
                disabled
              >
                <svg className="h-4 w-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Settings
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export { ProfileCard };