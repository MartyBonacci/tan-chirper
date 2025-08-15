import { Router } from 'express';
import { z } from 'zod';
import { requireAuth, optionalAuth, AuthenticatedRequest } from '../middleware/auth.js';
import { validateBody, validateParams, validateQuery, ValidatedRequest } from '../middleware/validation.js';
import { CreateChirpSchema, UpdateChirpSchema, type CreateChirp, type UpdateChirp } from '../../shared/schemas/chirp.js';
import {
  createChirp,
  getChirpWithProfile,
  getFeedChirps,
  getChirpsByProfileId,
  updateChirp,
  deleteChirp
} from '../db/queries/chirps.js';
import { getLikeStats } from '../db/queries/likes.js';

const router = Router();

// Schema for chirp ID parameter
const ChirpIdSchema = z.object({
  id: z.string().uuid('Invalid chirp ID')
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

// POST /api/chirps - Create new chirp (authenticated)
router.post('/', requireAuth, validateBody(CreateChirpSchema), async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  const validatedReq = req as ValidatedRequest<CreateChirp>;
  try {
    const chirp = await createChirp(authReq.user.profileId, validatedReq.validatedData);
    
    // Get the full chirp with profile data
    const fullChirp = await getChirpWithProfile(chirp.id, authReq.user.profileId);
    
    res.status(201).json({
      message: 'Chirp created successfully',
      chirp: fullChirp
    });
    
  } catch (error) {
    console.error('Create chirp error:', error);
    res.status(500).json({
      error: 'Failed to create chirp',
      message: 'Unable to create chirp at this time'
    });
  }
});

// GET /api/chirps - Get feed of recent chirps (public, but shows like status if authenticated)
router.get('/', optionalAuth, validateQuery(PaginationSchema), async (req, res) => {
  const validatedReq = req as ValidatedRequest<{limit: number, offset: number}>;
  try {
    const currentUserId = (req as AuthenticatedRequest).user?.profileId;
    const { limit, offset } = validatedReq.validatedData;
    
    const chirps = await getFeedChirps(currentUserId, limit, offset);
    
    res.json({
      chirps,
      pagination: {
        limit,
        offset,
        count: chirps.length
      }
    });
    
  } catch (error) {
    console.error('Get chirps feed error:', error);
    res.status(500).json({
      error: 'Failed to get chirps',
      message: 'Unable to retrieve chirps at this time'
    });
  }
});

// GET /api/chirps/:id - Get specific chirp with profile and like data
router.get('/:id', optionalAuth, validateParams(ChirpIdSchema), async (req, res) => {
  try {
    const currentUserId = (req as AuthenticatedRequest).user?.profileId;
    const chirp = await getChirpWithProfile(req.params.id, currentUserId);
    
    if (!chirp) {
      return res.status(404).json({
        error: 'Chirp not found',
        message: 'The requested chirp does not exist'
      });
    }
    
    res.json({ chirp });
    
  } catch (error) {
    console.error('Get chirp error:', error);
    res.status(500).json({
      error: 'Failed to get chirp',
      message: 'Unable to retrieve chirp at this time'
    });
  }
});

// PUT /api/chirps/:id - Update chirp (authenticated, owner only)
router.put('/:id', requireAuth, validateParams(ChirpIdSchema), validateBody(UpdateChirpSchema), async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  const validatedReq = req as ValidatedRequest<UpdateChirp>;
  try {
    const updatedChirp = await updateChirp(req.params.id, authReq.user.profileId, validatedReq.validatedData);
    
    if (!updatedChirp) {
      return res.status(404).json({
        error: 'Chirp not found',
        message: 'The chirp does not exist or you do not have permission to edit it'
      });
    }
    
    // Get the full chirp with profile data
    const fullChirp = await getChirpWithProfile(updatedChirp.id, authReq.user.profileId);
    
    res.json({
      message: 'Chirp updated successfully',
      chirp: fullChirp
    });
    
  } catch (error) {
    console.error('Update chirp error:', error);
    res.status(500).json({
      error: 'Failed to update chirp',
      message: 'Unable to update chirp at this time'
    });
  }
});

// DELETE /api/chirps/:id - Delete chirp (authenticated, owner only)
router.delete('/:id', requireAuth, validateParams(ChirpIdSchema), async (req, res) => {
  const authReq = req as AuthenticatedRequest;
  try {
    const deleted = await deleteChirp(req.params.id, authReq.user.profileId);
    
    if (!deleted) {
      return res.status(404).json({
        error: 'Chirp not found',
        message: 'The chirp does not exist or you do not have permission to delete it'
      });
    }
    
    res.json({
      message: 'Chirp deleted successfully'
    });
    
  } catch (error) {
    console.error('Delete chirp error:', error);
    res.status(500).json({
      error: 'Failed to delete chirp',
      message: 'Unable to delete chirp at this time'
    });
  }
});

// GET /api/chirps/profile/:profileId - Get chirps by profile ID
router.get('/profile/:profileId', optionalAuth, validateParams(ProfileIdSchema), validateQuery(PaginationSchema), async (req, res) => {
  const validatedReq = req as ValidatedRequest<{limit: number, offset: number}>;
  try {
    const { limit, offset } = validatedReq.validatedData;
    const chirps = await getChirpsByProfileId(req.params.profileId, limit, offset);
    
    res.json({
      chirps,
      pagination: {
        limit,
        offset,
        count: chirps.length
      }
    });
    
  } catch (error) {
    console.error('Get chirps by profile error:', error);
    res.status(500).json({
      error: 'Failed to get chirps',
      message: 'Unable to retrieve chirps at this time'
    });
  }
});

// GET /api/chirps/:id/likes - Get like stats for a specific chirp
router.get('/:id/likes', optionalAuth, validateParams(ChirpIdSchema), async (req, res) => {
  try {
    const currentUserId = (req as AuthenticatedRequest).user?.profileId;
    const stats = await getLikeStats(req.params.id, currentUserId);
    
    res.json({
      chirp_id: stats.chirp_id,
      like_count: stats.like_count,
      is_liked: stats.is_liked
    });
    
  } catch (error) {
    console.error('Get chirp like stats error:', error);
    res.status(500).json({
      error: 'Failed to get like stats',
      message: 'Unable to retrieve like information at this time'
    });
  }
});

export default router;