import mongoose, { Schema, Document } from 'mongoose';

export interface IPaymentIntent extends Document {
    razorpayOrderId: string;
    userId: string;
    amountPaise: number;
    status: 'created' | 'completed' | 'failed';
    createdAt: Date;
    updatedAt: Date;
}

const PaymentIntentSchema = new Schema(
    {
        razorpayOrderId: { type: String, required: true, unique: true, index: true },
        userId: { type: String, required: true, index: true },
        amountPaise: { type: Number, required: true, min: 1 },
        status: {
            type: String,
            enum: ['created', 'completed', 'failed'],
            default: 'created',
            required: true,
        },
    },
    { timestamps: true }
);

PaymentIntentSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 });

export default mongoose.model<IPaymentIntent>('PaymentIntent', PaymentIntentSchema);
