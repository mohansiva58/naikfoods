import { Request, Response, NextFunction } from 'express';
import { verifyFirebaseToken } from '../config/firebase';
import { cacheGet, cacheSet, CACHE_TTL } from '../utils/cache';
import { ensureUserRecord } from '../utils/ensureUser';

export interface AuthRequest extends Request {
    user?: {
        uid: string;
        email: string;
        displayName?: string;
    };
}

interface UserAuthData {
    _id?: string;
    firebaseUid: string;
    email: string;
    displayName: string;
    role: string;
    picture?: string;
}

export const authenticateUser = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        console.log(`[AuthMiddleware] Entering for ${req.method} ${req.originalUrl}, Authorization header:`, req.headers.authorization ? 'Present' : 'Not present');
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            res.status(401).json({ error: 'Unauthorized - No token provided' });
            return;
        }

        const token = authHeader.split('Bearer ')[1];
        let decodedToken: { uid: string; email?: string; name?: string; picture?: string };

        try {
            decodedToken = await verifyFirebaseToken(token);
        } catch (error) {
            console.warn('Token verification failed:', (error as Error).message);
            res.status(401).json({ error: 'Unauthorized — invalid or expired token' });
            return;
        }

        // ============ AUTH CACHING ============
        const userCacheKey = `auth:user:${decodedToken.uid}`;
        let user = (await cacheGet(userCacheKey)) as UserAuthData | null;

        if (!user) {
            try {
                const upsertedUser = await ensureUserRecord({
                    firebaseUid: decodedToken.uid,
                    email: decodedToken.email,
                    displayName: decodedToken.name,
                    picture: decodedToken.picture,
                });

                if (!upsertedUser) {
                    throw new Error('Failed to create or retrieve user');
                }

                user = upsertedUser.toObject() as unknown as UserAuthData;
                await cacheSet(userCacheKey, user, CACHE_TTL.USER_AUTH);
            } catch (dbError) {
                console.error('Auth middleware database error:', dbError);
                const message = dbError instanceof Error ? dbError.message : '';
                if (message.includes('already associated with a different account')) {
                    res.status(409).json({ error: message });
                    return;
                }
                res.status(503).json({ error: 'Unable to sync user account. Please try again.' });
                return;
            }
        }

        req.user = {
            uid: decodedToken.uid,
            email: decodedToken.email || user?.email || '',
            displayName: decodedToken.name || user?.displayName || '',
        };
        console.log('[AuthMiddleware] req.user successfully set:', req.user);

        next();

    } catch (error) {
        console.error('Authentication error:', error);
        res.status(500).json({ error: 'Internal server error' });
        return;
    }
};

export const optionalAuth = async (
    req: AuthRequest,
    _res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const authHeader = req.headers.authorization;

        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split('Bearer ')[1];

            try {
                const decodedToken = await verifyFirebaseToken(token);
                req.user = {
                    uid: decodedToken.uid,
                    email: decodedToken.email || '',
                    displayName: decodedToken.name,
                };
            } catch (error) {
                console.warn('Invalid token in optional auth:', error);
            }
        }

        next();
    } catch (error) {
        next();
    }
};
