import { authenticateUser } from './auth';
import { requireAdmin } from './requireAdmin';

/** Express middleware array: auth then admin. */
export const authenticateAdmin = [authenticateUser, requireAdmin];
