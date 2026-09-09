import mongoose, { Schema, Document } from 'mongoose';

export interface IInstagramPost extends Document {
    postId: string;
    mediaType: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM';
    mediaUrl: string;
    thumbnailUrl: string;
    caption: string;
    permalink: string;
    timestamp: string;
    fetchedAt: Date;
    updatedAt: Date;
}

/**
 * InstagramPost — a small MongoDB collection that stores the last synced
 * Instagram feed (one doc per post). Acts as the Level-2 fallback when
 * the Instagram API is unreachable.
 */
const InstagramPostSchema: Schema = new Schema(
    {
        postId: { type: String, required: true, unique: true, index: true },
        mediaType: {
            type: String,
            enum: ['IMAGE', 'VIDEO', 'CAROUSEL_ALBUM'],
            required: true,
        },
        mediaUrl: { type: String, default: '' },
        thumbnailUrl: { type: String, default: '' },
        caption: { type: String, default: '' },
        permalink: { type: String, default: '' },
        timestamp: { type: String, default: '' },
        fetchedAt: { type: Date, default: Date.now },
    },
    { timestamps: true }
);

export default mongoose.model<IInstagramPost>('InstagramPost', InstagramPostSchema);