import Link from "next/link";

import { AuthForm } from "@/components/auth-form";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 px-6">
      <AuthForm />
      <Link href="/" className="text-sm text-muted-foreground underline">
        Back to home
      </Link>
    </main>
  );
}
