import { Request, Response, NextFunction } from 'express';
import { AuthService, TokenPayload } from '../lib/auth.js';

export interface AuthenticatedRequest extends Request {
  user: TokenPayload;
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = AuthService.extractTokenFromHeader(authHeader);
  
  if (!token) {
    return res.status(401).json({
      error: 'Authentication required',
      message: 'No token provided'
    });
  }
  
  const payload = AuthService.verifyAccessToken(token);
  
  if (!payload) {
    return res.status(401).json({
      error: 'Invalid token',
      message: 'Token is invalid or expired'
    });
  }
  
  (req as AuthenticatedRequest).user = payload;
  next();
}

export function optionalAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = AuthService.extractTokenFromHeader(authHeader);
  
  if (token) {
    const payload = AuthService.verifyAccessToken(token);
    if (payload) {
      (req as AuthenticatedRequest).user = payload;
    }
  }
  
  next();
}