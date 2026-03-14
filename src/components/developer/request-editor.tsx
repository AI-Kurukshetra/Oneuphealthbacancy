"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { FormField, SelectInput, TextAreaInput, TextInput } from "@/components/ui/form-input";
import { DEVELOPER_ENDPOINTS } from "@/lib/developer/catalog";

const requestSchema = z.object({
  apiKey: z.string().min(1, "API key is required."),
  body: z.string(),
  endpoint: z.string().min(1, "Endpoint is required."),
  pathValue: z.string(),
});

export type PlaygroundRequestValues = z.infer<typeof requestSchema>;

export function RequestEditor({
  defaultApiKey,
  isSubmitting,
  onSubmit,
}: {
  defaultApiKey?: string;
  isSubmitting?: boolean;
  onSubmit: (values: PlaygroundRequestValues) => Promise<void> | void;
}) {
  const form = useForm<PlaygroundRequestValues>({
    defaultValues: {
      apiKey: defaultApiKey ?? "",
      body: "",
      endpoint: DEVELOPER_ENDPOINTS[0]?.path ?? "",
      pathValue: "",
    },
  });

  const selectedEndpoint = DEVELOPER_ENDPOINTS.find((entry) => entry.path === form.watch("endpoint")) ?? DEVELOPER_ENDPOINTS[0];

  useEffect(() => {
    if (defaultApiKey) {
      form.setValue("apiKey", defaultApiKey);
    }
  }, [defaultApiKey, form]);

  const handleSubmit = form.handleSubmit(async (values) => {
    const parsed = requestSchema.safeParse(values);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const field = issue.path[0];
        if (typeof field === "string") {
          form.setError(field as keyof PlaygroundRequestValues, { message: issue.message });
        }
      }
      return;
    }

    await onSubmit(parsed.data);
  });

  useEffect(() => {
    if (!selectedEndpoint) {
      return;
    }

    form.setValue(
      "body",
      selectedEndpoint.sampleRequest.body ? JSON.stringify(selectedEndpoint.sampleRequest.body, null, 2) : "",
    );
  }, [form, selectedEndpoint]);

  return (
    <form className="space-y-4 rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm" onSubmit={handleSubmit}>
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">Request Editor</p>
        <p className="mt-1 text-sm text-slate-600">Select an endpoint, optionally provide an identifier, and send the request with an API key.</p>
      </div>

      <FormField error={form.formState.errors.apiKey?.message} label="API key">
        <TextInput {...form.register("apiKey")} placeholder="hb_live_xxxxxxxx" />
      </FormField>

      <FormField error={form.formState.errors.endpoint?.message} label="Endpoint">
        <SelectInput {...form.register("endpoint")}>
          {DEVELOPER_ENDPOINTS.map((endpoint) => (
            <option key={endpoint.path} value={endpoint.path}>
              {endpoint.method} {endpoint.path}
            </option>
          ))}
        </SelectInput>
      </FormField>

      {selectedEndpoint?.path.includes("{id}") || selectedEndpoint?.path.includes("{id}") || selectedEndpoint?.path.includes("patient_id={id}") ? (
        <FormField error={form.formState.errors.pathValue?.message} label="Path or query value">
          <TextInput {...form.register("pathValue")} placeholder="patient-123" />
        </FormField>
      ) : null}

      <FormField label="JSON body">
        <TextAreaInput {...form.register("body")} className="min-h-60 font-mono text-xs" spellCheck={false} />
      </FormField>

      <Button className="w-full sm:w-auto" disabled={isSubmitting} type="submit">
        {isSubmitting ? "Sending..." : "Send request"}
      </Button>
    </form>
  );
}
