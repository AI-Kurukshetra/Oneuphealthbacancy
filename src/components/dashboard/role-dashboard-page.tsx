"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

import { DashboardLoader } from "@/components/dashboard/shared";
import { RoleDashboardShell } from "@/components/dashboard/role-dashboard-shell";
import { getDashboardSession, rolePath } from "@/lib/dashboard-api";
import type { DashboardSession } from "@/lib/dashboard-api";
import type { ProfileRole } from "@/types/database";

type AllowedRole = Exclude<ProfileRole, "admin">;

export function RoleDashboardPage({
  children,
  role,
}: {
  children: (session: DashboardSession) => ReactNode;
  role: AllowedRole;
}) {
  const router = useRouter();
  const [session, setSession] = useState<DashboardSession | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    void (async () => {
      try {
        const nextSession = await getDashboardSession();
        if (!active) {
          return;
        }

        if (nextSession.profile.role === "admin") {
          router.replace(rolePath("admin"));
          return;
        }

        if (nextSession.profile.role !== role) {
          router.replace(rolePath(nextSession.profile.role));
          return;
        }

        setSession(nextSession);
      } catch (nextError) {
        if (!active) {
          return;
        }

        if (nextError instanceof Error && nextError.message === "Unauthorized") {
          router.replace("/login");
          return;
        }

        setError(nextError instanceof Error ? nextError.message : "Unable to load dashboard.");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [role, router]);

  if (loading) {
    return (
      <div className="w-full px-4 py-8 sm:px-6 lg:px-8 xl:px-10">
        <DashboardLoader
          description="We are resolving your authenticated role and preparing the requested dashboard."
          title="Loading dashboard"
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full px-4 py-8 sm:px-6 lg:px-8 xl:px-10">
        <div className="rounded-[1.75rem] border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">{error}</div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <RoleDashboardShell
      organizationName={session.organization?.name ?? null}
      role={role}
      userName={session.profile.full_name ?? session.user.email ?? "User"}
    >
      {children(session)}
    </RoleDashboardShell>
  );
}
