"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { DashboardLoader } from "@/components/dashboard/shared";
import { getDashboardSession, rolePath } from "@/lib/dashboard-api";

export default function DashboardRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    let active = true;

    void (async () => {
      try {
        const session = await getDashboardSession();
        if (!active) {
          return;
        }
        router.replace(rolePath(session.profile.role));
      } catch {
        if (!active) {
          return;
        }
        router.replace("/login");
      }
    })();

    return () => {
      active = false;
    };
  }, [router]);

  return (
    <div className="w-full px-4 py-8 sm:px-6 lg:px-8 xl:px-10">
      <DashboardLoader
        description="We are routing you to the correct dashboard for your role."
        title="Preparing dashboard"
      />
    </div>
  );
}
