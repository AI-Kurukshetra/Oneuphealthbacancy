"use client";

import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { useDashboardSession } from "@/components/dashboard/dashboard-session-context";
import { DashboardLoader } from "@/components/dashboard/shared";
import { Button } from "@/components/ui/button";
import { Card, StatCard } from "@/components/ui/card";
import { FormField, SelectInput, TextAreaInput, TextInput } from "@/components/ui/form-input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { createEncounter, createMedication, createObservation, fetchPatientEncounters, fetchPatientMedications, fetchPatientObservations, fetchPatients, fetchProviders } from "@/lib/dashboard-api";
import type { Encounter, Medication, Observation, Patient, Provider } from "@/types/fhir";

const encounterSchema = z.object({
  diagnosis: z.string().min(1, "Diagnosis is required."),
  notes: z.string().optional(),
  patient_id: z.string().min(1, "Patient is required."),
  reason: z.string().min(1, "Reason is required."),
  visit_date: z.string().min(1, "Visit date is required."),
});

const observationSchema = z.object({
  encounter_id: z.string().optional(),
  observed_at: z.string().min(1, "Observation date is required."),
  patient_id: z.string().min(1, "Patient is required."),
  type: z.string().min(1, "Type is required."),
  unit: z.string().min(1, "Unit is required."),
  value: z.string().min(1, "Value is required."),
});

const medicationSchema = z.object({
  dosage: z.string().min(1, "Dosage is required."),
  frequency: z.string().min(1, "Frequency is required."),
  name: z.string().min(1, "Medication name is required."),
  patient_id: z.string().min(1, "Patient is required."),
  start_date: z.string().min(1, "Start date is required."),
});

type EncounterFormValues = z.infer<typeof encounterSchema>;
type ObservationFormValues = z.infer<typeof observationSchema>;
type MedicationFormValues = z.infer<typeof medicationSchema>;

