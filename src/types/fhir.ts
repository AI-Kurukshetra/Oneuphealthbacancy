import type { Database } from "@/types/database";

export type Patient = Database["public"]["Tables"]["patients"]["Row"];
export type PatientInsert = Database["public"]["Tables"]["patients"]["Insert"];
export type PatientUpdate = Database["public"]["Tables"]["patients"]["Update"];

export type Provider = Database["public"]["Tables"]["providers"]["Row"];
export type ProviderInsert = Database["public"]["Tables"]["providers"]["Insert"];
export type ProviderUpdate = Database["public"]["Tables"]["providers"]["Update"];

export type Encounter = Database["public"]["Tables"]["encounters"]["Row"];
export type EncounterInsert = Database["public"]["Tables"]["encounters"]["Insert"];
export type EncounterUpdate = Database["public"]["Tables"]["encounters"]["Update"];

export type Observation = Database["public"]["Tables"]["observations"]["Row"];
export type ObservationInsert = Database["public"]["Tables"]["observations"]["Insert"];
export type ObservationUpdate = Database["public"]["Tables"]["observations"]["Update"];

export type Medication = Database["public"]["Tables"]["medications"]["Row"];
export type MedicationInsert = Database["public"]["Tables"]["medications"]["Insert"];
export type MedicationUpdate = Database["public"]["Tables"]["medications"]["Update"];

export type Claim = Database["public"]["Tables"]["claims"]["Row"];
export type ClaimInsert = Database["public"]["Tables"]["claims"]["Insert"];
export type ClaimUpdate = Database["public"]["Tables"]["claims"]["Update"];

export type Consent = Database["public"]["Tables"]["consents"]["Row"];
export type ConsentInsert = Database["public"]["Tables"]["consents"]["Insert"];
export type ConsentUpdate = Database["public"]["Tables"]["consents"]["Update"];
