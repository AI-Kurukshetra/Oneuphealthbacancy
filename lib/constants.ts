export const USER_ROLES = ["patient", "provider", "insurance", "admin"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const CLAIM_STATUS = ["pending", "approved", "rejected"] as const;
export type ClaimStatus = (typeof CLAIM_STATUS)[number];

export const CONSENT_ACCESS_TYPES = ["full", "clinical", "claims", "documents"] as const;
export type ConsentAccessType = (typeof CONSENT_ACCESS_TYPES)[number];
