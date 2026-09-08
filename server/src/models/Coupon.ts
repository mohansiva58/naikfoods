import mongoose, { Schema, Document } from 'mongoose';

export interface ICoupon extends Document {
    code: string;
    discountType: 'percentage' | 'fixed';
    discountValue: number;
    isActive: boolean;
    expiryDate?: Date;
    minOrderAmount?: number;
    createdAt: Date;
    updatedAt: Date;
}

const CouponSchema: Schema = new Schema(
    {
        code: { 
            type: String, 
            required: true, 
            unique: true, 
            uppercase: true, 
            trim: true,
            index: true 
        },
        discountType: {
            type: String,
            enum: ['percentage', 'fixed'],
            default: 'percentage',
            required: true
        },
        discountValue: { 
            type: Number, 
            required: true, 
            min: 0
        },
        isActive: { 
            type: Boolean, 
            default: true 
        },
        expiryDate: { 
            type: Date 
        },
        minOrderAmount: { 
            type: Number, 
            default: 0 
        },
    },
    {
        timestamps: true,
    }
);

export default mongoose.model<ICoupon>('Coupon', CouponSchema);
