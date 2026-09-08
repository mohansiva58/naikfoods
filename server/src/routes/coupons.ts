import express from 'express';
import { authenticateUser } from '../middleware/auth';
import { requireAdmin } from '../middleware/requireAdmin';
import {
    createCoupon,
    getAllCoupons,
    deleteCoupon,
    validateCoupon
} from '../controllers/couponController';

const router = express.Router();

// Public/User routes
router.post('/validate', validateCoupon);

// Admin routes
router.post('/', authenticateUser, requireAdmin, createCoupon);
router.get('/', authenticateUser, requireAdmin, getAllCoupons);
router.delete('/:id', authenticateUser, requireAdmin, deleteCoupon);

export default router;
