"use client";

import { useEffect, useState } from "react";

import { RequestEditor, type PlaygroundRequestValues } from "@/components/developer/request-editor";
import { ResponseViewer } from "@/components/developer/response-viewer";
import { fetchApi } from "@/lib/dashboard-api";
import type { ApiKey } from "@/types/developer";

type ListedApiKey = Pick<ApiKey, "created_at" | "developer_id" | "id" | "is_active" | "key">;

export function DeveloperPlayground() {
  const [apiKeys, setApiKeys] = useState<ListedApiKey[]>([]);
  const [status, setStatus] = useState<number | null>(null);
  const [payload, setPayload] = useState<unknown>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    void (async () => {
      const nextKeys = await fetchApi<ListedApiKey[]>("/api/developer/api-keys");
      setApiKeys(nextKeys);
    })();
  }, []);

  const handleSubmit = async (values: PlaygroundRequestValues) => {
    setSubmitting(true);

    try {
      let path = values.endpoint;
      if (path.includes("{id}")) {
        path = path.replace("{id}", encodeURIComponent(values.pathValue || "123"));
      }
      if (path.includes("patient_id={id}")) {
        path = path.replace("{id}", encodeURIComponent(values.pathValue || "123"));
      }

      const response = await fetch(path, {
        body: values.body.trim() ? values.body : undefined,
        headers: {
          Authorization: `Bearer ${values.apiKey}`,
          ...(values.body.trim() ? { "Content-Type": "application/json" } : {}),
        },
        method:
          path === "/api/encounters" || path === "/api/observations" || path === "/api/medications"
            ? "POST"
            : "GET",
      });

      setStatus(response.status);
      setPayload(await response.json().catch(() => ({ error: "Unable to parse response." })));
    } catch (error) {
      setStatus(500);
      setPayload({ error: error instanceof Error ? error.message : "Unexpected playground error." });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-[1.5rem] border border-slate-200 bg-white p-4 text-sm text-slate-600 shadow-sm">
        {apiKeys.length === 0
          ? "Create an API key first, then paste the raw key value into the request editor."
          : `Active keys on file: ${apiKeys.filter((entry) => entry.is_active).map((entry) => entry.key).join(", ")}. Paste the original raw key value to authenticate playground requests.`}
      </div>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <RequestEditor isSubmitting={submitting} onSubmit={handleSubmit} />
        <ResponseViewer payload={payload} status={status} />
      </div>
    </div>
  );
}
