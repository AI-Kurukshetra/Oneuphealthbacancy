"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { FormField, TextInput } from "@/components/ui/form-input";
import { fetchApi } from "@/lib/dashboard-api";
import type { ApiKey, DeveloperProfilePayload } from "@/types/developer";

const registrationSchema = z.object({
  organization_name: z.string().min(2, "Organization name is required."),
});

type RegistrationValues = z.infer<typeof registrationSchema>;

type ListedApiKey = Pick<ApiKey, "created_at" | "developer_id" | "id" | "is_active" | "key">;

export function DeveloperApiKeysManager() {
  const [profile, setProfile] = useState<DeveloperProfilePayload | null>(null);
  const [keys, setKeys] = useState<ListedApiKey[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [freshKey, setFreshKey] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const form = useForm<RegistrationValues>({
    defaultValues: {
      organization_name: "",
    },
  });

  const load = async () => {
    const [nextProfile, nextKeys] = await Promise.all([
      fetchApi<DeveloperProfilePayload>("/api/developer/profile"),
      fetchApi<ListedApiKey[]>("/api/developer/api-keys"),
    ]);

    setProfile(nextProfile);
    setKeys(nextKeys);
    if (nextProfile.developer) {
      form.setValue("organization_name", nextProfile.developer.organization_name);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const handleRegister = form.handleSubmit(async (values) => {
    const parsed = registrationSchema.safeParse(values);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const field = issue.path[0];
        if (typeof field === "string") {
          form.setError(field as keyof RegistrationValues, { message: issue.message });
        }
      }
      return;
    }

    setSubmitting(true);
    setError(null);
    setMessage(null);

    try {
      await fetchApi("/api/developer/register", {
        body: JSON.stringify(parsed.data),
        method: "POST",
      });
      await load();
      setMessage("Developer profile saved.");
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to register developer.");
    } finally {
      setSubmitting(false);
    }
  });

  const handleCreateKey = async () => {
    setSubmitting(true);
    setError(null);
    setMessage(null);
    setFreshKey(null);

    try {
      const created = await fetchApi<ApiKey>("/api/developer/api-keys", { method: "POST" });
      setFreshKey(created.key);
      await load();
      setMessage("API key created. Copy it now; existing entries are masked.");
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to create API key.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async (apiKeyId: string, isActive: boolean) => {
    setSubmitting(true);
    setError(null);
    setMessage(null);

    try {
      await fetchApi(`/api/developer/api-keys/${apiKeyId}`, {
        body: JSON.stringify({ is_active: !isActive }),
        method: "PUT",
      });
      await load();
      setMessage(`API key ${isActive ? "deactivated" : "activated"}.`);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to update API key.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Developer Registration</p>
          <p className="text-sm text-slate-600">Register or update the organization that will own issued API keys.</p>
        </div>
        <form className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto]" onSubmit={handleRegister}>
          <FormField error={form.formState.errors.organization_name?.message} label="Organization name">
            <TextInput {...form.register("organization_name")} placeholder="Acme Digital Health" />
          </FormField>
          <div className="flex items-end">
            <Button className="w-full sm:w-auto" disabled={submitting} type="submit">
              {profile?.developer ? "Update developer profile" : "Register as developer"}
            </Button>
          </div>
        </form>
      </section>

      <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">API Key Management</p>
            <p className="mt-1 text-sm text-slate-600">Generate, review, and rotate active developer credentials.</p>
          </div>
          <Button disabled={submitting || !profile?.developer} onClick={() => void handleCreateKey()}>
            Generate API key
          </Button>
        </div>

        {freshKey ? (
          <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
            <p className="text-sm font-semibold text-emerald-800">New API key</p>
            <code className="mt-2 block break-all text-sm text-emerald-900">{freshKey}</code>
          </div>
        ) : null}
        {message ? <p className="mt-4 text-sm text-emerald-700">{message}</p> : null}
        {error ? <p className="mt-4 text-sm text-rose-600">{error}</p> : null}

        <div className="mt-5 space-y-3">
          {keys.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-600">
              No API keys yet.
            </div>
          ) : (
            keys.map((apiKey) => (
              <div key={apiKey.id} className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <code className="text-sm font-semibold text-slate-950">{apiKey.key}</code>
                  <p className="mt-1 text-sm text-slate-500">Created {new Date(apiKey.created_at).toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${apiKey.is_active ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-700"}`}>
                    {apiKey.is_active ? "Active" : "Inactive"}
                  </span>
                  <Button disabled={submitting} onClick={() => void handleToggle(apiKey.id, apiKey.is_active)} variant="outline">
                    {apiKey.is_active ? "Deactivate" : "Activate"}
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
