"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  Activity,
  ArrowRight,
  BadgeCheck,
  BriefcaseMedical,
  Building2,
  Hospital,
  LogOut,
  ShieldCheck,
  Sparkles,
  UserPlus,
  Users,
} from "lucide-react";

import { EncounterChart } from "@/components/charts/encounter-chart";
import { PatientGrowth } from "@/components/charts/patient-growth";
import { RiskChart } from "@/components/charts/risk-chart";
import { ORGANIZATION_TYPES, requiresOrganization, ROLE_LABELS, USER_ROLES } from "@/lib/roles";
import type { Alert, AnalyticsMetrics } from "@/types/ai";
import type { Database, ProfileRole } from "@/types/database";

import {
  DashboardLoader,
  DashboardSection,
  EmptyState,
  FormField,
  MetricCard,
  PrimaryButton,
  StatusMessage,
  formatDate,
  inputClassName,
} from "./shared";

type AdminSection = "analytics" | "monitor" | "organizations" | "providers" | "users";

type AdminDashboardProps = {
  activeSection: AdminSection;
  displayName: string;
  onSignOut: () => Promise<void>;
  supabase: SupabaseClient<Database>;
};

type OrganizationRow = Database["public"]["Tables"]["organizations"]["Row"];
type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
type ProviderRow = Database["public"]["Tables"]["providers"]["Row"];
type AdminOverviewPayload = {
  alerts: Alert[];
  analytics: AnalyticsMetrics;
  counts: {
    organizations: number;
    patients: number;
    providers: number;
    users: number;
  };
  organizations: OrganizationRow[];
  profiles: ProfileRow[];
  providers: ProviderRow[];
};

type UserFormState = {
  deliveryMethod: "invite" | "manual_password";
  email: string;
  fullName: string;
  organizationId: string;
  role: ProfileRole;
  specialty: string;
};

const defaultUserForm: UserFormState = {
  deliveryMethod: "manual_password",
  email: "",
  fullName: "",
  organizationId: "",
  role: "patient",
  specialty: "",
};

const ADMIN_NAV: {
  description: string;
  href: string;
  icon: typeof Activity;
  key: AdminSection;
  label: string;
}[] = [
  {
    description: "Roster, specialties, and organization coverage.",
    href: "/dashboard/admin/providers",
    icon: BriefcaseMedical,
    key: "providers",
    label: "Manage providers",
  },
  {
    description: "Network participants and payer/provider entities.",
    href: "/dashboard/admin/organizations",
    icon: Building2,
    key: "organizations",
    label: "Manage organizations",
  },
  {
    description: "Platform counts, readiness, and operational visibility.",
    href: "/dashboard/admin/monitor",
    icon: Activity,
    key: "monitor",
    label: "Monitor system usage",
  },
  {
    description: "Population trends, AI risk distribution, and clinical alerts.",
    href: "/dashboard/admin/analytics",
    icon: Sparkles,
    key: "analytics",
    label: "AI analytics",
  },
  {
    description: "Provision users, assign roles, and issue access.",
    href: "/dashboard/admin/users",
    icon: Users,
    key: "users",
    label: "Create and assign user roles",
  },
];

function organizationTypeClassName(type: OrganizationRow["type"]) {
  switch (type) {
    case "hospital":
      return "bg-cyan-100 text-cyan-800 ring-1 ring-inset ring-cyan-200";
    case "insurance":
      return "bg-emerald-100 text-emerald-800 ring-1 ring-inset ring-emerald-200";
    case "clinic":
    default:
      return "bg-sky-100 text-sky-800 ring-1 ring-inset ring-sky-200";
  }
}

function roleBadgeClassName(role: ProfileRole) {
  switch (role) {
    case "admin":
      return "bg-slate-900 text-white";
    case "provider":
      return "bg-cyan-600 text-white";
    case "insurance":
      return "bg-emerald-600 text-white";
    case "patient":
    default:
      return "bg-slate-200 text-slate-700";
  }
}

function sectionTitle(section: AdminSection) {
  switch (section) {
    case "providers":
      return "Manage Providers";
    case "organizations":
      return "Manage Organizations";
    case "analytics":
      return "AI Analytics";
    case "users":
      return "Create And Assign User Roles";
    case "monitor":
    default:
      return "Monitor System Usage";
  }
}

