"use client";

import { RoleDashboardPage } from "@/components/dashboard/role-dashboard-page";

export const dynamic = "force-dynamic";

export default function InsuranceDashboardPage() {
  return <RoleDashboardPage role="insurance" />;
}
