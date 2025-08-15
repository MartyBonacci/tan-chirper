import { Router } from 'express';
import authRoutes from './auth.js';
import profileRoutes from './profiles.js';
import chirpRoutes from './chirps.js';
import likeRoutes from './likes.js';

const router = Router();

// API routes
router.use('/auth', authRoutes);
router.use('/profiles', profileRoutes);
router.use('/chirps', chirpRoutes);
router.use('/likes', likeRoutes);

export default router;