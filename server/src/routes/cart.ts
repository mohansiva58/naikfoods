import express from 'express';
import { authenticateUser } from '../middleware/auth';
import {
    getCart,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart,
    getCartAvailability,
} from '../controllers/cartController';

const router = express.Router();

// All cart routes require authentication
router.use(authenticateUser);

router.get('/', getCart);
router.get('/availability', getCartAvailability);
router.post('/add', addToCart);
router.put('/update', updateCartItem);
router.delete('/remove/:productId/:size', removeFromCart);
router.delete('/clear', clearCart);

export default router;
