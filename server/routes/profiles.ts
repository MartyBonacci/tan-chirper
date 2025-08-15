import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';
import { validateBody, validateParams, ValidatedRequest } from '../middleware/validation.js';
import { UpdateProfileSchema, type UpdateProfile } from '../../shared/schemas/profile.js';
import {
  getPublicProfileById,
  getPublicProfileByUsername,
  getProfileById,
  updateProfile
} from '../db/queries/profiles.js';

const router = Router();

// Schema for profile ID parameter
const ProfileIdSchema = z.object({
  id: z.string().uuid('Invalid profile ID')
});

// Schema for username parameter
const UsernameSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters')
});

// GET /api/profiles/me - Get current user's profile (authenticated)
router.get('/me', requireAuth, async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  try {
    const profile = await getProfileById(authReq.user.profileId);
    
    if (!profile) {
      return res.status(404).json({
        error: 'Profile not found',
        message: 'Your profile could not be found'
      });
    }
    
    res.json({
      profile: {
        id: profile.id,
        username: profile.username,
        display_name: profile.display_name,
        bio: profile.bio,
        avatar_url: profile.avatar_url,
        email: profile.email,
        created_at: profile.created_at,
        updated_at: profile.updated_at
      }
    });
    
  } catch (error) {
    console.error('Get current profile error:', error);
    res.status(500).json({
      error: 'Failed to get profile',
      message: 'Unable to retrieve profile at this time'
    });
  }
});

// PUT /api/profiles/me - Update current user's profile (authenticated)
router.put('/me', requireAuth, validateBody(UpdateProfileSchema), async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  const validatedReq = req as ValidatedRequest<UpdateProfile>;
  try {
    const updatedProfile = await updateProfile(authReq.user.profileId, validatedReq.validatedData);
    
    if (!updatedProfile) {
      return res.status(404).json({
        error: 'Profile not found',
        message: 'Your profile could not be found'
      });
    }
    
    res.json({
      message: 'Profile updated successfully',
      profile: {
        id: updatedProfile.id,
        username: updatedProfile.username,
        display_name: updatedProfile.display_name,
        bio: updatedProfile.bio,
        avatar_url: updatedProfile.avatar_url,
        email: updatedProfile.email,
        created_at: updatedProfile.created_at,
        updated_at: updatedProfile.updated_at
      }
    });
    
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      error: 'Failed to update profile',
      message: 'Unable to update profile at this time'
    });
  }
});

// GET /api/profiles/:id - Get public profile by ID
router.get('/:id', validateParams(ProfileIdSchema), async (req, res) => {
  try {
    const profile = await getPublicProfileById(req.params.id);
    
    if (!profile) {
      return res.status(404).json({
        error: 'Profile not found',
        message: 'The requested profile does not exist'
      });
    }
    
    res.json({
      profile: {
        id: profile.id,
        username: profile.username,
        display_name: profile.display_name,
        bio: profile.bio,
        avatar_url: profile.avatar_url,
        created_at: profile.created_at,
        updated_at: profile.updated_at
      }
    });
    
  } catch (error) {
    console.error('Get profile by ID error:', error);
    res.status(500).json({
      error: 'Failed to get profile',
      message: 'Unable to retrieve profile at this time'
    });
  }
});

// GET /api/profiles/username/:username - Get public profile by username
router.get('/username/:username', validateParams(UsernameSchema), async (req, res) => {
  try {
    const profile = await getPublicProfileByUsername(req.params.username);
    
    if (!profile) {
      return res.status(404).json({
        error: 'Profile not found',
        message: 'The requested profile does not exist'
      });
    }
    
    res.json({
      profile: {
        id: profile.id,
        username: profile.username,
        display_name: profile.display_name,
        bio: profile.bio,
        avatar_url: profile.avatar_url,
        created_at: profile.created_at,
        updated_at: profile.updated_at
      }
    });
    
  } catch (error) {
    console.error('Get profile by username error:', error);
    res.status(500).json({
      error: 'Failed to get profile',
      message: 'Unable to retrieve profile at this time'
    });
  }
});

export default router;