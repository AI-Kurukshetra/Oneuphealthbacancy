import { z } from "zod";

export const patientSchema = z.object({
  name: z.string().min(2),
  dob: z.string().date(),
  gender: z.enum(["male", "female", "other"]),
  phone: z.string().optional(),
  address: z.string().optional(),
  user_id: z.string().uuid().optional(),
});

export const encounterSchema = z.object({
  patient_id: z.string().uuid(),
  provider_id: z.string().uuid(),
  date: z.string().date(),
  reason: z.string().min(2),
  diagnosis: z.string().min(2),
  source_system: z.string().default("ehr-feed-a"),
});

export const observationSchema = z.object({
  patient_id: z.string().uuid(),
  type: z.string().min(2),
  value: z.string().min(1),
  unit: z.string().min(1),
  date: z.string().date(),
  source_system: z.string().default("lab-feed-b"),
});

export const claimSchema = z.object({
  patient_id: z.string().uuid(),
  provider_id: z.string().uuid(),
  amount: z.number().positive(),
  status: z.enum(["pending", "approved", "rejected"]).default("pending"),
});

export const consentSchema = z.object({
  patient_id: z.string().uuid(),
  organization_id: z.string().uuid(),
  access_type: z.enum(["full", "clinical", "claims", "documents"]),
});
