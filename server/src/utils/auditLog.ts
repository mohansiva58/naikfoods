import AdminAuditLog from '../models/AdminAuditLog';

export async function writeAudit(
    actorUid: string,
    actorEmail: string | undefined,
    action: string,
    resource: string,
    resourceId: string,
    details?: Record<string, unknown>
): Promise<void> {
    try {
        await AdminAuditLog.create({
            actorUid,
            actorEmail,
            action,
            resource,
            resourceId,
            details,
        });
    } catch (e) {
        console.warn('Audit log failed:', e);
    }
}
