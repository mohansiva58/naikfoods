/**
 * Centralized environment validation for production boot.
 * Fails fast when critical secrets or URLs are missing.
 */

const isProd = process.env.NODE_ENV === 'production';

export function validateProductionEnv(): void {
    if (!isProd) return;

    const missing: string[] = [];

    if (!process.env.MONGODB_URI) missing.push('MONGODB_URI');
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
        missing.push('RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET');
    }
    if (!process.env.FRONTEND_URL && !process.env.CORS_ORIGIN) {
        missing.push('FRONTEND_URL or CORS_ORIGIN');
    }

    const adminList = (process.env.ADMIN_EMAILS || '').split(',').map((e) => e.trim()).filter(Boolean);
    if (adminList.length === 0) {
        missing.push('ADMIN_EMAILS (comma-separated admin emails)');
    }

    if (missing.length > 0) {
        console.error('[env] Production startup blocked. Missing:', missing.join(', '));
        process.exit(1);
    }
}
