"use client";

export function ResponseViewer({
  payload,
  status,
}: {
  payload: unknown;
  status: number | null;
}) {
  return (
    <div className="space-y-4 rounded-[1.75rem] border border-slate-200 bg-slate-950 p-6 text-slate-100 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-300">Response Viewer</p>
          <p className="mt-1 text-sm text-slate-400">Inspect the raw JSON returned by the selected endpoint.</p>
        </div>
        <div className="rounded-full bg-white/10 px-3 py-1 text-sm font-semibold">
          Status: {status ?? "Idle"}
        </div>
      </div>
      <pre className="overflow-x-auto rounded-[1.25rem] bg-black/30 p-4 text-xs leading-6 text-cyan-100">
        {JSON.stringify(payload ?? { message: "No response yet." }, null, 2)}
      </pre>
    </div>
  );
}
