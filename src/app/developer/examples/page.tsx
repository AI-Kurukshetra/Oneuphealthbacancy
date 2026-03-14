import Link from "next/link";

import { Button } from "@/components/ui/button";
import { DEVELOPER_ENDPOINTS } from "@/lib/developer/catalog";

export default function DeveloperExamplesPage() {
  return (
    <div className="space-y-6">
      <section className="rounded-[1.75rem] border border-cyan-100 bg-[linear-gradient(180deg,#ecfeff,#ffffff)] p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-700">Sample Requests</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">Copy working examples for patient, encounter, observation, medication, claim, and consent flows.</h2>
      </section>

      <div className="grid gap-4">
        {DEVELOPER_ENDPOINTS.map((endpoint) => (
          <section key={endpoint.path} className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">{endpoint.title}</p>
                <p className="mt-1 text-sm text-slate-600">{endpoint.description}</p>
              </div>
              <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${endpoint.method === "GET" ? "bg-emerald-100 text-emerald-700" : "bg-cyan-100 text-cyan-700"}`}>
                {endpoint.method}
              </span>
            </div>

            <div className="mt-5 grid gap-4 xl:grid-cols-2">
              <pre className="overflow-x-auto rounded-2xl bg-slate-950 p-4 text-xs leading-6 text-cyan-100">
                {`${endpoint.method} ${endpoint.path}\n${JSON.stringify(endpoint.sampleRequest, null, 2)}`}
              </pre>
              <pre className="overflow-x-auto rounded-2xl bg-slate-950 p-4 text-xs leading-6 text-cyan-100">
                {JSON.stringify(endpoint.sampleResponse, null, 2)}
              </pre>
            </div>
          </section>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <Link href="/developer/playground">
          <Button>Open playground</Button>
        </Link>
        <Link href="/developer/postman">
          <Button variant="outline">Download Postman collection</Button>
        </Link>
      </div>
    </div>
  );
}
