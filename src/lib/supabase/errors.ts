type SupabaseErrorLike = {
  code?: string | null;
  message?: string | null;
};

export function isMissingProfilesTableError(error: SupabaseErrorLike | null | undefined): boolean {
  if (!error) {
    return false;
  }

  const message = (error.message ?? "").toLowerCase();
  const isSchemaCacheMissing =
    message.includes("public.profiles") && message.includes("schema cache");
  const isRelationMissing = message.includes("relation") && message.includes("public.profiles");

  return error.code === "PGRST205" || error.code === "42P01" || isSchemaCacheMissing || isRelationMissing;
}

export function getProfilesTableSetupMessage(error: SupabaseErrorLike | null | undefined): string {
  if (!isMissingProfilesTableError(error)) {
    return error?.message ?? "Unexpected database error.";
  }

  return "Database setup is incomplete: the profiles table is missing. Run the Supabase migrations first, for example `supabase db reset`, then try again.";
}
