"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";

import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { getProfilesTableSetupMessage, isMissingProfilesTableError } from "@/lib/supabase/errors";
import {
  registerSchema,
  type RegisterFormValues,
} from "@/utils/validators";

import { FormInput } from "./form-input";

function applyZodErrors(
  issues: { path: (string | number)[]; message: string }[],
  setError: ReturnType<typeof useForm<RegisterFormValues>>["setError"],
) {
  for (const issue of issues) {
    const field = issue.path[0];
    if (typeof field === "string") {
      setError(field as keyof RegisterFormValues, { message: issue.message });
    }
  }
}

export function RegisterForm() {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFormError(null);

    const parsed = registerSchema.safeParse(values);
    if (!parsed.success) {
      applyZodErrors(parsed.error.issues, setError);
      return;
    }

    const supabase = createBrowserSupabaseClient();

    const { data, error: signupError } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        data: {
          full_name: parsed.data.fullName,
        },
      },
    });

    if (signupError) {
      setFormError(signupError.message);
      return;
    }

    const userId = data.user?.id;

    if (!userId) {
      setFormError("Unable to complete registration. Please try again.");
      return;
    }

    const { error: profileError } = await supabase.from("profiles").upsert(
      {
        id: userId,
        email: parsed.data.email,
        full_name: parsed.data.fullName,
        role: "patient",
      },
      {
        onConflict: "id",
      },
    );

    if (profileError) {
      setFormError(getProfilesTableSetupMessage(profileError));

      if (isMissingProfilesTableError(profileError)) {
        return;
      }

      return;
    }

    router.push("/dashboard");
    router.refresh();
  });

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <FormInput
        label="Full name"
        type="text"
        autoComplete="name"
        {...register("fullName")}
        error={errors.fullName?.message}
      />

      <FormInput
        label="Email"
        type="email"
        autoComplete="email"
        {...register("email")}
        error={errors.email?.message}
      />

      <FormInput
        label="Password"
        type="password"
        autoComplete="new-password"
        {...register("password")}
        error={errors.password?.message}
      />

      {formError ? <p className="text-sm text-red-600">{formError}</p> : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isSubmitting ? "Creating account..." : "Create account"}
      </button>
    </form>
  );
}
