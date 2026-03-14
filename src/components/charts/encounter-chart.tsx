export function EncounterChart({
  claims,
  encounters,
  highRiskPatients,
}: {
  claims: number;
  encounters: number;
  highRiskPatients: number;
}) {
  const maxValue = Math.max(claims, encounters, highRiskPatients, 1);
  const items = [
    { color: "bg-cyan-500", label: "Encounters", value: encounters },
    { color: "bg-sky-500", label: "Claims", value: claims },
    { color: "bg-rose-500", label: "High Risk", value: highRiskPatients },
  ];

  return (
    <div className="space-y-4 rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">Utilization Snapshot</p>
        <p className="mt-1 text-sm text-slate-600">Relative comparison across encounters, claims, and high-risk patients.</p>
      </div>
      <div className="space-y-4">
        {items.map((item) => (
          <div key={item.label} className="grid gap-2 sm:grid-cols-[120px_minmax(0,1fr)_60px] sm:items-center">
            <p className="text-sm font-medium text-slate-700">{item.label}</p>
            <div className="h-3 rounded-full bg-slate-100">
              <div className={`h-3 rounded-full ${item.color}`} style={{ width: `${(item.value / maxValue) * 100}%` }} />
            </div>
            <p className="text-right text-sm font-semibold text-slate-950">{item.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
