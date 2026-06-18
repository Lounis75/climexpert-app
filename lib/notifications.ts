import { db } from "@/lib/db";
import { notifications } from "@/lib/db/schema";
import type { InferSelectModel } from "drizzle-orm";
import { eq, and, isNull, desc } from "drizzle-orm";
import { createId } from "@paralleldrive/cuid2";

export type Notification = InferSelectModel<typeof notifications>;

// Les notifications admin ont adminId = NULL. Celles dont adminId est renseigné
// sont destinées à un technicien (table polymorphe) et ne doivent PAS apparaître
// dans la cloche admin.
export async function getUnreadCount(): Promise<number> {
  const rows = await db
    .select({ id: notifications.id })
    .from(notifications)
    .where(and(eq(notifications.lu, false), isNull(notifications.adminId)));
  return rows.length;
}

export async function getRecentNotifications(limit = 15): Promise<Notification[]> {
  return db
    .select()
    .from(notifications)
    .where(isNull(notifications.adminId))
    .orderBy(desc(notifications.createdAt))
    .limit(limit);
}

export async function getAllNotifications(): Promise<Notification[]> {
  return db
    .select()
    .from(notifications)
    .where(isNull(notifications.adminId))
    .orderBy(desc(notifications.createdAt));
}

export async function markAllAsRead(): Promise<void> {
  await db
    .update(notifications)
    .set({ lu: true })
    .where(and(eq(notifications.lu, false), isNull(notifications.adminId)));
}

export async function markAsRead(id: string): Promise<void> {
  await db.update(notifications).set({ lu: true }).where(eq(notifications.id, id));
}

export async function createNotification(data: {
  type: string;
  titre: string;
  contenu?: string;
  refType?: string;
  refId?: string;
}): Promise<void> {
  await db.insert(notifications).values({
    id: createId(),
    type: data.type,
    titre: data.titre,
    contenu: data.contenu ?? null,
    lu: false,
    refType: data.refType ?? null,
    refId: data.refId ?? null,
  });
}
