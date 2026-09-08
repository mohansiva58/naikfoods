import express, { Router } from 'express';
import { upload } from '../middleware/upload';
import { authenticateUser } from '../middleware/auth';
import { requireAdmin } from '../middleware/requireAdmin';
import {
    createSale,
    getAllSales,
    getActiveSales,
    getSaleById,
    updateSale,
    deleteSale,
    createOrUpdateSaleMode,
    getAllSaleModes,
    getActiveSaleMode,
    toggleSaleMode,
    deleteSaleMode
} from '../controllers/saleController';

const router: Router = express.Router();

// Sale Items Routes
router.get('/items', getAllSales);
router.get('/items/active', getActiveSales);
router.get('/items/:id', getSaleById);

const saleAdminUpload = upload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'images', maxCount: 8 },
]);

router.post('/items', authenticateUser, requireAdmin, saleAdminUpload, createSale);
router.put('/items/:id', authenticateUser, requireAdmin, saleAdminUpload, updateSale);
router.delete('/items/:id', authenticateUser, requireAdmin, deleteSale);

// Sale Mode Routes
router.get('/modes', getAllSaleModes);
router.get('/modes/active', getActiveSaleMode);
router.post('/modes', authenticateUser, requireAdmin, createOrUpdateSaleMode);
router.put('/modes/:saleName/toggle', authenticateUser, requireAdmin, toggleSaleMode);
router.delete('/modes/:saleName', authenticateUser, requireAdmin, deleteSaleMode);

export default router;
