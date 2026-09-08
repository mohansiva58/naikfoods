import express from 'express';
import { authenticateUser } from '../middleware/auth';
import {
    reserveInventory,
    releaseInventory,
    confirmInventory,
} from '../controllers/inventoryController';

const router = express.Router();

router.use(authenticateUser);

router.post('/reserve', reserveInventory);
router.post('/release', releaseInventory);
router.post('/confirm', confirmInventory);

export default router;
