import { ApiTable } from "@/components/developer/api-table";
import { DEVELOPER_ENDPOINTS } from "@/lib/developer/catalog";

export default function DeveloperDocsPage() {
  return (
    <div className="space-y-6">
      <section className="rounded-[1.75rem] border border-cyan-100 bg-[linear-gradient(180deg,#ecfeff,#ffffff)] p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-700">API Documentation</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">FHIR-style resource endpoints with request and response examples.</h2>
        <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600">
          Use these references to understand available resources, expected payloads, and browser-playground request shapes.
        </p>
      </section>

      <ApiTable
        rows={DEVELOPER_ENDPOINTS.map((endpoint) => ({
          description: endpoint.description,
          method: endpoint.method,
          path: endpoint.path,
          sampleRequest: (
            <pre className="max-w-sm overflow-x-auto rounded-2xl bg-slate-950 p-3 text-xs leading-6 text-cyan-100">
              {JSON.stringify(
                {
                  headers: endpoint.sampleRequest.headers,
                  body: endpoint.sampleRequest.body,
                },
                null,
                2,
              )}
            </pre>
          ),
          sampleResponse: (
            <pre className="max-w-sm overflow-x-auto rounded-2xl bg-slate-950 p-3 text-xs leading-6 text-cyan-100">
              {JSON.stringify(endpoint.sampleResponse, null, 2)}
            </pre>
          ),
        }))}
      />
    </div>
  );
}