export function ProviderRoleDashboard() {
  const session = useDashboardSession();
  const [provider, setProvider] = useState<Provider | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [encounters, setEncounters] = useState<Encounter[]>([]);
  const [observations, setObservations] = useState<Observation[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const deferredSearch = useDeferredValue(searchTerm);

  const encounterForm = useForm<EncounterFormValues>({
    defaultValues: {
      diagnosis: "",
      notes: "",
      patient_id: "",
      reason: "",
      visit_date: "",
    },
  });

  const observationForm = useForm<ObservationFormValues>({
    defaultValues: {
      encounter_id: "",
      observed_at: "",
      patient_id: "",
      type: "",
      unit: "",
      value: "",
    },
  });

  const medicationForm = useForm<MedicationFormValues>({
    defaultValues: {
      dosage: "",
      frequency: "",
      name: "",
      patient_id: "",
      start_date: "",
    },
  });

  useEffect(() => {
    void (async () => {
      try {
        setLoading(true);
        const [providerRows, patientRows] = await Promise.all([fetchProviders(), fetchPatients()]);
        const activeProvider = providerRows.find((row) => row.user_id === session.user.id) ?? null;
        setProvider(activeProvider);
        setPatients(patientRows);
        const initialPatient = patientRows[0]?.id ?? "";
        setSelectedPatientId(initialPatient);
      } catch (nextError) {
        setError(nextError instanceof Error ? nextError.message : "Unable to load provider dashboard.");
      } finally {
        setLoading(false);
      }
    })();
  }, [session.user.id]);

  useEffect(() => {
    if (!selectedPatientId) {
      setEncounters([]);
      setObservations([]);
      setMedications([]);
      return;
    }

    void (async () => {
      try {
        const [encounterRows, observationRows, medicationRows] = await Promise.all([
          fetchPatientEncounters(selectedPatientId),
          fetchPatientObservations(selectedPatientId),
          fetchPatientMedications(selectedPatientId),
        ]);
        setEncounters(encounterRows);
        setObservations(observationRows);
        setMedications(medicationRows);
      } catch (nextError) {
        setError(nextError instanceof Error ? nextError.message : "Unable to load patient details.");
      }
    })();
  }, [selectedPatientId]);

  const filteredPatients = useMemo(() => {
    const needle = deferredSearch.trim().toLowerCase();
    if (!needle) {
      return patients;
    }

    return patients.filter((patient) =>
      `${patient.first_name ?? ""} ${patient.last_name ?? ""}`.trim().toLowerCase().includes(needle),
    );
  }, [deferredSearch, patients]);

  const selectedPatient = patients.find((patient) => patient.id === selectedPatientId) ?? null;

  if (loading) {
    return <DashboardLoader compact description="Loading provider profile, patient directory, and clinical forms." title="Loading provider dashboard" />;
  }

  return (
    <div className="space-y-6">
      <section id="overview" className="grid gap-4 md:grid-cols-4">
        <StatCard label="Patients" value={patients.length} />
        <StatCard label="Encounters" value={encounters.length} />
        <StatCard label="Observations" value={observations.length} />
        <StatCard label="Prescriptions" value={medications.length} />
      </section>

      {error ? <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}
      {message ? <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div> : null}

      <Card title="Provider Overview" description="Current provider assignment and patient search.">
        <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
          <div className="space-y-4">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Provider</p>
              <p className="mt-2 text-lg font-semibold text-slate-950">{provider?.name ?? "Not linked"}</p>
              <p className="mt-1 text-sm text-slate-700">Specialty: {provider?.specialty ?? "Not available"}</p>
              <p className="mt-1 text-sm text-slate-700">Organization: {session.organization?.name ?? "Not available"}</p>
            </div>
            <FormField label="Patient search">
              <TextInput onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search patient by name" value={searchTerm} />
            </FormField>
            <div id="patients" className="max-h-[360px] space-y-2 overflow-y-auto">
              {filteredPatients.map((patient) => {
                const patientLabel = `${patient.first_name ?? ""} ${patient.last_name ?? ""}`.trim() || "Unnamed patient";
                return (
                  <button
                    key={patient.id}
                    className={`w-full rounded-2xl border px-4 py-3 text-left text-sm transition ${
                      selectedPatientId === patient.id ? "border-cyan-300 bg-cyan-50 text-cyan-900" : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                    onClick={() => setSelectedPatientId(patient.id)}
                    type="button"
                  >
                    <p className="font-semibold">{patientLabel}</p>
                    <p className="mt-1 text-xs text-slate-500">{patient.date_of_birth ?? "DOB not available"}</p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-4 rounded-[1.5rem] border border-slate-200 bg-white p-5">
            <h3 className="text-lg font-semibold text-slate-950">Patient detail view</h3>
            {selectedPatient ? (
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Basic info</p>
                  <p className="mt-2 font-semibold text-slate-950">
                    {`${selectedPatient.first_name ?? ""} ${selectedPatient.last_name ?? ""}`.trim() || "Unnamed patient"}
                  </p>
                  <p className="mt-1 text-sm text-slate-700">DOB: {selectedPatient.date_of_birth ?? "Not available"}</p>
                  <p className="mt-1 text-sm text-slate-700">Phone: {selectedPatient.phone ?? "Not available"}</p>
                  <p className="mt-1 text-sm text-slate-700">Address: {selectedPatient.address ?? "Not available"}</p>
                </div>
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Latest activity</p>
                  <p className="mt-2 text-sm text-slate-700">Encounters: {encounters.length}</p>
                  <p className="mt-1 text-sm text-slate-700">Observations: {observations.length}</p>
                  <p className="mt-1 text-sm text-slate-700">Medications: {medications.length}</p>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-600">
                Select a patient to review their information.
              </div>
            )}
          </div>
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card title="Add Encounter" description="Create a new clinical visit." className="xl:col-span-1">
          <form
            className="space-y-4"
            onSubmit={encounterForm.handleSubmit(async (values) => {
              const parsed = encounterSchema.safeParse(values);
              if (!parsed.success) {
                for (const issue of parsed.error.issues) {
                  const field = issue.path[0];
                  if (typeof field === "string") {
                    encounterForm.setError(field as keyof EncounterFormValues, { message: issue.message });
                  }
                }
                return;
              }

              if (!provider?.id || !provider.organization_id) {
                setError("Provider profile is incomplete.");
                return;
              }

              try {
                setError(null);
                await createEncounter({
                  diagnosis: parsed.data.diagnosis,
                  notes: parsed.data.notes ?? null,
                  organization_id: provider.organization_id,
                  patient_id: parsed.data.patient_id,
                  provider_id: provider.id,
                  reason: parsed.data.reason,
                  visit_date: parsed.data.visit_date,
                });
                encounterForm.reset();
                if (selectedPatientId === parsed.data.patient_id) {
                  setEncounters(await fetchPatientEncounters(parsed.data.patient_id));
                }
                setMessage("Encounter created.");
              } catch (nextError) {
                setError(nextError instanceof Error ? nextError.message : "Unable to create encounter.");
              }
            })}
          >
            <FormField error={encounterForm.formState.errors.patient_id?.message} label="Patient">
              <SelectInput {...encounterForm.register("patient_id")}>
                <option value="">Select patient</option>
                {patients.map((patient) => (
                  <option key={patient.id} value={patient.id}>
                    {`${patient.first_name ?? ""} ${patient.last_name ?? ""}`.trim() || "Unnamed patient"}
                  </option>
                ))}
              </SelectInput>
            </FormField>
            <FormField error={encounterForm.formState.errors.visit_date?.message} label="Visit date">
              <TextInput type="datetime-local" {...encounterForm.register("visit_date")} />
            </FormField>
            <FormField error={encounterForm.formState.errors.reason?.message} label="Reason">
              <TextInput {...encounterForm.register("reason")} />
            </FormField>
            <FormField error={encounterForm.formState.errors.diagnosis?.message} label="Diagnosis">
              <TextInput {...encounterForm.register("diagnosis")} />
            </FormField>
            <FormField error={encounterForm.formState.errors.notes?.message} label="Notes">
              <TextAreaInput rows={4} {...encounterForm.register("notes")} />
            </FormField>
            <Button type="submit">Add encounter</Button>
          </form>
        </Card>

        <Card title="Add Observation" description="Capture labs or vitals." className="xl:col-span-1">
          <form
            className="space-y-4"
            onSubmit={observationForm.handleSubmit(async (values) => {
              const parsed = observationSchema.safeParse(values);
              if (!parsed.success) {
                for (const issue of parsed.error.issues) {
                  const field = issue.path[0];
                  if (typeof field === "string") {
                    observationForm.setError(field as keyof ObservationFormValues, { message: issue.message });
                  }
                }
                return;
              }

              try {
                setError(null);
                await createObservation({
                  encounter_id: parsed.data.encounter_id || null,
                  observed_at: parsed.data.observed_at,
                  patient_id: parsed.data.patient_id,
                  type: parsed.data.type,
                  unit: parsed.data.unit,
                  value: parsed.data.value,
                });
                observationForm.reset();
                if (selectedPatientId === parsed.data.patient_id) {
                  setObservations(await fetchPatientObservations(parsed.data.patient_id));
                }
                setMessage("Observation created.");
              } catch (nextError) {
                setError(nextError instanceof Error ? nextError.message : "Unable to create observation.");
              }
            })}
          >
            <FormField error={observationForm.formState.errors.patient_id?.message} label="Patient">
              <SelectInput {...observationForm.register("patient_id")}>
                <option value="">Select patient</option>
                {patients.map((patient) => (
                  <option key={patient.id} value={patient.id}>
                    {`${patient.first_name ?? ""} ${patient.last_name ?? ""}`.trim() || "Unnamed patient"}
                  </option>
                ))}
              </SelectInput>
            </FormField>
            <FormField error={observationForm.formState.errors.encounter_id?.message} label="Encounter">
              <SelectInput {...observationForm.register("encounter_id")}>
                <option value="">No encounter linked</option>
                {encounters.map((encounter) => (
                  <option key={encounter.id} value={encounter.id}>
                    {encounter.reason ?? encounter.id}
                  </option>
                ))}
              </SelectInput>
            </FormField>
            <FormField error={observationForm.formState.errors.type?.message} label="Type">
              <TextInput {...observationForm.register("type")} />
            </FormField>
            <FormField error={observationForm.formState.errors.value?.message} label="Value">
              <TextInput {...observationForm.register("value")} />
            </FormField>
            <FormField error={observationForm.formState.errors.unit?.message} label="Unit">
              <TextInput {...observationForm.register("unit")} />
            </FormField>
            <FormField error={observationForm.formState.errors.observed_at?.message} label="Observed at">
              <TextInput type="datetime-local" {...observationForm.register("observed_at")} />
            </FormField>
            <Button type="submit">Add observation</Button>
          </form>
        </Card>

        <Card title="Add Medication" description="Create a prescription record." className="xl:col-span-1">
          <form
            className="space-y-4"
            onSubmit={medicationForm.handleSubmit(async (values) => {
              const parsed = medicationSchema.safeParse(values);
              if (!parsed.success) {
                for (const issue of parsed.error.issues) {
                  const field = issue.path[0];
                  if (typeof field === "string") {
                    medicationForm.setError(field as keyof MedicationFormValues, { message: issue.message });
                  }
                }
                return;
              }

              if (!provider?.id) {
                setError("Provider profile is incomplete.");
                return;
              }

              try {
                setError(null);
                await createMedication({
                  dosage: parsed.data.dosage,
                  frequency: parsed.data.frequency,
                  name: parsed.data.name,
                  patient_id: parsed.data.patient_id,
                  provider_id: provider.id,
                  start_date: parsed.data.start_date,
                });
                medicationForm.reset();
                if (selectedPatientId === parsed.data.patient_id) {
                  setMedications(await fetchPatientMedications(parsed.data.patient_id));
                }
                setMessage("Medication created.");
              } catch (nextError) {
                setError(nextError instanceof Error ? nextError.message : "Unable to create medication.");
              }
            })}
          >
            <FormField error={medicationForm.formState.errors.patient_id?.message} label="Patient">
              <SelectInput {...medicationForm.register("patient_id")}>
                <option value="">Select patient</option>
                {patients.map((patient) => (
                  <option key={patient.id} value={patient.id}>
                    {`${patient.first_name ?? ""} ${patient.last_name ?? ""}`.trim() || "Unnamed patient"}
                  </option>
                ))}
              </SelectInput>
            </FormField>
            <FormField error={medicationForm.formState.errors.name?.message} label="Medication name">
              <TextInput {...medicationForm.register("name")} />
            </FormField>
            <FormField error={medicationForm.formState.errors.dosage?.message} label="Dosage">
              <TextInput {...medicationForm.register("dosage")} />
            </FormField>
            <FormField error={medicationForm.formState.errors.frequency?.message} label="Frequency">
              <TextInput {...medicationForm.register("frequency")} />
            </FormField>
            <FormField error={medicationForm.formState.errors.start_date?.message} label="Start date">
              <TextInput type="date" {...medicationForm.register("start_date")} />
            </FormField>
            <Button type="submit">Add medication</Button>
          </form>
        </Card>
      </div>

      <Card title="Patient Clinical Data" description="The selected patient's encounters, observations, and medications.">
        {!selectedPatient ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-600">
            Select a patient to review their clinical records.
          </div>
        ) : (
          <div className="space-y-6">
            <div id="encounters">
              <h3 className="mb-3 text-lg font-semibold text-slate-950">Encounters</h3>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeader>Date</TableHeader>
                    <TableHeader>Reason</TableHeader>
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
                        <TableCell>{encounter.reason ?? "-"}</TableCell>
                        <TableCell>{encounter.diagnosis ?? "-"}</TableCell>
                        <TableCell>{encounter.notes ?? "-"}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            <div id="observations">
              <h3 className="mb-3 text-lg font-semibold text-slate-950">Observations</h3>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableHeader>Type</TableHeader>
                    <TableHeader>Value</TableHeader>
                    <TableHeader>Unit</TableHeader>
                    <TableHeader>Date</TableHeader>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {observations.length === 0 ? (
                    <TableRow>
                      <TableCell className="text-center" colSpan={4}>No observations found.</TableCell>
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

            <div id="prescriptions">
              <h3 className="mb-3 text-lg font-semibold text-slate-950">Prescriptions</h3>
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
          </div>
        )}
      </Card>
    </div>
  );
}
