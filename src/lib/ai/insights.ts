import type { SupabaseClient } from "@supabase/supabase-js";

import type { Alert, AnalyticsMetrics, RiskLevel, RiskScore } from "@/types/ai";
import type { Database } from "@/types/database";
import type { Claim, Encounter, Medication, Observation, Patient } from "@/types/fhir";

type AdminSupabaseClient = SupabaseClient<Database>;

type PatientDataset = {
  claims: Claim[];
  encounters: Encounter[];
  medications: Medication[];
  observations: Observation[];
  patient: Patient | null;
};

type GroupedAnalyticsInput = {
  claims: Claim[];
  encounters: Encounter[];
  medications: Medication[];
  observations: Observation[];
  patients: Patient[];
};

const HIGH_RISK_SCORE = 11;
const MEDIUM_RISK_SCORE = 6;

function asNumber(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function isAbnormalObservation(observation: Observation) {
  const type = (observation.type ?? "").toLowerCase();
  const value = asNumber(observation.value);

  if (value === null) {
    const textValue = (observation.value ?? "").toLowerCase();
    return textValue.includes("abnormal") || textValue.includes("positive") || textValue.includes("critical");
  }

  if (type.includes("glucose")) {
    return value >= 140;
  }

  if (type.includes("a1c") || type.includes("hemoglobin a1c")) {
    return value >= 6.5;
  }

  if (type.includes("blood pressure systolic") || type === "systolic blood pressure") {
    return value >= 140;
  }

  if (type.includes("blood pressure diastolic") || type === "diastolic blood pressure") {
    return value >= 90;
  }

  if (type.includes("heart rate")) {
    return value >= 110 || value <= 45;
  }

  if (type.includes("oxygen") || type.includes("spo2")) {
    return value < 92;
  }

  if (type.includes("temperature")) {
    return value >= 100.4 || value <= 95;
  }

  return false;
}

export function classifyRiskScore(score: number): RiskLevel {
  if (score >= HIGH_RISK_SCORE) {
    return "high";
  }

  if (score >= MEDIUM_RISK_SCORE) {
    return "medium";
  }

  return "low";
}

export function calculateRiskScore(dataset: Omit<PatientDataset, "patient"> & { patient_id: string }): RiskScore {
  const abnormalObservationCount = dataset.observations.filter(isAbnormalObservation).length;
  const encounterCount = dataset.encounters.length;
  const medicationCount = dataset.medications.length;
  const claimCount = dataset.claims.length;
  const riskScore = encounterCount * 2 + abnormalObservationCount * 3 + medicationCount + claimCount;

  return {
    abnormal_observations: abnormalObservationCount,
    claim_count: claimCount,
    encounter_count: encounterCount,
    medication_count: medicationCount,
    patient_id: dataset.patient_id,
    risk_level: classifyRiskScore(riskScore),
    risk_score: riskScore,
  };
}

export function generateHealthSummary(dataset: PatientDataset) {
  if (!dataset.patient) {
    return "No linked patient profile was found for this record set.";
  }

  const diagnoses = dataset.encounters
    .map((encounter) => encounter.diagnosis?.trim())
    .filter((value): value is string => Boolean(value))
    .slice(0, 3);
  const abnormalObservations = dataset.observations.filter(isAbnormalObservation).slice(0, 3);
  const activeMedications = dataset.medications
    .map((medication) => medication.name?.trim())
    .filter((value): value is string => Boolean(value))
    .slice(0, 3);
  const risk = calculateRiskScore({
    claims: dataset.claims,
    encounters: dataset.encounters,
    medications: dataset.medications,
    observations: dataset.observations,
    patient_id: dataset.patient.id,
  });

  const summaryParts = [
    diagnoses.length > 0
      ? `Patient history includes ${diagnoses.join(", ")}.`
      : "Clinical history is limited and does not yet include documented diagnoses.",
    abnormalObservations.length > 0
      ? `Recent abnormal findings include ${abnormalObservations
          .map((observation) => `${observation.type ?? "observation"} ${observation.value ?? ""}${observation.unit ? ` ${observation.unit}` : ""}`.trim())
          .join(", ")}.`
      : "Recent observations do not show obvious abnormal readings based on configured thresholds.",
    activeMedications.length > 0
      ? `Medication history includes ${activeMedications.join(", ")}.`
      : "No medication history is currently documented.",
    risk.risk_level === "high"
      ? "Overall risk is high and suggests close clinical follow-up."
      : risk.risk_level === "medium"
        ? "Overall risk is moderate and should be monitored for deterioration."
        : "Overall risk is currently low based on available records.",
  ];

  return summaryParts.join(" ");
}

function buildAlertEntries(patientId: string, dataset: Omit<PatientDataset, "patient">, risk: RiskScore): Omit<Alert, "created_at" | "id">[] {
  const alerts: Omit<Alert, "created_at" | "id">[] = [];
  const abnormalObservations = dataset.observations.filter(isAbnormalObservation);

  for (const observation of abnormalObservations.slice(0, 3)) {
    alerts.push({
      alert_type: "abnormal_observation",
      message: `${observation.type ?? "Observation"} is outside the expected range at ${observation.value ?? "unknown"}${observation.unit ? ` ${observation.unit}` : ""}.`.trim(),
      patient_id: patientId,
      severity: risk.risk_level === "high" ? "high" : "medium",
    });
  }

  const recentEncounterCount = dataset.encounters.filter((encounter) => {
    if (!encounter.visit_date) {
      return false;
    }

    const visitDate = new Date(encounter.visit_date);
    return Number.isFinite(visitDate.getTime()) && Date.now() - visitDate.getTime() <= 30 * 24 * 60 * 60 * 1000;
  }).length;

  if (recentEncounterCount >= 3) {
    alerts.push({
      alert_type: "frequent_encounters",
      message: `Patient has ${recentEncounterCount} encounters in the last 30 days.`,
      patient_id: patientId,
      severity: recentEncounterCount >= 5 ? "high" : "medium",
    });
  }

  if (risk.risk_level === "high") {
    alerts.push({
      alert_type: "high_risk_score",
      message: `Calculated patient risk score is ${risk.risk_score}, which falls in the high-risk band.`,
      patient_id: patientId,
      severity: "high",
    });
  }

  return alerts;
}

export async function fetchPatientDataset(adminSupabase: AdminSupabaseClient, patientId: string): Promise<PatientDataset> {
  const [patientResult, encountersResult, observationsResult, medicationsResult, claimsResult] = await Promise.all([
    adminSupabase
      .from("patients")
      .select("id, user_id, first_name, last_name, date_of_birth, gender, phone, address, created_at")
      .eq("id", patientId)
      .maybeSingle(),
    adminSupabase
      .from("encounters")
      .select("id, patient_id, provider_id, organization_id, visit_date, reason, diagnosis, notes, created_at")
      .eq("patient_id", patientId)
      .order("visit_date", { ascending: false }),
    adminSupabase
      .from("observations")
      .select("id, patient_id, encounter_id, type, value, unit, observed_at, created_at")
      .eq("patient_id", patientId)
      .order("observed_at", { ascending: false }),
    adminSupabase
      .from("medications")
      .select("id, patient_id, provider_id, name, dosage, frequency, start_date, end_date, created_at")
      .eq("patient_id", patientId)
      .order("start_date", { ascending: false }),
    adminSupabase
      .from("claims")
      .select("id, patient_id, provider_id, organization_id, amount, status, submitted_at, created_at")
      .eq("patient_id", patientId)
      .order("submitted_at", { ascending: false }),
  ]);

  if (patientResult.error) {
    throw new Error(patientResult.error.message);
  }
  if (encountersResult.error) {
    throw new Error(encountersResult.error.message);
  }
  if (observationsResult.error) {
    throw new Error(observationsResult.error.message);
  }
  if (medicationsResult.error) {
    throw new Error(medicationsResult.error.message);
  }
  if (claimsResult.error) {
    throw new Error(claimsResult.error.message);
  }

  return {
    claims: claimsResult.data ?? [],
    encounters: encountersResult.data ?? [],
    medications: medicationsResult.data ?? [],
    observations: observationsResult.data ?? [],
    patient: patientResult.data ?? null,
  };
}

export async function syncPatientAlerts(adminSupabase: AdminSupabaseClient, patientId: string) {
  const dataset = await fetchPatientDataset(adminSupabase, patientId);
  if (!dataset.patient) {
    return [] as Alert[];
  }

  const risk = calculateRiskScore({
    claims: dataset.claims,
    encounters: dataset.encounters,
    medications: dataset.medications,
    observations: dataset.observations,
    patient_id: patientId,
  });
  const alerts = buildAlertEntries(patientId, dataset, risk);

  const deleteResult = await adminSupabase.from("alerts").delete().eq("patient_id", patientId);
  if (deleteResult.error) {
    throw new Error(deleteResult.error.message);
  }

  if (alerts.length === 0) {
    return [] as Alert[];
  }

  const insertResult = await adminSupabase
    .from("alerts")
    .insert(alerts)
    .select("id, patient_id, alert_type, message, severity, created_at")
    .order("created_at", { ascending: false });

  if (insertResult.error) {
    throw new Error(insertResult.error.message);
  }

  return insertResult.data ?? [];
}

export function buildPopulationMetrics(input: GroupedAnalyticsInput): AnalyticsMetrics {
  const patientStats = input.patients.map((patient) =>
    calculateRiskScore({
      claims: input.claims.filter((claim) => claim.patient_id === patient.id),
      encounters: input.encounters.filter((encounter) => encounter.patient_id === patient.id),
      medications: input.medications.filter((medication) => medication.patient_id === patient.id),
      observations: input.observations.filter((observation) => observation.patient_id === patient.id),
      patient_id: patient.id,
    }),
  );
  const totalPatients = input.patients.length;
  const averageRiskScore =
    totalPatients === 0
      ? 0
      : Number((patientStats.reduce((sum, stat) => sum + stat.risk_score, 0) / totalPatients).toFixed(1));

  return {
    average_risk_score: averageRiskScore,
    high_risk_patients: patientStats.filter((stat) => stat.risk_level === "high").length,
    patients_by_risk_level: [
      { count: patientStats.filter((stat) => stat.risk_level === "low").length, level: "low" },
      { count: patientStats.filter((stat) => stat.risk_level === "medium").length, level: "medium" },
      { count: patientStats.filter((stat) => stat.risk_level === "high").length, level: "high" },
    ],
    total_claims: input.claims.length,
    total_encounters: input.encounters.length,
    total_patients: totalPatients,
  };
}

export async function fetchPopulationMetrics(adminSupabase: AdminSupabaseClient) {
  const [patientsResult, encountersResult, observationsResult, medicationsResult, claimsResult] = await Promise.all([
    adminSupabase.from("patients").select("id, user_id, first_name, last_name, date_of_birth, gender, phone, address, created_at"),
    adminSupabase.from("encounters").select("id, patient_id, provider_id, organization_id, visit_date, reason, diagnosis, notes, created_at"),
    adminSupabase.from("observations").select("id, patient_id, encounter_id, type, value, unit, observed_at, created_at"),
    adminSupabase.from("medications").select("id, patient_id, provider_id, name, dosage, frequency, start_date, end_date, created_at"),
    adminSupabase.from("claims").select("id, patient_id, provider_id, organization_id, amount, status, submitted_at, created_at"),
  ]);

  if (patientsResult.error) {
    throw new Error(patientsResult.error.message);
  }
  if (encountersResult.error) {
    throw new Error(encountersResult.error.message);
  }
  if (observationsResult.error) {
    throw new Error(observationsResult.error.message);
  }
  if (medicationsResult.error) {
    throw new Error(medicationsResult.error.message);
  }
  if (claimsResult.error) {
    throw new Error(claimsResult.error.message);
  }

  return buildPopulationMetrics({
    claims: claimsResult.data ?? [],
    encounters: encountersResult.data ?? [],
    medications: medicationsResult.data ?? [],
    observations: observationsResult.data ?? [],
    patients: patientsResult.data ?? [],
  });
}
