import mongoose, { Schema, Document } from 'mongoose';

export interface ISale extends Document {
    saleId: string;
    name: string;
    price: number;
    originalPrice?: number;
    image: string;
    images: string[];
    category: string;
    sizes: string[];
    description: string;
    rating: number;
    reviews: number;
    stock: number;
    discount?: number;
    saleMode: string;
    cloudinaryId?: string;
    cloudinaryIds?: string[];
    createdAt: Date;
    updatedAt: Date;
}

const SaleSchema: Schema = new Schema(
    {
        saleId: { type: String, required: true, unique: true, index: true },
        name: { type: String, required: true, trim: true },
        price: { type: Number, required: true, min: 0 },
        originalPrice: { type: Number, min: 0 },
        image: { type: String, required: true },
        images: [{ type: String }],
        category: { type: String, required: true, index: true },
        sizes: {
            type: [String],
            required: true,
            validate: {
                validator: function (v: string[]) {
                    return v && v.length > 0 && v.every((s: string) => s && s.trim().length > 0);
                },
                message: 'At least one valid size is required'
            }
        },
        description: { type: String, required: true },
        rating: { type: Number, default: 0, min: 0, max: 5 },
        reviews: { type: Number, default: 0, min: 0 },
        stock: { type: Number, min: 0, default: 100 },
        discount: { type: Number, min: 0, max: 100 },
        saleMode: { type: String, required: true, index: true },
        cloudinaryId: { type: String },
        cloudinaryIds: [{ type: String }],
    },
    {
        timestamps: true,
    }
);

// Index for faster queries
SaleSchema.index({ category: 1, createdAt: -1 });
SaleSchema.index({ saleMode: 1, createdAt: -1 });

export default mongoose.model<ISale>('Sale', SaleSchema);
