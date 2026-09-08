import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import User from '../models/User';
import { IAddress } from '../models/User';
import { cacheDel } from '../utils/cache';
import { isAdminEmail } from '../utils/admin';
import { ensureUserRecord } from '../utils/ensureUser';
import { sendLoginNotificationEmail } from '../config/email';

const authCacheKey = (uid: string) => `auth:user:${uid}`;
type AddressWithId = IAddress & { _id?: { toString(): string } };

const getAddressId = (address: IAddress) => (address as AddressWithId)._id?.toString();

export const getCurrentUser = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.uid;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        let user = await User.findOne({ firebaseUid: userId });

        if (!user) {
            user = await ensureUserRecord({
                firebaseUid: userId,
                email: req.user?.email,
                displayName: req.user?.displayName,
            });
        }

        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        const currentEmail = req.user?.email || user.email;
        const isAdmin = isAdminEmail(currentEmail) || user.role === 'admin';
        res.json({
            ...user.toObject(),
            email: currentEmail,
            isAdmin,
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Failed to fetch user' });
    }
};

export const addAddress = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.uid;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const address = req.body;

        if (!address.fullName || !address.phone || !address.address || !address.city || !address.pincode) {
            res.status(400).json({ error: 'All required address fields must be provided' });
            return;
        }

        const user = await User.findOne({ firebaseUid: userId });

        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        // If this is the first address or marked as default, make it default
        if (user.addresses.length === 0 || address.isDefault) {
            user.addresses.forEach((addr) => (addr.isDefault = false));
            address.isDefault = true;
        }

        user.addresses.push(address);
        await user.save();
        await cacheDel(authCacheKey(userId));

        res.status(201).json(user);
    } catch (error) {
        console.error('Add address error:', error);
        res.status(500).json({ error: 'Failed to add address' });
    }
};

export const updateAddress = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.uid;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const { addressId } = req.params;
        const updates = req.body;

        const user = await User.findOne({ firebaseUid: userId });

        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        const address = user.addresses.find((addr) => getAddressId(addr) === addressId);

        if (!address) {
            res.status(404).json({ error: 'Address not found' });
            return;
        }

        Object.assign(address, updates);

        if (updates.isDefault) {
            user.addresses.forEach((addr) => {
                if (getAddressId(addr) !== addressId) {
                    addr.isDefault = false;
                }
            });
        }

        await user.save();
        await cacheDel(authCacheKey(userId));

        res.json(user);
    } catch (error) {
        console.error('Update address error:', error);
        res.status(500).json({ error: 'Failed to update address' });
    }
};

export const deleteAddress = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.uid;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const { addressId } = req.params;

        const user = await User.findOne({ firebaseUid: userId });

        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        const addressIndex = user.addresses.findIndex((addr) => getAddressId(addr) === addressId);

        if (addressIndex === -1) {
            res.status(404).json({ error: 'Address not found' });
            return;
        }

        const wasDefault = user.addresses[addressIndex].isDefault;
        user.addresses.splice(addressIndex, 1);

        // If deleted address was default, make the first remaining address default
        if (wasDefault && user.addresses.length > 0) {
            user.addresses[0].isDefault = true;
        }

        await user.save();
        await cacheDel(authCacheKey(userId));
        res.json(user);
    } catch (error) {
        console.error('Delete address error:', error);
        res.status(500).json({ error: 'Failed to delete address' });
    }
};

export const notifyLogin = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.uid;
        if (!userId) {
            res.status(401).json({ error: 'Unauthorized' });
            return;
        }

        const email = req.user?.email || '';
        const displayName = req.user?.displayName || email.split('@')[0] || 'User';

        res.json({ success: true, message: 'Login notification sent' });

        if (email) {
            sendLoginNotificationEmail(email, displayName).catch((emailError) => {
                console.error('Login notification email failed:', emailError);
            });
        }
    } catch (error) {
        console.error('Notify login error:', error);
        res.json({ success: true, message: 'Login notification skipped' });
    }
};
