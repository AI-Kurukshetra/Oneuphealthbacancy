"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getClientSupabase } from "@/lib/supabase/client";

type PatientRow = {
  id: string;
  name: string;
  dob: string;
  gender: string;
};

type DashboardResponse = {
  data: {
    resourceType: "Bundle";
    entry: Array<{ resource: { id: string; name: Array<{ text: string }>; birthDate: string; gender: string } }>;
  };
};

export function DashboardShell() {
  const [patients, setPatients] = useState<PatientRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = getClientSupabase();

    const loadPatients = async () => {
      setLoading(true);
      const response = await fetch("/api/patients", { cache: "no-store" });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        setError(payload.error ?? "Failed to load patients");
        setLoading(false);
        return;
      }

      const payload = (await response.json()) as DashboardResponse;
      const rows = payload.data.entry.map((entry) => ({
        id: entry.resource.id,
        name: entry.resource.name?.[0]?.text ?? "Unknown",
        dob: entry.resource.birthDate,
        gender: entry.resource.gender,
      }));

      setPatients(rows);
      setLoading(false);
    };

    void loadPatients();

    const channel = supabase
      .channel("patients-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "patients" }, () => {
        void loadPatients();
      })
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  const patientCount = useMemo(() => patients.length, [patients]);

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl space-y-6 px-6 py-12">
      <section className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">HealthBridge Dashboard</h1>
          <p className="text-sm text-muted-foreground">Unified profile exchange with consent-governed access.</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">FHIR APIs</Badge>
          <Badge variant="success">Consent Enabled</Badge>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Total Patients</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-extrabold text-primary">{patientCount}</p>
          </CardContent>
        </Card>
        <Card className="md:col-span-3">
          <CardHeader>
            <CardTitle>Demo API Links</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2 text-sm">
            <code className="rounded bg-muted px-2 py-1">GET /api/patients</code>
            <code className="rounded bg-muted px-2 py-1">POST /api/encounters</code>
            <code className="rounded bg-muted px-2 py-1">POST /api/consent/grant</code>
            <code className="rounded bg-muted px-2 py-1">POST /api/consent/revoke</code>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Patients</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? <p className="text-sm text-muted-foreground">Loading records...</p> : null}
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          {!loading && !error && patients.length === 0 ? <p className="text-sm text-muted-foreground">No patients found.</p> : null}
          {patients.map((patient) => (
            <div key={patient.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-white/90 px-4 py-3">
              <div>
                <p className="font-semibold">{patient.name}</p>
                <p className="text-xs text-muted-foreground">
                  DOB: {patient.dob} | Gender: {patient.gender}
                </p>
              </div>
              <Link href={`/patients/${patient.id}`} className={buttonVariants()}>
                Open Aggregated Profile
              </Link>
            </div>
          ))}
        </CardContent>
      </Card>
    </main>
  );
}
