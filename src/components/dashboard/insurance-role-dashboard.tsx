"use client";

import { useEffect, useMemo, useState } from "react";

import { useDashboardSession } from "@/components/dashboard/dashboard-session-context";
import { DashboardLoader } from "@/components/dashboard/shared";
import { Button } from "@/components/ui/button";
import { Card, StatCard } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  MOCK_CLAIMS,
  MOCK_PATIENTS_FOR_CLAIMS,
  MOCK_PROVIDERS_FOR_CLAIMS,
} from "@/lib/insurance-mock-data";
import { fetchClaims, fetchConsentRecords, fetchPatient, fetchProvider, updateClaimStatus } from "@/lib/dashboard-api";
import type { Claim, Consent, Patient, Provider } from "@/types/fhir";

type EnrichedClaim = Claim & {
  consentApproved: boolean;
  patient: Patient | null;
  provider: Provider | null;
};

function buildEnrichedClaims(
  claimRows: Claim[],
  patientMap: Map<string, Patient>,
  providerMap: Map<string, Provider>,
  consentMap: Map<string, Consent[]>,
  orgId: string | null,
): EnrichedClaim[] {
  return claimRows.map((claim) => {
    const consentRows = consentMap.get(claim.patient_id ?? "") ?? [];
    const consentApproved = consentRows.some(
      (consent) =>
        consent.organization_id === orgId &&
        consent.granted &&
        (consent.access_type === "claims" || consent.access_type === "full"),
    );

    return {
      ...claim,
      consentApproved,
      patient: claim.patient_id ? patientMap.get(claim.patient_id) ?? null : null,
      provider: claim.provider_id ? providerMap.get(claim.provider_id) ?? null : null,
    };
  });
}

