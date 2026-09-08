import express from 'express';
import { authenticateUser } from '../middleware/auth';
import { requireAdmin } from '../middleware/requireAdmin';
import {
    getDashboardStats,
    getAllOrders,
    updateOrderStatus,
    uploadImage
} from '../controllers/adminController';
import { upload } from '../middleware/upload';

const router = express.Router();

router.use(authenticateUser, requireAdmin);

router.get('/stats', getDashboardStats);
router.get('/orders', getAllOrders);
router.put('/orders/:orderId', updateOrderStatus);
router.post('/upload-image', upload.single('image'), uploadImage);

export default router;
