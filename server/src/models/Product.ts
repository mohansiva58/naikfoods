import mongoose, { Schema, Document } from 'mongoose';

export interface IColorImage {
    _id?: string;
    url: string;
    publicId?: string;
}

export interface IColorVariant {
    colorName: string;
    colorCode?: string; // Hex color code
    image: IColorImage; // Main image for this color
    images?: IColorImage[]; // Additional images for this color
    stock?: number; // Stock for this specific color
}

export interface IVariantStock {
    variantKey: string;
    size: string;
    color?: string;
    totalStock: number;
    availableStock: number;
    reservedStock: number;
    soldStock: number;
    lowStockThreshold: number;
    lastAdjustedAt?: Date;
    lastAdjustedBy?: string;
}

export interface INutrition {
    calories?: number;
    protein?: number;
    fat?: number;
    carbohydrates?: number;
}

export interface IProduct extends Document {
    productId: string;
    slug: string;
    name: string;
    price: number;
    originalPrice?: number;
    image: string;
    images: string[];
    category: string;
    sizes: string[];
    sizeCounts?: Record<string, number>;
    description: string;
    rating: number;
    reviews: number;
    newArrival: boolean;
    isBestseller: boolean;
    stock: number;
    totalStock?: number;
    availableStock?: number;
    reservedStock?: number;
    soldStock?: number;
    lowStockThreshold?: number;
    variantStock?: IVariantStock[];
    sizeReservedCounts?: Record<string, number>;
    setType?: string; // e.g., "1 piece", "2 piece set", "3 piece set"
    colors?: IColorVariant[]; // Color variants
    cloudinaryId?: string;
    cloudinaryIds?: string[];
    ingredients?: string[];
    storageInstructions?: string;
    shelfLife?: string;
    nutrition?: INutrition;
    vegStatus: 'veg' | 'non_veg';
    spiceLevel?: 'mild' | 'medium' | 'spicy';
    dietaryTags?: string[];
    packQuantity?: string;
    createdAt: Date;
    updatedAt: Date;
}

const ColorImageSchema = new Schema({
    url: { type: String, required: true },
    publicId: { type: String }
});

const ProductSchema: Schema = new Schema(
    {
        productId: { type: String, required: true, unique: true, index: true },
        slug: { type: String, required: true, unique: true, index: true, trim: true, lowercase: true },
        name: { type: String, required: true, trim: true },
        price: { type: Number, required: true, min: 1 },
        originalPrice: { type: Number, min: 0 },
        image: { type: String, required: true },
        images: [{ type: String }],
        category: { type: String, required: true, index: true },
        sizes: { 
            type: [String], 
            required: true,
            validate: {
                validator: function(v: string[]) {
                    return v && v.length > 0 && v.every((s: string) => s && s.trim().length > 0);
                },
                message: 'At least one valid size is required'
            }
        },
        sizeCounts: {
            type: Map,
            of: Number,
        },
        sizeReservedCounts: {
            type: Map,
            of: Number,
            default: {},
        },
        description: { type: String, required: true },
        rating: { type: Number, default: 0, min: 0, max: 5 },
        reviews: { type: Number, default: 0, min: 0 },
        newArrival: { type: Boolean, default: false },
        isBestseller: { type: Boolean, default: false },
        stock: { type: Number, default: 100, min: 0 },
        totalStock: { type: Number, min: 0, default: 0 },
        availableStock: { type: Number, min: 0, default: 0 },
        reservedStock: { type: Number, min: 0, default: 0 },
        soldStock: { type: Number, min: 0, default: 0 },
        lowStockThreshold: { type: Number, min: 0, default: 3 },
        variantStock: [{
            variantKey: { type: String, required: true },
            size: { type: String, required: true },
            color: { type: String },
            totalStock: { type: Number, min: 0, default: 0 },
            availableStock: { type: Number, min: 0, default: 0 },
            reservedStock: { type: Number, min: 0, default: 0 },
            soldStock: { type: Number, min: 0, default: 0 },
            lowStockThreshold: { type: Number, min: 0, default: 3 },
            lastAdjustedAt: { type: Date },
            lastAdjustedBy: { type: String },
        }],
        setType: { type: String }, // e.g., "1 piece", "2 piece set", "3 piece set"
        colors: [{
            colorName: { type: String, required: true },
            colorCode: { type: String }, // Hex code like #FF0000
            image: { type: ColorImageSchema, required: true },
            images: [ColorImageSchema],
            stock: { type: Number, min: 0, default: 0 }
        }],
        cloudinaryId: { type: String },
        cloudinaryIds: [{ type: String }],
        ingredients: { type: [String], default: [] },
        storageInstructions: { type: String, trim: true },
        shelfLife: { type: String, trim: true },
        nutrition: {
            calories: { type: Number, min: 0 },
            protein: { type: Number, min: 0 },
            fat: { type: Number, min: 0 },
            carbohydrates: { type: Number, min: 0 },
        },
        vegStatus: { type: String, enum: ['veg', 'non_veg'], required: true, default: 'veg' },
        spiceLevel: { type: String, enum: ['mild', 'medium', 'spicy'] },
        dietaryTags: { type: [String], default: [] },
        packQuantity: { type: String, trim: true },
    },
    {
        timestamps: true,
    }
);

// Indexes for better query performance
ProductSchema.index({ category: 1, price: 1 });
ProductSchema.index({ newArrival: 1, isBestseller: 1 });
ProductSchema.index({ name: 'text', description: 'text' });
ProductSchema.index({ productId: 1, 'variantStock.variantKey': 1 });

export default mongoose.model<IProduct>('Product', ProductSchema);
