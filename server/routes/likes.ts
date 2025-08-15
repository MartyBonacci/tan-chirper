import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, optionalAuth, AuthenticatedRequest } from '../middleware/auth.js';
import { validateBody, validateParams, validateQuery, ValidatedRequest } from '../middleware/validation.js';
import { CreateLikeSchema, DeleteLikeSchema, type CreateLike, type DeleteLike } from '../../shared/schemas/like.js';
import {
  toggleLike,
  getLikeStats,
  getLikesByChirpId,
  getLikesByProfileId
} from '../db/queries/likes.js';

const router = Router();

// Schema for chirp ID parameter
const ChirpIdSchema = z.object({
  chirpId: z.string().uuid('Invalid chirp ID')
});

// Schema for profile ID parameter
const ProfileIdSchema = z.object({
  profileId: z.string().uuid('Invalid profile ID')
});

// Schema for pagination query parameters
const PaginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0)
});

// POST /api/likes - Toggle like on a chirp (authenticated)
router.post('/', requireAuth, validateBody(CreateLikeSchema), async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  const validatedReq = req as ValidatedRequest<CreateLike>;
  try {
    const result = await toggleLike(authReq.user.profileId, validatedReq.validatedData.chirp_id);
    
    const action = result.is_liked ? 'liked' : 'unliked';
    
    res.json({
      message: `Chirp ${action} successfully`,
      like_count: result.like_count,
      is_liked: result.is_liked
    });
    
  } catch (error) {
    console.error('Toggle like error:', error);
    res.status(500).json({
      error: 'Failed to toggle like',
      message: 'Unable to like/unlike chirp at this time'
    });
  }
});

// DELETE /api/likes - Unlike a chirp (authenticated) - Alternative endpoint
router.delete('/', requireAuth, validateBody(DeleteLikeSchema), async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  const validatedReq = req as ValidatedRequest<DeleteLike>;
  try {
    const result = await toggleLike(authReq.user.profileId, validatedReq.validatedData.chirp_id);
    
    res.json({
      message: 'Like removed successfully',
      like_count: result.like_count,
      is_liked: result.is_liked
    });
    
  } catch (error) {
    console.error('Remove like error:', error);
    res.status(500).json({
      error: 'Failed to remove like',
      message: 'Unable to unlike chirp at this time'
    });
  }
});

// GET /api/likes/chirp/:chirpId - Get like stats for a chirp
router.get('/chirp/:chirpId', optionalAuth, validateParams(ChirpIdSchema), async (req, res) => {
  try {
    const currentUserId = (req as AuthenticatedRequest).user?.profileId;
    const stats = await getLikeStats(req.params.chirpId, currentUserId);
    
    res.json({
      chirp_id: stats.chirp_id,
      like_count: stats.like_count,
      is_liked: stats.is_liked
    });
    
  } catch (error) {
    console.error('Get like stats error:', error);
    res.status(500).json({
      error: 'Failed to get like stats',
      message: 'Unable to retrieve like information at this time'
    });
  }
});

// GET /api/likes/chirp/:chirpId/users - Get list of users who liked a chirp
router.get('/chirp/:chirpId/users', validateParams(ChirpIdSchema), validateQuery(PaginationSchema), async (req, res) => {
  const validatedReq = req as ValidatedRequest<{limit: number, offset: number}>;
  try {
    const { limit, offset } = validatedReq.validatedData;
    const likes = await getLikesByChirpId(req.params.chirpId, limit, offset);
    
    res.json({
      likes,
      pagination: {
        limit,
        offset,
        count: likes.length
      }
    });
    
  } catch (error) {
    console.error('Get likes by chirp error:', error);
    res.status(500).json({
      error: 'Failed to get likes',
      message: 'Unable to retrieve likes at this time'
    });
  }
});

// GET /api/likes/profile/:profileId - Get chirps liked by a profile
router.get('/profile/:profileId', validateParams(ProfileIdSchema), validateQuery(PaginationSchema), async (req, res) => {
  const validatedReq = req as ValidatedRequest<{limit: number, offset: number}>;
  try {
    const { limit, offset } = validatedReq.validatedData;
    const likes = await getLikesByProfileId(req.params.profileId, limit, offset);
    
    res.json({
      likes,
      pagination: {
        limit,
        offset,
        count: likes.length
      }
    });
    
  } catch (error) {
    console.error('Get likes by profile error:', error);
    res.status(500).json({
      error: 'Failed to get likes',
      message: 'Unable to retrieve likes at this time'
    });
  }
});

export default router;