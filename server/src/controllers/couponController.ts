import { Request, Response } from 'express';
import Coupon from '../models/Coupon';
import { AuthRequest } from '../middleware/auth';

// Admin: Create a new coupon
export const createCoupon = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { code, discountType, discountValue, expiryDate, minOrderAmount } = req.body;

        const existingCoupon = await Coupon.findOne({ code: code.toUpperCase() });
        if (existingCoupon) {
            res.status(400).json({ error: 'Coupon code already exists' });
            return;
        }

        const coupon = new Coupon({
            code: code.toUpperCase(),
            discountType,
            discountValue,
            expiryDate,
            minOrderAmount,
        });

        await coupon.save();
        res.status(201).json(coupon);
    } catch (error) {
        console.error('Create coupon error:', error);
        res.status(500).json({ error: 'Failed to create coupon' });
    }
};

// Admin: Get all coupons
export const getAllCoupons = async (_req: AuthRequest, res: Response): Promise<void> => {
    try {
        const coupons = await Coupon.find().sort({ createdAt: -1 });
        res.json(coupons);
    } catch (error) {
        console.error('Get all coupons error:', error);
        res.status(500).json({ error: 'Failed to fetch coupons' });
    }
};

// Admin: Delete a coupon
export const deleteCoupon = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const coupon = await Coupon.findByIdAndDelete(id);
        if (!coupon) {
            res.status(404).json({ error: 'Coupon not found' });
            return;
        }
        res.json({ message: 'Coupon deleted successfully' });
    } catch (error) {
        console.error('Delete coupon error:', error);
        res.status(500).json({ error: 'Failed to delete coupon' });
    }
};

// User: Validate a coupon
export const validateCoupon = async (req: Request, res: Response): Promise<void> => {
    try {
        const { code, orderAmount } = req.body;
        console.log(`🔍 Validating coupon: ${code} for amount: ${orderAmount}`);
        if (!code) {
            res.status(400).json({ error: 'Coupon code is required' });
            return;
        }

        const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });

        if (!coupon) {
            res.status(404).json({ error: 'Invalid coupon code' });
            return;
        }

        if (coupon.expiryDate && new Date(coupon.expiryDate) < new Date()) {
            res.status(400).json({ error: 'Coupon has expired' });
            return;
        }

        if (orderAmount && coupon.minOrderAmount && orderAmount < coupon.minOrderAmount) {
            res.status(400).json({ 
                error: `Minimum order amount for this coupon is ₹${coupon.minOrderAmount}` 
            });
            return;
        }

        res.json({
            code: coupon.code,
            discountType: coupon.discountType,
            discountValue: coupon.discountValue,
        });
    } catch (error) {
        console.error('Validate coupon error:', error);
        res.status(500).json({ error: 'Failed to validate coupon' });
    }
};
