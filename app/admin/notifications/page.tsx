import AdminHeader from "@/components/AdminHeader";
import { getAllNotifications } from "@/lib/notifications";
import NotificationsClient from "./NotificationsClient";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const notifs = await getAllNotifications();

  return (
    <div className="min-h-screen bg-[#080d18]">
      <AdminHeader />
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Notifications</h1>
            <p className="text-slate-400 text-sm mt-0.5">
              {notifs.filter((n) => !n.lu).length} non lue{notifs.filter((n) => !n.lu).length > 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <NotificationsClient initialNotifs={notifs} />
      </main>
    </div>
  );
}
