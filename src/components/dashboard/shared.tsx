import type { ReactNode } from "react";

export function DashboardSection({
  actions,
  children,
  description,
  title,
}: {
  actions?: ReactNode;
  children: ReactNode;
  description?: string;
  title: string;
}) {
  return (
    <section className="space-y-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:p-7">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold text-slate-950 lg:text-2xl">{title}</h2>
          {description ? <p className="text-[15px] leading-7 text-slate-600">{description}</p> : null}
        </div>
        {actions}
      </div>
      {children}
    </section>
  );
}

export function MetricCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-[1.6rem] border border-slate-200 bg-slate-50 p-5 lg:p-6">
      <p className="text-sm font-medium uppercase tracking-[0.12em] text-slate-500">{label}</p>
      <p className="mt-3 text-4xl font-semibold tracking-tight text-slate-950 lg:text-[2.6rem]">{value}</p>
    </div>
  );
}

export function EmptyState({ description, title }: { description: string; title: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-600">
      <p className="font-medium text-slate-900">{title}</p>
      <p className="mt-1">{description}</p>
    </div>
  );
}

export function DashboardLoader({
  compact = false,
  description = "Please wait while the latest workspace data is prepared.",
  title = "Loading workspace",
}: {
  compact?: boolean;
  description?: string;
  title?: string;
}) {
  if (compact) {
    return (
      <div className="overflow-hidden rounded-[1.75rem] border border-cyan-100 bg-[linear-gradient(180deg,rgba(236,254,255,0.9),rgba(255,255,255,1))] p-5 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-100">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-cyan-700 border-t-transparent" />
          </div>
          <div className="min-w-0 flex-1 space-y-3">
            <div>
              <p className="text-base font-semibold text-slate-950">{title}</p>
              <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
              <div className="h-20 animate-pulse rounded-2xl bg-slate-100" />
              <div className="h-20 animate-pulse rounded-2xl bg-slate-100" />
              <div className="h-20 animate-pulse rounded-2xl bg-slate-100" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[2rem] border border-cyan-100 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.98),_rgba(240,249,255,0.94)_46%,_rgba(230,247,255,0.95)_100%)] p-6 shadow-[0_24px_90px_rgba(14,116,144,0.12)] lg:p-8">
        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-5">
            <div className="inline-flex items-center gap-3 rounded-full bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-800 ring-1 ring-inset ring-cyan-200">
              <div className="h-3 w-3 animate-pulse rounded-full bg-cyan-500" />
              {title}
            </div>
            <div className="space-y-3">
              <div className="h-10 w-3/4 animate-pulse rounded-2xl bg-white/90" />
              <div className="h-4 w-full animate-pulse rounded-full bg-white/80" />
              <div className="h-4 w-2/3 animate-pulse rounded-full bg-white/80" />
            </div>
            <p className="max-w-2xl text-[15px] leading-7 text-slate-600">{description}</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="h-32 animate-pulse rounded-[1.6rem] bg-white/85" />
            <div className="h-32 animate-pulse rounded-[1.6rem] bg-white/85" />
            <div className="h-32 animate-pulse rounded-[1.6rem] bg-white/85" />
            <div className="h-32 animate-pulse rounded-[1.6rem] bg-white/85" />
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="space-y-4 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="h-8 w-56 animate-pulse rounded-2xl bg-slate-100" />
          <div className="h-5 w-80 animate-pulse rounded-full bg-slate-100" />
          <div className="space-y-3">
            <div className="h-24 animate-pulse rounded-3xl bg-slate-100" />
            <div className="h-24 animate-pulse rounded-3xl bg-slate-100" />
            <div className="h-24 animate-pulse rounded-3xl bg-slate-100" />
          </div>
        </div>
        <div className="space-y-4 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="h-8 w-56 animate-pulse rounded-2xl bg-slate-100" />
          <div className="h-5 w-72 animate-pulse rounded-full bg-slate-100" />
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="h-32 animate-pulse rounded-3xl bg-slate-100" />
            <div className="h-32 animate-pulse rounded-3xl bg-slate-100" />
            <div className="h-32 animate-pulse rounded-3xl bg-slate-100" />
            <div className="h-32 animate-pulse rounded-3xl bg-slate-100" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function FormField({
  children,
  label,
}: {
  children: ReactNode;
  label: string;
}) {
  return (
    <label className="space-y-2 text-sm font-medium text-slate-700">
      <span>{label}</span>
      {children}
    </label>
  );
}

export function inputClassName() {
  return "w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-[15px] text-slate-900 outline-none transition focus:border-slate-950";
}

export function PrimaryButton({
  children,
  className = "",
  disabled,
  type = "button",
  onClick,
}: {
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
  type?: "button" | "submit";
}) {
  return (
    <button
      className={`rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
      disabled={disabled}
      onClick={onClick}
      type={type}
    >
      {children}
    </button>
  );
}

export function SecondaryButton({
  children,
  className = "",
  disabled,
  onClick,
  type = "button",
}: {
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
  type?: "button" | "submit";
}) {
  return (
    <button
      className={`rounded-2xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
      disabled={disabled}
      onClick={onClick}
      type={type}
    >
      {children}
    </button>
  );
}

export function StatusMessage({ message, tone = "error" }: { message: string | null; tone?: "error" | "success" }) {
  if (!message) {
    return null;
  }

  return (
    <p className={`whitespace-pre-line text-sm ${tone === "success" ? "text-emerald-700" : "text-rose-600"}`}>
      {message}
    </p>
  );
}

export function formatDate(value: string | null | undefined) {
  if (!value) {
    return "Not available";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString();
}
