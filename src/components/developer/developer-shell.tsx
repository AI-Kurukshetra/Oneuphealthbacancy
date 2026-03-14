"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BookOpen, Braces, KeyRound, LayoutDashboard, LogOut, PlayCircle, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { getDashboardSession, signOutDashboardUser } from "@/lib/dashboard-api";

const NAV_ITEMS = [
  { href: "/developer", icon: LayoutDashboard, label: "Overview" },
  { href: "/developer/docs", icon: BookOpen, label: "Docs" },
  { href: "/developer/playground", icon: PlayCircle, label: "Playground" },
  { href: "/developer/api-keys", icon: KeyRound, label: "API Keys" },
  { href: "/developer/examples", icon: Braces, label: "Examples" },
];

export function DeveloperShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [displayName, setDisplayName] = useState("Developer");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    void (async () => {
      try {
        const session = await getDashboardSession();
        if (!active) {
          return;
        }

        setDisplayName(session.profile.full_name ?? session.user.email ?? "Developer");
      } catch {
        if (active) {
          router.replace("/login");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [router]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[linear-gradient(180deg,#ecfeff,#f8fafc)] px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl rounded-[2rem] border border-cyan-100 bg-white/80 p-8 shadow-sm">
          <p className="text-sm text-slate-600">Loading developer portal...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#eff7fb_0%,#f8fafc_30%,#f8fafc_100%)]">
      <div className="mx-auto grid min-h-screen max-w-[1600px] gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[280px_minmax(0,1fr)] lg:px-8 xl:px-10">
        <aside className="h-fit rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm lg:sticky lg:top-6">
          <div className="rounded-[1.5rem] bg-[linear-gradient(180deg,#ecfeff,#ffffff)] p-5">
            <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-cyan-800 ring-1 ring-inset ring-cyan-200">
              <Sparkles className="h-3.5 w-3.5" />
              Developer Portal
            </div>
            <h1 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950">{displayName}</h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">Explore documentation, manage API keys, and test HealthBridge endpoints from the browser.</p>
          </div>

          <nav className="mt-5 space-y-2">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${
                    isActive ? "bg-cyan-50 text-cyan-900" : "text-slate-700 hover:bg-slate-100"
                  }`}
                  href={item.href}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-6">
            <Button
              className="w-full"
              onClick={async () => {
                await signOutDashboardUser();
                router.replace("/login");
              }}
              variant="outline"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </Button>
          </div>
        </aside>

        <div className="min-w-0 space-y-6">{children}</div>
      </div>
    </main>
  );
}
