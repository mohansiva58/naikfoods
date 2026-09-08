import { Request, Response } from 'express';
import { verifyRazorpayWebhookSignature } from '../config/razorpay';
import WebhookEvent from '../models/WebhookEvent';
import Order from '../models/Order';

/**
 * Razorpay webhook — raw body required (mounted with express.raw).
 */
export const razorpayWebhook = async (req: Request, res: Response): Promise<void> => {
    try {
        const signature = req.headers['x-razorpay-signature'] as string | undefined;
        const rawBody = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : String(req.body || '');

        if (!verifyRazorpayWebhookSignature(rawBody, signature)) {
            res.status(400).json({ error: 'Invalid webhook signature' });
            return;
        }

        let payload: { event?: string; event_id?: string; id?: string; payload?: { payment?: { entity?: { id?: string } } } };
        try {
            payload = JSON.parse(rawBody);
        } catch {
            res.status(400).json({ error: 'Invalid JSON body' });
            return;
        }

        const eventId = (payload as Record<string, unknown>).event_id as string | undefined || (payload as Record<string, unknown>).id as string | undefined;
        const eventType = payload.event || 'unknown';

        if (eventId) {
            try {
                await WebhookEvent.create({ eventId, eventType });
            } catch (err: unknown) {
                if (err && typeof err === 'object' && 'code' in err && (err as { code: number }).code === 11000) {
                    res.json({ received: true, duplicate: true });
                    return;
                }
                throw err;
            }
        }

        if (payload.event === 'payment.captured') {
            const paymentId = payload.payload?.payment?.entity?.id;
            if (paymentId) {
                await Order.findOneAndUpdate(
                    { razorpayPaymentId: paymentId, paymentStatus: 'pending' },
                    { $set: { paymentStatus: 'paid', orderStatus: 'confirmed' } }
                );
            }
        }

        res.json({ received: true });
    } catch (error) {
        console.error('Webhook error:', error);
        res.status(500).json({ error: 'Webhook processing failed' });
    }
};
