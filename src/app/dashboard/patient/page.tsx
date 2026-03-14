import { PatientRoleDashboard } from "@/components/dashboard/patient-role-dashboard";
import { RoleDashboardPage } from "@/components/dashboard/role-dashboard-page";

export default function PatientDashboardPage() {
  return <RoleDashboardPage role="patient">{(session) => <PatientRoleDashboard session={session} />}</RoleDashboardPage>;
}
