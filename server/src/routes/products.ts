import express from 'express';
import {
    getAllProducts,
    getProductById,
    getFeaturedProducts,
    createProduct,
    bulkCreateProducts,
    updateProduct,
    deleteProduct,
    checkStockAvailability,
    getProductStock,
    reserveStock,
    releaseStock
} from '../controllers/productController';
import { upload } from '../middleware/upload';
import { authenticateUser } from '../middleware/auth';
import { requireAdmin } from '../middleware/requireAdmin';

const router = express.Router();

router.get('/featured', getFeaturedProducts);
router.post('/check-stock', checkStockAvailability);
router.post('/reserve', reserveStock);
router.post('/release', releaseStock);
router.get('/', getAllProducts);
router.get('/:id/stock', getProductStock);
router.get('/:id', getProductById);

// Admin-only mutations
const adminUpload = upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'images', maxCount: 8 },
]);

router.post('/', authenticateUser, requireAdmin, adminUpload, createProduct);
router.post('/bulk', authenticateUser, requireAdmin, bulkCreateProducts);
router.put('/:id', authenticateUser, requireAdmin, adminUpload, updateProduct);
router.delete('/:id', authenticateUser, requireAdmin, deleteProduct);

export default router;
