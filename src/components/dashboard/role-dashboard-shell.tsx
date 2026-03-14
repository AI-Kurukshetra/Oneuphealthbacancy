"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Activity, ClipboardList, FileHeart, FlaskConical, HeartPulse, LogOut, Pill, Shield, Stethoscope, UserRoundSearch, UsersRound } from "lucide-react";
import type { ReactNode } from "react";

import { signOutDashboardUser } from "@/lib/dashboard-api";
import type { ProfileRole } from "@/types/database";

import { Button } from "@/components/ui/button";

type NavItem = {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
};

const NAV_ITEMS: Record<"patient" | "provider" | "insurance", NavItem[]> = {
  insurance: [
    { href: "#overview", icon: Activity, label: "Dashboard" },
    { href: "#claims", icon: ClipboardList, label: "Claims" },
    { href: "#analytics", icon: Shield, label: "Analytics" },
  ],
  patient: [
    { href: "#overview", icon: Activity, label: "Dashboard" },
    { href: "#ai-insights", icon: FileHeart, label: "AI Insights" },
    { href: "#history", icon: HeartPulse, label: "Medical History" },
    { href: "#labs", icon: FlaskConical, label: "Lab Results" },
    { href: "#medications", icon: Pill, label: "Medications" },
    { href: "#claims", icon: ClipboardList, label: "Claims" },
    { href: "#consent", icon: Shield, label: "Consent" },
  ],
  provider: [
    { href: "#overview", icon: Activity, label: "Dashboard" },
    { href: "#patients", icon: UserRoundSearch, label: "Patients" },
    { href: "#encounters", icon: Stethoscope, label: "Encounters" },
    { href: "#observations", icon: FlaskConical, label: "Observations" },
    { href: "#prescriptions", icon: Pill, label: "Prescriptions" },
  ],
};

function dashboardLabel(role: Exclude<ProfileRole, "admin">) {
  return role === "patient" ? "Patient Workspace" : role === "provider" ? "Provider Workspace" : "Insurance Workspace";
}

export function RoleDashboardShell({
  children,
  organizationName,
  role,
  userName,
}: {
  children: ReactNode;
  organizationName?: string | null;
  role: Exclude<ProfileRole, "admin">;
  userName: string;
}) {
  const router = useRouter();
  const navItems = NAV_ITEMS[role];

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#eff7fb_0%,#f8fafc_28%,#f8fafc_100%)]">
      <div className="w-full px-4 py-6 sm:px-6 lg:px-8 xl:px-10">
        <div className="mb-6 flex flex-col gap-4 rounded-[2rem] border border-cyan-100 bg-white/90 px-6 py-5 shadow-sm backdrop-blur lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-700">{dashboardLabel(role)}</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">{userName}</h1>
            <p className="mt-2 text-sm text-slate-600">{organizationName ?? "No organization assigned"}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden rounded-2xl bg-cyan-50 px-4 py-3 text-sm text-cyan-900 sm:block">
              HealthBridge unified interoperability dashboard
            </div>
            <Button
              variant="outline"
              onClick={async () => {
                await signOutDashboardUser();
                router.replace("/login");
              }}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </Button>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="h-fit rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm xl:sticky xl:top-6">
            <div className="rounded-[1.5rem] bg-[linear-gradient(180deg,#ecfeff,#ffffff)] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-700">Navigation</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">Jump between the main workflow areas for your role.</p>
            </div>
            <nav className="mt-4 space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.label}
                    className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-100 hover:text-slate-950"
                    href={item.href}
                  >
                    <Icon className="h-4 w-4 text-cyan-700" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <div className="mt-5 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
              <div className="flex items-center gap-2 text-slate-900">
                {role === "patient" ? <FileHeart className="h-4 w-4 text-cyan-700" /> : role === "provider" ? <UsersRound className="h-4 w-4 text-cyan-700" /> : <Shield className="h-4 w-4 text-cyan-700" />}
                <span className="font-semibold">Active role</span>
              </div>
              <p className="mt-2 leading-6">{dashboardLabel(role)}</p>
            </div>
          </aside>

          <div className="min-w-0 space-y-6">{children}</div>
        </div>
      </div>
    </main>
  );
}
