"use client";

import { InsuranceRoleDashboard } from "@/components/dashboard/insurance-role-dashboard";
import { RoleDashboardPage } from "@/components/dashboard/role-dashboard-page";

export function InsuranceDashboardClient() {
  return (
    <RoleDashboardPage role="insurance">
      <InsuranceRoleDashboard />
    </RoleDashboardPage>
  );
}
