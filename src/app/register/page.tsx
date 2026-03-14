import Link from "next/link";

import { RegisterForm } from "@/components/auth/register-form";

export default function RegisterPage() {
  return (
    <main className="py-12">
      <div className="container max-w-md space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold text-slate-900">Patient Self-Registration</h1>
          <p className="text-sm text-slate-600">
            Staff, insurance, and admin accounts are created from the admin dashboard.
          </p>
        </div>

        <RegisterForm />

        <p className="text-center text-sm text-slate-600">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-slate-900 underline">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
