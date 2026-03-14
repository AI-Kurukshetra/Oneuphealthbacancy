"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { DashboardLoader } from "@/components/dashboard/shared";
import { Button } from "@/components/ui/button";
import { Card, StatCard } from "@/components/ui/card";
import { FormField, SelectInput } from "@/components/ui/form-input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import {
  fetchAiSummary,
  fetchAlerts,
  fetchConsentRecords,
  fetchPatientClaims,
  fetchPatientEncounters,
  fetchPatientMedications,
  fetchPatientObservations,
  fetchPatients,
  fetchRiskScore,
  grantConsent,
  revokeConsent,
} from "@/lib/dashboard-api";
import type { DashboardSession } from "@/lib/dashboard-api";
import type { Alert, RiskScore } from "@/types/ai";
import type { Database } from "@/types/database";
import type { Claim, Consent, Encounter, Medication, Observation, Patient } from "@/types/fhir";

const consentSchema = z.object({
  access_type: z.enum(["full", "clinical", "claims", "documents"]),
  organization_id: z.string().min(1, "Organization is required."),
});

type ConsentFormValues = z.infer<typeof consentSchema>;

export function PatientRoleDashboard({ session }: { session: DashboardSession }) {
  const [patient, setPatient] = useState<Patient | null>(null);
  const [organizations, setOrganizations] = useState<Database["public"]["Tables"]["organizations"]["Row"][]>([]);
  const [encounters, setEncounters] = useState<Encounter[]>([]);
  const [observations, setObservations] = useState<Observation[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [consents, setConsents] = useState<Consent[]>([]);
  const [summary, setSummary] = useState<string>("");
  const [riskScore, setRiskScore] = useState<RiskScore | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [consentMessage, setConsentMessage] = useState<string | null>(null);

  const form = useForm<ConsentFormValues>({
    defaultValues: {
      access_type: "full",
      organization_id: "",
    },
  });

  const loadDashboard = async () => {
    const [patients, organizationRows] = await Promise.all([
      fetchPatients(),
      createBrowserSupabaseClient()
        .from("organizations")
        .select("id, name, type, address, created_at")
        .order("name", { ascending: true })
        .then((result) => result.data ?? []),
    ]);

    const currentPatient = patients.find((entry) => entry.user_id === session.user.id) ?? null;
    setPatient(currentPatient);
    setOrganizations(organizationRows);

    if (!currentPatient) {
      setEncounters([]);
      setObservations([]);
      setMedications([]);
      setClaims([]);
      setConsents([]);
      setSummary("");
      setRiskScore(null);
      setAlerts([]);
      return;
    }

    const [encounterRows, observationRows, medicationRows, claimRows, consentRows, summaryPayload, riskPayload, alertRows] = await Promise.all([
      fetchPatientEncounters(currentPatient.id),
      fetchPatientObservations(currentPatient.id),
      fetchPatientMedications(currentPatient.id),
      fetchPatientClaims(currentPatient.id),
      fetchConsentRecords(currentPatient.id),
      fetchAiSummary(currentPatient.id),
      fetchRiskScore(currentPatient.id),
      fetchAlerts(currentPatient.id),
    ]);

    setEncounters(encounterRows);
    setObservations(observationRows);
    setMedications(medicationRows);
    setClaims(claimRows);
    setConsents(consentRows);
    setSummary(summaryPayload.summary);
    setRiskScore(riskPayload);
    setAlerts(alertRows);
  };

  useEffect(() => {
    void (async () => {
      try {
        setLoading(true);
        await loadDashboard();
      } catch (nextError) {
        setError(nextError instanceof Error ? nextError.message : "Unable to load patient dashboard.");
      } finally {
        setLoading(false);
      }
    })();
  }, [session.user.id]);

  const handleConsent = form.handleSubmit(async (values) => {
    const parsed = consentSchema.safeParse(values);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const field = issue.path[0];
        if (typeof field === "string") {
          form.setError(field as keyof ConsentFormValues, { message: issue.message });
        }
      }
      return;
    }

    if (!patient) {
      setError("Patient profile not found.");
      return;
    }

    try {
      setError(null);
      setConsentMessage(null);
      await grantConsent({
        access_type: parsed.data.access_type,
        organization_id: parsed.data.organization_id,
        patient_id: patient.id,
      });
      await loadDashboard();
      setConsentMessage("Consent granted.");
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to grant consent.");
    }
  });

  const handleRevoke = form.handleSubmit(async (values) => {
    const parsed = consentSchema.safeParse(values);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const field = issue.path[0];
        if (typeof field === "string") {
          form.setError(field as keyof ConsentFormValues, { message: issue.message });
        }
      }
      return;
    }

    if (!patient) {
      setError("Patient profile not found.");
      return;
    }

    try {
      setError(null);
      setConsentMessage(null);
      await revokeConsent({
        access_type: parsed.data.access_type,
        organization_id: parsed.data.organization_id,
        patient_id: patient.id,
      });
      await loadDashboard();
      setConsentMessage("Consent revoked.");
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to revoke consent.");
    }
  });

  if (loading) {
    return <DashboardLoader compact description="Loading patient records, claims, medications, and consent history." title="Loading patient dashboard" />;
  }

  return (
    <div className="space-y-6">
      <section id="overview" className="grid gap-4 md:grid-cols-4">
        <StatCard label="Encounters" value={encounters.length} />
        <StatCard label="Lab Results" value={observations.length} />
        <StatCard label="Medications" value={medications.length} />
        <StatCard label="Risk Score" value={riskScore?.risk_score ?? 0} />
      </section>

      {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}

      <Card title="AI Health Insights" description="Rule-based summary, risk prediction, and clinical alerts generated from your record set.">
        <div id="ai-insights" className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-4">
            <div className="rounded-[1.5rem] border border-cyan-100 bg-[linear-gradient(180deg,#ecfeff,#ffffff)] p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-cyan-800">AI Summary</p>
              <p className="mt-3 text-sm leading-7 text-slate-700">{summary || "No AI summary is available yet for this patient."}</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Risk level</p>
                <p className="mt-2 text-lg font-semibold capitalize text-slate-950">{riskScore?.risk_level ?? "low"}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Abnormal observations</p>
                <p className="mt-2 text-lg font-semibold text-slate-950">{riskScore?.abnormal_observations ?? 0}</p>
              </div>
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Claims tracked</p>
                <p className="mt-2 text-lg font-semibold text-slate-950">{riskScore?.claim_count ?? 0}</p>
              </div>
            </div>
          </div>
          <div className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Clinical Alerts</p>
            <div className="mt-4 space-y-3">
              {alerts.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm text-slate-600">
                  No active alerts detected.
                </div>
              ) : (
                alerts.map((alert) => (
                  <div key={alert.id} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold capitalize text-slate-950">{alert.alert_type.replaceAll("_", " ")}</p>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                          alert.severity === "high"
                            ? "bg-rose-100 text-rose-700"
                            : alert.severity === "medium"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        {alert.severity}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{alert.message}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </Card>

      <Card
        title="Patient Profile"
        description="Your demographic and contact information."
      >
        {patient ? (
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Name</p>
              <p className="mt-2 text-lg font-semibold text-slate-950">
                {`${patient.first_name ?? ""} ${patient.last_name ?? ""}`.trim() || "Not available"}
              </p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Date of Birth</p>
              <p className="mt-2 text-lg font-semibold text-slate-950">{patient.date_of_birth ?? "Not available"}</p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Contact</p>
              <p className="mt-2 text-sm text-slate-700">Phone: {patient.phone ?? "Not available"}</p>
              <p className="mt-1 text-sm text-slate-700">Address: {patient.address ?? "Not available"}</p>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-600">
            No patient profile is linked to this user yet.
          </div>
        )}
      </Card>

      <Card title="Medical History" description="Visit history and clinical notes." className="scroll-mt-6" >
        <div id="history" className="space-y-4">
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>Date</TableHeader>
                <TableHeader>Provider</TableHeader>
                <TableHeader>Diagnosis</TableHeader>
                <TableHeader>Notes</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {encounters.length === 0 ? (
                <TableRow>
                  <TableCell className="text-center" colSpan={4}>No encounters found.</TableCell>
                </TableRow>
              ) : (
                encounters.map((encounter) => (
                  <TableRow key={encounter.id}>
                    <TableCell>{encounter.visit_date ?? "-"}</TableCell>
                    <TableCell>{encounter.provider_id ?? "-"}</TableCell>
                    <TableCell>{encounter.diagnosis ?? "-"}</TableCell>
                    <TableCell>{encounter.notes ?? "-"}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Card title="Lab Results" description="Observations, labs, and vitals." >
        <div id="labs">
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>Test Type</TableHeader>
                <TableHeader>Value</TableHeader>
                <TableHeader>Unit</TableHeader>
                <TableHeader>Date</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {observations.length === 0 ? (
                <TableRow>
                  <TableCell className="text-center" colSpan={4}>No lab results found.</TableCell>
                </TableRow>
              ) : (
                observations.map((observation) => (
                  <TableRow key={observation.id}>
                    <TableCell>{observation.type ?? "-"}</TableCell>
                    <TableCell>{observation.value ?? "-"}</TableCell>
                    <TableCell>{observation.unit ?? "-"}</TableCell>
                    <TableCell>{observation.observed_at ?? "-"}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Card title="Medications" description="Current and historic prescriptions.">
        <div id="medications">
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>Name</TableHeader>
                <TableHeader>Dosage</TableHeader>
                <TableHeader>Frequency</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {medications.length === 0 ? (
                <TableRow>
                  <TableCell className="text-center" colSpan={3}>No medications found.</TableCell>
                </TableRow>
              ) : (
                medications.map((medication) => (
                  <TableRow key={medication.id}>
                    <TableCell>{medication.name ?? "-"}</TableCell>
                    <TableCell>{medication.dosage ?? "-"}</TableCell>
                    <TableCell>{medication.frequency ?? "-"}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Card title="Claims History" description="Insurance claims and reimbursement status.">
        <div id="claims">
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>Amount</TableHeader>
                <TableHeader>Status</TableHeader>
                <TableHeader>Submitted Date</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {claims.length === 0 ? (
                <TableRow>
                  <TableCell className="text-center" colSpan={3}>No claims found.</TableCell>
                </TableRow>
              ) : (
                claims.map((claim) => (
                  <TableRow key={claim.id}>
                    <TableCell>{claim.amount ?? "-"}</TableCell>
                    <TableCell>{claim.status ?? "-"}</TableCell>
                    <TableCell>{claim.submitted_at ?? "-"}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Card title="Consent Management" description="Grant or revoke organization access to your records.">
        <div id="consent" className="space-y-5">
          <form className="grid gap-4 lg:grid-cols-[1fr_1fr_auto_auto]" onSubmit={(event) => event.preventDefault()}>
            <FormField error={form.formState.errors.organization_id?.message} label="Organization">
              <SelectInput {...form.register("organization_id")}>
                <option value="">Select organization</option>
                {organizations.map((organization) => (
                  <option key={organization.id} value={organization.id}>
                    {organization.name}
                  </option>
                ))}
              </SelectInput>
            </FormField>
            <FormField error={form.formState.errors.access_type?.message} label="Access Type">
              <SelectInput {...form.register("access_type")}>
                <option value="full">full</option>
                <option value="clinical">clinical</option>
                <option value="claims">claims</option>
                <option value="documents">documents</option>
              </SelectInput>
            </FormField>
            <div className="flex items-end">
              <Button className="w-full" onClick={() => void handleConsent()}>
                Grant Consent
              </Button>
            </div>
            <div className="flex items-end">
              <Button className="w-full" onClick={() => void handleRevoke()} variant="outline">
                Revoke Consent
              </Button>
            </div>
          </form>
          {consentMessage ? <div className="text-sm text-emerald-700">{consentMessage}</div> : null}
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>Organization</TableHeader>
                <TableHeader>Access Type</TableHeader>
                <TableHeader>Status</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {consents.length === 0 ? (
                <TableRow>
                  <TableCell className="text-center" colSpan={3}>No consent records found.</TableCell>
                </TableRow>
              ) : (
                consents.map((consent) => (
                  <TableRow key={consent.id}>
                    <TableCell>{organizations.find((organization) => organization.id === consent.organization_id)?.name ?? consent.organization_id}</TableCell>
                    <TableCell>{consent.access_type}</TableCell>
                    <TableCell>{consent.granted ? "Granted" : "Revoked"}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
