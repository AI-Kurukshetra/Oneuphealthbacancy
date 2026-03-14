import Link from "next/link";
import { Activity, Database, ShieldCheck } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col justify-center gap-10 px-6 py-12">
      <section className="space-y-4">
        <p className="inline-flex rounded-full bg-secondary px-3 py-1 text-xs font-semibold uppercase tracking-wide text-secondary-foreground">
          HealthBridge Demo
        </p>
        <h1 className="text-4xl font-extrabold leading-tight md:text-5xl">Unified Healthcare Data Exchange Platform</h1>
        <p className="max-w-2xl text-muted-foreground">
          Aggregate patient records from multiple providers, enforce consent controls, and expose FHIR-style APIs.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link href="/dashboard" className={cn(buttonVariants({ variant: "default" }))}>
            Open Dashboard
          </Link>
          <Link href="/login" className={cn(buttonVariants({ variant: "secondary" }))}>
            Login
          </Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <Database className="h-8 w-8 text-primary" />
            <CardTitle>Multi-Provider Aggregation</CardTitle>
            <CardDescription>Records tagged by source system unify in one profile.</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <ShieldCheck className="h-8 w-8 text-primary" />
            <CardTitle>Consent Controlled</CardTitle>
            <CardDescription>Patients can grant or revoke organization access.</CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <Activity className="h-8 w-8 text-primary" />
            <CardTitle>FHIR-Style APIs</CardTitle>
            <CardDescription>Bundle-based responses for encounters, observations, and claims.</CardDescription>
          </CardHeader>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Demo checklist</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
            <li>Patient records from multiple providers and systems.</li>
            <li>Single aggregated profile with clinical + claims timeline.</li>
            <li>Consent grant/revoke governing insurance/provider access.</li>
            <li>FHIR-style API endpoints under <code>/api/*</code>.</li>
          </ul>
        </CardContent>
      </Card>
    </main>
  );
}
