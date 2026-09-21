import { Request, Response, NextFunction } from 'express';
import { adminAuth } from '../lib/firebase-admin.ts';
import { DecodedIdToken } from 'firebase-admin/auth';

export interface AuthRequest extends Request {
  user?: DecodedIdToken;
}

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing token' });
  }

  const token = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Error verifying Firebase ID token:', error);
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};

export const requireAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const user = req.user;
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized: Missing authenticated user' });
  }

  // Token email must be verified
  if (!user.email_verified) {
    return res.status(403).json({ error: 'Forbidden: Email must be verified' });
  }

  const userEmail = (user.email || '').trim().toLowerCase();
  const adminEmailsEnv = process.env.ADMIN_EMAILS || '';
  const allowedAdmins = adminEmailsEnv
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(e => e.length > 0);

  if (!userEmail || !allowedAdmins.includes(userEmail)) {
    return res.status(403).json({ error: 'Forbidden: Access denied. User is not an authorized administrator.' });
  }

  next();
};

