import mongoose, { Schema, Document } from 'mongoose';

export interface IWebhookEvent extends Document {
    eventId: string;
    eventType: string;
    createdAt: Date;
}

const WebhookEventSchema = new Schema(
    {
        eventId: { type: String, required: true, unique: true, index: true },
        eventType: { type: String, required: true },
    },
    { timestamps: true }
);

export default mongoose.model<IWebhookEvent>('WebhookEvent', WebhookEventSchema);
