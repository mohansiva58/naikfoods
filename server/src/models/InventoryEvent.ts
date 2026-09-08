import mongoose, { Schema, Document } from 'mongoose';

export interface IInventoryEvent extends Document {
    eventType: 'reserved' | 'released' | 'confirmed' | 'cancelled' | 'expired' | 'adjusted';
    productId: string;
    size?: string;
    color?: string;
    quantity: number;
    reservationId?: string;
    reservationGroupId?: string;
    orderId?: string;
    paymentId?: string;
    userId?: string;
    idempotencyKey?: string;
    metadata?: Record<string, unknown>;
    createdAt: Date;
    updatedAt: Date;
}

const InventoryEventSchema = new Schema(
    {
        eventType: {
            type: String,
            enum: ['reserved', 'released', 'confirmed', 'cancelled', 'expired', 'adjusted'],
            required: true,
            index: true,
        },
        productId: { type: String, required: true, index: true },
        size: { type: String, index: true },
        color: { type: String },
        quantity: { type: Number, required: true },
        reservationId: { type: String, index: true },
        reservationGroupId: { type: String, index: true },
        orderId: { type: String, index: true },
        paymentId: { type: String, index: true },
        userId: { type: String, index: true },
        idempotencyKey: { type: String, index: true },
        metadata: { type: Schema.Types.Mixed },
    },
    { timestamps: true }
);

InventoryEventSchema.index({ productId: 1, size: 1, createdAt: -1 });
InventoryEventSchema.index({ reservationId: 1, eventType: 1 });

export default mongoose.model<IInventoryEvent>('InventoryEvent', InventoryEventSchema);
