import { Response, NextFunction } from 'express';
import User from '../models/User';
import { AuthRequest } from './auth';
import { isAdminEmail } from '../utils/admin';

/**
 * Requires authenticated user and admin privilege (ADMIN_EMAILS or User.role === admin).
 */
export const requireAdmin = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
        const uid = req.user?.uid;
        const email = req.user?.email;

        if (!uid) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        if (isAdminEmail(email)) {
            next();
            return;
        }

        const user = await User.findOne({ firebaseUid: uid }).lean();
        if (user && user.role === 'admin') {
            next();
            return;
        }

        res.status(403).json({ error: 'Forbidden — admin access required' });
    } catch (e) {
        console.error('requireAdmin error:', e);
        res.status(500).json({ error: 'Authorization check failed' });
    }
};
