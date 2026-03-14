import type { AnalyticsMetrics } from "@/types/ai";

const BAR_STYLES: Record<string, string> = {
  high: "from-rose-500 to-rose-400",
  low: "from-emerald-500 to-emerald-400",
  medium: "from-amber-500 to-amber-400",
};

export function RiskChart({ metrics }: { metrics: AnalyticsMetrics }) {
  const maxCount = Math.max(...metrics.patients_by_risk_level.map((entry) => entry.count), 1);

  return (
    <div className="space-y-4 rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">Patients By Risk Level</p>
        <p className="mt-1 text-sm text-slate-600">Live distribution from current patient records and rule-based scoring.</p>
      </div>
      <div className="space-y-4">
        {metrics.patients_by_risk_level.map((entry) => (
          <div key={entry.level} className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium capitalize text-slate-700">{entry.level}</span>
              <span className="font-semibold text-slate-950">{entry.count}</span>
            </div>
            <div className="h-3 rounded-full bg-slate-100">
              <div
                className={`h-3 rounded-full bg-gradient-to-r ${BAR_STYLES[entry.level] ?? "from-cyan-500 to-sky-400"}`}
                style={{ width: `${Math.max((entry.count / maxCount) * 100, entry.count > 0 ? 10 : 0)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
