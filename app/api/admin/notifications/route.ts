import { NextRequest, NextResponse } from "next/server";
import {
  getUnreadCount,
  getRecentNotifications,
  markAllAsRead,
  markAsRead,
} from "@/lib/notifications";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    if (searchParams.get("count") === "1") {
      const count = await getUnreadCount();
      return NextResponse.json({ count });
    }
    const notifs = await getRecentNotifications();
    return NextResponse.json({ notifications: notifs });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    if (body.id) {
      await markAsRead(body.id);
    } else {
      await markAllAsRead();
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
