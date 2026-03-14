import type { ReactNode } from "react";

type ApiDocRow = {
  description: string;
  method: string;
  path: string;
  sampleRequest: ReactNode;
  sampleResponse: ReactNode;
};

export function ApiTable({ rows }: { rows: ApiDocRow[] }) {
  return (
    <div className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Method</th>
              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Endpoint</th>
              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Description</th>
              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Sample Request</th>
              <th className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Sample Response</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {rows.map((row) => (
              <tr key={`${row.method}-${row.path}`} className="align-top">
                <td className="px-5 py-5">
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                      row.method === "GET" ? "bg-emerald-100 text-emerald-700" : "bg-cyan-100 text-cyan-700"
                    }`}
                  >
                    {row.method}
                  </span>
                </td>
                <td className="px-5 py-5">
                  <code className="text-sm font-semibold text-slate-950">{row.path}</code>
                </td>
                <td className="px-5 py-5 text-sm leading-6 text-slate-600">{row.description}</td>
                <td className="px-5 py-5">{row.sampleRequest}</td>
                <td className="px-5 py-5">{row.sampleResponse}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
