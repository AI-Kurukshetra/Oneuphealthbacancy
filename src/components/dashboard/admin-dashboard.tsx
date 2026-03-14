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
import { MOCK_ADMIN_OVERVIEW } from "@/lib/admin-mock-data";
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

  const applyPayload = (data: AdminOverviewPayload) => {
    setOrganizations(data.organizations ?? []);
    setProfiles(data.profiles ?? []);
    setProviders(data.providers ?? []);
    setAnalyticsMetrics(data.analytics ?? MOCK_ADMIN_OVERVIEW.analytics);
    setClinicalAlerts(Array.isArray(data.alerts) ? data.alerts : MOCK_ADMIN_OVERVIEW.alerts);
    setCounts(data.counts ?? MOCK_ADMIN_OVERVIEW.counts);
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

      if (response.ok && payload?.success && payload.data) {
        const data = payload.data;
        const isEmpty =
          (data.organizations?.length ?? 0) === 0 &&
          (data.profiles?.length ?? 0) === 0 &&
          (data.providers?.length ?? 0) === 0 &&
          (data.counts?.patients ?? 0) === 0;

        if (isEmpty) {
          applyPayload(MOCK_ADMIN_OVERVIEW);
        } else {
          applyPayload({
            ...data,
            alerts: Array.isArray(data.alerts) ? data.alerts : MOCK_ADMIN_OVERVIEW.alerts,
            analytics: data.analytics ?? MOCK_ADMIN_OVERVIEW.analytics,
          });
        }
      } else {
        applyPayload(MOCK_ADMIN_OVERVIEW);
      }
    } catch {
      applyPayload(MOCK_ADMIN_OVERVIEW);
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
      <section className="overflow-hidden rounded-2xl border border-cyan-100/80 bg-gradient-to-br from-cyan-50/60 via-white to-teal-50/40 shadow-[0_4px_24px_rgba(6,182,212,0.08)]">
        <div className="grid gap-6 px-6 py-6 xl:grid-cols-[1.2fr_1fr] xl:px-8 xl:py-8">
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-700 shadow-sm ring-1 ring-cyan-200/60">
                <Sparkles className="h-3.5 w-3.5" />
                Admin Operations
              </span>
              <span className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-white">
                <ShieldCheck className="h-3.5 w-3.5" />
                Control surface
              </span>
            </div>
            <div className="space-y-2">
              <h2 className="max-w-2xl text-2xl font-bold tracking-tight text-slate-950 lg:text-3xl">
                Platform readiness at a glance
              </h2>
              <p className="max-w-xl text-sm leading-7 text-slate-600">
                Track adoption, role coverage, and operational readiness across providers, organizations, and users.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm transition hover:shadow-md">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">Role Coverage</p>
                <div className="mt-3 space-y-2 text-sm text-slate-700">
                  <p className="flex items-center justify-between"><span>Admins</span><span className="font-bold text-slate-950">{roleDistribution.admin}</span></p>
                  <p className="flex items-center justify-between"><span>Providers</span><span className="font-bold text-slate-950">{roleDistribution.provider}</span></p>
                  <p className="flex items-center justify-between"><span>Insurance</span><span className="font-bold text-slate-950">{roleDistribution.insurance}</span></p>
                </div>
              </div>
              <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm transition hover:shadow-md">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">Organization Mix</p>
                <div className="mt-3 space-y-2 text-sm text-slate-700">
                  <p className="flex items-center justify-between"><span>Hospitals</span><span className="font-bold text-slate-950">{organizationMix.hospitals}</span></p>
                  <p className="flex items-center justify-between"><span>Clinics</span><span className="font-bold text-slate-950">{organizationMix.clinics}</span></p>
                  <p className="flex items-center justify-between"><span>Payers</span><span className="font-bold text-slate-950">{organizationMix.insurance}</span></p>
                </div>
              </div>
              <div className="rounded-xl border border-cyan-200/80 bg-gradient-to-br from-cyan-700 to-teal-700 p-4 text-white shadow-md">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-cyan-100">Quick nav</p>
                <p className="mt-3 text-sm leading-6 text-white/95">
                  Use the sidebar to switch between providers, organizations, users, and analytics.
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
                <div key={organization.id} className="group flex items-center justify-between rounded-xl border border-slate-200/80 bg-white px-4 py-4 shadow-sm transition hover:shadow-md">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-50 text-cyan-600">
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-950">{organization.name}</p>
                      <p className="mt-0.5 text-sm text-slate-600">{organization.address ?? "No address set"}</p>
                    </div>
                  </div>
                  <span className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize ${organizationTypeClassName(organization.type)}`}>
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
                <div key={provider.id} className="group rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm transition hover:shadow-md">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-cyan-50 text-cyan-600">
                        <BriefcaseMedical className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-950">{provider.name ?? "Unnamed provider"}</p>
                        <p className="mt-0.5 text-sm text-slate-600">{provider.email ?? "No email"}</p>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2 text-sm text-slate-600">
                    <span className="rounded-lg bg-slate-50 px-3 py-1.5 text-slate-700">Specialty: {provider.specialty ?? "Not set"}</span>
                    <span className="rounded-lg bg-slate-50 px-3 py-1.5 text-slate-700">Org: {provider.organizationName}</span>
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
      <section className="overflow-hidden rounded-2xl border border-cyan-100/80 bg-gradient-to-br from-cyan-50/50 via-white to-white p-6 shadow-[0_4px_24px_rgba(6,182,212,0.06)] lg:p-7">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-700 shadow-sm ring-1 ring-cyan-200/60">
            <Building2 className="h-3.5 w-3.5" />
            Network Setup
          </div>
          <h3 className="text-xl font-bold tracking-tight text-slate-950 lg:text-2xl">Create organizations</h3>
          <p className="text-sm leading-6 text-slate-600">
            Provider and payer entities are managed from this workspace. Each organization becomes available for provider and insurance onboarding.
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

          <div className="lg:col-span-3 flex flex-col gap-4 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
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
                className="group rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all hover:shadow-[0_8px_30px_rgba(15,23,42,0.08)]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <span className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize ${organizationTypeClassName(organization.type)}`}>
                    {organization.type}
                  </span>
                </div>
                <div className="mt-4 space-y-2">
                  <p className="text-base font-semibold text-slate-950">{organization.name}</p>
                  <p className="min-h-10 text-sm leading-6 text-slate-600">{organization.address ?? "Address not set yet."}</p>
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4 text-sm text-slate-500">
                  <span>Created {new Date(organization.created_at).toLocaleDateString()}</span>
                  <span className="inline-flex items-center gap-1 font-medium text-cyan-700">
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
              <div key={provider.id} className="group rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm transition-all hover:shadow-md">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600">
                      <BriefcaseMedical className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-base font-semibold text-slate-950">{provider.name ?? "Unnamed provider"}</p>
                      <p className="mt-0.5 text-sm text-slate-600">{provider.email ?? "No email"}</p>
                    </div>
                  </div>
                </div>
                <div className="mt-4 grid gap-2 text-sm text-slate-600">
                  <p className="rounded-lg bg-slate-50 px-3 py-2 text-slate-700">Specialty: {provider.specialty ?? "Not set"}</p>
                  <p className="rounded-lg bg-slate-50 px-3 py-2 text-slate-700">Organization: {provider.organizationName}</p>
                  <p className="rounded-lg bg-slate-50 px-3 py-2 text-slate-700">
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
      <section className="overflow-hidden rounded-2xl border border-cyan-100/80 bg-gradient-to-br from-cyan-50/50 via-white to-teal-50/30 p-6 shadow-[0_4px_24px_rgba(6,182,212,0.06)]">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
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
                  <div key={alert.id} className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:shadow-md">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-base font-semibold capitalize text-slate-950">{alert.alert_type.replaceAll("_", " ")}</p>
                        <p className="mt-1 text-sm text-slate-500">Patient ID: {alert.patient_id}</p>
                      </div>
                      <span
                        className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize ${
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
      <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-br from-white to-slate-50/30 p-6 shadow-[0_4px_24px_rgba(15,23,42,0.06)] lg:p-7">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-cyan-50 px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-700">
              <UserPlus className="h-3.5 w-3.5" />
              Workforce Provisioning
            </div>
            <h3 className="text-xl font-bold tracking-tight text-slate-950 lg:text-2xl">Create users and assign access</h3>
            <p className="max-w-2xl text-sm leading-6 text-slate-600">
              Create admins, providers, payers, or patients with either invite email or direct temporary-password access.
            </p>
          </div>
          <div className="flex shrink-0 rounded-xl border border-slate-200/80 bg-white px-4 py-3 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">Supported roles</p>
            <p className="mt-2 text-2xl font-bold text-slate-950">{USER_ROLES.length}</p>
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

          <div className="lg:col-span-2 flex flex-col gap-4 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
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
                className="flex flex-col gap-3 rounded-xl border border-slate-200/80 bg-white px-4 py-4 shadow-sm transition hover:shadow-md md:flex-row md:items-center md:justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                    <Users className="h-5 w-5" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="font-semibold text-slate-950">{profile.full_name ?? "Not set"}</p>
                    <p className="text-sm text-slate-600">{profile.email ?? "Not set"}</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize ${roleBadgeClassName(profile.role)}`}>
                    {profile.role}
                  </span>
                  <span className="rounded-lg bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-600">
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
    <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)] 2xl:grid-cols-[340px_minmax(0,1fr)]">
      <aside className="h-fit rounded-2xl border border-slate-200/80 bg-white/90 p-5 shadow-[0_4px_24px_rgba(15,23,42,0.06)] backdrop-blur-sm xl:sticky xl:top-6">
        <div className="space-y-4">
          <div className="rounded-xl border border-cyan-100/80 bg-gradient-to-br from-cyan-50/80 to-white p-4">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-700 shadow-sm">
              <ShieldCheck className="h-3.5 w-3.5" />
              Admin Console
            </div>
            <h2 className="mt-3 text-xl font-bold tracking-tight text-slate-950">{displayName}</h2>
            <p className="mt-1.5 text-sm leading-6 text-slate-600">
              Platform operations at a glance.
            </p>
            <button
              className="mt-4 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50"
              onClick={() => void onSignOut()}
              type="button"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>

          <nav className="space-y-1.5">
            {ADMIN_NAV.map((item) => {
              const Icon = item.icon;
              const isActive = item.key === activeSection;

              return (
                <Link
                  key={item.key}
                  className={`group block rounded-xl px-4 py-3.5 transition-all duration-200 ${
                    isActive
                      ? "bg-gradient-to-r from-cyan-500/10 to-teal-500/10 ring-1 ring-cyan-200/60"
                      : "hover:bg-slate-50"
                  }`}
                  href={item.href}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors ${
                        isActive ? "bg-cyan-600 text-white shadow-md" : "bg-slate-100 text-slate-600 group-hover:bg-slate-200"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <p className={`text-sm font-semibold ${isActive ? "text-cyan-900" : "text-slate-800"}`}>{item.label}</p>
                      <p className="line-clamp-2 text-xs leading-5 text-slate-500">{item.description}</p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </nav>

          <div className="space-y-2">
            <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-sm transition hover:shadow-md">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-cyan-50 p-2 text-cyan-600">
                  <BadgeCheck className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-800">Quick onboarding</p>
                  <p className="text-[11px] leading-4 text-slate-500">Temporary passwords for rapid testing.</p>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-sm transition hover:shadow-md">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-emerald-50 p-2 text-emerald-600">
                  <Hospital className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-800">Org routing</p>
                  <p className="text-[11px] leading-4 text-slate-500">Dedicated pages for workflows.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </aside>

      <div className="space-y-6">
        <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] lg:p-7">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-cyan-50 to-teal-50 px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-800">
                <Sparkles className="h-3.5 w-3.5" />
                Admin Route
              </div>
              <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-950 lg:text-3xl">{sectionTitle(activeSection)}</h1>
              <p className="mt-2 max-w-2xl text-[15px] leading-7 text-slate-600">{sectionDescription(activeSection)}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-lg bg-cyan-50 px-3.5 py-2 text-sm font-medium text-cyan-800 ring-1 ring-cyan-200/60">
                Orgs: {counts.organizations}
              </span>
              <span className="rounded-lg bg-slate-100 px-3.5 py-2 text-sm font-medium text-slate-700">
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
