import { formatISO } from "date-fns";

interface FhirResource {
  resourceType: string;
  id: string;
  [key: string]: unknown;
}

export function toBundle(resources: FhirResource[], type: "searchset" | "collection" = "searchset") {
  return {
    resourceType: "Bundle",
    type,
    timestamp: formatISO(new Date()),
    total: resources.length,
    entry: resources.map((resource) => ({ resource })),
  };
}

export function toFhirPatient(patient: {
  id: string;
  name: string;
  dob: string;
  gender: string;
  phone: string | null;
  address: string | null;
}) {
  return {
    resourceType: "Patient",
    id: patient.id,
    name: [{ text: patient.name }],
    birthDate: patient.dob,
    gender: patient.gender,
    telecom: patient.phone ? [{ system: "phone", value: patient.phone }] : [],
    address: patient.address ? [{ text: patient.address }] : [],
  };
}

export function toFhirEncounter(encounter: {
  id: string;
  patient_id: string;
  provider_id: string;
  date: string;
  reason: string;
  diagnosis: string;
  source_system: string;
}) {
  return {
    resourceType: "Encounter",
    id: encounter.id,
    subject: { reference: `Patient/${encounter.patient_id}` },
    participant: [{ individual: { reference: `Practitioner/${encounter.provider_id}` } }],
    period: { start: encounter.date },
    reasonCode: [{ text: encounter.reason }],
    diagnosis: [{ condition: { display: encounter.diagnosis } }],
    extension: [{ url: "http://healthbridge.dev/fhir/source-system", valueString: encounter.source_system }],
  };
}

export function toFhirObservation(observation: {
  id: string;
  patient_id: string;
  type: string;
  value: string;
  unit: string;
  date: string;
  source_system: string;
}) {
  return {
    resourceType: "Observation",
    id: observation.id,
    subject: { reference: `Patient/${observation.patient_id}` },
    code: { text: observation.type },
    effectiveDateTime: observation.date,
    valueQuantity: {
      value: Number(observation.value),
      unit: observation.unit,
    },
    extension: [{ url: "http://healthbridge.dev/fhir/source-system", valueString: observation.source_system }],
  };
}

export function toFhirClaim(claim: {
  id: string;
  patient_id: string;
  provider_id: string;
  amount: number;
  status: string;
}) {
  return {
    resourceType: "Claim",
    id: claim.id,
    patient: { reference: `Patient/${claim.patient_id}` },
    provider: { reference: `Organization/${claim.provider_id}` },
    status: claim.status,
    total: { value: claim.amount, currency: "USD" },
  };
}
