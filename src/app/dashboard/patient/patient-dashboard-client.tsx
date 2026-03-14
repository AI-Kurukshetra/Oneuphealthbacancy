"use client";

import { PatientRoleDashboard } from "@/components/dashboard/patient-role-dashboard";
import { RoleDashboardPage } from "@/components/dashboard/role-dashboard-page";

export function PatientDashboardClient() {
  return (
    <RoleDashboardPage role="patient">
      <PatientRoleDashboard />
    </RoleDashboardPage>
  );
}
