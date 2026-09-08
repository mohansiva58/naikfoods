import express from 'express';
import { authenticateUser } from '../middleware/auth';
import {
    createOrder,
    getOrders,
    getOrderById,
    cancelOrder,
} from '../controllers/orderController';

const router = express.Router();

// All order routes require authentication
router.use(authenticateUser);

router.post('/', createOrder);
router.post('/create-from-checkout', createOrder);
router.get('/', getOrders);
router.get('/:orderId', getOrderById);
router.post('/:orderId/cancel', cancelOrder);

export default router;
