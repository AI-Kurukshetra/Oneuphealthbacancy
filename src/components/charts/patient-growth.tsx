import type { Alert } from "@/types/ai";

function monthLabel(value: Date) {
  return value.toLocaleDateString(undefined, { month: "short" });
}

export function PatientGrowth({ alerts, totalPatients }: { alerts: Alert[]; totalPatients: number }) {
  const now = new Date();
  const months = Array.from({ length: 6 }, (_, index) => {
    const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
    const key = `${date.getFullYear()}-${date.getMonth()}`;
    const count = alerts.filter((alert) => {
      const createdAt = new Date(alert.created_at);
      return `${createdAt.getFullYear()}-${createdAt.getMonth()}` === key;
    }).length;

    return {
      count,
      label: monthLabel(date),
    };
  });
  const maxCount = Math.max(...months.map((month) => month.count), 1);

  return (
    <div className="space-y-4 rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">Clinical Alert Trend</p>
          <p className="mt-1 text-sm text-slate-600">Recent alert volume over the last six months.</p>
        </div>
        <div className="text-right">
          <p className="text-xs uppercase tracking-[0.14em] text-slate-500">Patients</p>
          <p className="text-2xl font-semibold tracking-tight text-slate-950">{totalPatients}</p>
        </div>
      </div>
      <div className="flex h-48 items-end gap-3">
        {months.map((month) => (
          <div key={month.label} className="flex flex-1 flex-col items-center gap-2">
            <div className="flex w-full items-end justify-center rounded-t-2xl bg-slate-50 px-2" style={{ height: "100%" }}>
              <div
                className="w-full rounded-t-2xl bg-[linear-gradient(180deg,#22d3ee,#0f766e)]"
                style={{ height: `${Math.max((month.count / maxCount) * 100, month.count > 0 ? 12 : 4)}%` }}
              />
            </div>
            <div className="text-center">
              <p className="text-xs font-semibold text-slate-700">{month.count}</p>
              <p className="text-xs text-slate-500">{month.label}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
