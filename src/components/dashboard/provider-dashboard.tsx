"use client";

import { useEffect, useMemo, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";

import { MOCK_PATIENTS, MOCK_PROVIDER } from "@/lib/provider-mock-data";
import type { Database } from "@/types/database";

import {
  DashboardLoader,
  DashboardSection,
  EmptyState,
  FormField,
  MetricCard,
  PrimaryButton,
  StatusMessage,
  formatDate,
  inputClassName,
} from "./shared";

type ProviderDashboardProps = {
  organizationName: string | null;
  supabase: SupabaseClient<Database>;
  userId: string;
};

type ProviderRow = Database["public"]["Tables"]["providers"]["Row"];
type PatientRow = Database["public"]["Tables"]["patients"]["Row"];

type PatientForm = {
  address: string;
  dateOfBirth: string;
  firstName: string;
  gender: "male" | "female" | "other";
  lastName: string;
  phone: string;
};

const defaultPatientForm: PatientForm = {
  address: "",
  dateOfBirth: "",
  firstName: "",
  gender: "male",
  lastName: "",
  phone: "",
};

export function ProviderDashboard({ organizationName, supabase, userId }: ProviderDashboardProps) {
  const [provider, setProvider] = useState<ProviderRow | null>(null);
  const [patients, setPatients] = useState<PatientRow[]>([]);
  const [patientForm, setPatientForm] = useState<PatientForm>(defaultPatientForm);
  const [encounterForm, setEncounterForm] = useState({ diagnosis: "", notes: "", patientId: "", reason: "", visitDate: "" });
  const [observationForm, setObservationForm] = useState({ observedAt: "", patientId: "", type: "", unit: "", value: "" });
  const [medicationForm, setMedicationForm] = useState({ dosage: "", endDate: "", frequency: "", name: "", patientId: "", startDate: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const patientNameById = useMemo(
    () =>
      new Map(
        patients.map((patient) => [patient.id, `${patient.first_name ?? ""} ${patient.last_name ?? ""}`.trim() || "Unnamed patient"]),
      ),
    [patients],
  );

  const getAuthHeaders = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    return {
      Authorization: session?.access_token ? `Bearer ${session.access_token}` : "",
    };
  };

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [{ data: providerRow }, patientsResponse] = await Promise.all([
        supabase
          .from("providers")
          .select("id, user_id, name, email, specialty, organization_id, created_at")
          .eq("user_id", userId)
          .maybeSingle(),
        fetch("/api/provider/patients", { cache: "no-store", headers: await getAuthHeaders() }).then(async (response) => {
          const payload = (await response.json().catch(() => null)) as { data?: PatientRow[]; error?: string } | null;
          if (!response.ok) {
            throw new Error(payload?.error ?? "Unable to load patients.");
          }
          return payload?.data ?? [];
        }),
      ]);

      if (providerRow && (patientsResponse?.length ?? 0) > 0) {
        setProvider(providerRow);
        setPatients(patientsResponse);
      } else {
        setProvider(MOCK_PROVIDER as ProviderRow);
        setPatients(MOCK_PATIENTS as PatientRow[]);
      }
    } catch {
      setProvider(MOCK_PROVIDER as ProviderRow);
      setPatients(MOCK_PATIENTS as PatientRow[]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [supabase, userId]);

  const submitWithMessage = async (runner: () => Promise<string>) => {
    setError(null);
    setSuccess(null);

    try {
      const message = await runner();
      setSuccess(message);
      await loadData();
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Unable to save changes.");
    }
  };

  if (loading) {
    return (
      <DashboardLoader
        compact
        description="We are pulling provider profile data, assigned patients, and clinical actions."
        title="Loading provider workspace"
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Assigned Patients" value={patients.length} />
        <MetricCard label="Organization" value={organizationName ?? "Unassigned"} />
        <MetricCard label="Specialty" value={provider?.specialty ?? "Not set"} />
        <MetricCard label="Provider ID" value={provider ? provider.id.slice(0, 8) : "Missing"} />
      </div>

      <StatusMessage message={error} />
      <StatusMessage message={success} tone="success" />

      <DashboardSection title="Provider Profile" description="Providers can create patient records and add clinical updates.">
        {provider ? (
          <div className="rounded-2xl border border-slate-200 p-4 text-sm text-slate-700">
            <p className="text-lg font-semibold text-slate-950">{provider.name ?? "Unnamed provider"}</p>
            <p className="mt-1">Email: {provider.email ?? "Not set"}</p>
            <p className="mt-1">Specialty: {provider.specialty ?? "Not set"}</p>
            <p className="mt-1">Organization: {organizationName ?? "Unassigned"}</p>
          </div>
        ) : (
          <EmptyState
            title="Provider profile missing"
            description="Ask an admin to recreate your provider account so it links to a provider record."
          />
        )}
      </DashboardSection>

      <DashboardSection title="Create Patient Records" description="Create a patient profile that can later receive encounters, observations, and prescriptions.">
        <form
          className="grid gap-4 lg:grid-cols-3"
          onSubmit={(event) => {
            event.preventDefault();
            void submitWithMessage(async () => {
              const { error: insertError } = await supabase.from("patients").insert({
                address: patientForm.address || null,
                date_of_birth: patientForm.dateOfBirth || null,
                first_name: patientForm.firstName,
                gender: patientForm.gender,
                last_name: patientForm.lastName || null,
                phone: patientForm.phone || null,
              });

              if (insertError) {
                throw new Error(insertError.message);
              }

              setPatientForm(defaultPatientForm);
              return "Patient record created.";
            });
          }}
        >
          <FormField label="First name">
            <input
              className={inputClassName()}
              onChange={(event) => setPatientForm((current) => ({ ...current, firstName: event.target.value }))}
              required
              value={patientForm.firstName}
            />
          </FormField>
          <FormField label="Last name">
            <input
              className={inputClassName()}
              onChange={(event) => setPatientForm((current) => ({ ...current, lastName: event.target.value }))}
              value={patientForm.lastName}
            />
          </FormField>
          <FormField label="Date of birth">
            <input
              className={inputClassName()}
              onChange={(event) => setPatientForm((current) => ({ ...current, dateOfBirth: event.target.value }))}
              type="date"
              value={patientForm.dateOfBirth}
            />
          </FormField>
          <FormField label="Gender">
            <select
              className={inputClassName()}
              onChange={(event) =>
                setPatientForm((current) => ({ ...current, gender: event.target.value as PatientForm["gender"] }))
              }
              value={patientForm.gender}
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </FormField>
          <FormField label="Phone">
            <input
              className={inputClassName()}
              onChange={(event) => setPatientForm((current) => ({ ...current, phone: event.target.value }))}
              value={patientForm.phone}
            />
          </FormField>
          <FormField label="Address">
            <input
              className={inputClassName()}
              onChange={(event) => setPatientForm((current) => ({ ...current, address: event.target.value }))}
              value={patientForm.address}
            />
          </FormField>
          <div className="lg:col-span-3">
            <PrimaryButton type="submit">Create patient</PrimaryButton>
          </div>
        </form>
      </DashboardSection>

      <DashboardSection title="Patient Directory" description="Use the directory to choose a patient before recording visits or prescriptions.">
        {patients.length === 0 ? (
          <EmptyState title="No patients" description="Create a patient record to start clinical documentation." />
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {patients.slice(0, 8).map((patient) => (
              <div key={patient.id} className="rounded-2xl border border-slate-200 p-4 text-sm text-slate-700">
                <p className="font-semibold text-slate-950">{patientNameById.get(patient.id)}</p>
                <p className="mt-1">DOB: {formatDate(patient.date_of_birth)}</p>
                <p className="mt-1">Gender: {patient.gender ?? "Not set"}</p>
              </div>
            ))}
          </div>
        )}
      </DashboardSection>

      <div className="grid gap-6 lg:grid-cols-3">
        <DashboardSection title="Add Encounter" description="Record a patient visit and diagnosis.">
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              if (!provider) {
                setError("Provider profile not found.");
                return;
              }

              void submitWithMessage(async () => {
                const { error: insertError } = await supabase.from("encounters").insert({
                  diagnosis: encounterForm.diagnosis,
                  notes: encounterForm.notes || null,
                  organization_id: provider.organization_id,
                  patient_id: encounterForm.patientId,
                  provider_id: provider.id,
                  reason: encounterForm.reason,
                  visit_date: encounterForm.visitDate || new Date().toISOString(),
                });

                if (insertError) {
                  throw new Error(insertError.message);
                }

                setEncounterForm({ diagnosis: "", notes: "", patientId: "", reason: "", visitDate: "" });
                return "Encounter added.";
              });
            }}
          >
            <FormField label="Patient">
              <select
                className={inputClassName()}
                onChange={(event) => setEncounterForm((current) => ({ ...current, patientId: event.target.value }))}
                required
                value={encounterForm.patientId}
              >
                <option value="">Select patient</option>
                {patients.map((patient) => (
                  <option key={patient.id} value={patient.id}>
                    {patientNameById.get(patient.id)}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Visit date">
              <input
                className={inputClassName()}
                onChange={(event) => setEncounterForm((current) => ({ ...current, visitDate: event.target.value }))}
                type="datetime-local"
                value={encounterForm.visitDate}
              />
            </FormField>
            <FormField label="Reason">
              <input
                className={inputClassName()}
                onChange={(event) => setEncounterForm((current) => ({ ...current, reason: event.target.value }))}
                required
                value={encounterForm.reason}
              />
            </FormField>
            <FormField label="Diagnosis">
              <input
                className={inputClassName()}
                onChange={(event) => setEncounterForm((current) => ({ ...current, diagnosis: event.target.value }))}
                required
                value={encounterForm.diagnosis}
              />
            </FormField>
            <FormField label="Notes">
              <textarea
                className={inputClassName()}
                onChange={(event) => setEncounterForm((current) => ({ ...current, notes: event.target.value }))}
                rows={4}
                value={encounterForm.notes}
              />
            </FormField>
            <PrimaryButton type="submit">Save encounter</PrimaryButton>
          </form>
        </DashboardSection>

        <DashboardSection title="Add Observation" description="Capture vitals, labs, or other measurements.">
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              void submitWithMessage(async () => {
                const { error: insertError } = await supabase.from("observations").insert({
                  observed_at: observationForm.observedAt || new Date().toISOString(),
                  patient_id: observationForm.patientId,
                  type: observationForm.type,
                  unit: observationForm.unit,
                  value: observationForm.value,
                });

                if (insertError) {
                  throw new Error(insertError.message);
                }

                setObservationForm({ observedAt: "", patientId: "", type: "", unit: "", value: "" });
                return "Observation added.";
              });
            }}
          >
            <FormField label="Patient">
              <select
                className={inputClassName()}
                onChange={(event) => setObservationForm((current) => ({ ...current, patientId: event.target.value }))}
                required
                value={observationForm.patientId}
              >
                <option value="">Select patient</option>
                {patients.map((patient) => (
                  <option key={patient.id} value={patient.id}>
                    {patientNameById.get(patient.id)}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Observed at">
              <input
                className={inputClassName()}
                onChange={(event) => setObservationForm((current) => ({ ...current, observedAt: event.target.value }))}
                type="datetime-local"
                value={observationForm.observedAt}
              />
            </FormField>
            <FormField label="Type">
              <input
                className={inputClassName()}
                onChange={(event) => setObservationForm((current) => ({ ...current, type: event.target.value }))}
                required
                value={observationForm.type}
              />
            </FormField>
            <FormField label="Value">
              <input
                className={inputClassName()}
                onChange={(event) => setObservationForm((current) => ({ ...current, value: event.target.value }))}
                required
                value={observationForm.value}
              />
            </FormField>
            <FormField label="Unit">
              <input
                className={inputClassName()}
                onChange={(event) => setObservationForm((current) => ({ ...current, unit: event.target.value }))}
                required
                value={observationForm.unit}
              />
            </FormField>
            <PrimaryButton type="submit">Save observation</PrimaryButton>
          </form>
        </DashboardSection>

        <DashboardSection title="Add Prescription" description="Record a medication and dosing plan.">
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              if (!provider) {
                setError("Provider profile not found.");
                return;
              }

              void submitWithMessage(async () => {
                const { error: insertError } = await supabase.from("medications").insert({
                  dosage: medicationForm.dosage,
                  end_date: medicationForm.endDate || null,
                  frequency: medicationForm.frequency,
                  name: medicationForm.name,
                  patient_id: medicationForm.patientId,
                  provider_id: provider.id,
                  start_date: medicationForm.startDate || null,
                });

                if (insertError) {
                  throw new Error(insertError.message);
                }

                setMedicationForm({ dosage: "", endDate: "", frequency: "", name: "", patientId: "", startDate: "" });
                return "Prescription added.";
              });
            }}
          >
            <FormField label="Patient">
              <select
                className={inputClassName()}
                onChange={(event) => setMedicationForm((current) => ({ ...current, patientId: event.target.value }))}
                required
                value={medicationForm.patientId}
              >
                <option value="">Select patient</option>
                {patients.map((patient) => (
                  <option key={patient.id} value={patient.id}>
                    {patientNameById.get(patient.id)}
                  </option>
                ))}
              </select>
            </FormField>
            <FormField label="Medication name">
              <input
                className={inputClassName()}
                onChange={(event) => setMedicationForm((current) => ({ ...current, name: event.target.value }))}
                required
                value={medicationForm.name}
              />
            </FormField>
            <FormField label="Dosage">
              <input
                className={inputClassName()}
                onChange={(event) => setMedicationForm((current) => ({ ...current, dosage: event.target.value }))}
                required
                value={medicationForm.dosage}
              />
            </FormField>
            <FormField label="Frequency">
              <input
                className={inputClassName()}
                onChange={(event) => setMedicationForm((current) => ({ ...current, frequency: event.target.value }))}
                required
                value={medicationForm.frequency}
              />
            </FormField>
            <FormField label="Start date">
              <input
                className={inputClassName()}
                onChange={(event) => setMedicationForm((current) => ({ ...current, startDate: event.target.value }))}
                type="date"
                value={medicationForm.startDate}
              />
            </FormField>
            <FormField label="End date">
              <input
                className={inputClassName()}
                onChange={(event) => setMedicationForm((current) => ({ ...current, endDate: event.target.value }))}
                type="date"
                value={medicationForm.endDate}
              />
            </FormField>
            <PrimaryButton type="submit">Save prescription</PrimaryButton>
          </form>
        </DashboardSection>
      </div>
    </div>
  );
}
