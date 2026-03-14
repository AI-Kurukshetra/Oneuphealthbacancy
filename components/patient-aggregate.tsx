"use client";

import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getClientSupabase } from "@/lib/supabase/client";

type BundleEntry = { resource: Record<string, unknown> };

interface ApiBundle {
  resourceType: "Bundle";
  entry: BundleEntry[];
  total: number;
}

interface PatientAggregate {
  patient: Record<string, unknown>;
  encounters: ApiBundle;
  observations: ApiBundle;
  claims: ApiBundle;
  consent: { patient_id: string; organization_id: string; access_type: string; granted: boolean }[];
}

export function PatientAggregate({ patientId }: { patientId: string }) {
  const [data, setData] = useState<PatientAggregate | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [orgId, setOrgId] = useState("");

  const load = async () => {
    const [patientResponse, encounterResponse, observationResponse, claimResponse, consentResponse] = await Promise.all([
      fetch(`/api/patients/${patientId}`, { cache: "no-store" }),
      fetch(`/api/patients/${patientId}/encounters`, { cache: "no-store" }),
      fetch(`/api/patients/${patientId}/observations`, { cache: "no-store" }),
      fetch(`/api/patients/${patientId}/claims`, { cache: "no-store" }),
      fetch(`/api/consent/${patientId}`, { cache: "no-store" }),
    ]);

    const failing = [patientResponse, encounterResponse, observationResponse, claimResponse, consentResponse].find((resp) => !resp.ok);
    if (failing) {
      const payload = (await failing.json()) as { error?: string };
      setError(payload.error ?? "Failed to load aggregate profile");
      return;
    }

    const patientPayload = (await patientResponse.json()) as { data: { entry: BundleEntry[] } };
    const encounterPayload = (await encounterResponse.json()) as { data: ApiBundle };
    const observationPayload = (await observationResponse.json()) as { data: ApiBundle };
    const claimPayload = (await claimResponse.json()) as { data: ApiBundle };
    const consentPayload = (await consentResponse.json()) as { data: PatientAggregate["consent"] };

    setData({
      patient: patientPayload.data.entry[0]?.resource ?? {},
      encounters: encounterPayload.data,
      observations: observationPayload.data,
      claims: claimPayload.data,
      consent: consentPayload.data,
    });
    setError(null);
  };

  useEffect(() => {
    void load();

    const supabase = getClientSupabase();
    const channel = supabase
      .channel(`patient-${patientId}-live`)
      .on("postgres_changes", { event: "*", schema: "public", table: "encounters", filter: `patient_id=eq.${patientId}` }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "observations", filter: `patient_id=eq.${patientId}` }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "claims", filter: `patient_id=eq.${patientId}` }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "consents", filter: `patient_id=eq.${patientId}` }, load)
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [patientId]);

  const setConsent = async (granted: boolean) => {
    const endpoint = granted ? "/api/consent/grant" : "/api/consent/revoke";

    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ patient_id: patientId, organization_id: orgId, access_type: "full" }),
    });

    if (!response.ok) {
      const payload = (await response.json()) as { error?: string };
      setError(payload.error ?? "Consent update failed");
      return;
    }

    await load();
  };

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl space-y-6 px-6 py-12">
      <header className="space-y-1">
        <h1 className="text-3xl font-extrabold">Aggregated Patient Profile</h1>
        <p className="text-sm text-muted-foreground">This view merges records from multiple provider systems.</p>
      </header>

      {error ? <p className="rounded-md bg-red-100 px-3 py-2 text-sm text-red-700">{error}</p> : null}

      <Card>
        <CardHeader>
          <CardTitle>Patient</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="overflow-x-auto rounded bg-muted p-4 text-xs">{JSON.stringify(data?.patient ?? {}, null, 2)}</pre>
        </CardContent>
      </Card>

      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Encounters</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-2 text-3xl font-bold text-primary">{data?.encounters.total ?? 0}</p>
            <div className="space-y-1 text-xs text-muted-foreground">
              {data?.encounters.entry.slice(0, 3).map((entry, index) => (
                <p key={index}>{String((entry.resource.reasonCode as Array<{ text: string }>)?.[0]?.text ?? "Visit")}</p>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Observations</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-2 text-3xl font-bold text-primary">{data?.observations.total ?? 0}</p>
            <div className="space-y-1 text-xs text-muted-foreground">
              {data?.observations.entry.slice(0, 3).map((entry, index) => (
                <p key={index}>{String((entry.resource.code as { text: string })?.text ?? "Lab")}</p>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Claims</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-2 text-3xl font-bold text-primary">{data?.claims.total ?? 0}</p>
            <div className="space-y-1 text-xs text-muted-foreground">
              {data?.claims.entry.slice(0, 3).map((entry, index) => (
                <p key={index}>{String(entry.resource.status ?? "pending")}</p>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Consent Controls</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">Grant or revoke organization access for this patient profile.</p>
          <Input placeholder="Organization UUID" value={orgId} onChange={(event) => setOrgId(event.target.value)} />
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setConsent(true)}>Grant Consent</Button>
            <Button variant="destructive" onClick={() => setConsent(false)}>
              Revoke Consent
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {(data?.consent ?? []).map((item) => (
              <Badge key={`${item.organization_id}-${item.access_type}`} variant={item.granted ? "success" : "warning"}>
                {item.organization_id.slice(0, 8)}... | {item.access_type} | {item.granted ? "granted" : "revoked"}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
