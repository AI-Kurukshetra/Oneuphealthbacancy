"use client";

import { createContext, useContext } from "react";

import type { DashboardSession } from "@/lib/dashboard-api";

const DashboardSessionContext = createContext<DashboardSession | null>(null);

export function useDashboardSession(): DashboardSession {
  const session = useContext(DashboardSessionContext);
  if (!session) {
    throw new Error("useDashboardSession must be used within RoleDashboardPage");
  }
  return session;
}

export { DashboardSessionContext };
