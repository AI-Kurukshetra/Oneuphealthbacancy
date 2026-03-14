import { getServerSupabase } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/constants";

interface AccessContext {
  role: UserRole;
  orgId: string | null;
  userId: string;
}

export async function resolveAccessContext() {
  const supabase = getServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, organization_id")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return null;
  }

  const context: AccessContext = {
    role: profile.role,
    orgId: profile.organization_id,
    userId: user.id,
  };

  return context;
}

export async function canAccessPatient(patientId: string, accessType: "clinical" | "claims" | "documents" | "full") {
  const supabase = getServerSupabase();
  const context = await resolveAccessContext();
  if (!context) {
    return false;
  }

  if (context.role === "admin") {
    return true;
  }

  if (context.role === "patient") {
    const { data: patient } = await supabase
      .from("patients")
      .select("id")
      .eq("id", patientId)
      .eq("user_id", context.userId)
      .maybeSingle();

    return Boolean(patient);
  }

  if (!context.orgId) {
    return false;
  }

  const { data, error } = await supabase.rpc("user_has_active_consent", {
    p_patient_id: patientId,
    p_org_id: context.orgId,
    p_access_type: accessType,
  });

  if (error) {
    return false;
  }

  return Boolean(data);
}
