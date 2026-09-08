import mongoose, { Schema, Document } from 'mongoose';

export interface IStockReservation extends Document {
    reservationId: string;
    reservationGroupId?: string;
    idempotencyKey?: string;
    productId: string;
    size: string;
    color?: string;
    quantity: number;
    userId?: string;
    sessionId: string;
    status: 'reserved' | 'completed' | 'expired' | 'released' | 'cancelled';
    releaseReason?: string;
    confirmedOrderId?: string;
    confirmedPaymentId?: string;
    expiresAt: Date;
    createdAt: Date;
    updatedAt: Date;
}

const StockReservationSchema: Schema = new Schema(
    {
        reservationId: { type: String, required: true, unique: true, index: true },
        reservationGroupId: { type: String, index: true },
        idempotencyKey: { type: String, index: true },
        productId: { type: String, required: true, index: true },
        size: { type: String, required: true },
        color: { type: String },
        quantity: { type: Number, required: true, min: 1 },
        userId: { type: String },
        sessionId: { type: String, required: true, index: true },
        status: { 
            type: String, 
            enum: ['reserved', 'completed', 'expired', 'released', 'cancelled'], 
            default: 'reserved',
            index: true
        },
        releaseReason: { type: String },
        confirmedOrderId: { type: String },
        confirmedPaymentId: { type: String },
        expiresAt: { type: Date, required: true, index: true },
    },
    {
        timestamps: true,
    }
);

StockReservationSchema.index(
    { idempotencyKey: 1, productId: 1, size: 1, color: 1 },
    { unique: true, sparse: true }
);

// TTL index to automatically remove expired documents if we want, 
// but the user wants to release stock, so we might need a manual process or a change stream.
// Actually, MongoDB TTL index only deletes documents. We need to increment the stock back.
// So we'll use a cron job or a background service.

export default mongoose.model<IStockReservation>('StockReservation', StockReservationSchema);
