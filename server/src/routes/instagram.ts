import express, { Router } from 'express';
import { getInstagramFeed } from '../controllers/instagramController';

const router: Router = express.Router();

// Public endpoint — GET /api/instagram
// Always returns 200 with { success, source, posts } so the frontend
// never enters an error state, even if Instagram is fully down.
router.get('/', getInstagramFeed);

export default router;