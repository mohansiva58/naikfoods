import mongoose, { Schema, Document } from 'mongoose';

export interface IAddress {
    fullName: string;
    phone: string;
    email?: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    isDefault: boolean;
}

export interface IUser extends Document {
    firebaseUid: string;
    email: string;
    displayName?: string;
    phoneNumber?: string;
    photoURL?: string;
    /** Elevated access for admin API (also checked against ADMIN_EMAILS). */
    role?: 'user' | 'admin';
    addresses: IAddress[];
    createdAt: Date;
    updatedAt: Date;
}

const AddressSchema: Schema = new Schema({
    fullName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    address: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    pincode: { type: String, required: true, trim: true },
    isDefault: { type: Boolean, default: false },
});

const UserSchema: Schema = new Schema(
    {
        firebaseUid: { type: String, required: true, unique: true, index: true },
        email: { type: String, required: true, unique: true, lowercase: true, trim: true },
        displayName: { type: String, trim: true },
        phoneNumber: { type: String, trim: true },
        photoURL: { type: String },
        role: { type: String, enum: ['user', 'admin'], default: 'user' },
        addresses: [AddressSchema],
    },
    {
        timestamps: true,
    }
);

// Index for faster queries


export default mongoose.model<IUser>('User', UserSchema);
