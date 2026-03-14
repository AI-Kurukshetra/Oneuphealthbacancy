"use client";

import { useEffect, useMemo, useState } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";

import { CONSENT_ACCESS_TYPES } from "@/lib/roles";
import type { Database } from "@/types/database";

import {
  DashboardLoader,
  DashboardSection,
  EmptyState,
  FormField,
  MetricCard,
  PrimaryButton,
  SecondaryButton,
  StatusMessage,
  formatDate,
  inputClassName,
} from "./shared";

type PatientDashboardProps = {
  supabase: SupabaseClient<Database>;
  userId: string;
};

type PatientRow = Database["public"]["Tables"]["patients"]["Row"];
type OrganizationRow = Database["public"]["Tables"]["organizations"]["Row"];
type ConsentRow = Database["public"]["Tables"]["consents"]["Row"];
type DocumentRow = Database["public"]["Tables"]["documents"]["Row"];
type EncounterRow = Database["public"]["Tables"]["encounters"]["Row"];
type ObservationRow = Database["public"]["Tables"]["observations"]["Row"];
type MedicationRow = Database["public"]["Tables"]["medications"]["Row"];
type ClaimRow = Database["public"]["Tables"]["claims"]["Row"];

function patientName(patient: PatientRow | null) {
  if (!patient) {
    return "Patient";
  }

  return `${patient.first_name ?? ""} ${patient.last_name ?? ""}`.trim() || "Patient";
}

async function readFile(file: File) {
  return await new Promise<ArrayBuffer>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Unable to read file."));
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.readAsArrayBuffer(file);
  });
}