export function InsuranceRoleDashboard() {
  const session = useDashboardSession();
  const [claims, setClaims] = useState<EnrichedClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    void (async () => {
      try {
        setLoading(true);
        setError(null);

        let claimRows: Claim[];
        const patientMap = new Map<string, Patient>();
        const providerMap = new Map<string, Provider>();
        const consentMap = new Map<string, Consent[]>();

        try {
          claimRows = await fetchClaims();
          if (claimRows.length === 0) {
            claimRows = MOCK_CLAIMS;
            MOCK_PATIENTS_FOR_CLAIMS.forEach((p) => patientMap.set(p.id, p));
            MOCK_PROVIDERS_FOR_CLAIMS.forEach((p) => providerMap.set(p.id, p));
          } else {
            const patientIds = [...new Set(claimRows.map((c) => c.patient_id).filter((v): v is string => Boolean(v)))];
            const providerIds = [...new Set(claimRows.map((c) => c.provider_id).filter((v): v is string => Boolean(v)))];

            const [patientEntries, providerEntries, consentEntries] = await Promise.all([
              Promise.all(patientIds.map(async (id) => [id, await fetchPatient(id)] as const)),
              Promise.all(providerIds.map(async (id) => [id, await fetchProvider(id)] as const)),
              Promise.all(patientIds.map(async (id) => [id, await fetchConsentRecords(id)] as const)),
            ]);

            patientEntries.forEach(([id, p]) => patientMap.set(id, p));
            providerEntries.forEach(([id, p]) => providerMap.set(id, p));
            consentEntries.forEach(([id, c]) => consentMap.set(id, c));
          }
        } catch {
          claimRows = MOCK_CLAIMS;
          MOCK_PATIENTS_FOR_CLAIMS.forEach((p) => patientMap.set(p.id, p));
          MOCK_PROVIDERS_FOR_CLAIMS.forEach((p) => providerMap.set(p.id, p));
        }

        setClaims(
          buildEnrichedClaims(
            claimRows,
            patientMap,
            providerMap,
            consentMap,
            session.profile.organization_id,
          ),
        );
      } catch (nextError) {
        setError(nextError instanceof Error ? nextError.message : "Unable to load insurance dashboard.");
      } finally {
        setLoading(false);
      }
    })();
  }, [session.profile.organization_id]);

  const claimCounts = useMemo(
    () => ({
      approved: claims.filter((claim) => claim.status === "approved").length,
      pending: claims.filter((claim) => claim.status === "pending").length,
      rejected: claims.filter((claim) => claim.status === "rejected").length,
    }),
    [claims],
  );

  if (loading) {
    return <DashboardLoader compact description="Loading claims, patient details, provider details, and consent verification." title="Loading insurance dashboard" />;
  }

  return (
    <div className="space-y-6">
      <section id="overview" className="grid gap-4 md:grid-cols-4">
        <StatCard label="Organization" value={session.organization?.name ?? "Not linked"} />
        <StatCard label="Pending Claims" value={claimCounts.pending} />
        <StatCard label="Approved" value={claimCounts.approved} />
        <StatCard label="Rejected" value={claimCounts.rejected} />
      </section>

      {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}
      {message ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div> : null}

      <Card title="Claims Management" description="Review insurance claims and approve or reject them.">
        <div id="claims" className="space-y-4">
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>Patient</TableHeader>
                <TableHeader>Provider</TableHeader>
                <TableHeader>Amount</TableHeader>
                <TableHeader>Status</TableHeader>
                <TableHeader>Consent</TableHeader>
                <TableHeader>Actions</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {claims.length === 0 ? (
                <TableRow>
                  <TableCell className="text-center" colSpan={6}>No claims found.</TableCell>
                </TableRow>
              ) : (
                claims.map((claim) => (
                  <TableRow key={claim.id}>
                    <TableCell>
                      {claim.patient ? `${claim.patient.first_name ?? ""} ${claim.patient.last_name ?? ""}`.trim() || claim.patient.id : claim.patient_id ?? "-"}
                    </TableCell>
                    <TableCell>{claim.provider?.name ?? claim.provider_id ?? "-"}</TableCell>
                    <TableCell>{claim.amount ?? "-"}</TableCell>
                    <TableCell>{claim.status ?? "-"}</TableCell>
                    <TableCell>{claim.consentApproved ? "Verified" : "Missing consent"}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          disabled={updatingId === claim.id}
                          onClick={async () => {
                            try {
                              setUpdatingId(claim.id);
                              if (claim.id.startsWith("mock-")) {
                                setClaims((current) => current.map((entry) => (entry.id === claim.id ? { ...entry, status: "approved" } : entry)));
                                setMessage("Claim approved. (Demo)");
                              } else {
                                await updateClaimStatus(claim.id, "approved");
                                setClaims((current) => current.map((entry) => (entry.id === claim.id ? { ...entry, status: "approved" } : entry)));
                                setMessage("Claim approved.");
                              }
                            } catch (nextError) {
                              setError(nextError instanceof Error ? nextError.message : "Unable to approve claim.");
                            } finally {
                              setUpdatingId(null);
                            }
                          }}
                        >
                          Approve
                        </Button>
                        <Button
                          disabled={updatingId === claim.id}
                          onClick={async () => {
                            try {
                              setUpdatingId(claim.id);
                              if (claim.id.startsWith("mock-")) {
                                setClaims((current) => current.map((entry) => (entry.id === claim.id ? { ...entry, status: "rejected" } : entry)));
                                setMessage("Claim rejected. (Demo)");
                              } else {
                                await updateClaimStatus(claim.id, "rejected");
                                setClaims((current) => current.map((entry) => (entry.id === claim.id ? { ...entry, status: "rejected" } : entry)));
                                setMessage("Claim rejected.");
                              }
                            } catch (nextError) {
                              setError(nextError instanceof Error ? nextError.message : "Unable to reject claim.");
                            } finally {
                              setUpdatingId(null);
                            }
                          }}
                          variant="outline"
                        >
                          Reject
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Card title="Claims Analytics" description="Simple operational summary for payer workflow.">
        <div id="analytics" className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-2xl bg-slate-50 p-5">
            <p className="text-sm text-slate-500">Claims with verified consent</p>
            <p className="mt-3 text-3xl font-semibold text-slate-950">{claims.filter((claim) => claim.consentApproved).length}</p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-5">
            <p className="text-sm text-slate-500">Average claim amount</p>
            <p className="mt-3 text-3xl font-semibold text-slate-950">
              {claims.length === 0
                ? 0
                : Math.round(claims.reduce((sum, claim) => sum + (claim.amount ?? 0), 0) / claims.length)}
            </p>
          </div>
          <div className="rounded-2xl bg-slate-50 p-5">
            <p className="text-sm text-slate-500">Pending review rate</p>
            <p className="mt-3 text-3xl font-semibold text-slate-950">
              {claims.length === 0 ? 0 : Math.round((claimCounts.pending / claims.length) * 100)}%
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
