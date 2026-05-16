import { db } from "@/lib/db";
import { auditLog } from "@/lib/db/schema";

type AuditParams = {
  action: string;
  tableCible?: string;
  idCible?: string;
  avant?: unknown;
  apres?: unknown;
  adminId?: string;
  ip?: string;
};

export async function auditAction(params: AuditParams): Promise<void> {
  await db.insert(auditLog).values({
    action:     params.action,
    tableCible: params.tableCible ?? null,
    idCible:    params.idCible ?? null,
    avantJson:  params.avant != null ? JSON.stringify(params.avant) : null,
    apresJson:  params.apres != null ? JSON.stringify(params.apres) : null,
    adminId:    params.adminId ?? null,
    ip:         params.ip ?? null,
  });
}

export async function getAuditLog(options?: { idCible?: string; tableCible?: string; limit?: number }) {
  const { idCible, tableCible, limit = 50 } = options ?? {};

  let query = db.select().from(auditLog).$dynamic();
  if (idCible) {
    const { eq } = await import("drizzle-orm");
    query = query.where(eq(auditLog.idCible, idCible));
  }
  if (tableCible && !idCible) {
    const { eq } = await import("drizzle-orm");
    query = query.where(eq(auditLog.tableCible, tableCible));
  }

  const { desc } = await import("drizzle-orm");
  query = query.orderBy(desc(auditLog.createdAt)).limit(limit);

  return query;
}
