"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { fetchApi } from "@/lib/dashboard-api";
import type { DeveloperProfilePayload } from "@/types/developer";

export function DeveloperDashboard() {
  const [payload, setPayload] = useState<DeveloperProfilePayload | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      try {
        setPayload(await fetchApi<DeveloperProfilePayload>("/api/developer/profile"));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">Loading developer dashboard...</div>;
  }

  const cards = [
    { label: "Total API Requests", value: payload?.stats.total_api_requests ?? 0 },
    { label: "Active API Keys", value: payload?.stats.active_api_keys ?? 0 },
    { label: "Available Endpoints", value: payload?.stats.available_endpoints ?? 0 },
  ];

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-cyan-100 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.98),_rgba(236,254,255,0.94)_46%,_rgba(240,249,255,0.95)_100%)] p-6 shadow-[0_24px_90px_rgba(14,116,144,0.12)]">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-700">Overview</p>
          <h2 className="text-3xl font-semibold tracking-tight text-slate-950">Build against HealthBridge APIs with live documentation, key issuance, and browser testing.</h2>
          <p className="max-w-3xl text-sm leading-7 text-slate-600">
            {payload?.developer
              ? `Registered developer organization: ${payload.developer.organization_name}.`
              : "Register a developer organization to start issuing API keys and tracking request volume."}
          </p>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {cards.map((card) => (
          <div key={card.label} className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium uppercase tracking-[0.14em] text-slate-500">{card.label}</p>
            <p className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">{card.value}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-lg font-semibold text-slate-950">Documentation</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">Browse endpoint definitions, sample requests, and example responses.</p>
          <div className="mt-4">
            <Link href="/developer/docs">
              <Button>Open docs</Button>
            </Link>
          </div>
        </div>
        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-lg font-semibold text-slate-950">Playground</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">Send live requests from the browser using your active API keys.</p>
          <div className="mt-4">
            <Link href="/developer/playground">
              <Button>Open playground</Button>
            </Link>
          </div>
        </div>
        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-lg font-semibold text-slate-950">API Keys</p>
          <p className="mt-2 text-sm leading-6 text-slate-600">Register as a developer and generate scoped keys for external integrations.</p>
          <div className="mt-4">
            <Link href="/developer/api-keys">
              <Button>Manage keys</Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
