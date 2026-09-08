import mongoose, { Schema, Document } from 'mongoose';

export interface IOrderItem {
    productId: string;
    name: string;
    price: number;
    image: string;
    size: string;
    quantity: number;
    variantImage?: string;
    color?: string;
}

export interface IShippingAddress {
    fullName: string;
    phone: string;
    email?: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
}

export interface IOrder extends Document {
    orderId: string;
    userId: string;
    userEmail: string;
    items: IOrderItem[];
    shippingAddress: IShippingAddress;
    subtotal: number;
    discount: number;
    couponCode?: string;
    total: number;
    paymentMethod: 'razorpay' | 'cod';
    paymentStatus: 'pending' | 'paid' | 'failed' | 'cod';
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
    razorpaySignature?: string;
    orderStatus: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'returned';
    trackingNumber?: string;
    estimatedDelivery?: Date;
    deliveryDate?: Date;
    cancelledAt?: Date;
    returnedAt?: Date;
    cancellationReason?: string;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}

const OrderItemSchema: Schema = new Schema({
    productId: { type: String, required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    image: { type: String, required: true },
    size: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    variantImage: { type: String },
    color: { type: String },
});

const ShippingAddressSchema: Schema = new Schema({
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    email: { type: String },
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
});

const OrderSchema: Schema = new Schema(
    {
        orderId: { type: String, required: true, unique: true, index: true },
        userId: { type: String, required: true, index: true },
        userEmail: { type: String, required: true },
        items: [OrderItemSchema],
        shippingAddress: { type: ShippingAddressSchema, required: true },
        subtotal: { type: Number, required: true, min: 0 },
        discount: { type: Number, default: 0, min: 0 },
        couponCode: { type: String },
        total: { type: Number, required: true, min: 0 },
        paymentMethod: { type: String, enum: ['razorpay', 'cod'], required: true },
        paymentStatus: {
            type: String,
            enum: ['pending', 'paid', 'failed', 'cod'],
            default: 'pending',
            required: true,
        },
        razorpayOrderId: { type: String },
        razorpayPaymentId: { type: String },
        razorpaySignature: { type: String },
        orderStatus: {
            type: String,
            enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'],
            default: 'pending',
            required: true,
        },
        trackingNumber: { type: String },
        estimatedDelivery: { type: Date },
        deliveryDate: { type: Date },
        cancelledAt: { type: Date },
        returnedAt: { type: Date },
        cancellationReason: { type: String },
        notes: { type: String },
    },
    {
        timestamps: true,
    }
);

// Indexes for efficient queries
OrderSchema.index({ userId: 1, createdAt: -1 });

OrderSchema.index({ orderStatus: 1 });
OrderSchema.index({ paymentStatus: 1 });

// Idempotency: one business order per Razorpay payment / order (sparse for COD)
OrderSchema.index({ razorpayPaymentId: 1 }, { unique: true, sparse: true });
OrderSchema.index({ razorpayOrderId: 1 }, { unique: true, sparse: true });

export default mongoose.model<IOrder>('Order', OrderSchema);