function sectionDescription(section: AdminSection) {
  switch (section) {
    case "providers":
      return "Review provider roster, specialties, and network assignments.";
    case "organizations":
      return "Create and review healthcare organizations across the exchange.";
    case "analytics":
      return "Track population health metrics, patient risk distribution, and generated clinical alerts.";
    case "users":
      return "Provision users, assign roles, and control onboarding flows.";
    case "monitor":
    default:
      return "Track adoption, role coverage, and operational readiness.";
  }
}

export function AdminDashboard({ activeSection, displayName, onSignOut, supabase }: AdminDashboardProps) {
  const [organizations, setOrganizations] = useState<OrganizationRow[]>([]);
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [providers, setProviders] = useState<ProviderRow[]>([]);
  const [counts, setCounts] = useState({ organizations: 0, patients: 0, providers: 0, users: 0 });
  const [analyticsMetrics, setAnalyticsMetrics] = useState<AnalyticsMetrics | null>(null);
  const [clinicalAlerts, setClinicalAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [userForm, setUserForm] = useState<UserFormState>(defaultUserForm);
  const [orgForm, setOrgForm] = useState({ address: "", name: "", type: ORGANIZATION_TYPES[0] });
  const [userError, setUserError] = useState<string | null>(null);
  const [userSuccess, setUserSuccess] = useState<string | null>(null);
  const [orgError, setOrgError] = useState<string | null>(null);
  const [orgSuccess, setOrgSuccess] = useState<string | null>(null);
  const [submittingOrg, setSubmittingOrg] = useState(false);
  const [submittingUser, setSubmittingUser] = useState(false);

  const organizationNameById = useMemo(
    () => new Map(organizations.map((organization) => [organization.id, organization.name])),
    [organizations],
  );
  const providersWithOrganizations = useMemo(
    () =>
      providers.map((provider) => ({
        ...provider,
        organizationName: organizationNameById.get(provider.organization_id ?? "") ?? "Unassigned",
      })),
    [organizationNameById, providers],
  );
  const roleDistribution = useMemo(
    () => ({
      admin: profiles.filter((profile) => profile.role === "admin").length,
      insurance: profiles.filter((profile) => profile.role === "insurance").length,
      patient: profiles.filter((profile) => profile.role === "patient").length,
      provider: profiles.filter((profile) => profile.role === "provider").length,
    }),
    [profiles],
  );
  const organizationMix = useMemo(
    () => ({
      clinics: organizations.filter((organization) => organization.type === "clinic").length,
      hospitals: organizations.filter((organization) => organization.type === "hospital").length,
      insurance: organizations.filter((organization) => organization.type === "insurance").length,
    }),
    [organizations],
  );

  const getAuthHeaders = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    return {
      Authorization: session?.access_token ? `Bearer ${session.access_token}` : "",
      "Content-Type": "application/json",
    };
  };

  const loadData = async () => {
    setLoading(true);
    setOrgError(null);

    try {
      const headers = await getAuthHeaders();
      const response = await fetch("/api/admin/overview", { cache: "no-store", headers });
      const payload = (await response.json().catch(() => null)) as
        | {
            data?: AdminOverviewPayload;
            error?: string;
            success?: boolean;
          }
        | null;

      if (!response.ok || !payload?.success || !payload.data) {
        throw new Error(payload?.error ?? "Unable to load admin data.");
      }

      setOrganizations(payload.data.organizations);
      setProfiles(payload.data.profiles);
      setProviders(payload.data.providers);
      setAnalyticsMetrics(payload.data.analytics);
      setClinicalAlerts(payload.data.alerts);
      setCounts(payload.data.counts);
    } catch (error) {
      setOrgError(error instanceof Error ? error.message : "Unable to load admin data.");
      setOrganizations([]);
      setProfiles([]);
      setProviders([]);
      setAnalyticsMetrics(null);
      setClinicalAlerts([]);
      setCounts({ organizations: 0, patients: 0, providers: 0, users: 0 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [supabase]);

  const handleCreateOrganization = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmittingOrg(true);
    setOrgError(null);
    setOrgSuccess(null);

    const response = await fetch("/api/admin/organizations", {
      body: JSON.stringify(orgForm),
      headers: await getAuthHeaders(),
      method: "POST",
    });

    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    if (!response.ok) {
      setOrgError(payload?.error ?? "Unable to create organization.");
      setSubmittingOrg(false);
      return;
    }

    setOrgForm({ address: "", name: "", type: ORGANIZATION_TYPES[0] });
    setOrgSuccess("Organization created.");
    await loadData();
    setSubmittingOrg(false);
  };

  const handleCreateUser = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmittingUser(true);
    setUserError(null);
    setUserSuccess(null);

    const response = await fetch("/api/admin/users", {
      body: JSON.stringify({
        deliveryMethod: userForm.deliveryMethod,
        email: userForm.email,
        fullName: userForm.fullName,
        organizationId: userForm.organizationId || null,
        role: userForm.role,
        specialty: userForm.specialty,
      }),
      headers: await getAuthHeaders(),
      method: "POST",
    });

    const payload = (await response.json().catch(() => null)) as {
      data?: {
        deliveryMethod?: "invite" | "manual_password";
        email?: string;
        loginUrl?: string;
        temporaryPassword?: string | null;
      };
      error?: string;
      message?: string;
    } | null;

    if (!response.ok) {
      setUserError(payload?.error ?? "Unable to create user.");
      setSubmittingUser(false);
      return;
    }

    setUserForm(defaultUserForm);
    if (payload?.data?.deliveryMethod === "manual_password") {
      setUserSuccess(
        [
          "User created without email invite.",
          `Login URL: ${payload.data.loginUrl ?? "/login"}`,
          `Email: ${payload.data.email ?? ""}`,
          `Temporary password: ${payload.data.temporaryPassword ?? ""}`,
        ].join("\n"),
      );
    } else {
      setUserSuccess(payload?.message ?? "User created.");
    }

    await loadData();
    setSubmittingUser(false);
  };

  const renderMonitorSection = () => (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[2rem] border border-cyan-100 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.98),_rgba(240,249,255,0.94)_46%,_rgba(230,247,255,0.95)_100%)] shadow-[0_24px_90px_rgba(14,116,144,0.12)]">
        <div className="grid gap-8 px-6 py-7 xl:grid-cols-[1.25fr_0.9fr] xl:px-8 xl:py-8">
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-cyan-800 ring-1 ring-inset ring-cyan-200">
                <Sparkles className="h-3.5 w-3.5" />
                Admin Operations
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-cyan-950 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-50">
                <ShieldCheck className="h-3.5 w-3.5" />
                Control surface
              </span>
            </div>
            <div className="space-y-3">
              <h2 className="max-w-3xl text-3xl font-semibold tracking-tight text-slate-950 lg:text-[2.35rem]">
                Monitor platform readiness across providers, organizations, and user-role coverage.
              </h2>
              <p className="max-w-2xl text-sm leading-7 text-slate-600">
                The sidebar now owns navigation so the main canvas can focus on high-signal operational insights instead of
                squeezing every admin function into one page.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-3xl border border-white/70 bg-white/85 p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Role Coverage</p>
                <div className="mt-3 space-y-2 text-sm text-slate-700">
                  <p className="flex items-center justify-between"><span>Admins</span><span className="font-semibold text-slate-950">{roleDistribution.admin}</span></p>
                  <p className="flex items-center justify-between"><span>Providers</span><span className="font-semibold text-slate-950">{roleDistribution.provider}</span></p>
                  <p className="flex items-center justify-between"><span>Insurance</span><span className="font-semibold text-slate-950">{roleDistribution.insurance}</span></p>
                </div>
              </div>
              <div className="rounded-3xl border border-white/70 bg-white/85 p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Organization Mix</p>
                <div className="mt-3 space-y-2 text-sm text-slate-700">
                  <p className="flex items-center justify-between"><span>Hospitals</span><span className="font-semibold text-slate-950">{organizationMix.hospitals}</span></p>
                  <p className="flex items-center justify-between"><span>Clinics</span><span className="font-semibold text-slate-950">{organizationMix.clinics}</span></p>
                  <p className="flex items-center justify-between"><span>Payers</span><span className="font-semibold text-slate-950">{organizationMix.insurance}</span></p>
                </div>
              </div>
              <div className="rounded-3xl border border-cyan-200 bg-cyan-950 p-4 text-cyan-50 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-200">Action Focus</p>
                <p className="mt-3 text-sm leading-6 text-cyan-50/90">
                  Move between providers, organizations, users, and usage analytics from the sidebar without losing context.
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            <MetricCard label="Users" value={counts.users} />
            <MetricCard label="Providers" value={counts.providers} />
            <MetricCard label="Patients" value={counts.patients} />
            <MetricCard label="Organizations" value={counts.organizations} />
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <DashboardSection title="Recent Organizations" description="Newest network entities added to the exchange.">
          {organizations.length === 0 ? (
            <EmptyState title="No organizations yet" description="Create an organization to establish provider and payer routes." />
          ) : (
            <div className="space-y-3">
              {organizations.slice(0, 4).map((organization) => (
                <div key={organization.id} className="flex items-center justify-between rounded-3xl border border-slate-200 bg-slate-50 px-4 py-4">
                  <div>
                    <p className="font-semibold text-slate-950">{organization.name}</p>
                    <p className="mt-1 text-sm text-slate-600">{organization.address ?? "No address set"}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${organizationTypeClassName(organization.type)}`}>
                    {organization.type}
                  </span>
                </div>
              ))}
            </div>
          )}
        </DashboardSection>

        <DashboardSection title="Recent Providers" description="Latest providers provisioned into the network.">
          {providersWithOrganizations.length === 0 ? (
            <EmptyState title="No providers yet" description="Provider accounts created by admin will appear here." />
          ) : (
            <div className="space-y-3">
              {providersWithOrganizations.slice(0, 4).map((provider) => (
                <div key={provider.id} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold text-slate-950">{provider.name ?? "Unnamed provider"}</p>
                      <p className="mt-1 text-sm text-slate-600">{provider.email ?? "No email"}</p>
                    </div>
                    <div className="rounded-2xl bg-cyan-50 p-2 text-cyan-700">
                      <BriefcaseMedical className="h-5 w-5" />
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2 text-sm text-slate-600">
                    <span className="rounded-full bg-slate-100 px-3 py-1">Specialty: {provider.specialty ?? "Not set"}</span>
                    <span className="rounded-full bg-slate-100 px-3 py-1">Organization: {provider.organizationName}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </DashboardSection>
      </div>
    </div>
  );

  const renderOrganizationsSection = () => (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-cyan-100 bg-[linear-gradient(180deg,rgba(236,254,255,0.95),rgba(255,255,255,1))] p-6 shadow-[0_18px_60px_rgba(8,145,178,0.12)]">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-cyan-800 ring-1 ring-inset ring-cyan-200">
            <Building2 className="h-3.5 w-3.5" />
            Network Setup
          </div>
          <h3 className="text-2xl font-semibold tracking-tight text-slate-950">Create organizations from a dedicated workspace</h3>
          <p className="text-sm leading-6 text-slate-600">
            Provider and payer entities are now managed from their own route so the form and listing can use the full content area.
          </p>
        </div>

        <form className="mt-6 grid gap-4 lg:grid-cols-3" onSubmit={handleCreateOrganization}>
          <FormField label="Organization name">
            <input
              className={inputClassName()}
              onChange={(event) => setOrgForm((current) => ({ ...current, name: event.target.value }))}
              required
              value={orgForm.name}
            />
          </FormField>

          <FormField label="Type">
            <select
              className={inputClassName()}
              onChange={(event) =>
                setOrgForm((current) => ({ ...current, type: event.target.value as (typeof ORGANIZATION_TYPES)[number] }))
              }
              value={orgForm.type}
            >
              {ORGANIZATION_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Address">
            <input
              className={inputClassName()}
              onChange={(event) => setOrgForm((current) => ({ ...current, address: event.target.value }))}
              value={orgForm.address}
            />
          </FormField>

          <div className="lg:col-span-3 flex items-center justify-between gap-4 border-t border-cyan-200 pt-4">
            <div className="text-sm text-slate-500">Each organization becomes immediately available in provider and insurance onboarding.</div>
            <PrimaryButton className="sm:w-auto" disabled={submittingOrg} type="submit">
              {submittingOrg ? "Saving..." : "Create organization"}
            </PrimaryButton>
          </div>
        </form>

        <div className="mt-4 space-y-2">
          <StatusMessage message={orgError} />
          <StatusMessage message={orgSuccess} tone="success" />
        </div>
      </section>

      <DashboardSection title="Organization Directory" description="Every organization currently configured in the exchange.">
        {loading ? (
          <DashboardLoader
            compact
            description="We are loading the current healthcare organization network."
            title="Loading organizations"
          />
        ) : organizations.length === 0 ? (
          <EmptyState title="No organizations yet" description="Create an organization to assign provider and insurance users." />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {organizations.map((organization) => (
              <div
                key={organization.id}
                className="group rounded-[1.75rem] border border-slate-200 bg-[linear-gradient(180deg,#ffffff,#f8fbfd)] p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(15,23,42,0.08)]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-700">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${organizationTypeClassName(organization.type)}`}>
                    {organization.type}
                  </span>
                </div>
                <div className="mt-5 space-y-2">
                  <p className="text-lg font-semibold text-slate-950">{organization.name}</p>
                  <p className="min-h-12 text-sm leading-6 text-slate-600">{organization.address ?? "Address not set yet."}</p>
                </div>
                <div className="mt-5 flex items-center justify-between border-t border-slate-200 pt-4 text-sm text-slate-500">
                  <span>Created {new Date(organization.created_at).toLocaleDateString()}</span>
                  <span className="inline-flex items-center gap-1 font-medium text-cyan-800">
                    Ready <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </DashboardSection>
    </div>
  );

  const renderProvidersSection = () => (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-3">
        <MetricCard label="Providers" value={counts.providers} />
        <MetricCard label="Hospitals" value={organizationMix.hospitals} />
        <MetricCard label="Clinics" value={organizationMix.clinics} />
      </div>

      <DashboardSection title="Provider Directory" description="Monitor provider roster, specialties, and current organization assignments.">
        {loading ? (
          <DashboardLoader
            compact
            description="We are loading the provider roster and organization mappings."
            title="Loading providers"
          />
        ) : providersWithOrganizations.length === 0 ? (
          <EmptyState title="No providers yet" description="Create a provider user from the user-role route and it will appear here." />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {providersWithOrganizations.map((provider) => (
              <div key={provider.id} className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-lg font-semibold text-slate-950">{provider.name ?? "Unnamed provider"}</p>
                    <p className="mt-1 text-sm text-slate-600">{provider.email ?? "No email"}</p>
                  </div>
                  <div className="rounded-2xl bg-cyan-50 p-2 text-cyan-700">
                    <BriefcaseMedical className="h-5 w-5" />
                  </div>
                </div>
                <div className="mt-5 grid gap-2 text-sm text-slate-600">
                  <p className="rounded-2xl bg-slate-50 px-3 py-2">Specialty: {provider.specialty ?? "Not set"}</p>
                  <p className="rounded-2xl bg-slate-50 px-3 py-2">Organization: {provider.organizationName}</p>
                  <p className="rounded-2xl bg-slate-50 px-3 py-2">
                    Linked user: {provider.user_id ? `${provider.user_id.slice(0, 8)}...` : "No linked auth user"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </DashboardSection>
    </div>
  );

  const renderAnalyticsSection = () => (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[2rem] border border-cyan-100 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.99),_rgba(236,254,255,0.94)_46%,_rgba(240,249,255,0.95)_100%)] p-6 shadow-[0_24px_90px_rgba(14,116,144,0.12)]">
        <div className="grid gap-4 xl:grid-cols-4">
          <MetricCard label="Total Patients" value={analyticsMetrics?.total_patients ?? 0} />
          <MetricCard label="Total Encounters" value={analyticsMetrics?.total_encounters ?? 0} />
          <MetricCard label="Total Claims" value={analyticsMetrics?.total_claims ?? 0} />
          <MetricCard label="Average Risk Score" value={analyticsMetrics?.average_risk_score ?? 0} />
        </div>
      </section>

      {loading ? (
        <DashboardLoader
          compact
          description="We are calculating population health analytics and refreshing generated alerts."
          title="Loading analytics"
        />
      ) : !analyticsMetrics ? (
        <EmptyState title="Analytics unavailable" description="Population metrics could not be calculated from the current dataset." />
      ) : (
        <>
          <div className="grid gap-6 xl:grid-cols-3">
            <RiskChart metrics={analyticsMetrics} />
            <PatientGrowth alerts={clinicalAlerts} totalPatients={analyticsMetrics.total_patients} />
            <EncounterChart
              claims={analyticsMetrics.total_claims}
              encounters={analyticsMetrics.total_encounters}
              highRiskPatients={analyticsMetrics.high_risk_patients}
            />
          </div>

          <DashboardSection title="Clinical Alerts" description="Most recent patient alerts generated from abnormal observations, encounter density, and risk scores.">
            {clinicalAlerts.length === 0 ? (
              <EmptyState title="No active alerts" description="Alerts will appear here when high-risk patients or abnormal readings are detected." />
            ) : (
              <div className="grid gap-4 lg:grid-cols-2">
                {clinicalAlerts.slice(0, 10).map((alert) => (
                  <div key={alert.id} className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-base font-semibold capitalize text-slate-950">{alert.alert_type.replaceAll("_", " ")}</p>
                        <p className="mt-1 text-sm text-slate-500">Patient ID: {alert.patient_id}</p>
                      </div>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                          alert.severity === "high"
                            ? "bg-rose-100 text-rose-700"
                            : alert.severity === "medium"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        {alert.severity}
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-6 text-slate-600">{alert.message}</p>
                    <p className="mt-4 text-xs font-medium uppercase tracking-[0.14em] text-slate-400">{formatDate(alert.created_at)}</p>
                  </div>
                ))}
              </div>
            )}
          </DashboardSection>
        </>
      )}
    </div>
  );

  const renderUsersSection = () => (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-cyan-800">
              <UserPlus className="h-3.5 w-3.5" />
              Workforce Provisioning
            </div>
            <h3 className="text-2xl font-semibold tracking-tight text-slate-950">Create users and assign access from one route</h3>
            <p className="max-w-2xl text-sm leading-6 text-slate-600">
              Create admins, providers, payers, or patients with either invite email or direct temporary-password access.
            </p>
          </div>
          <div className="hidden rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-right lg:block">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Supported roles</p>
            <p className="mt-2 text-lg font-semibold text-slate-950">{USER_ROLES.length}</p>
          </div>
        </div>

        <form className="mt-6 grid gap-4 lg:grid-cols-2" onSubmit={handleCreateUser}>
          <FormField label="Full name">
            <input
              className={inputClassName()}
              onChange={(event) => setUserForm((current) => ({ ...current, fullName: event.target.value }))}
              required
              value={userForm.fullName}
            />
          </FormField>

          <FormField label="Email">
            <input
              className={inputClassName()}
              onChange={(event) => setUserForm((current) => ({ ...current, email: event.target.value }))}
              required
              type="email"
              value={userForm.email}
            />
          </FormField>

          <FormField label="Role">
            <select
              className={inputClassName()}
              onChange={(event) =>
                setUserForm((current) => ({
                  ...current,
                  organizationId: requiresOrganization(event.target.value as ProfileRole) ? current.organizationId : "",
                  role: event.target.value as ProfileRole,
                }))
              }
              value={userForm.role}
            >
              {USER_ROLES.map((role) => (
                <option key={role} value={role}>
                  {ROLE_LABELS[role]}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Organization">
            <select
              className={inputClassName()}
              disabled={!requiresOrganization(userForm.role)}
              onChange={(event) => setUserForm((current) => ({ ...current, organizationId: event.target.value }))}
              required={requiresOrganization(userForm.role)}
              value={userForm.organizationId}
            >
              <option value="">Select organization</option>
              {organizations.map((organization) => (
                <option key={organization.id} value={organization.id}>
                  {organization.name}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Specialty (provider only)">
            <input
              className={inputClassName()}
              disabled={userForm.role !== "provider"}
              onChange={(event) => setUserForm((current) => ({ ...current, specialty: event.target.value }))}
              placeholder={userForm.role === "provider" ? "Cardiology, Internal Medicine, Pediatrics..." : ""}
              required={userForm.role === "provider"}
              value={userForm.specialty}
            />
          </FormField>

          <FormField label="Onboarding method">
            <select
              className={inputClassName()}
              onChange={(event) =>
                setUserForm((current) => ({
                  ...current,
                  deliveryMethod: event.target.value as UserFormState["deliveryMethod"],
                }))
              }
              value={userForm.deliveryMethod}
            >
              <option value="manual_password">Create temporary password</option>
              <option value="invite">Send invite email</option>
            </select>
          </FormField>

          <div className="lg:col-span-2 flex flex-col gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-slate-500">
              Provider and insurance users require organization assignment before provisioning.
            </div>
            <PrimaryButton className="sm:w-auto" disabled={submittingUser} type="submit">
              {submittingUser
                ? "Creating user..."
                : userForm.deliveryMethod === "manual_password"
                  ? "Create user with temporary password"
                  : "Create user and send invite"}
            </PrimaryButton>
          </div>
        </form>

        <div className="mt-4 space-y-2">
          <StatusMessage message={userError} />
          <StatusMessage message={userSuccess} tone="success" />
        </div>
      </section>

      <DashboardSection title="User Directory" description="Quick role, email, and organization visibility for every user in the system.">
        {loading ? (
          <DashboardLoader
            compact
            description="We are loading user roles, emails, and organization assignments."
            title="Loading users"
          />
        ) : profiles.length === 0 ? (
          <EmptyState title="No users yet" description="Create users from this route to assign roles and access." />
        ) : (
          <div className="space-y-3">
            {profiles.map((profile) => (
              <div
                key={profile.id}
                className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-slate-50/70 px-4 py-4 md:flex-row md:items-center md:justify-between"
              >
                <div className="space-y-1">
                  <p className="font-semibold text-slate-950">{profile.full_name ?? "Not set"}</p>
                  <p className="text-sm text-slate-600">{profile.email ?? "Not set"}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${roleBadgeClassName(profile.role)}`}>
                    {profile.role}
                  </span>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-600 ring-1 ring-inset ring-slate-200">
                    {organizationNameById.get(profile.organization_id ?? "") ?? "Unassigned"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </DashboardSection>
    </div>
  );

  const renderSection = () => {
    switch (activeSection) {
      case "analytics":
        return renderAnalyticsSection();
      case "providers":
        return renderProvidersSection();
      case "organizations":
        return renderOrganizationsSection();
      case "users":
        return renderUsersSection();
      case "monitor":
      default:
        return renderMonitorSection();
    }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)] 2xl:grid-cols-[360px_minmax(0,1fr)]">
      <aside className="h-fit rounded-[2rem] border border-slate-200 bg-[linear-gradient(180deg,#ffffff,#f6fbff)] p-6 shadow-[0_18px_60px_rgba(15,23,42,0.06)] xl:sticky xl:top-6">
        <div className="space-y-4">
          <div className="rounded-[1.5rem] border border-cyan-100 bg-[linear-gradient(180deg,rgba(236,254,255,0.95),rgba(255,255,255,1))] p-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-800 ring-1 ring-inset ring-cyan-200">
              <ShieldCheck className="h-3.5 w-3.5" />
              Admin Console
            </div>
            <h2 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950">{displayName}</h2>
            <p className="mt-2 text-[15px] leading-7 text-slate-600">
              Sidebar-based admin workspace with route-level navigation for platform operations.
            </p>
            <button
              className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              onClick={() => void onSignOut()}
              type="button"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>

          <nav className="space-y-2">
            {ADMIN_NAV.map((item) => {
              const Icon = item.icon;
              const isActive = item.key === activeSection;

              return (
                <Link
                  key={item.key}
                  className={`block rounded-[1.5rem] border px-4 py-4 transition ${
                    isActive
                      ? "border-cyan-200 bg-cyan-50 shadow-sm"
                      : "border-slate-200 bg-white hover:border-cyan-100 hover:bg-slate-50"
                  }`}
                  href={item.href}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`mt-0.5 rounded-2xl p-2 ${
                        isActive ? "bg-cyan-600 text-white" : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="space-y-1">
                      <p className={`text-[15px] font-semibold ${isActive ? "text-cyan-950" : "text-slate-900"}`}>{item.label}</p>
                      <p className="text-sm leading-6 text-slate-500">{item.description}</p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </nav>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            <div className="rounded-3xl border border-slate-200 bg-white p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-cyan-50 p-2 text-cyan-700">
                  <BadgeCheck className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-950">Temporary-password onboarding</p>
                  <p className="text-xs leading-5 text-slate-500">Avoid invite email rate limits during rapid testing.</p>
                </div>
              </div>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-white p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-emerald-50 p-2 text-emerald-700">
                  <Hospital className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-950">Organization-aware routing</p>
                  <p className="text-xs leading-5 text-slate-500">Use dedicated pages for cleaner workflows and more usable space.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <div className="space-y-6">
        <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-600">
                <Sparkles className="h-3.5 w-3.5" />
                Admin Route
              </div>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 xl:text-[2.6rem]">{sectionTitle(activeSection)}</h1>
              <p className="mt-2 max-w-3xl text-[15px] leading-7 text-slate-600">{sectionDescription(activeSection)}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <span className="rounded-full bg-cyan-50 px-4 py-2 text-sm font-medium text-cyan-800 ring-1 ring-inset ring-cyan-200">
                Organizations: {counts.organizations}
              </span>
              <span className="rounded-full bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700">
                Users: {counts.users}
              </span>
            </div>
          </div>
        </section>

        {renderSection()}
      </div>
    </div>
  );
}
