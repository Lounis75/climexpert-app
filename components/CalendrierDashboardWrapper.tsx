"use client";

import dynamic from "next/dynamic";

const CalendrierDashboard = dynamic(
  () => import("@/app/admin/interventions/CalendrierDashboard"),
  {
    ssr: false,
    loading: () => (
      <div className="h-48 flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
      </div>
    ),
  }
);

export default function CalendrierDashboardWrapper() {
  return <CalendrierDashboard />;
}
