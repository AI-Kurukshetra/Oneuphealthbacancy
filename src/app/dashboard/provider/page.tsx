"use client";

import { ProviderRoleDashboard } from "@/components/dashboard/provider-role-dashboard";
import { RoleDashboardPage } from "@/components/dashboard/role-dashboard-page";

export default function ProviderDashboardPage() {
  return (
    <RoleDashboardPage role="provider">
      <ProviderRoleDashboard />
    </RoleDashboardPage>
  );
}
