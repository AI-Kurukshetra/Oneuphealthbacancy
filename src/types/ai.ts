import type { AlertSeverity } from "@/types/database";

export type RiskLevel = "low" | "medium" | "high";

export type RiskScore = {
  abnormal_observations: number;
  claim_count: number;
  encounter_count: number;
  medication_count: number;
  patient_id: string;
  risk_level: RiskLevel;
  risk_score: number;
};

export type Alert = {
  alert_type: string;
  created_at: string;
  id: string;
  message: string;
  patient_id: string;
  severity: AlertSeverity;
};

export type AnalyticsMetrics = {
  average_risk_score: number;
  high_risk_patients: number;
  patients_by_risk_level: Array<{
    count: number;
    level: RiskLevel;
  }>;
  total_claims: number;
  total_encounters: number;
  total_patients: number;
};
