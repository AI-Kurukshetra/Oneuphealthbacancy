import Link from "next/link";

import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <main className="py-12">
      <div className="container max-w-md space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold text-slate-900">Welcome back</h1>
          <p className="text-sm text-slate-600">
            Sign in to HealthBridge. Admin-created users land in the dashboard for their assigned role.
          </p>
        </div>

        <LoginForm />

        <p className="text-center text-sm text-slate-600">
          Need an account?{" "}
          <Link href="/register" className="font-medium text-slate-900 underline">
            Register
          </Link>
        </p>
      </div>
    </main>
  );
}
