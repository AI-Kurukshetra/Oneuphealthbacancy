import type { ConsentAccessType, OrganizationType, ProfileRole } from "@/types/database";

export const USER_ROLES: ProfileRole[] = ["patient", "provider", "insurance", "admin"];
export const ORGANIZATION_TYPES: OrganizationType[] = ["hospital", "clinic", "insurance"];
export const CONSENT_ACCESS_TYPES: ConsentAccessType[] = ["full", "clinical", "claims", "documents"];
export const CLAIM_STATUSES = ["pending", "approved", "rejected"] as const;

export const ROLE_LABELS: Record<ProfileRole, string> = {
  patient: "Patient",
  provider: "Provider",
  insurance: "Insurance",
  admin: "Admin",
};

export const ROLE_CAPABILITIES: Record<ProfileRole, string[]> = {
  patient: ["View health records", "Grant consent", "Revoke consent", "Upload documents"],
  provider: ["Create patient records", "Add observations", "Add prescriptions", "Add encounters"],
  insurance: ["View patient records with consent", "Verify treatments", "Manage claims"],
  admin: ["Manage providers", "Manage organizations", "Monitor system usage", "Create and assign user roles"],
};

export function requiresOrganization(role: ProfileRole) {
  return role === "provider" || role === "insurance";
}

export function splitFullName(fullName: string) {
  const trimmed = fullName.trim();
  if (!trimmed) {
    return { firstName: "", lastName: "" };
  }

  const [firstName, ...rest] = trimmed.split(/\s+/);
  return {
    firstName,
    lastName: rest.join(" "),
  };
}
