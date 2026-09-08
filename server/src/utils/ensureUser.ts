import User from '../models/User';
import { isAdminEmail } from './admin';

interface EnsureUserInput {
    firebaseUid: string;
    email?: string;
    displayName?: string;
    picture?: string;
}

const EMAIL_IN_USE_ERROR =
    'This email is already associated with a different account. Please sign in with the original login method or contact support.';

export function normalizeUserEmail(email: string | undefined, firebaseUid: string): string {
    if (!email) {
        return `user_${firebaseUid.slice(0, 8)}@firebase.local`;
    }
    return email.toLowerCase().trim();
}

async function assertEmailAvailable(email: string, firebaseUid: string): Promise<void> {
    const existing = await User.findOne({ email }).select('firebaseUid').lean();
    if (existing?.firebaseUid && existing.firebaseUid !== firebaseUid) {
        throw new Error(EMAIL_IN_USE_ERROR);
    }
}

export async function ensureUserRecord(input: EnsureUserInput) {
    const email = normalizeUserEmail(input.email, input.firebaseUid);
    const shouldBeAdmin = isAdminEmail(email);
    const displayName = input.displayName || email.split('@')[0] || 'User';
    const photoURL = input.picture || '';

    const existingByUid = await User.findOne({ firebaseUid: input.firebaseUid });
    if (existingByUid) {
        existingByUid.displayName = displayName;
        existingByUid.photoURL = photoURL;
        if (shouldBeAdmin) {
            existingByUid.role = 'admin';
        }
        if (existingByUid.email !== email) {
            await assertEmailAvailable(email, input.firebaseUid);
            existingByUid.email = email;
        }
        await existingByUid.save();
        return existingByUid;
    }

    const unlinked = await User.findOne({
        email,
        $or: [
            { firebaseUid: { $exists: false } },
            { firebaseUid: null },
            { firebaseUid: '' },
        ],
    });
    if (unlinked) {
        unlinked.firebaseUid = input.firebaseUid;
        unlinked.displayName = displayName;
        unlinked.photoURL = photoURL;
        if (shouldBeAdmin) {
            unlinked.role = 'admin';
        }
        await unlinked.save();
        return unlinked;
    }

    await assertEmailAvailable(email, input.firebaseUid);

    try {
        return await User.create({
            firebaseUid: input.firebaseUid,
            email,
            displayName,
            photoURL,
            role: shouldBeAdmin ? 'admin' : 'user',
        });
    } catch (dbError: unknown) {
        const err = dbError as { code?: number; keyPattern?: { email?: boolean; firebaseUid?: boolean } };
        if (err.code === 11000) {
            const retry = await User.findOne({ firebaseUid: input.firebaseUid });
            if (retry) {
                return retry;
            }
            if (err.keyPattern?.email) {
                throw new Error(EMAIL_IN_USE_ERROR);
            }
        }
        throw dbError;
    }
}
