import type { Database } from "@/types/database";

export type Developer = Database["public"]["Tables"]["developers"]["Row"];
export type ApiKey = Database["public"]["Tables"]["api_keys"]["Row"];
export type ApiRequestLog = Database["public"]["Tables"]["api_requests"]["Row"];

export type DeveloperStats = {
  active_api_keys: number;
  available_endpoints: number;
  total_api_requests: number;
};

export type DeveloperProfilePayload = {
  developer: Developer | null;
  stats: DeveloperStats;
};