export function PatientDashboard({ supabase, userId }: PatientDashboardProps) {
  const [patient, setPatient] = useState<PatientRow | null>(null);
  const [organizations, setOrganizations] = useState<OrganizationRow[]>([]);
  const [consents, setConsents] = useState<ConsentRow[]>([]);
  const [documents, setDocuments] = useState<DocumentRow[]>([]);
  const [encounters, setEncounters] = useState<EncounterRow[]>([]);
  const [observations, setObservations] = useState<ObservationRow[]>([]);
  const [medications, setMedications] = useState<MedicationRow[]>([]);
  const [claims, setClaims] = useState<ClaimRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [consentForm, setConsentForm] = useState({ accessType: CONSENT_ACCESS_TYPES[0], organizationId: "" });
  const [consentError, setConsentError] = useState<string | null>(null);
  const [consentSuccess, setConsentSuccess] = useState<string | null>(null);
  const [documentError, setDocumentError] = useState<string | null>(null);
  const [documentSuccess, setDocumentSuccess] = useState<string | null>(null);
  const [documentTitle, setDocumentTitle] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const organizationNameById = useMemo(
    () => new Map(organizations.map((organization) => [organization.id, organization.name])),
    [organizations],
  );

  const loadData = async () => {
    setLoading(true);

    const { data: patientRow } = await supabase
      .from("patients")
      .select("id, user_id, first_name, last_name, date_of_birth, gender, phone, address, created_at")
      .eq("user_id", userId)
      .maybeSingle();

    setPatient(patientRow ?? null);

    const organizationsResult = await supabase
      .from("organizations")
      .select("id, name, type, address, created_at")
      .order("name", { ascending: true });
    setOrganizations(organizationsResult.data ?? []);

    if (!patientRow) {
      setConsents([]);
      setDocuments([]);
      setEncounters([]);
      setObservations([]);
      setMedications([]);
      setClaims([]);
      setLoading(false);
      return;
    }

    const [consentsResult, documentsResult, encountersResult, observationsResult, medicationsResult, claimsResult] =
      await Promise.all([
        supabase
          .from("consents")
          .select("id, patient_id, organization_id, access_type, granted, granted_at, created_at")
          .eq("patient_id", patientRow.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("documents")
          .select("id, patient_id, title, mime_type, bucket_path, source_system, uploaded_by, created_at")
          .eq("patient_id", patientRow.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("encounters")
          .select("id, patient_id, provider_id, organization_id, visit_date, reason, diagnosis, notes, created_at")
          .eq("patient_id", patientRow.id)
          .order("visit_date", { ascending: false }),
        supabase
          .from("observations")
          .select("id, patient_id, encounter_id, type, value, unit, observed_at, created_at")
          .eq("patient_id", patientRow.id)
          .order("observed_at", { ascending: false }),
        supabase
          .from("medications")
          .select("id, patient_id, provider_id, name, dosage, frequency, start_date, end_date, created_at")
          .eq("patient_id", patientRow.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("claims")
          .select("id, patient_id, provider_id, organization_id, amount, status, submitted_at, created_at")
          .eq("patient_id", patientRow.id)
          .order("submitted_at", { ascending: false }),
      ]);

    setConsents(consentsResult.data ?? []);
    setDocuments(documentsResult.data ?? []);
    setEncounters(encountersResult.data ?? []);
    setObservations(observationsResult.data ?? []);
    setMedications(medicationsResult.data ?? []);
    setClaims(claimsResult.data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    void loadData();
  }, [supabase, userId]);

  const handleConsent = async (granted: boolean) => {
    if (!patient || !consentForm.organizationId) {
      setConsentError("Choose an organization before updating consent.");
      return;
    }

    setConsentError(null);
    setConsentSuccess(null);

    const { error } = await supabase.from("consents").upsert(
      {
        access_type: consentForm.accessType,
        granted,
        granted_at: new Date().toISOString(),
        organization_id: consentForm.organizationId,
        patient_id: patient.id,
      },
      { onConflict: "patient_id,organization_id,access_type" },
    );

    if (error) {
      setConsentError(error.message);
      return;
    }

    setConsentSuccess(granted ? "Consent granted." : "Consent revoked.");
    await loadData();
  };

  const handleUpload = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!patient || !selectedFile) {
      setDocumentError("Select a file before uploading.");
      return;
    }

    setUploading(true);
    setDocumentError(null);
    setDocumentSuccess(null);

    try {
      const fileBuffer = await readFile(selectedFile);
      const filePath = `${patient.id}/${Date.now()}-${selectedFile.name.replace(/\s+/g, "-")}`;
      const { error: uploadError } = await supabase.storage.from("health-reports").upload(filePath, fileBuffer, {
        contentType: selectedFile.type,
        upsert: false,
      });

      if (uploadError) {
        throw uploadError;
      }

      const { error: insertError } = await supabase.from("documents").insert({
        bucket_path: filePath,
        mime_type: selectedFile.type || "application/octet-stream",
        patient_id: patient.id,
        source_system: "patient-upload",
        title: documentTitle.trim() || selectedFile.name,
        uploaded_by: userId,
      });

      if (insertError) {
        throw insertError;
      }

      setDocumentTitle("");
      setSelectedFile(null);
      setDocumentSuccess("Document uploaded.");
      await loadData();
    } catch (error) {
      setDocumentError(error instanceof Error ? error.message : "Unable to upload document.");
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLoader
        compact
        description="We are assembling records, documents, claims, and consent history."
        title="Loading patient workspace"
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Encounters" value={encounters.length} />
        <MetricCard label="Observations" value={observations.length} />
        <MetricCard label="Prescriptions" value={medications.length} />
        <MetricCard label="Claims" value={claims.length} />
      </div>

      <DashboardSection title="Health Record Summary" description="Your role can view records, upload documents, and manage consent access.">
        {patient ? (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 p-4">
              <p className="text-sm text-slate-500">Patient</p>
              <p className="mt-2 text-xl font-semibold text-slate-950">{patientName(patient)}</p>
              <p className="mt-1 text-sm text-slate-600">DOB: {formatDate(patient.date_of_birth)}</p>
              <p className="mt-1 text-sm text-slate-600">Gender: {patient.gender ?? "Not set"}</p>
            </div>
            <div className="rounded-2xl border border-slate-200 p-4">
              <p className="text-sm text-slate-500">Contact</p>
              <p className="mt-2 text-sm text-slate-700">Phone: {patient.phone ?? "Not set"}</p>
              <p className="mt-1 text-sm text-slate-700">Address: {patient.address ?? "Not set"}</p>
            </div>
          </div>
        ) : (
          <EmptyState
            title="Patient record not linked yet"
            description="Your login exists, but no patient profile is linked to it yet. An admin or provider can create one for you."
          />
        )}
      </DashboardSection>

      <DashboardSection title="Consent Management" description="Grant or revoke record sharing for each organization and access scope.">
        {!patient ? (
          <EmptyState title="Consent unavailable" description="Consent can be managed after your patient profile is created." />
        ) : (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <FormField label="Organization">
                <select
                  className={inputClassName()}
                  onChange={(event) => setConsentForm((current) => ({ ...current, organizationId: event.target.value }))}
                  value={consentForm.organizationId}
                >
                  <option value="">Select organization</option>
                  {organizations.map((organization) => (
                    <option key={organization.id} value={organization.id}>
                      {organization.name}
                    </option>
                  ))}
                </select>
              </FormField>
              <FormField label="Access type">
                <select
                  className={inputClassName()}
                  onChange={(event) => setConsentForm((current) => ({ ...current, accessType: event.target.value as typeof CONSENT_ACCESS_TYPES[number] }))}
                  value={consentForm.accessType}
                >
                  {CONSENT_ACCESS_TYPES.map((accessType) => (
                    <option key={accessType} value={accessType}>
                      {accessType}
                    </option>
                  ))}
                </select>
              </FormField>
              <div className="flex items-end gap-3">
                <PrimaryButton className="flex-1" onClick={() => void handleConsent(true)}>
                  Grant
                </PrimaryButton>
                <SecondaryButton className="flex-1" onClick={() => void handleConsent(false)}>
                  Revoke
                </SecondaryButton>
              </div>
            </div>
            <StatusMessage message={consentError} />
            <StatusMessage message={consentSuccess} tone="success" />
            {consents.length === 0 ? (
              <EmptyState title="No consent rules" description="Use the form above to grant or revoke access." />
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {consents.map((consent) => (
                  <div key={consent.id} className="rounded-2xl border border-slate-200 p-4 text-sm text-slate-700">
                    <p className="font-semibold text-slate-950">
                      {organizationNameById.get(consent.organization_id ?? "") ?? "Unknown organization"}
                    </p>
                    <p className="mt-1">Scope: {consent.access_type ?? "Not set"}</p>
                    <p className="mt-1">Status: {consent.granted ? "Granted" : "Revoked"}</p>
                    <p className="mt-1">Updated: {formatDate(consent.granted_at ?? consent.created_at)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </DashboardSection>

      <DashboardSection title="Upload Documents" description="Attach reports or documents to your patient record.">
        {!patient ? (
          <EmptyState title="Uploads unavailable" description="Document upload becomes available after a patient record is linked." />
        ) : (
          <div className="space-y-4">
            <form className="grid gap-4 md:grid-cols-[1fr_1fr_auto]" onSubmit={handleUpload}>
              <FormField label="Document title">
                <input className={inputClassName()} onChange={(event) => setDocumentTitle(event.target.value)} value={documentTitle} />
              </FormField>
              <FormField label="File">
                <input
                  className={inputClassName()}
                  onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
                  required
                  type="file"
                />
              </FormField>
              <div className="flex items-end">
                <PrimaryButton className="w-full" disabled={uploading} type="submit">
                  {uploading ? "Uploading..." : "Upload"}
                </PrimaryButton>
              </div>
            </form>
            <StatusMessage message={documentError} />
            <StatusMessage message={documentSuccess} tone="success" />
            {documents.length === 0 ? (
              <EmptyState title="No documents uploaded" description="Upload a report or attachment to populate this list." />
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {documents.map((document) => (
                  <div key={document.id} className="rounded-2xl border border-slate-200 p-4">
                    <p className="font-semibold text-slate-950">{document.title}</p>
                    <p className="mt-1 text-sm text-slate-600">{document.mime_type}</p>
                    <p className="mt-1 text-sm text-slate-600">Uploaded: {formatDate(document.created_at)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </DashboardSection>

      <DashboardSection title="Clinical Timeline" description="Recent encounters, observations, prescriptions, and claims tied to your record.">
        {!patient ? (
          <EmptyState title="No timeline yet" description="Timeline data will appear after records are linked to your patient profile." />
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-3">
              <p className="text-sm font-semibold text-slate-950">Encounters</p>
              {encounters.length === 0 ? (
                <EmptyState title="No encounters" description="Visits added by providers will appear here." />
              ) : (
                encounters.slice(0, 4).map((encounter) => (
                  <div key={encounter.id} className="rounded-2xl border border-slate-200 p-4 text-sm text-slate-700">
                    <p className="font-semibold text-slate-950">{encounter.reason ?? "Encounter"}</p>
                    <p className="mt-1">Diagnosis: {encounter.diagnosis ?? "Not set"}</p>
                    <p className="mt-1">Date: {formatDate(encounter.visit_date)}</p>
                  </div>
                ))
              )}
            </div>
            <div className="space-y-3">
              <p className="text-sm font-semibold text-slate-950">Observations</p>
              {observations.length === 0 ? (
                <EmptyState title="No observations" description="Clinical measurements will appear here." />
              ) : (
                observations.slice(0, 4).map((observation) => (
                  <div key={observation.id} className="rounded-2xl border border-slate-200 p-4 text-sm text-slate-700">
                    <p className="font-semibold text-slate-950">{observation.type ?? "Observation"}</p>
                    <p className="mt-1">
                      {observation.value ?? "-"} {observation.unit ?? ""}
                    </p>
                    <p className="mt-1">Observed: {formatDate(observation.observed_at)}</p>
                  </div>
                ))
              )}
            </div>
            <div className="space-y-3">
              <p className="text-sm font-semibold text-slate-950">Prescriptions</p>
              {medications.length === 0 ? (
                <EmptyState title="No prescriptions" description="Prescriptions added by providers will appear here." />
              ) : (
                medications.slice(0, 4).map((medication) => (
                  <div key={medication.id} className="rounded-2xl border border-slate-200 p-4 text-sm text-slate-700">
                    <p className="font-semibold text-slate-950">{medication.name ?? "Medication"}</p>
                    <p className="mt-1">Dosage: {medication.dosage ?? "Not set"}</p>
                    <p className="mt-1">Frequency: {medication.frequency ?? "Not set"}</p>
                  </div>
                ))
              )}
            </div>
            <div className="space-y-3">
              <p className="text-sm font-semibold text-slate-950">Claims</p>
              {claims.length === 0 ? (
                <EmptyState title="No claims" description="Insurance claims tied to your care will appear here." />
              ) : (
                claims.slice(0, 4).map((claim) => (
                  <div key={claim.id} className="rounded-2xl border border-slate-200 p-4 text-sm text-slate-700">
                    <p className="font-semibold text-slate-950">Claim #{claim.id.slice(0, 8)}</p>
                    <p className="mt-1">Amount: {claim.amount ?? 0}</p>
                    <p className="mt-1">Status: {claim.status ?? "pending"}</p>
                    <p className="mt-1">Submitted: {formatDate(claim.submitted_at)}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </DashboardSection>
    </div>
  );
}
