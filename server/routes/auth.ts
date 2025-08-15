import { Router } from 'express';
import { AuthService } from '../lib/auth.js';
import { validateBody, ValidatedRequest } from '../middleware/validation.js';
import { LoginSchema, RegisterSchema, RefreshTokenSchema, type Login, type Register, type RefreshToken } from '../../shared/schemas/auth.js';
import {
  createProfile,
  getProfileByEmail,
  getProfileById,
  checkUsernameExists,
  checkEmailExists
} from '../db/queries/profiles.js';

const router = Router();

// POST /api/auth/register
router.post('/register', validateBody(RegisterSchema), async (req, res) => {
  const validatedReq = req as ValidatedRequest<Register>;
  try {
    const { username, display_name, email, password, bio } = validatedReq.validatedData;
    
    // Check if username or email already exists
    const [usernameExists, emailExists] = await Promise.all([
      checkUsernameExists(username),
      checkEmailExists(email)
    ]);
    
    if (usernameExists) {
      return res.status(409).json({
        error: 'Username already exists',
        message: 'This username is already taken'
      });
    }
    
    if (emailExists) {
      return res.status(409).json({
        error: 'Email already exists', 
        message: 'An account with this email already exists'
      });
    }
    
    // Hash password
    const passwordHash = await AuthService.hashPassword(password);
    
    // Create profile
    const profile = await createProfile({
      username,
      display_name,
      email,
      bio,
      avatar_url: '',
      password: password, // This will be ignored by createProfile, but needed for type compatibility
      password_hash: passwordHash
    });
    
    // Generate tokens
    const accessToken = AuthService.generateAccessToken({
      profileId: profile.id,
      username: profile.username,
      email: profile.email
    });
    
    const refreshToken = AuthService.generateRefreshToken({
      profileId: profile.id
    });
    
    res.status(201).json({
      message: 'Account created successfully',
      access_token: accessToken,
      refresh_token: refreshToken,
      profile: {
        id: profile.id,
        username: profile.username,
        display_name: profile.display_name,
        bio: profile.bio,
        avatar_url: profile.avatar_url,
        email: profile.email
      }
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      error: 'Registration failed',
      message: 'Unable to create account at this time'
    });
  }
});

// POST /api/auth/login
router.post('/login', validateBody(LoginSchema), async (req, res) => {
  const validatedReq = req as ValidatedRequest<Login>;
  try {
    const { email, password } = validatedReq.validatedData;
    
    // Find user by email
    const profile = await getProfileByEmail(email);
    
    if (!profile) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Email or password is incorrect'
      });
    }
    
    // Verify password
    const isValidPassword = await AuthService.verifyPassword(profile.password_hash, password);
    
    if (!isValidPassword) {
      return res.status(401).json({
        error: 'Invalid credentials',
        message: 'Email or password is incorrect'
      });
    }
    
    // Generate tokens
    const accessToken = AuthService.generateAccessToken({
      profileId: profile.id,
      username: profile.username,
      email: profile.email
    });
    
    const refreshToken = AuthService.generateRefreshToken({
      profileId: profile.id
    });
    
    res.json({
      message: 'Login successful',
      access_token: accessToken,
      refresh_token: refreshToken,
      profile: {
        id: profile.id,
        username: profile.username,
        display_name: profile.display_name,
        bio: profile.bio,
        avatar_url: profile.avatar_url,
        email: profile.email
      }
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Login failed',
      message: 'Unable to log in at this time'
    });
  }
});

// POST /api/auth/refresh
router.post('/refresh', validateBody(RefreshTokenSchema), async (req, res) => {
  const validatedReq = req as ValidatedRequest<RefreshToken>;
  try {
    const { refresh_token } = validatedReq.validatedData;
    
    // Verify refresh token
    const refreshPayload = AuthService.verifyRefreshToken(refresh_token);
    
    if (!refreshPayload) {
      return res.status(401).json({
        error: 'Invalid refresh token',
        message: 'Refresh token is invalid or expired'
      });
    }
    
    // Get profile data
    const profile = await getProfileById(refreshPayload.profileId);
    
    if (!profile) {
      return res.status(401).json({
        error: 'Profile not found',
        message: 'Associated profile no longer exists'
      });
    }
    
    // Generate new access token
    const accessToken = AuthService.generateAccessToken({
      profileId: profile.id,
      username: profile.username,
      email: profile.email
    });
    
    res.json({
      message: 'Token refreshed successfully',
      access_token: accessToken
    });
    
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({
      error: 'Token refresh failed',
      message: 'Unable to refresh token at this time'
    });
  }
});

export default router;