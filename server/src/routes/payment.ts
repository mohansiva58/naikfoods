import express from 'express';
import { authenticateUser } from '../middleware/auth';
import {
    createRazorpayOrder,
    verifyPayment,
} from '../controllers/paymentController';

const router = express.Router();

// All payment routes require authentication
router.use(authenticateUser);

router.post('/create-order', createRazorpayOrder);
router.post('/verify', verifyPayment);

export default router;
