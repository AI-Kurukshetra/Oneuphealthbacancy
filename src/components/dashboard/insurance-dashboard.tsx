"use client";

import { useEffect, useMemo, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";

import { MOCK_INSURANCE_CLAIMS_ENRICHED } from "@/lib/insurance-mock-data";
import type { Database } from "@/types/database";

import {
  DashboardLoader,
  DashboardSection,
  EmptyState,
  MetricCard,
  PrimaryButton,
  SecondaryButton,
  StatusMessage,
  formatDate,
} from "./shared";

type InsuranceClaim = {
  amount: number | null;
  created_at: string;
  id: string;
  latestEncounter: {
    diagnosis: string | null;
    reason: string | null;
    visit_date: string | null;
  } | null;
  patient_name: string;
  provider_name: string;
  status: "pending" | "approved" | "rejected" | null;
  submitted_at: string | null;
};

export function InsuranceDashboard({
  organizationName,
  supabase,
}: {
  organizationName: string | null;
  supabase: SupabaseClient<Database>;
}) {
  const [claims, setClaims] = useState<InsuranceClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [updatingClaimId, setUpdatingClaimId] = useState<string | null>(null);

  const getAuthHeaders = async (includeJsonContentType = false) => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    return {
      Authorization: session?.access_token ? `Bearer ${session.access_token}` : "",
      ...(includeJsonContentType ? { "Content-Type": "application/json" } : {}),
    };
  };

  const loadClaims = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/insurance/claims", {
        cache: "no-store",
        headers: await getAuthHeaders(),
      });
      const payload = (await response.json().catch(() => null)) as { data?: InsuranceClaim[]; error?: string } | null;

      if (response.ok && Array.isArray(payload?.data)) {
        setClaims(payload.data.length > 0 ? payload.data : MOCK_INSURANCE_CLAIMS_ENRICHED);
      } else {
        setClaims(MOCK_INSURANCE_CLAIMS_ENRICHED);
      }
    } catch {
      setClaims(MOCK_INSURANCE_CLAIMS_ENRICHED);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadClaims();
  }, [supabase]);

  const counts = useMemo(
    () => ({
      approved: claims.filter((claim) => claim.status === "approved").length,
      pending: claims.filter((claim) => claim.status === "pending").length,
      rejected: claims.filter((claim) => claim.status === "rejected").length,
    }),
    [claims],
  );

  const updateStatus = async (claimId: string, status: "pending" | "approved" | "rejected") => {
    setUpdatingClaimId(claimId);
    setError(null);
    setSuccess(null);

    if (claimId.startsWith("mock-")) {
      setClaims((prev) =>
        prev.map((c) => (c.id === claimId ? { ...c, status } : c)),
      );
      setSuccess(`Claim moved to ${status}. (Demo)`);
      setUpdatingClaimId(null);
      return;
    }

    const response = await fetch("/api/insurance/claims", {
      body: JSON.stringify({ claimId, status }),
      headers: await getAuthHeaders(true),
      method: "PATCH",
    });

    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    if (!response.ok) {
      setError(payload?.error ?? "Unable to update claim.");
      setUpdatingClaimId(null);
      return;
    }

    setSuccess(`Claim moved to ${status}.`);
    await loadClaims();
    setUpdatingClaimId(null);
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Organization" value={organizationName ?? "Unassigned"} />
        <MetricCard label="Pending Claims" value={counts.pending} />
        <MetricCard label="Approved" value={counts.approved} />
        <MetricCard label="Rejected" value={counts.rejected} />
      </div>

      <DashboardSection title="Claims Review Queue" description="Insurance users can verify treatments and manage claim status changes.">
        <StatusMessage message={error} />
        <StatusMessage message={success} tone="success" />
        {loading ? (
          <DashboardLoader
            compact
            description="We are collecting claim records and the latest verification context."
            title="Loading claim queue"
          />
        ) : claims.length === 0 ? (
          <EmptyState
            title="No claims for this payer"
            description="Claims submitted to this insurance organization will appear here for verification."
          />
        ) : (
          <div className="space-y-4">
            {claims.map((claim) => (
              <div key={claim.id} className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-1 text-sm text-slate-700">
                    <p className="text-lg font-semibold text-slate-950">{claim.patient_name}</p>
                    <p>Provider: {claim.provider_name}</p>
                    <p>Claim amount: {claim.amount ?? 0}</p>
                    <p>Submitted: {formatDate(claim.submitted_at ?? claim.created_at)}</p>
                    <p>Status: {claim.status ?? "pending"}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <PrimaryButton
                      disabled={updatingClaimId === claim.id}
                      onClick={() => void updateStatus(claim.id, "approved")}
                    >
                      Approve
                    </PrimaryButton>
                    <SecondaryButton
                      disabled={updatingClaimId === claim.id}
                      onClick={() => void updateStatus(claim.id, "rejected")}
                    >
                      Reject
                    </SecondaryButton>
                    <SecondaryButton
                      disabled={updatingClaimId === claim.id}
                      onClick={() => void updateStatus(claim.id, "pending")}
                    >
                      Mark pending
                    </SecondaryButton>
                  </div>
                </div>

                <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-700">
                  <p className="font-medium text-slate-950">Treatment verification</p>
                  {claim.latestEncounter ? (
                    <div className="mt-2 space-y-1">
                      <p>Reason: {claim.latestEncounter.reason ?? "Not recorded"}</p>
                      <p>Diagnosis: {claim.latestEncounter.diagnosis ?? "Not recorded"}</p>
                      <p>Visit date: {formatDate(claim.latestEncounter.visit_date)}</p>
                    </div>
                  ) : (
                    <p className="mt-2">No encounter data was found for this claim yet.</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </DashboardSection>
    </div>
  );
}
