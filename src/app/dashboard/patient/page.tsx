"use client";

import { RoleDashboardPage } from "@/components/dashboard/role-dashboard-page";

export const dynamic = "force-dynamic";

export default function PatientDashboardPage() {
  return <RoleDashboardPage role="patient" />;
}
