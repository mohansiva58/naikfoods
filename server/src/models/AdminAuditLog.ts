import mongoose, { Schema, Document } from 'mongoose';

export interface IAdminAuditLog extends Document {
    actorUid: string;
    actorEmail?: string;
    action: string;
    resource?: string;
    resourceId?: string;
    details?: Record<string, unknown>;
    createdAt: Date;
}

const AdminAuditLogSchema = new Schema(
    {
        actorUid: { type: String, required: true, index: true },
        actorEmail: { type: String },
        action: { type: String, required: true },
        resource: { type: String },
        resourceId: { type: String },
        details: { type: Schema.Types.Mixed },
    },
    { timestamps: true }
);

AdminAuditLogSchema.index({ createdAt: -1 });

export default mongoose.model<IAdminAuditLog>('AdminAuditLog', AdminAuditLogSchema);
