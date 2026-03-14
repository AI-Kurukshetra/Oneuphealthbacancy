import { InsuranceRoleDashboard } from "@/components/dashboard/insurance-role-dashboard";
import { RoleDashboardPage } from "@/components/dashboard/role-dashboard-page";

export default function InsuranceDashboardPage() {
  return <RoleDashboardPage role="insurance">{(session) => <InsuranceRoleDashboard session={session} />}</RoleDashboardPage>;
}
