import Razorpay from 'razorpay';
import crypto from 'crypto';

let razorpayInstance: Razorpay | null = null;

export const initializeRazorpay = (): Razorpay => {
    try {
        const keyId = process.env.RAZORPAY_KEY_ID;
        const keySecret = process.env.RAZORPAY_KEY_SECRET;

        if (!keyId || !keySecret) {
            throw new Error('Razorpay credentials missing in environment variables');
        }

        razorpayInstance = new Razorpay({
            key_id: keyId,
            key_secret: keySecret,
        });

        console.log('✅ Razorpay initialized successfully');
        return razorpayInstance;
    } catch (error) {
        console.error('❌ Failed to initialize Razorpay:', error);
        throw error;
    }
};

export const getRazorpayInstance = (): Razorpay => {
    if (!razorpayInstance) {
        return initializeRazorpay();
    }
    return razorpayInstance;
};

export const verifyRazorpaySignature = (
    orderId: string,
    paymentId: string,
    signature: string
): boolean => {
    try {
        const keySecret = process.env.RAZORPAY_KEY_SECRET;
        if (!keySecret) {
            throw new Error('Razorpay key secret not found');
        }

        const generatedSignature = crypto
            .createHmac('sha256', keySecret)
            .update(`${orderId}|${paymentId}`)
            .digest('hex');

        return generatedSignature === signature;
    } catch (error) {
        console.error('❌ Signature verification failed:', error);
        return false;
    }
};

/** Fetch payment entity from Razorpay (server-side reconciliation). */
export const fetchRazorpayPayment = async (paymentId: string): Promise<Record<string, unknown>> => {
    const rz = getRazorpayInstance() as unknown as {
        payments: { fetch: (id: string) => Promise<Record<string, unknown>> };
    };
    return rz.payments.fetch(paymentId);
};

/** Fetch Razorpay order (includes notes set at order creation). */
export const fetchRazorpayOrder = async (orderId: string): Promise<Record<string, unknown>> => {
    const rz = getRazorpayInstance() as unknown as {
        orders: { fetch: (id: string) => Promise<Record<string, unknown>> };
    };
    return rz.orders.fetch(orderId);
};

/** Verify Razorpay webhook signature (raw JSON body). */
export const verifyRazorpayWebhookSignature = (rawBody: string, signature: string | undefined): boolean => {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!secret || !signature) return false;
    const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
    if (expected.length !== signature.length) return false;
    try {
        return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
    } catch {
        return false;
    }
};
