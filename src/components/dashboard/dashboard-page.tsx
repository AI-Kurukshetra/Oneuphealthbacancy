"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";

import { AdminDashboard } from "@/components/dashboard/admin-dashboard";
import { InsuranceDashboard } from "@/components/dashboard/insurance-dashboard";
import { PatientDashboard } from "@/components/dashboard/patient-dashboard";
import { ProviderDashboard } from "@/components/dashboard/provider-dashboard";
import { DashboardLoader } from "@/components/dashboard/shared";
import { ROLE_CAPABILITIES, ROLE_LABELS } from "@/lib/roles";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { getProfilesTableSetupMessage } from "@/lib/supabase/errors";
import type { Database, ProfileRole } from "@/types/database";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type Organization = Database["public"]["Tables"]["organizations"]["Row"];
type AdminSection = "analytics" | "monitor" | "organizations" | "providers" | "users";

function getAdminSection(pathname: string): AdminSection | null {
  if (pathname === "/dashboard/admin" || pathname === "/dashboard/admin/") {
    return "monitor";
  }

  const match = pathname.match(/^\/dashboard\/admin\/([^/]+)$/);
  if (!match) {
    return null;
  }

  const section = match[1];
  if (section === "analytics" || section === "monitor" || section === "organizations" || section === "providers" || section === "users") {
    return section;
  }

  return null;
}

export function DashboardPage() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadUser = async () => {
      const {
        data: { user: currentUser },
        error: userError,
      } = await supabase.auth.getUser();

      if (!isMounted) {
        return;
      }

      if (userError || !currentUser) {
        router.replace("/login");
        return;
      }

      setUser(currentUser);

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("id, role, organization_id, full_name, email, created_at")
        .eq("id", currentUser.id)
        .maybeSingle();

      if (!isMounted) {
        return;
      }

      if (profileError) {
        setError(getProfilesTableSetupMessage(profileError));
        setIsLoading(false);
        return;
      }

      setProfile(profileData ?? null);

      if (profileData?.organization_id) {
        const { data: organizationData } = await supabase
          .from("organizations")
          .select("id, name, type, address, created_at")
          .eq("id", profileData.organization_id)
          .maybeSingle();

        if (isMounted) {
          setOrganization(organizationData ?? null);
        }
      } else if (isMounted) {
        setOrganization(null);
      }

      setIsLoading(false);
    };

    void loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        router.replace("/login");
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [router, supabase]);

  const displayName =
    profile?.full_name ??
    (typeof user?.user_metadata?.full_name === "string" ? user.user_metadata.full_name : user?.email) ??
    "User";

  const role: ProfileRole = profile?.role ?? "patient";
  const adminSection = getAdminSection(pathname);

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (role === "admin") {
      if (pathname === "/dashboard") {
        router.replace("/dashboard/admin/monitor");
        return;
      }

      if (pathname.startsWith("/dashboard/admin") && !adminSection) {
        router.replace("/dashboard/admin/monitor");
        return;
      }
    }

    if (role !== "admin" && pathname.startsWith("/dashboard/admin")) {
      router.replace("/dashboard");
    }
  }, [adminSection, isLoading, pathname, role, router]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.replace("/login");
  };

  if (isLoading) {
    return (
      <main className="py-12">
        <div className="container max-w-7xl">
          <DashboardLoader
            description="We are verifying your role, organization assignment, and latest dashboard data."
            title="Loading dashboard"
          />
        </div>
      </main>
    );
  }

  if (role === "admin") {
    if (!adminSection) {
      return null;
    }

    return (
      <main className="py-10">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12">
          <div className="space-y-6">
            {error ? <p className="text-sm text-rose-600">{error}</p> : null}
            <AdminDashboard
              activeSection={adminSection}
              displayName={displayName}
              onSignOut={handleSignOut}
              supabase={supabase}
            />
          </div>
        </div>
      </main>
    );
  }

  const renderDashboard = () => {
    if (!user) {
      return null;
    }

    switch (role) {
      case "provider":
        return <ProviderDashboard organizationName={organization?.name ?? null} supabase={supabase} userId={user.id} />;
      case "insurance":
        return <InsuranceDashboard organizationName={organization?.name ?? null} supabase={supabase} />;
      case "patient":
      default:
        return <PatientDashboard supabase={supabase} userId={user.id} />;
    }
  };

  return (
    <main className="py-10">
      <div className="container max-w-7xl space-y-6">
        <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm">
          <div className="grid gap-6 bg-[linear-gradient(135deg,#f8fafc,#e2e8f0)] px-6 py-8 lg:grid-cols-[1.4fr_0.9fr] lg:px-8">
            <div className="space-y-4">
              <div className="inline-flex rounded-full border border-slate-300 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">
                {ROLE_LABELS[role]} Dashboard
              </div>
              <div className="space-y-2">
                <h1 className="text-3xl font-semibold text-slate-950">{displayName}</h1>
                <p className="max-w-2xl text-sm leading-6 text-slate-700">
                  This workspace is rendered from the role assigned by the admin. After login, the user lands here and only sees the dashboard for that assigned role.
                </p>
              </div>
            </div>
            <div className="rounded-[1.5rem] border border-slate-200 bg-white/80 p-5 backdrop-blur">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-slate-500">Assigned role</p>
                  <p className="mt-1 text-xl font-semibold text-slate-950">{ROLE_LABELS[role]}</p>
                  <p className="mt-1 text-sm text-slate-600">{organization?.name ?? "No organization assigned"}</p>
                </div>
                <button
                  className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                  onClick={handleSignOut}
                  type="button"
                >
                  Sign out
                </button>
              </div>
              <div className="mt-4 space-y-2 text-sm text-slate-700">
                {ROLE_CAPABILITIES[role].map((capability) => (
                  <p key={capability} className="rounded-2xl bg-slate-50 px-3 py-2">
                    {capability}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </section>

        {error ? <p className="text-sm text-rose-600">{error}</p> : null}
        {renderDashboard()}
      </div>
    </main>
  );
}
