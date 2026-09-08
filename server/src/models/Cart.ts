import mongoose, { Schema, Document } from 'mongoose';

export interface ICartItem {
    productId: string;
    name: string;
    price: number;
    image: string;
    size: string;
    quantity: number;
    variantImage?: string;
    color?: string;
}

export interface ICart extends Document {
    userId: string;
    items: ICartItem[];
    updatedAt: Date;
}

const CartItemSchema: Schema = new Schema({
    productId: { type: String, required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    image: { type: String, required: true },
    size: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1, default: 1 },
    variantImage: { type: String },
    color: { type: String },
});

const CartSchema: Schema = new Schema(
    {
        userId: { type: String, required: true, unique: true, index: true },
        items: [CartItemSchema],
    },
    {
        timestamps: true,
    }
);

// TTL index - carts expire after 30 days of inactivity
CartSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 2592000 });

export default mongoose.model<ICart>('Cart', CartSchema);
