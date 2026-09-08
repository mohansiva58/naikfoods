import mongoose, { Schema, Document } from 'mongoose';

/** Single-flight guard: one in-flight/completed checkout per Razorpay payment id. */
export interface IPaymentClaim extends Document {
    razorpayPaymentId: string;
    userId: string;
    createdAt: Date;
}

const PaymentClaimSchema = new Schema(
    {
        razorpayPaymentId: { type: String, required: true, unique: true, index: true },
        userId: { type: String, required: true },
    },
    { timestamps: true }
);

export default mongoose.model<IPaymentClaim>('PaymentClaim', PaymentClaimSchema);
