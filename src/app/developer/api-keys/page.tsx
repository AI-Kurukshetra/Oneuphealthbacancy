import { DeveloperApiKeysManager } from "@/components/developer/developer-api-keys-manager";

export default function DeveloperApiKeysPage() {
  return (
    <div className="space-y-6">
      <section className="rounded-[1.75rem] border border-cyan-100 bg-[linear-gradient(180deg,#ecfeff,#ffffff)] p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-700">API Key Management</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">Register your developer organization and issue bearer credentials.</h2>
        <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600">
          Developer keys follow the `Authorization: Bearer hb_live_xxxxxxxx` pattern and are validated before API access is granted.
        </p>
      </section>

      <DeveloperApiKeysManager />
    </div>
  );
}
