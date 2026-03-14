import { DeveloperPlayground } from "@/components/developer/developer-playground";

export default function DeveloperPlaygroundPage() {
  return (
    <div className="space-y-6">
      <section className="rounded-[1.75rem] border border-cyan-100 bg-[linear-gradient(180deg,#ecfeff,#ffffff)] p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-700">API Playground</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">Send live requests from the browser with your HealthBridge API key.</h2>
        <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-600">
          Paste an active key, choose an endpoint, and inspect the JSON response directly in the portal.
        </p>
      </section>

      <DeveloperPlayground />
    </div>
  );
}
