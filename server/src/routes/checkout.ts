import express from 'express';
import { authenticateUser } from '../middleware/auth';
import { getCheckoutReservation } from '../controllers/inventoryController';

const router = express.Router();

router.use(authenticateUser);

router.get('/reservation/:id', getCheckoutReservation);

export default router;
