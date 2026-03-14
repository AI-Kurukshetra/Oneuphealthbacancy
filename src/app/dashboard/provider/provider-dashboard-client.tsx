"use client";

import { ProviderRoleDashboard } from "@/components/dashboard/provider-role-dashboard";
import { RoleDashboardPage } from "@/components/dashboard/role-dashboard-page";

export function ProviderDashboardClient() {
  return (
    <RoleDashboardPage role="provider">
      <ProviderRoleDashboard />
    </RoleDashboardPage>
  );
}
