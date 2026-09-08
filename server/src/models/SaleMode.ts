import mongoose, { Schema, Document } from 'mongoose';

export interface ISaleMode extends Document {
    saleName: string;
    isActive: boolean;
    description?: string;
    startDate?: Date;
    endDate?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const SaleModeSchema: Schema = new Schema(
    {
        saleName: { type: String, required: true, unique: true, trim: true, index: true },
        isActive: { type: Boolean, default: false, index: true },
        description: { type: String },
        startDate: { type: Date },
        endDate: { type: Date },
    },
    {
        timestamps: true,
    }
);

export default mongoose.model<ISaleMode>('SaleMode', SaleModeSchema);
